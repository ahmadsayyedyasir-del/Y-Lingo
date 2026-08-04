"use client";

import { useState } from "react";
import SettingsCard from "./SettingsCard";
import { LanguageSettings } from "@/types/settings";
import { languageOptions } from "@/data/settingsData";

interface LanguageSectionProps {
  language: LanguageSettings;
}

const selectClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-xl transition-colors duration-200 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40";

export default function LanguageSection({ language }: LanguageSectionProps) {
  const [native, setNative] = useState(language.nativeLanguage);
  const [learning, setLearning] = useState(language.learningLanguage);
  const [aiLang, setAiLang] = useState(language.aiConversationLanguage);

  function handleChange(field: "native" | "learning" | "ai", value: string) {
    // Backend integration point: PATCH /settings/language
    if (field === "native") setNative(value);
    if (field === "learning") setLearning(value);
    if (field === "ai") setAiLang(value);
  }

  return (
    <SettingsCard title="Language" description="What you speak and what you're learning">
      <div>
        <label htmlFor="native-language" className="mb-1.5 block text-xs text-gray-500">
          Native language
        </label>
        <select
          id="native-language"
          value={native}
          onChange={(e) => handleChange("native", e.target.value)}
          className={selectClass}
        >
          {languageOptions.map((opt) => (
            <option key={opt} value={opt} className="bg-[#030712] text-white">
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="learning-language" className="mb-1.5 block text-xs text-gray-500">
          Learning language
        </label>
        <select
          id="learning-language"
          value={learning}
          onChange={(e) => handleChange("learning", e.target.value)}
          className={selectClass}
        >
          {languageOptions.map((opt) => (
            <option key={opt} value={opt} className="bg-[#030712] text-white">
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="ai-conversation-language" className="mb-1.5 block text-xs text-gray-500">
          AI conversation language
        </label>
        <select
          id="ai-conversation-language"
          value={aiLang}
          onChange={(e) => handleChange("ai", e.target.value)}
          className={selectClass}
        >
          {languageOptions.map((opt) => (
            <option key={opt} value={opt} className="bg-[#030712] text-white">
              {opt}
            </option>
          ))}
        </select>
      </div>
    </SettingsCard>
  );
}