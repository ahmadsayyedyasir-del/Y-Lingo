import {
  ProfileUser,
  LearningGoals,
  ProfileStats,
  SkillProgress,
  ProfileAchievement,
  RecentLesson,
  RecentConversation,
} from "@/types/profile";

export const profileUser: ProfileUser = {
  id: "u1",
  fullName: "Alex Rivera",
  username: "alexr",
  email: "alex@example.com",
  country: "United States",
  timezone: "America/New_York (UTC-5)",
  nativeLanguage: "English",
  learningLanguage: "Spanish",
  memberSince: "January 2026",
  avatarInitials: "AR",
};

export const learningGoals: LearningGoals = {
  dailyGoalXp: 50,
  weeklyGoalXp: 300,
  targetFluency: "Conversational",
  learningStyle: "Conversation-first",
};

export const profileStats: ProfileStats = {
  xp: 3420,
  level: 7,
  streakDays: 12,
  completedLessons: 48,
  practiceMinutes: 620,
};

export const skillProgress: SkillProgress = {
  vocabulary: 72,
  grammar: 58,
  speaking: 64,
  listening: 81,
};

export const profileAchievements: ProfileAchievement[] = [
  { id: "a1", title: "First Steps", description: "Complete your first lesson", unlocked: true },
  { id: "a2", title: "7-Day Streak", description: "Practice 7 days in a row", unlocked: true },
  { id: "a3", title: "Conversation Starter", description: "Finish 10 AI conversations", unlocked: true },
  { id: "a4", title: "Vocabulary Master", description: "Learn 100 new words", unlocked: false },
  { id: "a5", title: "Grammar Guru", description: "Complete all grammar units", unlocked: false },
  { id: "a6", title: "Fluent Speaker", description: "Reach conversational fluency", unlocked: false },
];

export const recentLessons: RecentLesson[] = [
  { id: "rl1", title: "Everyday Greetings", category: "speaking", xpEarned: 15, completedAt: "2 hours ago" },
  { id: "rl2", title: "Common Verbs Quiz", category: "vocabulary", xpEarned: 10, completedAt: "Yesterday" },
  { id: "rl3", title: "Past Tense Basics", category: "grammar", xpEarned: 20, completedAt: "2 days ago" },
];

export const recentConversations: RecentConversation[] = [
  { id: "rc1", title: "Ordering at a café", durationMinutes: 8, completedAt: "Today" },
  { id: "rc2", title: "Introducing yourself", durationMinutes: 6, completedAt: "Yesterday" },
  { id: "rc3", title: "Asking for directions", durationMinutes: 10, completedAt: "3 days ago" },
];