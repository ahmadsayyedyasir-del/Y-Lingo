// app/ielts/chat/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { conversationEndpoints, ragEndpoints } from '@/lib/endpoints';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function IELTSAICoachPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const startSession = async () => {
      try {
        const response = await conversationEndpoints.start({
          language: 'en',
          native_language: 'ur',
          level: 'intermediate',
          topic: 'IELTS Preparation',
        });
        setSessionId(response.data.id);
        
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: '👋 Welcome to IELTS AI Coach! I can help you with:\n\n- 📖 Reading practice\n- ✍️ Writing feedback\n- 🗣️ Speaking practice\n- 📝 Vocabulary building\n\nAsk me any IELTS question, and I\'ll answer using your uploaded books and notes!',
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (error) {
        console.error('Failed to start session:', error);
      }
    };

    startSession();
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const contextResponse = await ragEndpoints.search({
        query: input,
        top_k: 3,
        category: 'ielts',
      });
      
      const ragContext = contextResponse.data.results || [];
      let contextText = '';
      if (ragContext.length > 0) {
        contextText = 'Relevant information from your uploaded IELTS books:\n\n';
        ragContext.forEach((result: any, index: number) => {
          contextText += `[${index + 1}] ${result.content}\n\n`;
        });
        contextText += '---\n\nPlease answer the user\'s question based on the above context. If the context doesn\'t contain the answer, provide a general helpful response.';
      }

      const response = await conversationEndpoints.sendMessage(sessionId, {
        message: contextText ? `${contextText}\n\nUser question: ${input}` : input,
        language: 'en',
        level: 'intermediate',
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: 'error',
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-white mb-2">💬 IELTS AI Coach</h1>
        <p className="text-gray-400 mb-6">Ask any IELTS question — AI answers using your uploaded books</p>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl h-[600px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-800/50 text-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800/50 rounded-2xl px-4 py-3 text-gray-400">
                  <span className="animate-pulse">AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-800 p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about IELTS..."
                rows={1}
                className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}