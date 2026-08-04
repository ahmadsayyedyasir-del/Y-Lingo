"use client";

import { Menu, Search, Bell } from "lucide-react";

interface TopNavbarProps {
  onMenuClick: () => void;
  userName: string;
}

export default function TopNavbar({ onMenuClick, userName }: TopNavbarProps) {
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/10 bg-[#030712]/80 px-4 py-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="text-gray-400 hover:text-white lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>

        <div className="relative hidden sm:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search lessons, words..."
            aria-label="Search"
            className="w-64 rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 backdrop-blur-xl focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-gray-400 hover:text-white" aria-label="Notifications">
          <Bell size={20} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
          {initials}
        </div>
      </div>
    </header>
  );
}