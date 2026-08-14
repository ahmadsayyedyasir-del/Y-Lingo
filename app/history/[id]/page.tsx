// app/history/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { conversationEndpoints } from '@/lib/endpoints';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function ConversationDetailPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await conversationEndpoints.getMessages(sessionId);
        setMessages(response.data);
        if (response.data.length > 0) {
          setTitle(response.data[0].title || 'Conversation');
        }
      } catch (err) {
        setError('Failed to load conversation.');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchMessages();
    }
  }, [sessionId, isAuthenticated, isLoading, router]);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString();
  };

  if (isLoading || loading) {
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
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/history')}
          className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
        >
          ← Back to History
        </button>

        <h1 className="text-2xl font-bold text-white mb-2">{title || 'Conversation'}</h1>
        <p className="text-gray-400 text-sm mb-6">{messages.length} messages</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-800/60 text-gray-200 border border-gray-700'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                <p className="text-xs opacity-50 mt-1.5">{formatTime(msg.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}