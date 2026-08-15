// app/admin/curricula/new/page.tsx — Create new curriculum
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { adminCurriculumEndpoints } from '@/lib/endpoints';

const LEVELS = ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced'];
const LANGUAGES = ['English', 'Urdu', 'Arabic', 'Spanish', 'French', 'German', 'Chinese'];

export default function NewCurriculumPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', target_language: 'English',
    native_language: 'Urdu', difficulty_level: 'beginner', is_published: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await adminCurriculumEndpoints.create(form);
      router.push(`/admin/curricula/${res.data.id}`);
    } catch {
      setError('Failed to create curriculum. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-400 hover:text-white text-sm">← Admin</Link>
          <span className="text-gray-600">/</span>
          <h1 className="text-xl font-bold text-white">New Curriculum</h1>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">{error}</div>
        )}

        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                placeholder="e.g. English for Beginners"
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                rows={3} placeholder="Describe the curriculum..."
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Target Language</label>
                <select value={form.target_language} onChange={e => setForm({...form, target_language: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Native Language</label>
                <select value={form.native_language} onChange={e => setForm({...form, native_language: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty Level</label>
              <select value={form.difficulty_level} onChange={e => setForm({...form, difficulty_level: e.target.value})}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="published" checked={form.is_published}
                onChange={e => setForm({...form, is_published: e.target.checked})}
                className="w-4 h-4 rounded accent-blue-600" />
              <label htmlFor="published" className="text-sm text-gray-300">Publish immediately</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Curriculum'}
              </button>
              <Link href="/admin" className="px-6 py-2.5 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 transition font-medium">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
