import { BookOpen, SpellCheck2, PenLine, Headphones } from "lucide-react";
import { ActivityItem, LessonCategory } from "@/types/dashboard";

interface RecentActivityProps {
  items: ActivityItem[];
}

const categoryIcon: Record<LessonCategory, typeof BookOpen> = {
  vocabulary: SpellCheck2,
  grammar: PenLine,
  speaking: BookOpen,
  listening: Headphones,
};

export default function RecentActivity({ items }: RecentActivityProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="text-sm font-semibold text-white">Recent activity</h2>

      <ul className="mt-4 space-y-3">
        {items.map((item) => {
          const Icon = categoryIcon[item.category];

          return (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                  <Icon size={16} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.completedAt}</p>
                </div>
              </div>
              <span className="shrink-0 text-xs font-semibold text-blue-400">+{item.xpEarned} XP</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}