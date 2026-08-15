// app/admin/curricula/[id]/units/[unitId]/lessons/[lessonId]/exercises/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { adminCurriculumEndpoints } from '@/lib/endpoints';
import { LoadingSpinner } from '@/components/ui/Skeleton';

interface Exercise {
  id: string; exercise_type: string; prompt: string;
  points: number; order_index: number;
}

const EXERCISE_TYPES = [
  'multiple_choice', 'fill_blank', 'translation',
  'listening', 'speaking', 'reorder_words',
];

export default function ExercisesPage() {
  const { id, unitId, lessonId } = useParams();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    exercise_type: 'multiple_choice',
    prompt: '',
    content: {} as Record<string, unknown>,
    points: 10,
    order_index: 1,
  });
  const [contentStr, setContentStr] = useState('{}');
  const [contentError, setContentError] = useState('');

  const fetchExercises = async () => {
    try {
      const res = await adminCurriculumEndpoints.listExercises(lessonId as string);
      setExercises(res.data.items || []);
    } catch { setError('Failed to load exercises.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (lessonId) fetchExercises(); }, [lessonId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setContentError('');
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(contentStr);
    } catch {
      setContentError('Content must be valid JSON.');
      return;
    }
    setSaving(true);
    try {
      await adminCurriculumEndpoints.createExercise(lessonId as string, {
        ...form, content: parsed, order_index: exercises.length + 1,
      });
      setShowForm(false);
      setForm({ exercise_type: 'multiple_choice', prompt: '', content: {}, points: 10, order_index: 1 });
      setContentStr('{}');
      fetchExercises();
    } catch { setError('Failed to create exercise.'); }
    finally { setSaving(false); }
  };

  const deleteExercise = async (exerciseId: string) => {
    if (!confirm('Delete this exercise?')) return;
    try {
      await adminCurriculumEndpoints.deleteExercise(exerciseId);
      setExercises(prev => prev.filter(x => x.id !== exerciseId));
    } catch { setError('Failed to delete exercise.'); }
  };

  if (loading) return <LoadingSpinner message="Loading exercises..." />;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6 flex-wrap">
          <Link href="/admin" className="text-gray-400 hover:text-white">Admin</Link>
          <span className="text-gray-600">/</span>
          <Link href={`/admin/curricula/${id}`} className="text-gray-400 hover:text-white">Curriculum</Link>
          <span className="text-gray-600">/</span>
          <Link href={`/admin/curricula/${id}/units/${unitId}`} className="text-gray-400 hover:text-white">Lessons</Link>
          <span className="text-gray-600">/</span>
          <span className="text-white font-medium">Exercises</span>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>}

        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-white font-semibold">Exercises ({exercises.length})</h2>
            <button onClick={() => setShowForm(v => !v)}
              className="px-4 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition text-sm">
              + Add Exercise
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreate} className="px-6 py-5 border-b border-gray-800 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Exercise Type</label>
                  <select value={form.exercise_type} onChange={e => setForm({...form, exercise_type: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {EXERCISE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Points</label>
                  <input type="number" min={1} value={form.points} onChange={e => setForm({...form, points: +e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Prompt *</label>
                <textarea value={form.prompt} onChange={e => setForm({...form, prompt: e.target.value})}
                  rows={2} placeholder="Question or instruction..."
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" required />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Content (JSON)</label>
                <textarea value={contentStr} onChange={e => setContentStr(e.target.value)}
                  rows={5} placeholder={'{\n  "options": ["A", "B"],\n  "correct": "A"\n}'}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                {contentError && <p className="text-red-400 text-xs mt-1">{contentError}</p>}
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Exercise'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition text-sm">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {exercises.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">No exercises yet. Add your first exercise above.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {exercises.map((ex, i) => (
                <div key={ex.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/10">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 text-sm w-6">#{i + 1}</span>
                    <div>
                      <p className="text-white text-sm">{ex.prompt.slice(0, 60)}{ex.prompt.length > 60 ? '...' : ''}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-blue-400 text-xs">{ex.exercise_type.replace('_', ' ')}</span>
                        <span className="text-gray-600 text-xs">• {ex.points} pts</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteExercise(ex.id)}
                    className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition text-xs">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
