// app/admin/curricula/[id]/page.tsx — Curriculum detail with units
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { adminCurriculumEndpoints } from '@/lib/endpoints';
import { LoadingSpinner } from '@/components/ui/Skeleton';

interface Unit { id: string; title: string; order_index: number; is_published: boolean; lessons_count?: number }
interface Curriculum { id: string; title: string; description?: string; target_language: string; difficulty_level: string; is_published: boolean }

export default function CurriculumDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [addingUnit, setAddingUnit] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);

  const fetchData = async () => {
    try {
      const [cRes, uRes] = await Promise.all([
        adminCurriculumEndpoints.get(id as string),
        adminCurriculumEndpoints.listUnits(id as string),
      ]);
      setCurriculum(cRes.data);
      setUnits(uRes.data.items || []);
    } catch {
      setError('Failed to load curriculum.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchData(); }, [id]);

  const togglePublish = async () => {
    if (!curriculum) return;
    try {
      const res = curriculum.is_published
        ? await adminCurriculumEndpoints.unpublish(curriculum.id)
        : await adminCurriculumEndpoints.publish(curriculum.id);
      setCurriculum(res.data);
    } catch { setError('Failed to update publish status.'); }
  };

  const addUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitTitle.trim()) return;
    setAddingUnit(true);
    try {
      await adminCurriculumEndpoints.createUnit(id as string, {
        title: newUnitTitle.trim(),
        order_index: units.length + 1,
        is_published: false,
      });
      setNewUnitTitle('');
      setShowAddUnit(false);
      fetchData();
    } catch { setError('Failed to create unit.'); }
    finally { setAddingUnit(false); }
  };

  const deleteUnit = async (unitId: string) => {
    if (!confirm('Delete this unit and all its lessons?')) return;
    try {
      await adminCurriculumEndpoints.deleteUnit(unitId);
      setUnits(u => u.filter(x => x.id !== unitId));
    } catch { setError('Failed to delete unit.'); }
  };

  if (loading) return <LoadingSpinner message="Loading curriculum..." />;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link href="/admin" className="text-gray-400 hover:text-white">Admin</Link>
          <span className="text-gray-600">/</span>
          <span className="text-white font-medium">{curriculum?.title}</span>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>}

        {curriculum && (
          <>
            {/* Curriculum header */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">{curriculum.title}</h1>
                  {curriculum.description && <p className="text-gray-400 mt-1 text-sm">{curriculum.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-gray-500 text-xs">{curriculum.target_language}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-500 text-xs capitalize">{curriculum.difficulty_level}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      curriculum.is_published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {curriculum.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={togglePublish}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      curriculum.is_published
                        ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                        : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                    }`}>
                    {curriculum.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                </div>
              </div>
            </div>

            {/* Units */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-white font-semibold">Units ({units.length})</h2>
                <button onClick={() => setShowAddUnit(v => !v)}
                  className="px-4 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition text-sm">
                  + Add Unit
                </button>
              </div>

              {showAddUnit && (
                <form onSubmit={addUnit} className="px-6 py-4 border-b border-gray-800 flex gap-3">
                  <input type="text" value={newUnitTitle} onChange={e => setNewUnitTitle(e.target.value)}
                    placeholder="Unit title..."
                    className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  <button type="submit" disabled={addingUnit}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50">
                    {addingUnit ? 'Adding...' : 'Add'}
                  </button>
                  <button type="button" onClick={() => setShowAddUnit(false)}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition text-sm">
                    Cancel
                  </button>
                </form>
              )}

              {units.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No units yet. Add your first unit above.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {units.map((unit, i) => (
                    <div key={unit.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/10">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 text-sm w-6">#{i + 1}</span>
                        <div>
                          <p className="text-white text-sm font-medium">{unit.title}</p>
                          <span className={`text-xs ${unit.is_published ? 'text-green-400' : 'text-yellow-400'}`}>
                            {unit.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/curricula/${id}/units/${unit.id}`}
                          className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition text-xs">
                          Lessons →
                        </Link>
                        <button onClick={() => deleteUnit(unit.id)}
                          className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition text-xs">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
