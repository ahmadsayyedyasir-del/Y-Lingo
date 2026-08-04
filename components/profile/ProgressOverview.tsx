import { SkillProgress } from "@/types/profile";

interface ProgressOverviewProps {
  progress: SkillProgress;
}

const skills: { key: keyof SkillProgress; label: string; color: string }[] = [
  { key: "vocabulary", label: "Vocabulary", color: "bg-blue-500" },
  { key: "grammar", label: "Grammar", color: "bg-indigo-500" },
  { key: "speaking", label: "Speaking", color: "bg-emerald-500" },
  { key: "listening", label: "Listening", color: "bg-amber-500" },
];

export default function ProgressOverview({ progress }: ProgressOverviewProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="text-sm font-semibold text-white">Skill progress</h2>
      <p className="mt-1 text-xs text-gray-500">How strong you are in each area</p>

      <ul className="mt-6 space-y-5">
        {skills.map(({ key, label, color }) => {
          const value = progress[key];
          return (
            <li key={key}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">{label}</span>
                <span className="text-xs font-semibold text-white">{value}%</span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label} progress`}
              >
                <div
                  className={`h-full rounded-full ${color} transition-all duration-500`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}