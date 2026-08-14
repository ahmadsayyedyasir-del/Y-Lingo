// app/admin/curricula/[id]/units/[unitId]/lessons/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminCurriculumEndpoints } from '@/lib/endpoints';

interface Lesson {
  id: string;
  unit_id: string;
  title: string;
  description: string;
  target_language: string;
  difficulty_level: string;
  estimated_duration_minutes: number;
  learning_objectives: string[];
  order_index: number;
  is_published: boolean;
}

interface Unit {
  id: string;
  title: string;
}

export default function AdminLessonsPage() {
  const params = useParams();
  const curriculumId = params.id as string;
  const unitId = params.unitId as string;

  const [unit, setUnit] = useState<Unit | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_language: 'en',
    native_language: 'ur',
    difficulty_level: 'beginner',
    estimated_duration_minutes: 10,
    learning_objectives: [''],
    order_index: 1,
    is_published: false,
  });

  useEffect(() => {
    fetchData();
  }, [unitId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lessonsRes] = await Promise.all([
        adminCurriculumEndpoints.listLessons(unitId),
      ]);
      setLessons(lessonsRes.data.items || []);
    } catch (err) {
      setError('Failed to load lessons.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCurriculumEndpoints.createLesson(unitId, {
        ...formData,
        learning_objectives: formData.learning_objectives.filter(obj => obj.trim()),
      });
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        target_language: 'en',
        native_language: 'ur',
        difficulty_level: 'beginner',
        estimated_duration_minutes: 10,
        learning_objectives: [''],
        order_index: lessons.length + 1,
        is_published: false,
      });
      fetchData();
    } catch (err) {
      setError('Failed to create lesson.');
    }
  };

  const handleTogglePublish = async (lessonId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await adminCurriculumEndpoints.unpublishLesson(lessonId);
      } else {
        await adminCurriculumEndpoints.publishLesson(lessonId);
      }
      fetchData();
    } catch (err) {
      setError('Failed to update publish status.');
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await adminCurriculumEndpoints.deleteLesson(lessonId);
      fetchData();
    } catch (err) {
      setError('Failed to delete lesson.');
    }
  };

  const addObjective = () => {
    setFormData({ ...formData, learning_objectives: [...formData.learning_objectives, ''] });
  };

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...formData.learning_objectives];
    newObjectives[index] = value;
    setFormData({ ...formData, learning_objectives: newObjectives });
  };

  const removeObjective = (index: number) => {
    const newObjectives = formData.learning_objectives.filter((_, i) => i !== index);
    setFormData({ ...formData, learning_objectives: newObjectives });
  };

  if (loading) {
    return (
      <ProtectedAdminRoute>
        <AdminLayout>
          <div className="text-white text-xl">Loading...</div>
        </AdminLayout>
      </ProtectedAdminRoute>
    );
  }

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href={`/admin/curricula/${curriculumId}`} className="text-blue-400 hover:text-blue-300 text-sm">
                ← Back to Units
              </Link>
              <h1 className="text-3xl font-bold text-white">Lessons</h1>
              <p className="text-gray-400">Manage lessons in this unit</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + New Lesson
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {showForm && (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Create New Lesson</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Target Language</label>
                    <input
                      type="text"
                      value={formData.target_language}
                      onChange={(e) => setFormData({ ...formData, target_language: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Native Language</label>
                    <input
                      type="text"
                      value={formData.native_language}
                      onChange={(e) => setFormData({ ...formData, native_language: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty</label>
                    <select
                      value={formData.difficulty_level}
                      onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      value={formData.estimated_duration_minutes}
                      onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Order Index</label>
                    <input
                      type="number"
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={1}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Learning Objectives</label>
                  {formData.learning_objectives.map((obj, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={obj}
                        onChange={(e) => updateObjective(index, e.target.value)}
                        placeholder="e.g., Learn basic greetings"
                        className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeObjective(index)}
                        className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addObjective}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    + Add Objective
                  </button>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="w-5 h-5 accent-blue-600"
                    />
                    Publish immediately
                  </label>
                </div>
                <div className="flex gap-4">
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {lessons.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
              <p className="text-gray-400">No lessons yet. Create your first one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/admin/curricula/${curriculumId}/units/${unitId}/lessons/${lesson.id}/exercises`}
                        className="text-xl font-semibold text-white hover:text-blue-400 transition"
                      >
                        Lesson {lesson.order_index}: {lesson.title}
                      </Link>
                      <p className="text-gray-400 text-sm mt-1">{lesson.description || 'No description'}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>⏱️ {lesson.estimated_duration_minutes} min</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          lesson.difficulty_level === 'beginner' ? 'bg-green-500/20 text-green-400' :
                          lesson.difficulty_level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {lesson.difficulty_level}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          lesson.is_published ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {lesson.is_published ? '✅ Published' : '📝 Draft'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/curricula/${curriculumId}/units/${unitId}/lessons/${lesson.id}/exercises`}
                        className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition text-sm"
                      >
                        Manage Exercises
                      </Link>
                      <button
                        onClick={() => handleTogglePublish(lesson.id, lesson.is_published)}
                        className={`px-3 py-1 rounded-lg transition text-sm ${
                          lesson.is_published
                            ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                            : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        }`}
                      >
                        {lesson.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}