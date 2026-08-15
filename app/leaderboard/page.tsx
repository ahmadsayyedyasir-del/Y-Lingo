// app/leaderboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { gamificationEndpoints } from '@/lib/endpoints';
import { LoadingSpinner } from '@/components/ui/Skeleton';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  full_name: string;
  total_xp: number;
  level: number;
  current_streak_days: number;
  is_current_user: boolean;
}

const RANK_ICONS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function LevelBadge({ level }: { level: number }) {
  const color = level >= 10 ? 'text-purple-400' : level >= 5 ? 'text-yellow-400' : 'text-blue-400';
  return <span className={`text-xs font-medium ${color}`}>Lv.{level}</span>;
}

export default function LeaderboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [type, setType] = useState<'xp' | 'streak'>('xp');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push('/login'); return; }
    if (!isAuthenticated) return;

    setLoading(true);
    gamificationEndpoints.getLeaderboard(type, 20)
      .then(res => setEntries(res.data.entries || []))
      .catch(() => setError('Failed to load leaderboard.'))
      .finally(() => setLoading(false));
  }, [type, isAuthenticated, isLoading, router]);

  if (isLoading || loading) return <LoadingSpinner message="Loading leaderboard..." />;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">🏆 Leaderboard</h1>
          <p className="text-gray-400 mt-2">Top learners ranked by {type === 'xp' ? 'XP earned' : 'day streak'}</p>
        </div>

        {/* Type toggle */}
        <div className="flex gap-2 mb-6 bg-gray-900/50 border border-gray-800 rounded-xl p-1">
          {(['xp', 'streak'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                type === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              {t === 'xp' ? '⭐ Top XP' : '🔥 Top Streak'}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>
        )}

        {entries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🎯</p>
            <p className="font-medium">No entries yet</p>
            <p className="text-sm text-gray-500 mt-1">Start practicing to appear on the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.user_id}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition ${
                  entry.is_current_user
                    ? 'bg-blue-600/10 border-blue-500/40 ring-1 ring-blue-500/20'
                    : 'bg-gray-900/40 border-gray-800 hover:bg-gray-800/30'
                }`}>

                {/* Rank */}
                <div className="w-10 text-center flex-shrink-0">
                  {RANK_ICONS[entry.rank] ? (
                    <span className="text-2xl">{RANK_ICONS[entry.rank]}</span>
                  ) : (
                    <span className="text-gray-500 font-bold text-lg">#{entry.rank}</span>
                  )}
                </div>

                {/* Avatar placeholder */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(entry.full_name || entry.username || '?').charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm truncate">
                      {entry.full_name || entry.username}
                    </p>
                    {entry.is_current_user && (
                      <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs">@{entry.username}</p>
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0">
                  {type === 'xp' ? (
                    <>
                      <p className="text-white font-bold">{entry.total_xp.toLocaleString()} XP</p>
                      <LevelBadge level={entry.level} />
                    </>
                  ) : (
                    <>
                      <p className="text-orange-400 font-bold">🔥 {entry.current_streak_days}</p>
                      <p className="text-gray-500 text-xs">day streak</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to action if user not in list */}
        {entries.length > 0 && !entries.some(e => e.is_current_user) && (
          <div className="mt-6 text-center p-4 bg-gray-900/30 border border-gray-800 rounded-2xl">
            <p className="text-gray-400 text-sm">You&apos;re not in the top 20 yet.</p>
            <button onClick={() => router.push('/voice')}
              className="mt-2 px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm">
              🎤 Practice to earn XP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
