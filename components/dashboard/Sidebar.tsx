"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  SpellCheck2,
  PenLine,
  Mic,
  User,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Coach", href: "/ai-coach", icon: Bot },
  { label: "Lessons", href: "/lessons", icon: BookOpen },
  { label: "Vocabulary", href: "/vocabulary", icon: SpellCheck2 },
  { label: "Grammar", href: "/grammar", icon: PenLine },
  { label: "Speaking", href: "/speaking", icon: Mic },
];

const bottomItems: NavItem[] = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const widthClass = collapsed ? "w-20" : "w-64";

  return (
    <>
      {isMobileOpen && (
        <button
          aria-label="Close sidebar overlay"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex ${widthClass} flex-col border-r border-white/10 bg-[#030712]/95 backdrop-blur-xl transition-all duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-5 py-6">
          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight text-white">Y-Lingo</span>
          )}
          <button
            onClick={onMobileClose}
            className="text-gray-400 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="hidden text-gray-400 hover:text-white lg:block"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-300 transition-colors duration-200 hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <item.icon size={18} className="shrink-0 text-gray-400" aria-hidden="true" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/10 px-3 py-4">
          {bottomItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-300 transition-colors duration-200 hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <item.icon size={18} className="shrink-0 text-gray-400" aria-hidden="true" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-colors duration-200 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            <LogOut size={18} className="shrink-0" aria-hidden="true" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}