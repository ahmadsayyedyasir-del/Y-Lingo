import { Star, TrendingUp, Flame, BookOpen, Clock } from "lucide-react";
import { ProfileStats } from "@/types/profile";

interface StatsOverviewProps {
  stats: ProfileStats;
}

const cards = [
  { key: "xp" as const, label: "Total XP", icon: Star, accent: "bg-blue-500/15 text-blue-400", format: (n: number) => n.toLocaleString() },
  { key: "level" as const, label: "Level", icon: TrendingUp, accent: "bg-indigo-500/15 text-indigo-400", format: (n: number) => String(n) },
  { key: "streakDays" as const, label: "Streak", icon: Flame, accent: "bg-orange-500/15 text-orange-400", format: (n: number) => `${n} days` },
  { key: "completedLessons" as const, label: "Lessons", icon: BookOpen, accent: "bg-emerald-500/15 text-emerald-400", format: (n: number) => String(n) },
  { key: "practiceMinutes" as const, label: "Practice time", icon: Clock, accent: "bg-amber-500/15 text-amber-400", format: (n: number) => `${Math.floor(n / 60)}h ${n % 60}m` },
];

export default function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <section aria-label="Profile statistics">
      <h2 className="mb-4 text-lg font-semibold text-white">Stats overview</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map(({ key, label, icon: Icon, accent, format }) => (
          <div
            key={key}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
              <Icon size={18} aria-hidden="true" />
            </div>
            <p className="text-xl font-semibold text-white">{format(stats[key])}</p>
            <p className="mt-1 text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}