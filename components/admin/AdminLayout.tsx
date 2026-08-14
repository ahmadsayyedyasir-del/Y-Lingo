// components/admin/AdminLayout.tsx
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900/90 border-r border-gray-800 p-6 flex flex-col fixed h-full">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">⚙️ Admin</h1>
          <p className="text-gray-500 text-sm">Content Management</p>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/admin" className="block px-4 py-2 text-gray-300 hover:bg-gray-800/50 rounded-lg transition">
            📊 Dashboard
          </Link>
          <Link href="/admin/curricula" className="block px-4 py-2 text-gray-300 hover:bg-gray-800/50 rounded-lg transition">
            📚 Curricula
          </Link>
        </nav>

        <div className="border-t border-gray-800 pt-4">
          <Link href="/dashboard" className="block px-4 py-2 text-gray-400 hover:text-white transition">
            ← Back to Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-red-400 hover:text-red-300 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}