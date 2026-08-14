// components/history/SessionCard.tsx
'use client';

import { useRouter } from 'next/navigation';

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

interface SessionCardProps {
  session: Session;
}

export default function SessionCard({ session }: SessionCardProps) {
  const router = useRouter();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'ended' ? 'text-green-400' : 'text-yellow-400';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div
      onClick={() => router.push(`/history/${session.id}`)}
      className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{session.title}</h3>
          <p className="text-gray-400 text-sm mt-1">
            {formatDate(session.created_at)}
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="text-sm text-gray-500">
              🌍 {session.target_language}
            </span>
            <span className={`text-sm ${getStatusColor(session.status)}`}>
              {session.status === 'ended' ? '✅ Completed' : '🔄 In Progress'}
            </span>
            {session.message_count !== undefined && (
              <span className="text-sm text-gray-500">
                💬 {session.message_count} messages
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-3">
          {session.fluency_score !== undefined && (
            <div className="text-center">
              <p className={`text-xl font-bold ${getScoreColor(session.fluency_score)}`}>
                {session.fluency_score}%
              </p>
              <p className="text-xs text-gray-500">Fluency</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}