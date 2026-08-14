// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminCurriculumEndpoints } from '@/lib/endpoints';

interface Stats {
  total_curricula: number;
  total_units: number;
  total_lessons: number;
  total_exercises: number;
  published: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    total_curricula: 0,
    total_units: 0,
    total_lessons: 0,
    total_exercises: 0,
    published: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminCurriculumEndpoints.list();
        const curricula = response.data.items || [];
        setStats({
          total_curricula: curricula.length,
          total_units: 0,
          total_lessons: 0,
          total_exercises: 0,
          published: curricula.filter((c: any) => c.is_published).length,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">📊 Admin Dashboard</h1>
          <p className="text-gray-400 mb-6">Manage your learning content</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm">Total Curricula</p>
              <p className="text-3xl font-bold text-white">{stats.total_curricula}</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm">Published</p>
              <p className="text-3xl font-bold text-white">{stats.published}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/admin/curricula" className="block bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition">
              <h2 className="text-xl font-semibold text-white mb-2">📚 Curricula</h2>
              <p className="text-gray-400">Manage courses, units, lessons, and exercises</p>
            </Link>
          </div>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}