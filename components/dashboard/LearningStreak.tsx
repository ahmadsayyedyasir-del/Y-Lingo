import { Flame } from "lucide-react";
import { StreakDay } from "@/types/dashboard";

interface LearningStreakProps {
  days: StreakDay[];
  streakCount: number;
}

export default function LearningStreak({ days, streakCount }: LearningStreakProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
          <Flame size={18} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{streakCount}-day streak</p>
          <p className="text-xs text-gray-500">Keep it going this week</p>
        </div>
      </div>

      <div className="mt-5 flex justify-between gap-2">
        {days.map((day, index) => (
          <div key={`${day.day}-${index}`} className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                day.completed ? "bg-orange-500 text-white" : "bg-white/10 text-gray-500"
              }`}
            >
              {day.completed ? <Flame size={14} aria-hidden="true" /> : ""}
            </div>
            <span className="text-[11px] text-gray-500">{day.day}</span>
          </div>
        ))}
      </div>
    </section>
  );
}