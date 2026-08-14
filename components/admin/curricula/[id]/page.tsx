// app/admin/curricula/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
}

interface Unit {
  id: string;
  curriculum_id: string;
  title: string;
  description: string;
  order_index: number;
  is_published: boolean;
}

export default function AdminCurriculumDetailPage() {
  const params = useParams();
  const curriculumId = params.id as string;

  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order_index: 1,
    is_published: false,
  });

  useEffect(() => {
    fetchData();
  }, [curriculumId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [curriculumRes, unitsRes] = await Promise.all([
        adminCurriculumEndpoints.get(curriculumId),
        adminCurriculumEndpoints.listUnits(curriculumId),
      ]);
      setCurriculum(curriculumRes.data);
      setUnits(unitsRes.data.items || []);
    } catch (err) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCurriculumEndpoints.createUnit(curriculumId, formData);
      setShowForm(false);
      setFormData({ title: '', description: '', order_index: units.length + 1, is_published: false });
      fetchData();
    } catch (err) {
      setError('Failed to create unit.');
    }
  };

  const handleTogglePublish = async (unitId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await adminCurriculumEndpoints.unpublishUnit(unitId);
      } else {
        await adminCurriculumEndpoints.publishUnit(unitId);
      }
      fetchData();
    } catch (err) {
      setError('Failed to update publish status.');
    }
  };

  const handleDelete = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;
    try {
      await adminCurriculumEndpoints.deleteUnit(unitId);
      fetchData();
    } catch (err) {
      setError('Failed to delete unit.');
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
              <Link href="/admin/curricula" className="text-blue-400 hover:text-blue-300 text-sm">
                ← Back to Curricula
              </Link>
              <h1 className="text-3xl font-bold text-white">{curriculum?.title}</h1>
              <p className="text-gray-400">Manage units in this curriculum</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + New Unit
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {showForm && (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Create New Unit</h2>
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">Order Index</label>
                    <input
                      type="number"
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={1}
                    />
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

          {units.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
              <p className="text-gray-400">No units yet. Create your first one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/admin/curricula/${curriculumId}/units/${unit.id}/lessons`}
                        className="text-xl font-semibold text-white hover:text-blue-400 transition"
                      >
                        Unit {unit.order_index}: {unit.title}
                      </Link>
                      <p className="text-gray-400 text-sm mt-1">{unit.description || 'No description'}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>📚 {unit.order_index}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          unit.is_published ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {unit.is_published ? '✅ Published' : '📝 Draft'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/curricula/${curriculumId}/units/${unit.id}/lessons`}
                        className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition text-sm"
                      >
                        Manage Lessons
                      </Link>
                      <button
                        onClick={() => handleTogglePublish(unit.id, unit.is_published)}
                        className={`px-3 py-1 rounded-lg transition text-sm ${
                          unit.is_published
                            ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                            : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        }`}
                      >
                        {unit.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(unit.id)}
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