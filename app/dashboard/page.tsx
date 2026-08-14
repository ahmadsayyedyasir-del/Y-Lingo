// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { dashboardEndpoints, gamificationEndpoints } from '@/lib/endpoints';

interface DashboardStats {
  total_xp: number;
  current_streak: number;
  lessons_completed: number;
  lessons_in_progress: number;
  total_sessions: number;
}

interface GamificationData {
  total_xp: number;
  current_streak_days: number;
  lessons_completed?: number;
}

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        console.log('📊 Fetching dashboard data...');
        
        const gamificationResponse = await gamificationEndpoints.getProfile();
        const gamificationData: GamificationData = gamificationResponse.data;
        console.log('🎮 Gamification data:', gamificationData);
        
        const progressResponse = await dashboardEndpoints.get();
        const progressData = progressResponse.data;
        console.log('📈 Progress data:', progressData);
        
        setStats({
          total_xp: gamificationData.total_xp || 0,
          current_streak: gamificationData.current_streak_days || 0,
          lessons_completed: progressData.stats?.lessons_completed || 0,
          lessons_in_progress: progressData.stats?.lessons_in_progress || 0,
          total_sessions: progressData.stats?.total_sessions || 0,
        });
        
      } catch (err) {
        console.error('❌ Failed to fetch dashboard data:', err);
        setError('Could not load dashboard data');
        setStats({
          total_xp: 0,
          current_streak: 0,
          lessons_completed: 0,
          lessons_in_progress: 0,
          total_sessions: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isLoading, isAuthenticated, router, user]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user.full_name}! 🎉
        </h1>
        <p className="text-gray-400 mb-8">Ready for today&apos;s practice?</p>

        {error && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm">Daily Streak</p>
            <p className="text-3xl font-bold text-white">
              {stats?.current_streak || 0} days
            </p>
            {stats?.current_streak && stats.current_streak > 0 && (
              <span className="text-yellow-400 text-sm">🔥 Keep going!</span>
            )}
          </div>
          
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm">XP Points</p>
            <p className="text-3xl font-bold text-white">
              {stats?.total_xp || 0} XP
            </p>
            <span className="text-blue-400 text-sm">⭐ Level up!</span>
          </div>
          
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm">Lessons Completed</p>
            <p className="text-3xl font-bold text-white">
              {stats?.lessons_completed || 0}
            </p>
            <span className="text-green-400 text-sm">📚 Keep learning!</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Continue Learning */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">📚 Continue Learning</h2>
            <p className="text-gray-400">Start a curriculum to begin learning!</p>
            <button 
              onClick={() => router.push('/learn')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Browse Curricula
            </button>
          </div>

          {/* AI Conversation */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">🤖 AI Conversation</h2>
            <p className="text-gray-400">Practice speaking with AI</p>
            <button 
              onClick={() => router.push('/conversation')}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Start Practice
            </button>
          </div>

          {/* ✅ Voice Practice */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">🎙️ Voice Practice</h2>
            <p className="text-gray-400">Speak naturally with AI — like a real call</p>
            <button 
              onClick={() => router.push('/voice')}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90 transition"
            >
              Start Speaking 🎤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}