// components/voice/VoiceCall.tsx
//
// Voice call UI — connects to:
//   STT: backend POST /voice/transcribe  (Groq Whisper)
//   TTS: backend POST /voice/tts         (ElevenLabs MP3)
//
// Falls back to browser SpeechSynthesis when ElevenLabs key is not configured
// (backend returns 503 → we catch and fall back silently).
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { conversationEndpoints, voiceEndpoints, profileEndpoints } from '@/lib/endpoints';
import ConversationManager, { ConversationManagerRef } from './ConversationManager';
import CoachingReport from '@/components/chat/CoachingReport';
import XPToast, { XPEvent } from '@/components/gamification/XPToast';

interface VoiceCallProps {
  scenario: string;
  level: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const scenarioNames: Record<string, string> = {
  casual: 'Casual Chat',
  interview: 'Job Interview',
  travel: 'Travel',
  daily: 'Daily Life',
  ielts: 'IELTS Speaking',
  business: 'Business',
};

const scenarioEmojis: Record<string, string> = {
  casual: '💬', interview: '💼', travel: '✈️',
  daily: '🌅', ielts: '📚', business: '📊',
};

const welcomeMessages: Record<string, (name: string) => string> = {
  casual: (n) => `Hey ${n}! 👋 Great to chat with you. How's your day going so far?`,
  interview: (n) => `Hello ${n}! 👋 Thanks for joining me. Let's do a friendly interview practice. Tell me about yourself.`,
  travel: (n) => `Hey ${n}! 🌍 I love talking about travel. What's the most interesting place you've ever visited?`,
  daily: (n) => `Hi ${n}! 🌅 Hope you're having a good day. What's been the highlight of your day so far?`,
  ielts: (n) => `Hello ${n}! 📚 I'm your IELTS speaking practice partner. Let's start with Part 1. Can you tell me about your hometown?`,
  business: (n) => `Good day ${n}! 📊 Let's practice some business conversation. What projects are you currently working on?`,
};

export default function VoiceCall({ scenario, level }: VoiceCallProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCallActive, setIsCallActive] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationStatus, setConversationStatus] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<unknown>(null);
  const [showReport, setShowReport] = useState(false);
  const [nativeLanguage, setNativeLanguage] = useState('ur');
  const [xpEvent, setXpEvent] = useState<XPEvent | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationManagerRef = useRef<ConversationManagerRef>(null);
  // Audio element for ElevenLabs TTS playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Track whether we've successfully used ElevenLabs (if 503 → fallback)
  const ttsAvailable = useRef<boolean>(true);

  const userName = user?.full_name || user?.fullName || 'Friend';

  // Fetch native language from profile
  useEffect(() => {
    profileEndpoints.get()
      .then((res) => { if (res.data?.native_language) setNativeLanguage(res.data.native_language); })
      .catch(() => {});
  }, []);

  // Start session on mount
  useEffect(() => {
    const startSession = async () => {
      try {
        const response = await conversationEndpoints.start({
          language: 'en',
          native_language: nativeLanguage,
          level,
          topic: scenario,
        });
        setSessionId(response.data.id);

        const welcome = (welcomeMessages[scenario] || welcomeMessages.casual)(userName);
        setMessages([{ id: 'welcome', role: 'assistant', content: welcome, timestamp: new Date() }]);

        // Speak welcome message after 500ms
        setTimeout(() => speakText(welcome), 500);
      } catch {
        setError('Failed to start conversation. Please go back and try again.');
      }
    };
    startSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeLanguage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      conversationManagerRef.current?.cancel();
    };
  }, []);

  // ── Audio helpers ────────────────────────────────────────────────────────

  const stopAudio = () => {
    // Stop ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    // Stop browser TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const speakWithBrowserFallback = (text: string) => {
    if (!('speechSynthesis' in window)) {
      // No TTS available at all — just start listening
      _afterSpeaking();
      return;
    }
    window.speechSynthesis.cancel();
    conversationManagerRef.current?.stopListening();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = level === 'beginner' ? 0.85 : level === 'intermediate' ? 0.95 : 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Use best English voice available
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang.startsWith('en') && v.localService) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onend = _afterSpeaking;
    utterance.onerror = _afterSpeaking;
    setIsSpeaking(true);
    setConversationStatus('idle');
    window.speechSynthesis.speak(utterance);
  };

  const speakText = async (text: string) => {
    if (!text.trim()) return;

    // Stop any current audio
    stopAudio();
    conversationManagerRef.current?.stopListening();
    setIsSpeaking(true);
    setConversationStatus('idle');

    // Try ElevenLabs TTS if previously available
    if (ttsAvailable.current) {
      try {
        const response = await voiceEndpoints.textToSpeech(text);
        const blob = response.data as Blob;

        if (!blob || blob.size < 100) throw new Error('Empty audio');

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          _afterSpeaking();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          // Fall back to browser TTS
          speakWithBrowserFallback(text);
        };

        await audio.play();
        return; // ElevenLabs success — done
      } catch (err: unknown) {
        // 503 = ElevenLabs not configured, 401 = bad key
        const axiosErr = err as { response?: { status?: number } };
        const status = axiosErr?.response?.status;
        if (status === 503 || status === 401) {
          ttsAvailable.current = false; // stop trying ElevenLabs
        }
        // Fall through to browser TTS
      }
    }

    // Browser TTS fallback
    speakWithBrowserFallback(text);
  };

  const _afterSpeaking = () => {
    setIsSpeaking(false);
    if (isCallActive && !isProcessing) {
      setTimeout(() => {
        conversationManagerRef.current?.startListening();
        setConversationStatus('listening');
      }, 400);
    }
  };

  const stopSpeaking = () => {
    stopAudio();
    setIsSpeaking(false);
    if (isCallActive && !isProcessing) {
      setTimeout(() => {
        conversationManagerRef.current?.startListening();
        setConversationStatus('listening');
      }, 300);
    }
  };

  // ── Message handling ─────────────────────────────────────────────────────

  const handleUserMessage = async (text: string) => {
    if (!text.trim() || !sessionId || !isCallActive) return;

    // Barge-in: stop AI if still speaking
    stopAudio();

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() },
    ]);
    setIsProcessing(true);
    setConversationStatus('processing');
    setError(null);

    try {
      const response = await conversationEndpoints.sendMessage(sessionId, {
        message: text,
        language: 'en',
        level,
        scenario,
      });

      const aiText = response.data.response;
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: aiText, timestamp: new Date() },
      ]);

      // Show XP toast if gamification data present
      if (response.data.xp_earned != null) {
        setXpEvent({
          xp_earned: response.data.xp_earned,
          total_xp: response.data.total_xp,
          level: response.data.level,
          leveled_up: response.data.leveled_up ?? false,
          newly_unlocked_achievements: response.data.newly_unlocked_achievements ?? [],
        });
      }

      setTimeout(() => speakText(aiText), 200);
    } catch {
      setError('Failed to get a response. Please try again.');
      // Resume listening even after error
      setTimeout(() => {
        if (isCallActive) {
          conversationManagerRef.current?.startListening();
          setConversationStatus('listening');
        }
      }, 1000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpeechDetected = (text: string) => {
    if (text.trim()) {
      setConversationStatus('processing');
      handleUserMessage(text);
    }
  };

  // ── End call ─────────────────────────────────────────────────────────────

  const endCall = async () => {
    stopAudio();
    conversationManagerRef.current?.cancel();
    setIsCallActive(false);

    if (sessionId) {
      try {
        const response = await conversationEndpoints.end(sessionId);
        setReport(response.data);
        setShowReport(true);
      } catch {
        router.push('/voice');
      }
    } else {
      router.push('/voice');
    }
  };

  const closeReport = () => {
    setShowReport(false);
    router.push('/voice');
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto p-4">

      {/* Header */}
      <div className="flex items-center justify-between bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-2xl">
            {scenarioEmojis[scenario] || '💬'}
          </div>
          <div>
            <h2 className="text-white font-semibold">
              {scenarioNames[scenario] || scenario} Practice
            </h2>
            <p className="text-gray-400 text-sm">
              {level.charAt(0).toUpperCase() + level.slice(1)} •{' '}
              {isCallActive ? '🟢 Active' : '🔴 Ended'}
            </p>
            {user && (
              <p className="text-blue-400 text-xs">
                👤 {user.full_name || user.fullName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* TTS source badge */}
          <span className="text-xs text-gray-600 hidden md:block">
            {ttsAvailable.current ? '🎵 ElevenLabs' : '🔈 Browser TTS'}
          </span>

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-4 py-2 bg-yellow-600/80 hover:bg-yellow-600 text-white rounded-xl transition text-sm font-medium flex items-center gap-2"
            >
              <span>⏹</span> Stop
            </button>
          )}
          <button
            onClick={endCall}
            className="px-5 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition text-sm font-medium"
          >
            End Call
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-900/30 border border-gray-800 rounded-2xl p-4 space-y-3 min-h-[300px]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-800/60 text-gray-200 border border-gray-700'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              <p className="text-xs opacity-50 mt-1.5">{formatTime(msg.timestamp)}</p>
            </div>
          </div>
        ))}

        {/* AI typing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-800/60 rounded-2xl px-5 py-3 border border-gray-700">
              <div className="flex gap-1.5">
                {['-0.3s', '-0.15s', '0s'].map((d) => (
                  <span
                    key={d}
                    className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: d }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI speaking indicator */}
        {isSpeaking && (
          <div className="flex justify-start">
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-2">
              <p className="text-green-400 text-sm flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                AI is speaking... <span className="text-xs text-gray-500">(tap Stop to interrupt)</span>
              </p>
            </div>
          </div>
        )}

        {/* Listening indicator */}
        {conversationStatus === 'listening' && (
          <div className="flex justify-end">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl px-4 py-2">
              <p className="text-blue-400 text-sm animate-pulse">🎙️ Listening...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-3 text-sm text-center flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-red-300 hover:text-white">✕</button>
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-center gap-6">
          <ConversationManager
            ref={conversationManagerRef}
            onSpeechDetected={handleSpeechDetected}
            isDisabled={isProcessing || !isCallActive || isSpeaking}
            onStatusChange={setConversationStatus}
            language="en"
          />
          <div className="text-center">
            <p className="text-sm text-gray-400">
              {isSpeaking
                ? '🔊 AI is speaking... tap Stop to interrupt'
                : conversationStatus === 'listening'
                ? '🔴 Listening — speak naturally (4s silence auto-stops)'
                : conversationStatus === 'processing'
                ? '⏳ Processing...'
                : isProcessing
                ? '🤖 AI is thinking...'
                : '🎤 Ready — tap mic to speak'}
            </p>
          </div>
        </div>
      </div>

      {/* Coaching Report Modal */}
      {showReport && report && (
        <CoachingReport
          report={report as Parameters<typeof CoachingReport>[0]['report']}
          onClose={closeReport}
        />
      )}

      {/* XP Toast — bottom right */}
      <XPToast event={xpEvent} onDismiss={() => setXpEvent(null)} />
    </div>
  );
}
