// app/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import SessionCard from '@/components/history/SessionCard';
import { conversationEndpoints } from '@/lib/endpoints';

interface Session {
  id: string;
  title: string;
  target_language: string;
  native_language: string;
  status: 'active' | 'ended';
  created_at: string;
  ended_at: string | null;
  message_count?: number;
  fluency_score?: number;
  grammar_score?: number;
  vocabulary_score?: number;
}

export default function HistoryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    average_fluency: 0,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await conversationEndpoints.getHistory(50);
        const data = response.data;
        
        // Extract sessions
        const sessionList = data.sessions || [];
        setSessions(sessionList);
        
        // Calculate stats
        const completed = sessionList.filter((s: any) => s.status === 'ended');
        const totalScores = completed.reduce((acc: any, s: any) => {
          return acc + (s.fluency_score || 0);
        }, 0);
        const avgScore = completed.length > 0 ? Math.round(totalScores / completed.length) : 0;
        
        setStats({
          total: sessionList.length,
          completed: completed.length,
          average_fluency: avgScore,
        });
        
      } catch (err) {
        console.error('Failed to fetch history:', err);
        setError('Failed to load conversation history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated, isLoading, router]);

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
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">📜 Conversation History</h1>
            <p className="text-gray-400 mt-1">View all your past conversations</p>
          </div>
          <button
            onClick={() => router.push('/voice')}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition"
          >
            + New Conversation
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-gray-400 text-sm">Total Sessions</p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.completed}</p>
            <p className="text-gray-400 text-sm">Completed</p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.average_fluency}%</p>
            <p className="text-gray-400 text-sm">Avg Fluency</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Session List */}
        {sessions.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-2xl">
            <div className="text-5xl mb-4">🗣️</div>
            <h2 className="text-xl font-semibold text-white mb-2">No Conversations Yet</h2>
            <p className="text-gray-400">Start your first voice practice session!</p>
            <button
              onClick={() => router.push('/voice')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Start Speaking
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}