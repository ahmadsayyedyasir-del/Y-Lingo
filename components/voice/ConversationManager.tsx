// components/voice/ConversationManager.tsx
//
// Records audio via MediaRecorder → sends to backend Groq Whisper STT.
// Falls back to browser SpeechRecognition if MediaRecorder is unavailable.
// Replaces alert() with in-component error state.
// Silence detection threshold: 4 seconds.
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

// ─── helpers ────────────────────────────────────────────────────────────────

function getBestAudioMime(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return '';
}

function mimeToExtension(mime: string): string {
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mp4')) return 'mp4';
  return 'webm'; // default
}

// ─── component ──────────────────────────────────────────────────────────────

const ConversationManager = forwardRef<ConversationManagerRef, ConversationManagerProps>(
  function ConversationManager(
    { onSpeechDetected, isDisabled = false, onStatusChange, language = 'en' },
    ref,
  ) {
    const [status, setStatus] = useState<'idle' | 'listening' | 'processing'>('idle');
    const [micError, setMicError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState('');
    const [useMediaRecorder, setUseMediaRecorder] = useState(true);

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

    // Check MediaRecorder availability on mount
    useEffect(() => {
      if (typeof MediaRecorder === 'undefined') {
        setUseMediaRecorder(false);
      }
      return () => {
        _cleanup();
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── internal cleanup ────────────────────────────────────────────────────

    const _cleanup = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (silenceCheckIntervalRef.current) {
        clearInterval(silenceCheckIntervalRef.current);
        silenceCheckIntervalRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    };

    const _updateStatus = (s: 'idle' | 'listening' | 'processing') => {
      setStatus(s);
      onStatusChange?.(s);
    };

    // ── MediaRecorder path ──────────────────────────────────────────────────

    const _startMediaRecorder = async () => {
      setMicError(null);
      setTranscript('');

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: unknown) {
        const domErr = err as { name?: string };
        if (domErr.name === 'NotAllowedError' || domErr.name === 'PermissionDeniedError') {
          setMicError(
            'Microphone access denied. Please allow microphone in your browser settings and try again.',
          );
        } else {
          setMicError('Could not access microphone. Please check your device settings.');
        }
        _updateStatus('idle');
        return;
      }

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mime = getBestAudioMime();
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        _cleanup();
        const chunks = audioChunksRef.current;
        if (chunks.length === 0) {
          _updateStatus('idle');
          return;
        }

        const actualMime = mime || 'audio/webm';
        const ext = mimeToExtension(actualMime);
        const blob = new Blob(chunks, { type: actualMime });

        if (blob.size < 500) {
          // Too small — likely no speech captured
          _updateStatus('idle');
          return;
        }

        _updateStatus('processing');
        setTranscript('Transcribing...');

        try {
          const file = new File([blob], `recording.${ext}`, { type: actualMime });
          const response = await voiceEndpoints.transcribe(file, language);
          const text = response.data?.text?.trim() || '';
          if (text) {
            onSpeechDetected(text);
          }
        } catch (err) {
          console.error('STT error:', err);
          setMicError('Could not transcribe audio. Please try again.');
        } finally {
          setTranscript('');
          _updateStatus('idle');
        }
      };

      // Start recording — request data every 250 ms for reliable chunks
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
        const SILENCE_THRESHOLD = 10; // RMS threshold (0-255)
        const CHECK_INTERVAL = 200; // ms
        const SILENCE_LIMIT_MS = 4000; // 4 seconds silence → stop

        silenceCheckIntervalRef.current = setInterval(() => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteTimeDomainData(data);

          // Compute RMS
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = data[i] - 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);

          if (rms < SILENCE_THRESHOLD) {
            silentMs += CHECK_INTERVAL;
            if (silentMs >= SILENCE_LIMIT_MS) {
              // 4 seconds of silence — stop recording
              stopListening();
            }
          } else {
            silentMs = 0; // reset on speech
          }
        }, CHECK_INTERVAL);
      } catch {
        // AudioContext not available — fallback to simple timer
        silenceTimerRef.current = setTimeout(() => {
          stopListening();
        }, 30000); // max 30s recording without silence detection
      }
    };

    // ── Browser SpeechRecognition fallback ──────────────────────────────────

    const _startBrowserSTT = () => {
      setMicError(null);
      const SpeechRecognition =
        (window.SpeechRecognition as new () => SpeechRecognition) ||
        (window.webkitSpeechRecognition as new () => SpeechRecognition);

      if (!SpeechRecognition) {
        setMicError('Voice recording is not supported in this browser. Please use Chrome or Edge.');
        return;
      }

      const recognition = new (SpeechRecognition as new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((e: unknown) => void) | null;
        onerror: ((e: unknown) => void) | null;
        onend: (() => void) | null;
        start(): void;
        stop(): void;
      })();

      recognition.lang = `${language}-${language.toUpperCase()}` || 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalText = '';
      let interimText = '';

      recognition.onresult = (event: unknown) => {
        const e = event as {
          resultIndex: number;
          results: { [i: number]: { [j: number]: { transcript: string }; isFinal?: boolean; length: number }; length: number };
        };

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        for (let i = e.resultIndex; i < e.results.length; i++) {
          const part = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalText += part;
          } else {
            interimText = part;
          }
        }
        setTranscript(interimText || finalText);

        // 4-second silence timer
        silenceTimerRef.current = setTimeout(() => {
          recognition.stop();
        }, 4000);
      };

      recognition.onerror = (event: unknown) => {
        const e = event as { error: string };
        if (e.error === 'not-allowed') {
          setMicError(
            'Microphone access denied. Please allow microphone in your browser settings.',
          );
        } else if (e.error !== 'no-speech') {
          setMicError(`Microphone error: ${e.error}`);
        }
        _updateStatus('idle');
        setTranscript('');
      };

      recognition.onend = () => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        _updateStatus('idle');
        const text = (finalText || interimText).trim();
        if (text) onSpeechDetected(text);
        setTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
      _updateStatus('listening');
      setTranscript('Listening...');
    };

    // ── Public API ──────────────────────────────────────────────────────────

    const startListening = () => {
      if (isDisabled || status === 'listening' || status === 'processing') return;
      setMicError(null);
      if (useMediaRecorder) {
        _startMediaRecorder();
      } else {
        _startBrowserSTT();
      }
    };

    const stopListening = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (silenceCheckIntervalRef.current) {
        clearInterval(silenceCheckIntervalRef.current);
        silenceCheckIntervalRef.current = null;
      }

      if (useMediaRecorder) {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop(); // triggers onstop → transcription
        } else {
          _cleanup();
          _updateStatus('idle');
        }
      } else {
        const r = recognitionRef.current as { stop?: () => void } | null;
        r?.stop?.();
        _updateStatus('idle');
      }
    };

    const cancel = () => {
      if (useMediaRecorder) {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.ondataavailable = null;
          mediaRecorderRef.current.onstop = null;
          mediaRecorderRef.current.stop();
        }
        _cleanup();
      } else {
        const r = recognitionRef.current as { stop?: () => void } | null;
        r?.stop?.();
      }
      setTranscript('');
      _updateStatus('idle');
    };

    useImperativeHandle(ref, () => ({ startListening, stopListening, cancel }));

    // ── Render ──────────────────────────────────────────────────────────────

    return (
      <div className="flex flex-col items-center gap-2">
        {/* Microphone error — inline, no alert() */}
        {micError && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-400 rounded-xl px-4 py-2 text-xs max-w-xs text-center">
            {micError}
            <button
              onClick={() => setMicError(null)}
              className="ml-2 text-red-300 hover:text-white"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        <button
          onClick={status === 'listening' ? stopListening : startListening}
          disabled={isDisabled && status !== 'listening'}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${
            status === 'listening'
              ? 'bg-red-600 hover:bg-red-700 animate-pulse shadow-lg shadow-red-600/40'
              : status === 'processing'
              ? 'bg-yellow-600 cursor-wait'
              : isDisabled
              ? 'bg-gray-700 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 shadow-lg shadow-blue-600/30'
          }`}
          title={
            status === 'listening'
              ? 'Stop recording'
              : status === 'processing'
              ? 'Transcribing...'
              : 'Start speaking'
          }
        >
          {status === 'processing' ? '⏳' : status === 'listening' ? '⏹' : '🎤'}
        </button>

        {status === 'listening' && (
          <p className="text-green-400 text-xs animate-pulse">🔴 Recording... speak now</p>
        )}
        {status === 'processing' && (
          <p className="text-yellow-400 text-xs animate-pulse">⏳ Transcribing...</p>
        )}
        {transcript && status === 'listening' && (
          <p className="text-gray-400 text-xs max-w-[200px] text-center truncate">{transcript}</p>
        )}
        {!useMediaRecorder && status === 'idle' && !micError && (
          <p className="text-gray-600 text-xs">Using browser STT</p>
        )}
      </div>
    );
  },
);

export default ConversationManager;
