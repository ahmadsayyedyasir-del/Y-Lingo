export type LessonCategory = "vocabulary" | "grammar" | "speaking" | "listening";

export interface UserStats {
  streakDays: number;
  xp: number;
  level: number;
  todayGoalXp: number;
  todayGoalProgressXp: number;
}

export interface LessonCardData {
  id: string;
  title: string;
  category: LessonCategory;
  progress: number;
}

export interface DailyChallengeData {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  current: number;
  goal: number;
}

export interface WeeklyProgressPoint {
  day: string;
  xp: number;
}

export interface AchievementData {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface ActivityItem {
  id: string;
  title: string;
  category: LessonCategory;
  xpEarned: number;
  completedAt: string;
}

export interface StreakDay {
  day: string;
  completed: boolean;
}