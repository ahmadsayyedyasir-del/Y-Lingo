// app/admin/page.tsx — Admin Dashboard
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { adminCurriculumEndpoints } from '@/lib/endpoints';
import { LoadingSpinner } from '@/components/ui/Skeleton';

interface Curriculum {
  id: string;
  title: string;
  target_language: string;
  difficulty_level: string;
  is_published: boolean;
  units_count?: number;
}

export default function AdminPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push('/login'); return; }
    if (!isLoading && isAuthenticated && !user?.is_admin && !user?.isAdmin) {
      router.push('/dashboard');
      return;
    }
    if (isAuthenticated && (user?.is_admin || user?.isAdmin)) {
      adminCurriculumEndpoints.list()
        .then(res => setCurricula(res.data.items || []))
        .catch(() => setError('Failed to load curricula.'))
        .finally(() => setLoading(false));
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || loading) return <LoadingSpinner message="Loading admin panel..." />;
  if (!isAuthenticated || (!user?.is_admin && !user?.isAdmin)) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">⚙️ Admin Panel</h1>
            <p className="text-gray-400 mt-1">Manage curriculum, lessons and exercises</p>
          </div>
          <Link
            href="/admin/curricula/new"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition"
          >
            + New Curriculum
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Curricula', value: curricula.length, emoji: '📚' },
            { label: 'Published', value: curricula.filter(c => c.is_published).length, emoji: '✅' },
            { label: 'Draft', value: curricula.filter(c => !c.is_published).length, emoji: '📝' },
            { label: 'Languages', value: new Set(curricula.map(c => c.target_language)).size, emoji: '🌐' },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 text-center">
              <div className="text-2xl mb-1">{s.emoji}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Curricula list */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-white font-semibold">All Curricula</h2>
          </div>
          {curricula.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📚</p>
              <p className="font-medium">No curricula yet</p>
              <p className="text-sm text-gray-500 mt-1">Create your first curriculum to get started.</p>
              <Link href="/admin/curricula/new"
                className="mt-4 inline-block px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                Create Curriculum
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {curricula.map((c) => (
                <div key={c.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/20 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center text-lg">
                      📚
                    </div>
                    <div>
                      <p className="text-white font-medium">{c.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {c.target_language} • {c.difficulty_level}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.is_published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {c.is_published ? 'Published' : 'Draft'}
                    </span>
                    <Link href={`/admin/curricula/${c.id}`}
                      className="px-3 py-1.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition text-xs font-medium">
                      Manage →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
