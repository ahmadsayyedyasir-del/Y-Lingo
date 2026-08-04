"use client";

import { Info, LifeBuoy, MessageSquare, Star } from "lucide-react";
import SettingsCard from "./SettingsCard";
import { AboutInfo } from "@/types/settings";

interface AboutSectionProps {
  about: AboutInfo;
}

export default function AboutSection({ about }: AboutSectionProps) {
  function handleFeedback() {
    // Backend integration point: open feedback form or mailto
  }

  function handleRate() {
    // Backend integration point: open store / rating modal
  }

  return (
    <SettingsCard title="About Y-Lingo" description="Version and support">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
          <Info size={16} aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Version</p>
          <p className="text-sm font-medium text-white">{about.version}</p>
        </div>
      </div>

      <a
        href={`mailto:${about.supportEmail}`}
        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300 transition-colors duration-200 hover:border-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <LifeBuoy size={16} className="shrink-0 text-blue-400" aria-hidden="true" />
        Support — {about.supportEmail}
      </a>

      <button
        type="button"
        onClick={handleFeedback}
        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-gray-300 transition-colors duration-200 hover:border-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <MessageSquare size={16} className="shrink-0 text-blue-400" aria-hidden="true" />
        Send feedback
      </button>

      <button
        type="button"
        onClick={handleRate}
        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-gray-300 transition-colors duration-200 hover:border-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <Star size={16} className="shrink-0 text-amber-400" aria-hidden="true" />
        Rate Y-Lingo
      </button>
    </SettingsCard>
  );
}