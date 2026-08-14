// components/progress/XpProgress.tsx
'use client';

interface XpProgressProps {
  current: number;
  next: number;
  progress: number;
  currentXp: number;
  level: number;
  levelLabel: string;
}

export default function XpProgress({
  current,
  next,
  progress,
  currentXp,
  level,
  levelLabel,
}: XpProgressProps) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-white font-semibold">
            Level {level} — {levelLabel}
          </p>
          <p className="text-gray-400 text-sm">
            {currentXp} XP total
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-sm">
            {currentXp - current} XP / {next - current} XP
          </p>
          <p className="text-blue-400 text-sm font-medium">
            {progress}% to next level
          </p>
        </div>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}