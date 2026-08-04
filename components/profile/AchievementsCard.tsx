import { Award, Lock } from "lucide-react";
import { ProfileAchievement } from "@/types/profile";

interface AchievementsCardProps {
  achievements: ProfileAchievement[];
}

export default function AchievementsCard({ achievements }: AchievementsCardProps) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-white">Achievements</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-5 text-center backdrop-blur-xl transition-all duration-300 ${
              achievement.unlocked
                ? "border-blue-500/30 bg-blue-500/10"
                : "border-white/10 bg-white/5 opacity-60"
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                achievement.unlocked ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-gray-500"
              }`}
            >
              {achievement.unlocked ? (
                <Award size={20} aria-hidden="true" />
              ) : (
                <Lock size={18} aria-hidden="true" />
              )}
            </div>
            <p className="text-xs font-semibold text-white">{achievement.title}</p>
            <p className="text-[11px] text-gray-500">{achievement.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}