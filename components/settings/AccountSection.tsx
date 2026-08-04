"use client";

import { User, Mail, AtSign, LogOut, KeyRound, Pencil } from "lucide-react";
import Button from "@/components/ui/Button";
import SettingsCard from "./SettingsCard";
import { AccountSettings } from "@/types/settings";

interface AccountSectionProps {
  account: AccountSettings;
}

export default function AccountSection({ account }: AccountSectionProps) {
  function handleEditProfile() {
    // Backend integration point: navigate to /profile or open edit modal.
    // window.location.href = "/profile";
  }

  function handleChangePassword() {
    // Backend integration point: open change-password flow / modal.
  }

  function handleLogout() {
    // Backend integration point: call FastAPI logout, clear JWT/session, redirect to /login.
  }

  return (
    <SettingsCard title="Account" description="Your identity on Y-Lingo">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
            <User size={16} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="text-sm font-medium text-white">{account.fullName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
            <Mail size={16} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-medium text-white">{account.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
            <AtSign size={16} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Username</p>
            <p className="text-sm font-medium text-white">@{account.username}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
        <Button type="button" variant="secondary" onClick={handleEditProfile}>
          <span className="flex items-center gap-2">
            <Pencil size={14} aria-hidden="true" />
            Edit Profile
          </span>
        </Button>
        <Button type="button" variant="secondary" onClick={handleChangePassword}>
          <span className="flex items-center gap-2">
            <KeyRound size={14} aria-hidden="true" />
            Change Password
          </span>
        </Button>
        <Button type="button" variant="secondary" className="text-red-400 hover:border-red-500/40 hover:text-red-300" onClick={handleLogout}>
          <span className="flex items-center gap-2">
            <LogOut size={14} aria-hidden="true" />
            Logout
          </span>
        </Button>
      </div>
    </SettingsCard>
  );
}