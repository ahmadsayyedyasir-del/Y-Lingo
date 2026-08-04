"use client";

import { useEffect, useState } from "react";
import { Flame, Star, TrendingUp, Target } from "lucide-react";
import { UserStats } from "@/types/dashboard";

interface StatsCardsProps {
  stats: UserStats;
}

interface StatConfig {
  label: string;
  value: number;
  suffix?: string;
  icon: typeof Flame;
  accent: string;
}

function useCountUp(target: number, durationMs = 800): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    let frame: number;

    function step(timestamp: number) {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / durationMs, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

function StatCard({ label, value, suffix, icon: Icon, accent }: StatConfig) {
  const animatedValue = useCountUp(value);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
        <Icon size={18} aria-hidden="true" />
      </div>
      <p className="text-2xl font-semibold text-white">
        {animatedValue}
        {suffix}
      </p>
      <p className="mt-1 text-xs text-gray-400">{label}</p>
    </div>
  );
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards: StatConfig[] = [
    { label: "Current streak", value: stats.streakDays, suffix: " days", icon: Flame, accent: "bg-orange-500/15 text-orange-400" },
    { label: "Total XP", value: stats.xp, icon: Star, accent: "bg-blue-500/15 text-blue-400" },
    { label: "Current level", value: stats.level, icon: TrendingUp, accent: "bg-indigo-500/15 text-indigo-400" },
    { label: "Today's goal", value: stats.todayGoalProgressXp, suffix: `/${stats.todayGoalXp} XP`, icon: Target, accent: "bg-emerald-500/15 text-emerald-400" },
  ];

  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Learning statistics">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </section>
  );
}