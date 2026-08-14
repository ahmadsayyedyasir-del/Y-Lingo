// components/gamification/XPToast.tsx
// Self-dismissing XP earned toast + achievement unlocked modal.
// Usage:
//   <XPToast event={xpEvent} onDismiss={() => setXpEvent(null)} />
// where xpEvent is the gamification data from the AIResponse.
'use client';

import { useEffect, useState } from 'react';

export interface XPEvent {
  xp_earned: number;
  total_xp: number;
  level: number;
  leveled_up: boolean;
  newly_unlocked_achievements: {
    code: string;
    name: string;
    description: string;
  }[];
}

interface XPToastProps {
  event: XPEvent | null;
  onDismiss: () => void;
}

// ─── Achievement icons by code ───────────────────────────────────────────────
const ACHIEVEMENT_ICONS: Record<string, string> = {
  FIRST_SESSION:  '🎉',
  STREAK_3:       '🔥',
  STREAK_7:       '🔥',
  STREAK_30:      '🔥',
  MESSAGES_50:    '💬',
  MESSAGES_100:   '💬',
  FLUENCY_80:     '🗣️',
  LEVEL_5:        '⭐',
  LEVEL_10:       '🌟',
  LESSON_FIRST:   '📚',
  LESSONS_10:     '📚',
  LESSONS_50:     '🏆',
};

export default function XPToast({ event, onDismiss }: XPToastProps) {
  const [visible, setVisible] = useState(false);
  const [achievementIndex, setAchievementIndex] = useState(0);

  // Animate in
  useEffect(() => {
    if (!event) { setVisible(false); return; }
    setAchievementIndex(0);
    setVisible(true);

    // Auto-dismiss after 3.5s if no achievements, 5s per achievement
    const duration = event.newly_unlocked_achievements.length > 0
      ? 5000 + (event.newly_unlocked_achievements.length - 1) * 1500
      : 3500;

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // wait for fade-out
    }, duration);

    return () => clearTimeout(timer);
  }, [event]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cycle through multiple achievements
  useEffect(() => {
    if (!event || event.newly_unlocked_achievements.length <= 1) return;
    const timer = setInterval(() => {
      setAchievementIndex((i) => (i + 1) % event.newly_unlocked_achievements.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [event]);

  if (!event) return null;

  const achievement = event.newly_unlocked_achievements[achievementIndex];
  const hasAchievement = event.newly_unlocked_achievements.length > 0;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col gap-2 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      {/* XP earned toast */}
      <div className="bg-gray-900 border border-blue-500/40 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-xl shadow-blue-500/10 min-w-[200px]">
        <div className="text-2xl">⭐</div>
        <div>
          <p className="text-white font-semibold text-sm">
            +{event.xp_earned} XP earned!
          </p>
          <p className="text-gray-400 text-xs">
            {event.total_xp} total • Level {event.level}
          </p>
        </div>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          className="ml-auto text-gray-600 hover:text-gray-400 text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      {/* Level up toast */}
      {event.leveled_up && (
        <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/50 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-xl shadow-yellow-500/10 animate-pulse">
          <div className="text-2xl">🎊</div>
          <div>
            <p className="text-yellow-400 font-bold text-sm">Level Up!</p>
            <p className="text-yellow-300/70 text-xs">You reached Level {event.level}!</p>
          </div>
        </div>
      )}

      {/* Achievement unlocked toast */}
      {hasAchievement && achievement && (
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-xl shadow-purple-500/10">
          <div className="text-2xl">
            {ACHIEVEMENT_ICONS[achievement.code] || '🏅'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-purple-300 font-bold text-xs uppercase tracking-wide">
              Achievement Unlocked!
            </p>
            <p className="text-white font-semibold text-sm truncate">{achievement.name}</p>
            <p className="text-gray-400 text-xs truncate">{achievement.description}</p>
          </div>
          {event.newly_unlocked_achievements.length > 1 && (
            <span className="text-purple-400 text-xs ml-1 shrink-0">
              {achievementIndex + 1}/{event.newly_unlocked_achievements.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
