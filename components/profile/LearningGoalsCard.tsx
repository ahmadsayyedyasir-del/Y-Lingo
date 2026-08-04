import { Target, Calendar, Flag, Sparkles } from "lucide-react";
import { LearningGoals } from "@/types/profile";

interface LearningGoalsCardProps {
  goals: LearningGoals;
}

const items = [
  { key: "dailyGoalXp" as const, label: "Daily goal", icon: Target, format: (v: number | string) => `${v} XP` },
  { key: "weeklyGoalXp" as const, label: "Weekly goal", icon: Calendar, format: (v: number | string) => `${v} XP` },
  { key: "targetFluency" as const, label: "Target fluency", icon: Flag, format: (v: number | string) => String(v) },
  { key: "learningStyle" as const, label: "Learning style", icon: Sparkles, format: (v: number | string) => String(v) },
];

export default function LearningGoalsCard({ goals }: LearningGoalsCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="text-sm font-semibold text-white">Learning goals</h2>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map(({ key, label, icon: Icon, format }) => (
          <div key={key} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
              <Icon size={16} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="mt-0.5 text-sm font-semibold text-white">{format(goals[key])}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}