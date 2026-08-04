"use client";

import { useState, ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

interface DashboardLayoutProps {
  children: ReactNode;
  userName: string;
}

export default function DashboardLayout({ children, userName }: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#030712]">
      <Sidebar isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

      <div className="lg:pl-64">
        <TopNavbar onMenuClick={() => setIsMobileSidebarOpen(true)} userName={userName} />
        <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}