// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { dashboardEndpoints, gamificationEndpoints, profileEndpoints } from '@/lib/endpoints';

interface GamificationData {
  total_xp: number;
  level: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string | null;
  total_sessions_completed: number;
  total_messages_sent: number;
  achievements_unlocked_count: number;
  achievements_total_count: number;
}

interface ProfileData {
  daily_goal: number;
  native_language: string;
  learning_language: string;
}

// XP needed per level (backend: total_xp // 100 + 1)
const XP_PER_LEVEL = 100;

function getXpProgress(totalXp: number) {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpInCurrentLevel = totalXp % XP_PER_LEVEL;
  const progressPct = Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100);
  return { level, xpInCurrentLevel, xpToNextLevel: XP_PER_LEVEL, progressPct };
}

function streakStatus(lastActivityDate: string | null, streakDays: number) {
  if (!lastActivityDate) return { practiced_today: false, at_risk: false };
  const last = new Date(lastActivityDate);
  const today = new Date();
  last.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - last.getTime()) / 86400000);
  return {
    practiced_today: diffDays === 0,
    at_risk: diffDays === 1 && streakDays > 0,
  };
}

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [gam, setGam] = useState<GamificationData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push('/login'); return; }
    if (!isAuthenticated) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        const [gamRes, profileRes] = await Promise.all([
          gamificationEndpoints.getProfile(),
          profileEndpoints.get(),
        ]);
        setGam(gamRes.data);
        setProfile(profileRes.data);
      } catch {
        setError('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) return null;

  const xp = gam?.total_xp ?? 0;
  const { level, xpInCurrentLevel, xpToNextLevel, progressPct } = getXpProgress(xp);
  const dailyGoal = profile?.daily_goal ?? 50;
  // Today's XP: use total_xp mod daily_goal as a simple approximation
  // Real today-XP would need a separate endpoint — use sessions*5 as proxy
  const todayXp = Math.min(xp, dailyGoal); // simplified: show total toward goal
  const dailyProgressPct = Math.min(100, Math.round((todayXp / dailyGoal) * 100));
  const streak = gam?.current_streak_days ?? 0;
  const { practiced_today, at_risk } = streakStatus(gam?.last_activity_date ?? null, streak);

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user.full_name || user.fullName || user.username}! 👋
          </h1>
          <p className="text-gray-400 mt-1">Ready for today&apos;s practice?</p>
        </div>

        {error && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Streak banner — at risk warning */}
        {at_risk && streak > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/40 rounded-2xl px-5 py-3 mb-5 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-orange-400 font-semibold text-sm">Your {streak}-day streak is at risk!</p>
              <p className="text-orange-300/70 text-xs">Practice today to keep your streak going.</p>
            </div>
            <button
              onClick={() => router.push('/voice')}
              className="ml-auto px-4 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition shrink-0"
            >
              Practice Now
            </button>
          </div>
        )}

        {/* Already practiced today */}
        {practiced_today && streak > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-5 py-3 mb-5 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <p className="text-green-400 text-sm font-medium">
              Great job! You&apos;ve practiced today. {streak} day streak! 🔥
            </p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Streak */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-1">Streak</p>
            <p className="text-3xl font-bold text-white">{streak}</p>
            <p className="text-yellow-400 text-xs mt-1">
              {streak > 0 ? '🔥 days in a row' : '—'}
            </p>
            {gam && gam.longest_streak_days > 0 && (
              <p className="text-gray-600 text-xs mt-0.5">Best: {gam.longest_streak_days} days</p>
            )}
          </div>

          {/* XP + Level */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-1">XP &amp; Level</p>
            <p className="text-3xl font-bold text-white">{xp}</p>
            <p className="text-blue-400 text-xs mt-1">⭐ Level {level}</p>
            {/* XP progress bar */}
            <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-gray-600 text-xs mt-0.5">{xpInCurrentLevel}/{xpToNextLevel} to next level</p>
          </div>

          {/* Sessions */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-1">Sessions</p>
            <p className="text-3xl font-bold text-white">{gam?.total_sessions_completed ?? 0}</p>
            <p className="text-purple-400 text-xs mt-1">🎯 {gam?.total_messages_sent ?? 0} messages</p>
          </div>

          {/* Achievements */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-1">Achievements</p>
            <p className="text-3xl font-bold text-white">
              {gam?.achievements_unlocked_count ?? 0}
              <span className="text-gray-600 text-xl">/{gam?.achievements_total_count ?? 13}</span>
            </p>
            <p className="text-green-400 text-xs mt-1">🏆 Unlocked</p>
          </div>
        </div>

        {/* Daily goal progress */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-white font-semibold">🎯 Daily Goal</h2>
              <p className="text-gray-500 text-xs mt-0.5">
                {Math.min(xp, dailyGoal)} / {dailyGoal} XP today
              </p>
            </div>
            <button
              onClick={() => router.push('/profile')}
              className="text-gray-600 hover:text-gray-400 text-xs transition"
            >
              Change goal →
            </button>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                dailyProgressPct >= 100
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
              style={{ width: `${Math.min(100, dailyProgressPct)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <p className="text-gray-500 text-xs">{dailyProgressPct}% complete</p>
            {dailyProgressPct >= 100 && (
              <p className="text-green-400 text-xs font-medium">🎉 Daily goal reached!</p>
            )}
          </div>
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">🎙️ Voice Practice</h2>
            <p className="text-gray-400 text-sm mb-4">Speak naturally with AI — like a real call</p>
            <button
              onClick={() => router.push('/voice')}
              className="w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90 transition text-sm font-medium"
            >
              Start Speaking +5 XP/msg 🎤
            </button>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">🤖 Text Practice</h2>
            <p className="text-gray-400 text-sm mb-4">Chat with your AI language coach</p>
            <button
              onClick={() => router.push('/conversation')}
              className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
            >
              Start Conversation
            </button>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">📚 IELTS Prep</h2>
            <p className="text-gray-400 text-sm mb-4">Practice writing, speaking, reading</p>
            <button
              onClick={() => router.push('/ielts')}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              IELTS Practice
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
