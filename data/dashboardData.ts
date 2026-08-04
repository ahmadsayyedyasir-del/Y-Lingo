import {
  UserStats,
  LessonCardData,
  DailyChallengeData,
  WeeklyProgressPoint,
  AchievementData,
  ActivityItem,
  StreakDay,
} from "@/types/dashboard";

export const userStats: UserStats = {
  streakDays: 12,
  xp: 3420,
  level: 7,
  todayGoalXp: 50,
  todayGoalProgressXp: 30,
};

export const continueLessons: LessonCardData[] = [
  { id: "l1", title: "Everyday Greetings", category: "speaking", progress: 65 },
  { id: "l2", title: "Common Verbs", category: "vocabulary", progress: 40 },
  { id: "l3", title: "Sentence Structure", category: "grammar", progress: 20 },
  { id: "l4", title: "Listening: Café Order", category: "listening", progress: 80 },
];

export const dailyChallenge: DailyChallengeData = {
  id: "dc1",
  title: "Complete 3 speaking exercises",
  description: "Sharpen your pronunciation with today's mission.",
  xpReward: 25,
  current: 1,
  goal: 3,
};

export const weeklyProgress: WeeklyProgressPoint[] = [
  { day: "Mon", xp: 40 },
  { day: "Tue", xp: 65 },
  { day: "Wed", xp: 30 },
  { day: "Thu", xp: 80 },
  { day: "Fri", xp: 55 },
  { day: "Sat", xp: 20 },
  { day: "Sun", xp: 70 },
];

export const achievements: AchievementData[] = [
  { id: "a1", title: "First Steps", description: "Complete your first lesson", unlocked: true },
  { id: "a2", title: "7-Day Streak", description: "Practice 7 days in a row", unlocked: true },
  { id: "a3", title: "Vocabulary Master", description: "Learn 100 new words", unlocked: false },
  { id: "a4", title: "Grammar Guru", description: "Complete all grammar units", unlocked: false },
];

export const recentActivity: ActivityItem[] = [
  { id: "r1", title: "Everyday Greetings", category: "speaking", xpEarned: 15, completedAt: "2 hours ago" },
  { id: "r2", title: "Common Verbs Quiz", category: "vocabulary", xpEarned: 10, completedAt: "Yesterday" },
  { id: "r3", title: "Past Tense Basics", category: "grammar", xpEarned: 20, completedAt: "2 days ago" },
];

export const streakCalendar: StreakDay[] = [
  { day: "M", completed: true },
  { day: "T", completed: true },
  { day: "W", completed: true },
  { day: "T", completed: true },
  { day: "F", completed: false },
  { day: "S", completed: false },
  { day: "S", completed: false },
];