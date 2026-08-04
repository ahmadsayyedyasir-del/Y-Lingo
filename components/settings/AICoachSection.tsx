"use client";

import { useState } from "react";
import SettingsCard from "./SettingsCard";
import ToggleSwitch from "./ToggleSwitch";
import { AICoachSettings, ConversationSpeed, AiVoice } from "@/types/settings";
import { conversationSpeedOptions } from "@/data/settingsData";

interface AICoachSectionProps {
  aiCoach: AICoachSettings;
}

const selectClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-xl transition-colors duration-200 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40";

export default function AICoachSection({ aiCoach }: AICoachSectionProps) {
  const [speed, setSpeed] = useState<ConversationSpeed>(aiCoach.conversationSpeed);
  const [grammar, setGrammar] = useState(aiCoach.grammarCorrection);
  const [translation, setTranslation] = useState(aiCoach.translationAssistance);
  const [voice, setVoice] = useState<AiVoice>(aiCoach.aiVoice);

  function persist() {
    // Backend integration point: PATCH /settings/ai-coach
    // body: { conversationSpeed: speed, grammarCorrection: grammar, translationAssistance: translation, aiVoice: voice }
  }

  return (
    <SettingsCard title="AI Coach" description="How your language partner behaves">
      <div>
        <label htmlFor="conversation-speed" className="mb-1.5 block text-xs text-gray-500">
          Conversation speed
        </label>
        <select
          id="conversation-speed"
          value={speed}
          onChange={(e) => {
            setSpeed(e.target.value as ConversationSpeed);
            persist();
          }}
          className={selectClass}
        >
          {conversationSpeedOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#030712] text-white">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <ToggleSwitch
        id="grammar-correction"
        checked={grammar}
        onChange={(v) => {
          setGrammar(v);
          persist();
        }}
        label="Grammar correction"
        description="AI points out and explains mistakes in real time"
      />

      <ToggleSwitch
        id="translation-assistance"
        checked={translation}
        onChange={(v) => {
          setTranslation(v);
          persist();
        }}
        label="Translation assistance"
        description="Show translations when you're stuck"
      />

      <div>
        <p className="mb-2 text-xs text-gray-500">AI voice</p>
        <div className="flex gap-3" role="radiogroup" aria-label="AI voice">
          {(["female", "male"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={voice === option}
              onClick={() => {
                setVoice(option);
                persist();
              }}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium capitalize transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                voice === option
                  ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                  : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-200"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </SettingsCard>
  );
}