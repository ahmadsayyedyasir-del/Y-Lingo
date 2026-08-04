import { WeeklyProgressPoint } from "@/types/dashboard";

interface ProgressChartProps {
  data: WeeklyProgressPoint[];
}

export default function ProgressChart({ data }: ProgressChartProps) {
  const maxXp = Math.max(...data.map((point) => point.xp), 1);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="text-sm font-semibold text-white">Weekly progress</h2>
      <p className="mt-1 text-xs text-gray-500">XP earned per day</p>

      <div className="mt-6 flex items-end justify-between gap-3" role="img" aria-label="Weekly XP progress chart">
        {data.map((point) => (
          <div key={point.day} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-32 w-full items-end overflow-hidden rounded-lg bg-white/5">
              <div
                className="w-full rounded-lg bg-gradient-to-t from-blue-600 to-indigo-400 transition-all duration-500"
                style={{ height: `${(point.xp / maxXp) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{point.day}</span>
          </div>
        ))}
      </div>
    </section>
  );
}