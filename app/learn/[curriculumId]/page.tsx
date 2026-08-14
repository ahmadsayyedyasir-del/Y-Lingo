// app/learn/[curriculumId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { curriculumEndpoints } from '@/lib/endpoints';

interface Unit {
  id: string;
  curriculum_id: string;
  title: string;
  description: string;
  order_index: number;
  lesson_count: number;
}

interface CurriculumDetail {
  id: string;
  title: string;
  description: string;
  target_language: string;
  difficulty_level: string;
  units: Unit[];
}

export default function CurriculumPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const curriculumId = params.curriculumId as string;

  const [curriculum, setCurriculum] = useState<CurriculumDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchCurriculum = async () => {
      try {
        setLoading(true);
        console.log('📚 Fetching curriculum:', curriculumId);
        const response = await curriculumEndpoints.get(curriculumId);
        setCurriculum(response.data);
        console.log('✅ Curriculum fetched:', response.data);
      } catch (err) {
        console.error('❌ Failed to fetch curriculum:', err);
        setError('Failed to load curriculum.');
      } finally {
        setLoading(false);
      }
    };

    if (curriculumId) {
      fetchCurriculum();
    }
  }, [curriculumId, isAuthenticated, isLoading, router]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !curriculum) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/learn" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to Curricula
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{curriculum.title}</h1>
          <p className="text-gray-400 mt-2">{curriculum.description || 'No description available.'}</p>
          <div className="flex gap-4 mt-4 text-sm">
            <span className="text-gray-500">🌍 {curriculum.target_language}</span>
            <span className="text-gray-500">|</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              curriculum.difficulty_level === 'beginner' ? 'bg-green-500/20 text-green-400' :
              curriculum.difficulty_level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {curriculum.difficulty_level}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {curriculum.units.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
            <p className="text-gray-400">No units available in this curriculum.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {curriculum.units.map((unit) => (
              <Link
                key={unit.id}
                href={`/learn/${curriculumId}/${unit.id}`}
                className="block bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition">
                      Unit {unit.order_index}: {unit.title}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">{unit.description || 'No description.'}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    📚 {unit.lesson_count} lessons
                  </div>
                </div>
                <div className="mt-4 text-blue-400 text-sm font-medium group-hover:underline">
                  View Lessons →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}