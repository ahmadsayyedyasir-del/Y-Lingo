export type ThemeOption = "dark" | "light" | "system";
export type FontSizeOption = "small" | "medium" | "large";
export type ConversationSpeed = "slow" | "normal" | "fast";
export type AiVoice = "male" | "female";

export interface AccountSettings {
  fullName: string;
  email: string;
  username: string;
}

export interface LanguageSettings {
  nativeLanguage: string;
  learningLanguage: string;
  aiConversationLanguage: string;
}

export interface AICoachSettings {
  conversationSpeed: ConversationSpeed;
  grammarCorrection: boolean;
  translationAssistance: boolean;
  aiVoice: AiVoice;
}

export interface NotificationSettings {
  dailyReminder: boolean;
  practiceReminder: boolean;
  emailNotifications: boolean;
  weeklyProgressReport: boolean;
}

export interface AppearanceSettings {
  theme: ThemeOption;
  fontSize: FontSizeOption;
}

export interface AboutInfo {
  version: string;
  supportEmail: string;
}

export interface SettingsData {
  account: AccountSettings;
  language: LanguageSettings;
  aiCoach: AICoachSettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  about: AboutInfo;
}