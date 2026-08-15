// app/admin/curricula/[id]/units/[unitId]/page.tsx — Unit lessons
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { adminCurriculumEndpoints } from '@/lib/endpoints';
import { LoadingSpinner } from '@/components/ui/Skeleton';

interface Lesson {
  id: string; title: string; order_index: number;
  is_published: boolean; estimated_duration_minutes?: number;
  difficulty_level?: string;
}

const LEVELS = ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced'];

export default function UnitLessonsPage() {
  const { id, unitId } = useParams();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', target_language: 'English',
    native_language: 'Urdu', difficulty_level: 'beginner',
    estimated_duration_minutes: 15, order_index: 1, is_published: false,
  });

  const fetchLessons = async () => {
    try {
      const res = await adminCurriculumEndpoints.listLessons(unitId as string);
      setLessons(res.data.items || []);
    } catch { setError('Failed to load lessons.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (unitId) fetchLessons(); }, [unitId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminCurriculumEndpoints.createLesson(unitId as string, {
        ...form, order_index: lessons.length + 1,
      });
      setShowForm(false);
      setForm({ ...form, title: '', description: '' });
      fetchLessons();
    } catch { setError('Failed to create lesson.'); }
    finally { setSaving(false); }
  };

  const togglePublish = async (lesson: Lesson) => {
    try {
      const res = lesson.is_published
        ? await adminCurriculumEndpoints.unpublishLesson(lesson.id)
        : await adminCurriculumEndpoints.publishLesson(lesson.id);
      setLessons(prev => prev.map(l => l.id === lesson.id ? res.data : l));
    } catch { setError('Failed to update lesson.'); }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await adminCurriculumEndpoints.deleteLesson(lessonId);
      setLessons(prev => prev.filter(l => l.id !== lessonId));
    } catch { setError('Failed to delete lesson.'); }
  };

  if (loading) return <LoadingSpinner message="Loading lessons..." />;

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
          <span className="text-white font-medium">Lessons</span>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>}

        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-white font-semibold">Lessons ({lessons.length})</h2>
            <button onClick={() => setShowForm(v => !v)}
              className="px-4 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition text-sm">
              + Add Lesson
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreate} className="px-6 py-5 border-b border-gray-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    placeholder="Lesson title"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Level</label>
                  <select value={form.difficulty_level} onChange={e => setForm({...form, difficulty_level: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Duration (min)</label>
                  <input type="number" min={1} value={form.estimated_duration_minutes}
                    onChange={e => setForm({...form, estimated_duration_minutes: +e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="lp" checked={form.is_published} onChange={e => setForm({...form, is_published: e.target.checked})} className="accent-blue-600" />
                  <label htmlFor="lp" className="text-sm text-gray-300">Publish immediately</label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  rows={2} className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Lesson'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition text-sm">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {lessons.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">No lessons yet. Add your first lesson above.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {lessons.map((lesson, i) => (
                <div key={lesson.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/10">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 text-sm w-6">#{i + 1}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{lesson.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs ${lesson.is_published ? 'text-green-400' : 'text-yellow-400'}`}>
                          {lesson.is_published ? 'Published' : 'Draft'}
                        </span>
                        {lesson.estimated_duration_minutes && (
                          <span className="text-gray-600 text-xs">• {lesson.estimated_duration_minutes}min</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/curricula/${id}/units/${unitId}/lessons/${lesson.id}/exercises`}
                      className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition text-xs">
                      Exercises →
                    </Link>
                    <button onClick={() => togglePublish(lesson)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition ${lesson.is_published ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30' : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'}`}>
                      {lesson.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onClick={() => deleteLesson(lesson.id)}
                      className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition text-xs">
                      Delete
                    </button>
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
