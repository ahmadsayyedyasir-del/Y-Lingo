// app/progress/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import StatsCard from '@/components/progress/StatsCard';
import XpProgress from '@/components/progress/XpProgress';
import AchievementCard from '@/components/progress/AchievementCard';
import ActivityItem from '@/components/progress/ActivityItem';
import { gamificationEndpoints, conversationEndpoints } from '@/lib/endpoints';

interface GamificationProfile {
  total_xp: number;
  total_messages_sent: number;
  total_sessions_completed: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string;
  achievements_unlocked_count: number;
  achievements_total_count: number;
}

interface UnlockedAchievement {
  code: string;
  name: string;
  description: string;
  category: string;
  unlocked: boolean;
  unlocked_at?: string;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  fluency_score?: number;
  status: string;
}

export default function ProgressPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch gamification profile (XP, streak, counts)
        const profileRes = await gamificationEndpoints.getProfile();
        setProfile(profileRes.data);

        // Fetch achievement catalog and filter only unlocked ones
        const achievementsRes = await gamificationEndpoints.getAchievements();
        const unlocked = (achievementsRes.data.items || []).filter(
          (a: UnlockedAchievement) => a.unlocked
        );
        setUnlockedAchievements(unlocked);

        // Fetch recent conversations
        const historyRes = await conversationEndpoints.getHistory(5);
        setRecentSessions(historyRes.data.sessions || []);

      } catch (err) {
        console.error('Failed to fetch progress data:', err);
        setError('Failed to load progress data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isLoading, router]);

  // Calculate level based on XP
  const getLevel = (xp: number) => {
    if (xp >= 10000) return { level: 5, label: '🌟 Master' };
    if (xp >= 5000) return { level: 4, label: '🚀 Advanced' };
    if (xp >= 2000) return { level: 3, label: '💪 Intermediate' };
    if (xp >= 500) return { level: 2, label: '🌱 Explorer' };
    return { level: 1, label: '🌟 Beginner' };
  };

  // Calculate XP for next level
  const getXpProgress = (xp: number) => {
    const levels = [0, 500, 2000, 5000, 10000];
    let current = 0;
    let next = 500;
    for (let i = 0; i < levels.length - 1; i++) {
      if (xp >= levels[i] && xp < levels[i + 1]) {
        current = levels[i];
        next = levels[i + 1];
        break;
      }
    }
    if (xp >= 10000) {
      return { current: 10000, next: 10000, progress: 100 };
    }
    return {
      current: current,
      next: next,
      progress: Math.round(((xp - current) / (next - current)) * 100),
    };
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

  const levelInfo = profile ? getLevel(profile.total_xp) : { level: 1, label: '🌟 Beginner' };
  const xpProgress = profile ? getXpProgress(profile.total_xp) : { current: 0, next: 500, progress: 0 };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">📊 Your Progress</h1>
            <p className="text-gray-400 mt-1">Track your learning journey</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Welcome back</p>
            <p className="text-white font-semibold">{user?.full_name || user?.fullName}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon="⭐"
            label="Level"
            value={`${levelInfo.level}`}
            subtitle={levelInfo.label}
          />
          <StatsCard
            icon="💎"
            label="Total XP"
            value={`${profile?.total_xp || 0}`}
            subtitle="Experience Points"
          />
          <StatsCard
            icon="🔥"
            label="Streak"
            value={`${profile?.current_streak_days || 0} days`}
            subtitle={`Longest: ${profile?.longest_streak_days || 0} days`}
          />
          <StatsCard
            icon="🎯"
            label="Sessions"
            value={`${profile?.total_sessions_completed || 0}`}
            subtitle={`${profile?.total_messages_sent || 0} messages`}
          />
        </div>

        {/* XP Progress Bar */}
        <div className="mb-6">
          <XpProgress
            current={xpProgress.current}
            next={xpProgress.next}
            progress={xpProgress.progress}
            currentXp={profile?.total_xp || 0}
            level={levelInfo.level}
            levelLabel={levelInfo.label}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Achievements */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              🏆 Achievements
              {profile && (
                <span className="text-sm font-normal text-gray-400 ml-1">
                  ({profile.achievements_unlocked_count}/{profile.achievements_total_count})
                </span>
              )}
            </h2>
            {unlockedAchievements.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {unlockedAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.code}
                    code={achievement.code}
                    title={achievement.name}
                    description={achievement.description}
                    unlocked={true}
                    unlockedAt={achievement.unlocked_at}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-2xl mb-2">🎯</p>
                <p>No achievements unlocked yet</p>
                <p className="text-sm text-gray-500">Keep practicing to earn achievements!</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              🕐 Recent Activity
            </h2>
            {recentSessions.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {recentSessions.map((session) => (
                  <ActivityItem
                    key={session.id}
                    id={session.id}
                    title={session.title}
                    date={session.created_at}
                    score={session.fluency_score}
                    status={session.status}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-2xl mb-2">🗣️</p>
                <p>No sessions yet</p>
                <p className="text-sm text-gray-500">Start your first voice practice!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/voice')}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition"
          >
            🎤 Start New Practice
          </button>
        </div>
      </div>
    </div>
  );
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  fluency_score?: number;
  status: string;
}

export default function ProgressPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch gamification profile
        const profileRes = await gamificationEndpoints.getProfile();
        setProfile(profileRes.data);

        // Fetch recent conversations
        const historyRes = await conversationEndpoints.getHistory(5);
        setRecentSessions(historyRes.data.sessions || []);

      } catch (err) {
        console.error('Failed to fetch progress data:', err);
        setError('Failed to load progress data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isLoading, router]);

  // Calculate level based on XP
  const getLevel = (xp: number) => {
    if (xp >= 10000) return { level: 5, label: '🌟 Master' };
    if (xp >= 5000) return { level: 4, label: '🚀 Advanced' };
    if (xp >= 2000) return { level: 3, label: '💪 Intermediate' };
    if (xp >= 500) return { level: 2, label: '🌱 Explorer' };
    return { level: 1, label: '🌟 Beginner' };
  };

  // Calculate XP for next level
  const getXpProgress = (xp: number) => {
    const levels = [0, 500, 2000, 5000, 10000];
    let current = 0;
    let next = 500;
    for (let i = 0; i < levels.length - 1; i++) {
      if (xp >= levels[i] && xp < levels[i + 1]) {
        current = levels[i];
        next = levels[i + 1];
        break;
      }
    }
    if (xp >= 10000) {
      return { current: 10000, next: 10000, progress: 100 };
    }
    return {
      current: current,
      next: next,
      progress: Math.round(((xp - current) / (next - current)) * 100),
    };
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

  const levelInfo = profile ? getLevel(profile.total_xp) : { level: 1, label: '🌟 Beginner' };
  const xpProgress = profile ? getXpProgress(profile.total_xp) : { current: 0, next: 500, progress: 0 };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">📊 Your Progress</h1>
            <p className="text-gray-400 mt-1">Track your learning journey</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Welcome back</p>
            <p className="text-white font-semibold">{user?.full_name}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon="⭐"
            label="Level"
            value={`${levelInfo.level}`}
            subtitle={levelInfo.label}
          />
          <StatsCard
            icon="💎"
            label="Total XP"
            value={`${profile?.total_xp || 0}`}
            subtitle="Experience Points"
          />
          <StatsCard
            icon="🔥"
            label="Streak"
            value={`${profile?.current_streak_days || 0} days`}
            subtitle={`Longest: ${profile?.longest_streak_days || 0} days`}
          />
          <StatsCard
            icon="🎯"
            label="Sessions"
            value={`${profile?.total_sessions_completed || 0}`}
            subtitle={`${profile?.total_messages_sent || 0} messages`}
          />
        </div>

        {/* XP Progress Bar */}
        <div className="mb-6">
          <XpProgress
            current={xpProgress.current}
            next={xpProgress.next}
            progress={xpProgress.progress}
            currentXp={profile?.total_xp || 0}
            level={levelInfo.level}
            levelLabel={levelInfo.label}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Achievements */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              🏆 Achievements
            </h2>
            {profile?.achievements && profile.achievements.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {profile.achievements.map((achievement, index) => (
                  <AchievementCard
                    key={index}
                    code={achievement.achievement_code}
                    title={achievement.title}
                    description={achievement.description}
                    unlocked={true}
                    unlockedAt={achievement.unlocked_at}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-2xl mb-2">🎯</p>
                <p>No achievements unlocked yet</p>
                <p className="text-sm text-gray-500">Keep practicing to earn achievements!</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              🕐 Recent Activity
            </h2>
            {recentSessions.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {recentSessions.map((session) => (
                  <ActivityItem
                    key={session.id}
                    id={session.id}
                    title={session.title}
                    date={session.created_at}
                    score={session.fluency_score}
                    status={session.status}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-2xl mb-2">🗣️</p>
                <p>No sessions yet</p>
                <p className="text-sm text-gray-500">Start your first voice practice!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/voice')}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition"
          >
            🎤 Start New Practice
          </button>
        </div>
      </div>
    </div>
  );
}