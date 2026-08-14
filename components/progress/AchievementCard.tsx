// components/progress/AchievementCard.tsx
'use client';

interface AchievementCardProps {
  code: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export default function AchievementCard({
  code,
  title,
  description,
  unlocked,
  unlockedAt,
}: AchievementCardProps) {
  const emojis: Record<string, string> = {
    first_lesson: '🎯',
    lesson_master: '📚',
    streak_7: '🔥',
    streak_30: '⚡',
    conversation_starter: '💬',
    chatty: '🗣️',
    xp_collector: '💎',
    xp_master: '⭐',
  };

  const emoji = emojis[code] || '🏆';

  return (
    <div
      className={`p-3 rounded-xl border text-center transition ${
        unlocked
          ? 'border-blue-500/50 bg-blue-500/10'
          : 'border-gray-800 bg-gray-900/50 opacity-50'
      }`}
    >
      <div className="text-2xl">{emoji}</div>
      <p className="text-sm font-medium text-white mt-1">{title}</p>
      <p className="text-xs text-gray-400">{description}</p>
      {unlocked && unlockedAt && (
        <p className="text-xs text-green-400 mt-1">
          ✅ {new Date(unlockedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}