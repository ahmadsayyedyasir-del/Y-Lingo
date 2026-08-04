"use client";

import Link from "next/link";
import { FileText, Shield, Download, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import SettingsCard from "./SettingsCard";

export default function PrivacySection() {
  function handleExportData() {
    // Backend integration point: GET /settings/export → download user data archive
  }

  function handleDeleteAccount() {
    // Intentionally disabled in UI until backend + confirmation flow exists.
    // Future: multi-step confirm → DELETE /auth/account
  }

  return (
    <SettingsCard title="Privacy & legal" description="Your data and our policies">
      <div className="space-y-3">
        <Link
          href="/privacy"
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300 transition-colors duration-200 hover:border-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <Shield size={16} className="shrink-0 text-blue-400" aria-hidden="true" />
          Privacy Policy
        </Link>
        <Link
          href="/terms"
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300 transition-colors duration-200 hover:border-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <FileText size={16} className="shrink-0 text-blue-400" aria-hidden="true" />
          Terms of Service
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
        <Button type="button" variant="secondary" onClick={handleExportData}>
          <span className="flex items-center gap-2">
            <Download size={14} aria-hidden="true" />
            Export data
          </span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled
          className="cursor-not-allowed opacity-50"
          onClick={handleDeleteAccount}
          aria-disabled="true"
        >
          <span className="flex items-center gap-2">
            <Trash2 size={14} aria-hidden="true" />
            Delete account
          </span>
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Account deletion is disabled until the full confirmation flow is live.
      </p>
    </SettingsCard>
  );
}