"use client";

import { useState } from "react";
import SettingsCard from "./SettingsCard";
import { AppearanceSettings, ThemeOption, FontSizeOption } from "@/types/settings";
import { themeOptions, fontSizeOptions } from "@/data/settingsData";

interface AppearanceSectionProps {
  appearance: AppearanceSettings;
}

export default function AppearanceSection({ appearance }: AppearanceSectionProps) {
  const [theme, setTheme] = useState<ThemeOption>(appearance.theme);
  const [fontSize, setFontSize] = useState<FontSizeOption>(appearance.fontSize);

  function persist() {
    // Backend integration point: PATCH /settings/appearance
    // Also apply theme/font locally (e.g. document.documentElement class)
  }

  return (
    <SettingsCard title="Appearance" description="Look and feel of Y-Lingo">
      <div>
        <p className="mb-2 text-xs text-gray-500">Theme</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Theme">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={theme === opt.value}
              onClick={() => {
                setTheme(opt.value);
                persist();
              }}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                theme === opt.value
                  ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                  : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-gray-500">Font size</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Font size">
          {fontSizeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={fontSize === opt.value}
              onClick={() => {
                setFontSize(opt.value);
                persist();
              }}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                fontSize === opt.value
                  ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                  : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </SettingsCard>
  );
}