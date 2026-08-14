// app/admin/curricula/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminCurriculumEndpoints } from '@/lib/endpoints';

interface Curriculum {
  id: string;
  title: string;
  description: string;
  target_language: string;
  difficulty_level: string;
  is_published: boolean;
  created_at: string;
}

export default function AdminCurriculaPage() {
  const router = useRouter();
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_language: 'en',
    native_language: 'ur',
    difficulty_level: 'beginner',
    is_published: false,
  });

  useEffect(() => {
    fetchCurricula();
  }, []);

  const fetchCurricula = async () => {
    try {
      setLoading(true);
      const response = await adminCurriculumEndpoints.list();
      setCurricula(response.data.items || []);
    } catch (err) {
      setError('Failed to load curricula.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCurriculumEndpoints.create(formData);
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        target_language: 'en',
        native_language: 'ur',
        difficulty_level: 'beginner',
        is_published: false,
      });
      fetchCurricula();
    } catch (err) {
      setError('Failed to create curriculum.');
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await adminCurriculumEndpoints.unpublish(id);
      } else {
        await adminCurriculumEndpoints.publish(id);
      }
      fetchCurricula();
    } catch (err) {
      setError('Failed to update publish status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this curriculum?')) return;
    try {
      await adminCurriculumEndpoints.delete(id);
      fetchCurricula();
    } catch (err) {
      setError('Failed to delete curriculum.');
    }
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
              <h1 className="text-3xl font-bold text-white">📚 Curricula</h1>
              <p className="text-gray-400">Manage all courses</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + New Curriculum
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Create Form */}
          {showForm && (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Create New Curriculum</h2>
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
                <div className="grid grid-cols-2 gap-4">
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

          {/* Curricula List */}
          {curricula.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
              <p className="text-gray-400">No curricula yet. Create your first one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {curricula.map((curriculum) => (
                <div
                  key={curriculum.id}
                  className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/admin/curricula/${curriculum.id}`} className="text-xl font-semibold text-white hover:text-blue-400 transition">
                        {curriculum.title}
                      </Link>
                      <p className="text-gray-400 text-sm mt-1">{curriculum.description || 'No description'}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>🌍 {curriculum.target_language}</span>
                        <span>|</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          curriculum.difficulty_level === 'beginner' ? 'bg-green-500/20 text-green-400' :
                          curriculum.difficulty_level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {curriculum.difficulty_level}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          curriculum.is_published ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {curriculum.is_published ? '✅ Published' : '📝 Draft'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/curricula/${curriculum.id}`}
                        className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition text-sm"
                      >
                        Manage
                      </Link>
                      <button
                        onClick={() => handleTogglePublish(curriculum.id, curriculum.is_published)}
                        className={`px-3 py-1 rounded-lg transition text-sm ${
                          curriculum.is_published
                            ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                            : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        }`}
                      >
                        {curriculum.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(curriculum.id)}
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