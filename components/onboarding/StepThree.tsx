"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

const goals = [
  {
    id: "speaking",
    icon: "🗣",
    title: "Speak Fluently",
    description: "Build confidence through real conversations.",
  },
  {
    id: "grammar",
    icon: "✍",
    title: "Improve Grammar",
    description: "Learn grammar naturally while speaking.",
  },
  {
    id: "vocabulary",
    icon: "📚",
    title: "Expand Vocabulary",
    description: "Learn useful words and expressions every day.",
  },
  {
    id: "listening",
    icon: "🎧",
    title: "Better Listening",
    description: "Understand native speakers more easily.",
  },
  {
    id: "interview",
    icon: "💼",
    title: "Job & Interview English",
    description: "Prepare for interviews and professional communication.",
  },
  {
    id: "academic",
    icon: "🎓",
    title: "Academic English",
    description: "Improve English for university and study.",
  },
  {
    id: "travel",
    icon: "🌍",
    title: "Travel Conversations",
    description: "Speak confidently while travelling.",
  },
  {
    id: "daily",
    icon: "💬",
    title: "Daily Conversations",
    description: "Practice everyday situations naturally.",
  },
];

interface StepThreeProps {
  onContinue: (selectedGoals: string[]) => void;
  onBack: () => void;
}

export default function StepThree({
  onContinue,
  onBack,
}: StepThreeProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-blue-400">
          Step 3 of 5
        </p>

        <h2 className="mt-3 text-4xl font-bold text-white">
          What are your learning goals?
        </h2>

        <p className="mt-3 text-gray-400">
          Select one or more goals. Your AI Coach will personalize lessons based
          on your choices.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {goals.map((goal) => {
          const active = selectedGoals.includes(goal.id);

          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => toggleGoal(goal.id)}
              className={`rounded-2xl border p-6 text-left transition-all duration-300 ${
                active
                  ? "border-blue-500 bg-blue-500/15"
                  : "border-white/10 bg-white/5 hover:border-blue-400"
              }`}
            >
              <div className="text-3xl">{goal.icon}</div>

              <h3 className="mt-4 text-xl font-semibold text-white">
                {goal.title}
              </h3>

              <p className="mt-2 text-gray-400">
                {goal.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
        <h4 className="font-semibold text-blue-300">
          🤖 AI Personalization
        </h4>

        <p className="mt-2 text-gray-300">
          Based on your goals, I&apos;ll personalize conversations, vocabulary,
          grammar corrections, and daily challenges just for you.
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>

        <Button
          disabled={selectedGoals.length === 0}
          onClick={() => onContinue(selectedGoals)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}