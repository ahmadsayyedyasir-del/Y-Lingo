export type LessonCategory = "vocabulary" | "grammar" | "speaking" | "listening";

export interface ProfileUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  country: string;
  timezone: string;
  nativeLanguage: string;
  learningLanguage: string;
  memberSince: string;
  avatarInitials: string;
}

export interface LearningGoals {
  dailyGoalXp: number;
  weeklyGoalXp: number;
  targetFluency: string;
  learningStyle: string;
}

export interface ProfileStats {
  xp: number;
  level: number;
  streakDays: number;
  completedLessons: number;
  practiceMinutes: number;
}

export interface SkillProgress {
  vocabulary: number;
  grammar: number;
  speaking: number;
  listening: number;
}

export interface ProfileAchievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface RecentLesson {
  id: string;
  title: string;
  category: LessonCategory;
  xpEarned: number;
  completedAt: string;
}

export interface RecentConversation {
  id: string;
  title: string;
  durationMinutes: number;
  completedAt: string;
}