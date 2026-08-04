import { Trophy } from "lucide-react";
import { DailyChallengeData } from "@/types/dashboard";

interface DailyChallengeProps {
  challenge: DailyChallengeData;
}

export default function DailyChallenge({ challenge }: DailyChallengeProps) {
  const progressPercent = Math.min((challenge.current / challenge.goal) * 100, 100);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <Trophy size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Today&apos;s mission</p>
            <h3 className="mt-1 text-sm font-semibold text-white">{challenge.title}</h3>
            <p className="mt-1 text-xs text-gray-400">{challenge.description}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-400">
          +{challenge.xpReward} XP
        </span>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          {challenge.current} of {challenge.goal} completed
        </p>
      </div>
    </section>
  );
}