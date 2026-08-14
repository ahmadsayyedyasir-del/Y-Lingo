// app/learn/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { curriculumEndpoints } from '@/lib/endpoints';

// ✅ Add proper interface
interface Curriculum {
  id: string;
  title: string;
  description: string;
  target_language: string;
  native_language: string;
  difficulty_level: string;
}

// ✅ Add proper interface
interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

export default function LearnPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchCurricula = async () => {
      try {
        setLoading(true);
        const response = await curriculumEndpoints.list(filterLanguage || undefined);
        setCurricula(response.data.items || []);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError?.response?.data?.detail || 'Failed to load curricula.');
      } finally {
        setLoading(false);
      }
    };

    fetchCurricula();
  }, [isAuthenticated, isLoading, router, filterLanguage]);

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
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">📚 Learning</h1>
        <p className="text-gray-400 mb-6">Browse courses and start learning</p>

        {/* Filter */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Filter by language..."
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {filterLanguage && (
            <button
              onClick={() => setFilterLanguage('')}
              className="px-4 py-2 text-gray-400 hover:text-white transition"
            >
              Clear
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {curricula.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
            <p className="text-gray-400">No curricula available yet.</p>
            <p className="text-gray-500 text-sm mt-2">Check back later for new courses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curricula.map((curriculum) => (
              <Link
                key={curriculum.id}
                href={`/learn/${curriculum.id}`}
                className="block bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition group"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition">
                    {curriculum.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    curriculum.difficulty_level === 'beginner' ? 'bg-green-500/20 text-green-400' :
                    curriculum.difficulty_level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {curriculum.difficulty_level}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                  {curriculum.description || 'No description available.'}
                </p>
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <span>🌍 {curriculum.target_language}</span>
                  <span>|</span>
                  <span>💬 {curriculum.native_language || 'English'}</span>
                </div>
                <div className="mt-4 text-blue-400 text-sm font-medium group-hover:underline">
                  Browse Units →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}