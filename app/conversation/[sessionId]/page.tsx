// app/conversation/[sessionId]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { conversationEndpoints } from '@/lib/endpoints';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import CoachingReport from '@/components/chat/CoachingReport';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  grammar_corrections?: GrammarCorrection[];
  vocabulary_suggestions?: VocabularySuggestion[];
}

interface GrammarCorrection {
  original: string;
  correction: string;
  explanation?: string;
}

interface VocabularySuggestion {
  word: string;
  better_word: string;
  reason?: string;
}

export default function ConversationPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionData, setSessionData] = useState<{ language: string; level: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [ended, setEnded] = useState(false);
  const [report, setReport] = useState(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await conversationEndpoints.getMessages(sessionId as string);
        setMessages(response.data);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        setError('Failed to load conversation.');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) fetchMessages();
  }, [sessionId, isAuthenticated, isLoading, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Read session language/level from URL search params or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setSessionData({
        language: params.get('language') || 'en',
        level: params.get('level') || 'intermediate',
      });
    }
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || sending || ended) return;
    setSending(true);
    setError('');

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await conversationEndpoints.sendMessage(sessionId as string, {
        message: text,
        language: sessionData?.language || 'en',
        level: sessionData?.level || 'intermediate',
      });

      // Attach feedback to the user message so it shows under it
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMessage.id
            ? {
                ...m,
                grammar_corrections: response.data.grammar_corrections || [],
                vocabulary_suggestions: response.data.vocabulary_suggestions || [],
              }
            : m
        )
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (err: unknown) {
      console.error('Failed to send message:', err);
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || 'Failed to send message.');
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleEndSession = async () => {
    if (ended) return;
    setLoading(true);
    try {
      const response = await conversationEndpoints.end(sessionId as string);
      setReport(response.data);
      setEnded(true);
    } catch (err) {
      console.error('Failed to end session:', err);
      setError('Failed to end session.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl">Loading conversation...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-gray-800 p-4 flex items-center justify-between">
        <button onClick={() => router.push('/conversation')} className="text-gray-400 hover:text-white transition">
          ← Back
        </button>
        <span className="text-white font-medium">AI Conversation</span>
        {!ended && (
          <button
            onClick={handleEndSession}
            disabled={loading}
            className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm rounded-lg transition disabled:opacity-50"
          >
            End Session
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg">Start the conversation by sending a message below.</p>
            <p className="text-sm">Your AI coach is ready to help you practice!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id}>
              <ChatMessage message={msg} />

              {/* Grammar Corrections — shown under user message */}
              {msg.role === 'user' && msg.grammar_corrections && msg.grammar_corrections.length > 0 && (
                <div className="flex justify-end mt-1">
                  <div className="max-w-[80%] space-y-1">
                    {msg.grammar_corrections.map((g, i) => (
                      <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-xs">
                        <span className="text-red-400 line-through mr-1">"{g.original}"</span>
                        <span className="text-gray-400 mr-1">→</span>
                        <span className="text-green-400">"{g.correction}"</span>
                        {g.explanation && (
                          <p className="text-gray-500 mt-0.5">{g.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vocabulary Suggestions — shown under user message */}
              {msg.role === 'user' && msg.vocabulary_suggestions && msg.vocabulary_suggestions.length > 0 && (
                <div className="flex justify-end mt-1">
                  <div className="max-w-[80%] space-y-1">
                    {msg.vocabulary_suggestions.map((v, i) => (
                      <div key={i} className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2 text-xs">
                        <span className="text-blue-300">💡 Try </span>
                        <span className="text-blue-400 font-medium">"{v.better_word}"</span>
                        <span className="text-gray-400"> instead of </span>
                        <span className="text-gray-300">"{v.word}"</span>
                        {v.reason && <p className="text-gray-500 mt-0.5">{v.reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-800/60 rounded-2xl px-5 py-3 border border-gray-700">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {!ended ? (
        <ChatInput onSend={handleSendMessage} disabled={sending} />
      ) : (
        <div className="bg-gray-900/50 border-t border-gray-800 p-4 text-center text-gray-400">
          Session ended.
          {report && (
            <button onClick={() => setReport(report)} className="ml-2 text-blue-400 hover:underline">
              View Coaching Report →
            </button>
          )}
        </div>
      )}

      {report && <CoachingReport report={report} onClose={() => setReport(null)} />}
    </div>
  );
}

  // Fetch messages on load
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await conversationEndpoints.getMessages(sessionId as string);
        setMessages(response.data);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        setError('Failed to load conversation.');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchMessages();
    }
  }, [sessionId, isAuthenticated, isLoading, router]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || sending || ended) return;
    setSending(true);
    setError('');

    try {
      // Optimistically add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send to API
      const response = await conversationEndpoints.sendMessage(sessionId as string, {
        message: text,
        language: 'en', // Should come from session data
        level: 'intermediate',
      });

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Show grammar/vocabulary feedback (optional)
      if (response.data.grammar_corrections?.length > 0) {
        console.log('📝 Grammar corrections:', response.data.grammar_corrections);
      }
      if (response.data.vocabulary_suggestions?.length > 0) {
        console.log('💡 Vocabulary suggestions:', response.data.vocabulary_suggestions);
      }

    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.response?.data?.detail || 'Failed to send message.');
      // Remove optimistic message
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const handleEndSession = async () => {
    if (ended) return;
    setLoading(true);
    try {
      const response = await conversationEndpoints.end(sessionId as string);
      setReport(response.data);
      setEnded(true);
    } catch (err) {
      console.error('Failed to end session:', err);
      setError('Failed to end session.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl">Loading conversation...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-gray-800 p-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/conversation')}
          className="text-gray-400 hover:text-white transition"
        >
          ← Back
        </button>
        <span className="text-white font-medium">AI Conversation</span>
        {!ended && (
          <button
            onClick={handleEndSession}
            disabled={loading}
            className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm rounded-lg transition disabled:opacity-50"
          >
            End Session
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg">Start the conversation by sending a message below.</p>
            <p className="text-sm">Your AI coach is ready to help you practice!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      {!ended ? (
        <ChatInput onSend={handleSendMessage} disabled={sending} />
      ) : (
        <div className="bg-gray-900/50 border-t border-gray-800 p-4 text-center text-gray-400">
          Session ended.
          {report && (
            <button
              onClick={() => setReport(report)}
              className="ml-2 text-blue-400 hover:underline"
            >
              View Coaching Report →
            </button>
          )}
        </div>
      )}

      {/* Coaching Report Modal */}
      {report && (
        <CoachingReport report={report} onClose={() => setReport(null)} />
      )}
    </div>
  );
}