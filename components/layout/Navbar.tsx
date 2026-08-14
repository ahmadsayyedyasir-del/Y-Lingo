// components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/learn', label: 'Learn' },
    { href: '/ielts', label: 'IELTS' },
    { href: '/conversation', label: 'Chat' },
    { href: '/voice', label: '🎤 Voice' },
    { href: '/history', label: '📜 History' },
    { href: '/progress', label: '📊 Progress' },  // ✅ Added Progress
    { href: '/rag', label: 'Documents' },
    { href: '/profile', label: 'Profile' },
  ];

  if (user?.is_admin) {
    links.push({ href: '/admin', label: 'Admin' });
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <nav className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🌐</span>
            <span className="text-white font-bold text-lg hidden sm:block">Y-Lingo</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(link.href)
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                {link.href === '/voice' ? '🎤 Voice' : link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm hidden sm:block">
              {user?.full_name}
            </span>
            <button
              onClick={logout}
              className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}