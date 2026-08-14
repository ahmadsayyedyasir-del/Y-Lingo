// app/learn/[curriculumId]/[unitId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { curriculumEndpoints } from '@/lib/endpoints';

interface Lesson {
  id: string;
  unit_id: string;
  title: string;
  description: string;
  difficulty_level: string;
  estimated_duration_minutes: number;
  order_index: number;
  exercise_count: number;
}

export default function UnitPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const curriculumId = params.curriculumId as string;
  const unitId = params.unitId as string;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [unitTitle, setUnitTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchLessons = async () => {
      try {
        setLoading(true);
        console.log('📚 Fetching lessons for unit:', unitId);
        const response = await curriculumEndpoints.listLessons(unitId);
        setLessons(response.data.items || []);
        
        // Set unit title from first lesson or use fallback
        if (response.data.items && response.data.items.length > 0) {
          setUnitTitle(response.data.items[0].unit_id || 'Unit');
        }
        
        console.log('✅ Lessons fetched:', response.data.items);
      } catch (err) {
        console.error('❌ Failed to fetch lessons:', err);
        setError('Failed to load lessons.');
      } finally {
        setLoading(false);
      }
    };

    if (unitId) {
      fetchLessons();
    }
  }, [unitId, isAuthenticated, isLoading, router]);

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
      <div className="max-w-4xl mx-auto">
        <Link href={`/learn/${curriculumId}`} className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to Units
        </Link>

        <h1 className="text-3xl font-bold text-white mb-6">
          {unitTitle || 'Lessons'}
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {lessons.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
            <p className="text-gray-400">No lessons available in this unit.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/learn/${curriculumId}/${unitId}/${lesson.id}`}
                className="block bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition">
                      Lesson {lesson.order_index}: {lesson.title}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">{lesson.description || 'No description.'}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500 flex-shrink-0 ml-4">
                    <div>⏱️ {lesson.estimated_duration_minutes} min</div>
                    <div>📝 {lesson.exercise_count} exercises</div>
                    <div className={`mt-1 text-xs px-2 py-1 rounded-full inline-block ${
                      lesson.difficulty_level === 'beginner' ? 'bg-green-500/20 text-green-400' :
                      lesson.difficulty_level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {lesson.difficulty_level}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-blue-400 text-sm font-medium group-hover:underline">
                  Start Lesson →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}