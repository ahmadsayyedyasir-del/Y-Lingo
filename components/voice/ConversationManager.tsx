// components/voice/ConversationManager.tsx
//
// Records audio via MediaRecorder → sends to backend Groq Whisper STT.
// Falls back to browser SpeechRecognition if MediaRecorder or STT fails.
// Silence detection: 4 seconds via Web Audio API RMS.
'use client';

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from 'react';
import { voiceEndpoints } from '@/lib/endpoints';

declare global {
  interface Window {
    SpeechRecognition: unknown;
    webkitSpeechRecognition: unknown;
  }
}

interface ConversationManagerProps {
  onSpeechDetected: (text: string) => void;
  isDisabled?: boolean;
  onStatusChange?: (status: 'idle' | 'listening' | 'processing') => void;
  language?: string;
}

export interface ConversationManagerRef {
  startListening: () => void;
  stopListening: () => void;
  cancel: () => void;
}

// ─── MIME helpers ────────────────────────────────────────────────────────────

// Groq Whisper accepted formats: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm
// We pick webm (most browsers support it) — without codec suffix for Groq compatibility
function getBestAudioMime(): string {
  const candidates = [
    'audio/webm',             // best: Groq accepts, most Chrome/Firefox support
    'audio/ogg;codecs=opus',  // Firefox fallback
    'audio/mp4',              // Safari
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return '';
}

// Strip codec suffix — Groq only wants "audio/webm", not "audio/webm;codecs=opus"
function normalizeContentType(mime: string): string {
  return mime.split(';')[0].trim();
}

function mimeToExtension(mime: string): string {
  const base = normalizeContentType(mime);
  if (base.includes('ogg')) return 'ogg';
  if (base.includes('mp4')) return 'mp4';
  return 'webm';
}

// ─── component ───────────────────────────────────────────────────────────────

const ConversationManager = forwardRef<ConversationManagerRef, ConversationManagerProps>(
  function ConversationManager(
    { onSpeechDetected, isDisabled = false, onStatusChange, language = 'en' },
    ref,
  ) {
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing'>('idle');
    const [micError, setMicError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState('');
    // Track whether backend STT works — fall back to browser if it consistently fails
    const backendSTTFailed = useRef<boolean>(false);
    const backendSTTFailCount = useRef<number>(0);

    // MediaRecorder refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const silenceCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fallback browser STT ref
    const recognitionRef = useRef<unknown>(null);

    useEffect(() => {
      return () => { _cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const _cleanup = () => {
      silenceTimerRef.current && clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
      silenceCheckIntervalRef.current && clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    };

    const _updateStatus = (s: 'idle' | 'listening' | 'processing') => {
      setStatus(s);
      onStatusChange?.(s);
    };

    // ── Request microphone permission explicitly ───────────────────────────

    const _requestMicPermission = async (): Promise<MediaStream | null> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          },
        });
        return stream;
      } catch (err: unknown) {
        const domErr = err as { name?: string; message?: string };
        if (domErr.name === 'NotAllowedError' || domErr.name === 'PermissionDeniedError') {
          setMicError(
            '🎤 Microphone access denied.\n\nTo fix: Click the 🔒 lock icon in your browser address bar → Allow Microphone.',
          );
        } else if (domErr.name === 'NotFoundError') {
          setMicError('No microphone found. Please connect a microphone and try again.');
        } else if (domErr.name === 'NotReadableError') {
          setMicError('Microphone is being used by another app. Close other apps and try again.');
        } else {
          setMicError(`Microphone error: ${domErr.message || domErr.name || 'Unknown error'}`);
        }
        return null;
      }
    };

    // ── Backend STT (Groq Whisper via MediaRecorder) ──────────────────────

    const _startMediaRecorder = async () => {
      setMicError(null);
      setTranscript('');

      const stream = await _requestMicPermission();
      if (!stream) { _updateStatus('idle'); return; }

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mime = getBestAudioMime();
      let recorder: MediaRecorder;
      try {
        recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      } catch {
        // mimeType not supported — create without it
        recorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        _cleanup();
        const chunks = audioChunksRef.current;
        if (chunks.length === 0) { _updateStatus('idle'); return; }

        const actualMime = recorder.mimeType || mime || 'audio/webm';
        const ext = mimeToExtension(actualMime);
        const contentType = normalizeContentType(actualMime);
        const blob = new Blob(chunks, { type: actualMime });

        if (blob.size < 300) { _updateStatus('idle'); return; }

        _updateStatus('processing');
        setTranscript('Transcribing...');

        // Try backend STT first, fall back to browser if consistently failing
        if (!backendSTTFailed.current) {
          try {
            const file = new File([blob], `recording.${ext}`, { type: contentType });
            const response = await voiceEndpoints.transcribe(file, language);
            const text = response.data?.text?.trim() || '';
            backendSTTFailCount.current = 0; // reset on success
            if (text) {
              setTranscript('');
              _updateStatus('idle');
              onSpeechDetected(text);
              return;
            }
            // Empty transcription — try browser fallback
            _updateStatus('idle');
            setTranscript('');
            return;
          } catch (err: unknown) {
            const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
            const status = axiosErr?.response?.status;
            backendSTTFailCount.current += 1;

            if (status === 503) {
              // Groq not configured — switch to browser permanently for this session
              backendSTTFailed.current = true;
              setMicError('Voice transcription service not configured. Using browser speech recognition instead.');
              setTimeout(() => setMicError(null), 4000);
            } else if (status === 400) {
              setMicError('Audio too short. Please speak for at least 1 second.');
            } else if (backendSTTFailCount.current >= 3) {
              // 3 consecutive failures → fall back to browser
              backendSTTFailed.current = true;
              setMicError('Switching to browser speech recognition after repeated errors.');
              setTimeout(() => setMicError(null), 4000);
            } else {
              const detail = axiosErr?.response?.data?.detail;
              setMicError(
                typeof detail === 'string'
                  ? `Transcription failed: ${detail}`
                  : 'Could not transcribe audio. Please speak clearly and try again.',
              );
            }
            setTranscript('');
            _updateStatus('idle');
            return;
          }
        }

        // Backend STT failed previously — try browser recognition as fallback
        setTranscript('');
        _updateStatus('idle');
        // Note: browser STT is started fresh via _startBrowserSTT
        _startBrowserSTT();
      };

      recorder.start(250);
      _updateStatus('listening');
      setTranscript('Listening...');

      // ── Silence detection via Web Audio API ──────────────────────────────
      try {
        const audioCtx = new AudioContext();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.fftSize);
        let silentMs = 0;
        const SILENCE_THRESHOLD = 8;
        const CHECK_INTERVAL = 200;
        const SILENCE_LIMIT_MS = 2000; // 2 seconds silence → stop

        silenceCheckIntervalRef.current = setInterval(() => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = data[i] - 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);

          if (rms < SILENCE_THRESHOLD) {
            silentMs += CHECK_INTERVAL;
            if (silentMs >= SILENCE_LIMIT_MS) stopListening();
          } else {
            silentMs = 0;
          }
        }, CHECK_INTERVAL);
      } catch {
        // AudioContext unavailable — max 30s safety timer
        silenceTimerRef.current = setTimeout(() => stopListening(), 30000);
      }
    };

    // ── Browser SpeechRecognition fallback ───────────────────────────────

    const _startBrowserSTT = () => {
      setMicError(null);
      const SpeechRecognitionCtor =
        (window.SpeechRecognition as (new () => SpeechRecognition) | undefined) ||
        (window.webkitSpeechRecognition as (new () => SpeechRecognition) | undefined);

      if (!SpeechRecognitionCtor) {
        setMicError(
          'Voice input is not supported in this browser. Please use Chrome or Edge on desktop.',
        );
        _updateStatus('idle');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognitionCtor as any)();
      recognition.lang = language === 'en' ? 'en-US' : language;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalText = '';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        silenceTimerRef.current && clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;

        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const part = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += part;
          else interim = part;
        }
        setTranscript(interim || finalText);
        silenceTimerRef.current = setTimeout(() => recognition.stop(), 2000); // 2s silence
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        silenceTimerRef.current && clearTimeout(silenceTimerRef.current);
        if (event.error === 'not-allowed') {
          setMicError(
            '🎤 Microphone access denied.\n\nPlease allow microphone in your browser settings.',
          );
        } else if (event.error === 'no-speech') {
          // Silent — not an error
        } else if (event.error === 'network') {
          setMicError('Network error during speech recognition. Check your connection.');
        } else {
          setMicError(`Speech recognition error: ${event.error}`);
        }
        _updateStatus('idle');
        setTranscript('');
      };

      recognition.onend = () => {
        silenceTimerRef.current && clearTimeout(silenceTimerRef.current);
        _updateStatus('idle');
        const text = finalText.trim();
        if (text) onSpeechDetected(text);
        setTranscript('');
        finalText = '';
      };

      recognitionRef.current = recognition;
      recognition.start();
      _updateStatus('listening');
      setTranscript('Listening...');
    };

    // ── Public API ────────────────────────────────────────────────────────

    const startListening = () => {
      if (isDisabled || status === 'listening' || status === 'processing') return;
      setMicError(null);

      // Use backend STT (MediaRecorder) unless it has failed
      if (typeof MediaRecorder !== 'undefined' && !backendSTTFailed.current) {
        _startMediaRecorder();
      } else {
        _startBrowserSTT();
      }
    };

    const stopListening = () => {
      silenceTimerRef.current && clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
      silenceCheckIntervalRef.current && clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop(); // triggers onstop → transcription
      } else if (recognitionRef.current) {
        (recognitionRef.current as { stop?: () => void }).stop?.();
        _updateStatus('idle');
      } else {
        _cleanup();
        _updateStatus('idle');
      }
    };

    const cancel = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      }
      (recognitionRef.current as { stop?: () => void } | null)?.stop?.();
      _cleanup();
      setTranscript('');
      _updateStatus('idle');
    };

    useImperativeHandle(ref, () => ({ startListening, stopListening, cancel }));

    // ── Render ────────────────────────────────────────────────────────────

    const isBackendSTT = !backendSTTFailed.current && typeof MediaRecorder !== 'undefined';

    return (
      <div className="flex flex-col items-center gap-2">
        {/* Mic error — clear, actionable */}
        {micError && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-300 rounded-xl px-4 py-2 text-xs max-w-xs text-center whitespace-pre-line">
            {micError}
            <button onClick={() => setMicError(null)} className="block mx-auto mt-1 text-red-400 hover:text-white text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Mic button */}
        <button
          onClick={status === 'listening' ? stopListening : startListening}
          disabled={isDisabled && status !== 'listening'}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all select-none ${
            status === 'listening'
              ? 'bg-red-600 hover:bg-red-700 animate-pulse shadow-lg shadow-red-600/40'
              : status === 'processing'
              ? 'bg-yellow-600 cursor-wait'
              : isDisabled
              ? 'bg-gray-700 cursor-not-allowed opacity-40'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 shadow-lg shadow-blue-600/30 active:scale-95'
          }`}
          title={
            status === 'listening' ? 'Tap to stop'
            : status === 'processing' ? 'Processing...'
            : isDisabled ? 'Waiting...'
            : 'Tap to speak'
          }
        >
          {status === 'processing' ? '⏳' : status === 'listening' ? '⏹' : '🎤'}
        </button>

        {/* Status text */}
        {status === 'listening' && (
          <p className="text-green-400 text-xs animate-pulse font-medium">🔴 Recording...</p>
        )}
        {status === 'processing' && (
          <p className="text-yellow-400 text-xs animate-pulse">⏳ Transcribing...</p>
        )}
        {transcript && status === 'listening' && (
          <p className="text-gray-400 text-xs max-w-[180px] text-center truncate italic">"{transcript}"</p>
        )}

        {/* STT source badge */}
        {status === 'idle' && !isDisabled && (
          <p className="text-gray-700 text-xs">
            {isBackendSTT ? '🎙️ Groq Whisper' : '🗣️ Browser STT'}
          </p>
        )}
      </div>
    );
  },
);

export default ConversationManager;
