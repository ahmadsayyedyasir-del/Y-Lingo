// components/voice/VoiceCall.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { conversationEndpoints } from '@/lib/endpoints';
import ConversationManager, { ConversationManagerRef } from './ConversationManager';
import CoachingReport from '@/components/chat/CoachingReport';

interface VoiceCallProps {
  scenario: string;
  level: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

const scenarioPrompts: Record<string, string> = {
  casual: "You are having a casual conversation with a friend. Be friendly, warm, and natural. Ask about their day, interests, and share things about yourself.",
  interview: "You are a friendly but professional interviewer. Ask common interview questions like 'Tell me about yourself', 'Why do you want this job?', and 'Where do you see yourself in 5 years?'. Keep it conversational.",
  travel: "You are a fellow traveler. Ask about travel experiences, favorite destinations, and travel plans. Share your own travel stories.",
  daily: "You are having a conversation about daily life. Ask about routines, hobbies, work, and family. Keep it natural and engaging.",
  ielts: "You are an IELTS speaking examiner. Ask IELTS-style questions for speaking practice. Be professional but encouraging.",
  business: "You are a business colleague. Discuss professional topics like projects, meetings, and career goals. Keep it professional but conversational.",
};

const levelInstructions: Record<string, string> = {
  beginner: "Use simple vocabulary, short sentences, and speak slowly. Be very encouraging and patient.",
  intermediate: "Use natural everyday English, moderate vocabulary, and normal speed. Correct mistakes subtly.",
  advanced: "Use fluent English, idioms, and natural expressions. Challenge the user with complex questions.",
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
  const [report, setReport] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationManagerRef = useRef<ConversationManagerRef>(null);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  const userName = user?.full_name || 'Friend';
  const scenarioName = scenario.charAt(0).toUpperCase() + scenario.slice(1);
  const levelName = level.charAt(0).toUpperCase() + level.slice(1);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Prefer English voices, then any
          const preferred = voices.find(v => v.lang.startsWith('en') && v.localService) ||
                           voices.find(v => v.lang.startsWith('en')) ||
                           voices[0];
          setSelectedVoice(preferred);
          setVoicesLoaded(true);
        }
      }
    };

    // Voices may load after a delay
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        loadVoices();
      } else {
        window.speechSynthesis.onvoiceschanged = loadVoices;
        // Fallback: try again after a second
        setTimeout(loadVoices, 1000);
      }
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Start session on mount
  useEffect(() => {
    const startSession = async () => {
      try {
        const response = await conversationEndpoints.start({
          language: 'en',
          native_language: user?.profile?.native_language || 'ur',
          level: level,
          topic: scenario,
        });
        setSessionId(response.data.id);

        const welcomeMessage = getWelcomeMessage(scenario, level, userName);
        const welcome: Message = {
          id: 'welcome',
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date(),
        };
        setMessages([welcome]);

        setTimeout(() => {
          speakWithBrowserTTS(welcomeMessage);
        }, 500);
      } catch (err) {
        console.error('Failed to start session:', err);
        setError('Failed to start conversation. Please try again.');
      }
    };

    startSession();
  }, [scenario, level, userName, user?.profile?.native_language]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      conversationManagerRef.current?.stopListening();
    };
  }, []);

  // ✅ Speak with browser TTS using best available voice
  const speakWithBrowserTTS = (text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('TTS not supported');
      return;
    }

    window.speechSynthesis.cancel();
    conversationManagerRef.current?.stopListening();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = level === 'beginner' ? 0.8 : level === 'intermediate' ? 0.9 : 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Use the selected voice if available
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setConversationStatus('idle');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setTimeout(() => {
        if (isCallActive && !isProcessing) {
          conversationManagerRef.current?.startListening();
          setConversationStatus('listening');
        }
      }, 500);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setTimeout(() => {
        if (isCallActive && !isProcessing) {
          conversationManagerRef.current?.startListening();
          setConversationStatus('listening');
        }
      }, 500);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setTimeout(() => {
      if (isCallActive && !isProcessing) {
        conversationManagerRef.current?.startListening();
        setConversationStatus('listening');
      }
    }, 300);
  };

  const getWelcomeMessage = (scenario: string, level: string, userName: string): string => {
    const name = userName || 'there';
    const messages: Record<string, string> = {
      casual: `Hey ${name}! 👋 Great to chat with you. How's your day going so far?`,
      interview: `Hello ${name}! 👋 Thanks for joining me. Let's do a friendly interview practice.`,
      travel: `Hey ${name}! 🌍 I love talking about travel. What's the most interesting place you've ever visited?`,
      daily: `Hi ${name}! 🌅 Hope you're having a good day. What's been the highlight of your day so far?`,
      ielts: `Hello ${name}! 📚 I'm your IELTS speaking practice partner. Let's start with Part 1.`,
      business: `Good morning ${name}! 📊 Let's practice some business conversation.`,
    };
    return messages[scenario] || messages.casual;
  };

  const handleUserMessage = async (text: string) => {
    if (!text.trim() || !sessionId || !isCallActive) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);
    setError(null);

    try {
      const response = await conversationEndpoints.sendMessage(sessionId, {
        message: text,
        language: 'en',
        level: level,
        scenario: scenario,
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      setTimeout(() => {
        speakWithBrowserTTS(response.data.response);
      }, 300);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to get response. Please try again.');
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

  const endCall = async () => {
    if (sessionId) {
      try {
        const response = await conversationEndpoints.end(sessionId);
        setReport(response.data);
        setShowReport(true);
        window.speechSynthesis.cancel();
        conversationManagerRef.current?.stopListening();
        setIsCallActive(false);
      } catch (err) {
        console.error('Failed to end session:', err);
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

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getScenarioEmoji = (): string => {
    const map: Record<string, string> = { casual: '💬', interview: '💼', travel: '✈️', daily: '🌅', ielts: '📚', business: '📊' };
    return map[scenario] || '💬';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto p-4">
      {/* Call Header */}
      <div className="flex items-center justify-between bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-2xl">
            {getScenarioEmoji()}
          </div>
          <div>
            <h2 className="text-white font-semibold">{scenarioName} Practice</h2>
            <p className="text-gray-400 text-sm">{levelName} • {isCallActive ? '🟢 Active' : '🔴 Ended'}</p>
            {user && <p className="text-blue-400 text-xs">👤 {user.full_name}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-4 py-2 bg-yellow-600/80 hover:bg-yellow-600 text-white rounded-xl transition text-sm font-medium flex items-center gap-2"
            >
              <span>⏹</span> Stop Speaking
            </button>
          )}
          <button onClick={endCall} className="px-5 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition text-sm font-medium">
            End Call
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-900/30 border border-gray-800 rounded-2xl p-4 space-y-4 min-h-[300px]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'bg-gray-800/60 text-gray-200 border border-gray-700'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              <p className="text-xs opacity-50 mt-1.5">{formatTime(msg.timestamp)}</p>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-800/60 rounded-2xl px-5 py-3 border border-gray-700">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        {isSpeaking && (
          <div className="flex justify-start">
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-2">
              <p className="text-green-400 text-sm flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                AI is speaking...
              </p>
            </div>
          </div>
        )}
        {conversationStatus === 'listening' && (
          <div className="flex justify-start">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl px-4 py-2">
              <p className="text-blue-400 text-sm flex items-center gap-2 animate-pulse">
                🎙️ Listening... Speak now
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-3 text-sm text-center">
          {error}
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
          />
          <div className="text-center">
            <p className="text-sm text-gray-400">
              {isSpeaking
                ? '🔊 AI is speaking...'
                : conversationStatus === 'listening'
                ? '🔴 Listening... Speak naturally'
                : conversationStatus === 'processing'
                ? '⏳ Processing...'
                : '🎤 Ready — speak naturally'}
            </p>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReport && report && (
        <CoachingReport
          report={report}
          onClose={closeReport}
        />
      )}
    </div>
  );
}