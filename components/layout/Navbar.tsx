// components/layout/Navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const NAV_LINKS = [
  { href: '/dashboard',    label: 'Dashboard',   emoji: '🏠' },
  { href: '/learn',        label: 'Learn',        emoji: '📚' },
  { href: '/ielts',        label: 'IELTS',        emoji: '🎓' },
  { href: '/conversation', label: 'Chat',         emoji: '🤖' },
  { href: '/voice',        label: 'Voice',        emoji: '🎤' },
  { href: '/history',      label: 'History',      emoji: '📜' },
  { href: '/progress',     label: 'Progress',     emoji: '📊' },
  { href: '/leaderboard',  label: 'Leaderboard',  emoji: '🏆' },
  { href: '/rag',          label: 'Documents',    emoji: '📄' },
  { href: '/profile',      label: 'Profile',      emoji: '👤' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = (user?.is_admin || user?.isAdmin)
    ? [...NAV_LINKS, { href: '/admin', label: 'Admin', emoji: '⚙️' }]
    : NAV_LINKS;

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === href || pathname?.startsWith(href + '/');

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <nav className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🌐</span>
            <span className="text-white font-bold text-lg hidden sm:block">Y-Lingo</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5 overflow-x-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  isActive(link.href)
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-gray-400 text-sm truncate max-w-[120px]">
              {user?.full_name || user?.fullName}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition text-sm font-medium"
            >
              Logout
            </button>
          </div>

          {/* Mobile: user name + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <span className="text-gray-400 text-sm truncate max-w-[100px]">
              {user?.full_name || user?.fullName}
            </span>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900/95 backdrop-blur-sm">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive(link.href)
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{link.emoji}</span>
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-600/10 transition"
              >
                <span className="text-lg">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
