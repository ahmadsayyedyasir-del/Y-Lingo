import { SettingsData } from "@/types/settings";

export const settingsData: SettingsData = {
  account: {
    fullName: "Alex Rivera",
    email: "alex@example.com",
    username: "alexr",
  },
  language: {
    nativeLanguage: "English",
    learningLanguage: "Spanish",
    aiConversationLanguage: "Spanish",
  },
  aiCoach: {
    conversationSpeed: "normal",
    grammarCorrection: true,
    translationAssistance: true,
    aiVoice: "female",
  },
  notifications: {
    dailyReminder: true,
    practiceReminder: true,
    emailNotifications: false,
    weeklyProgressReport: true,
  },
  appearance: {
    theme: "dark",
    fontSize: "medium",
  },
  about: {
    version: "1.0.0",
    supportEmail: "support@y-lingo.app",
  },
};

export const languageOptions = ["English", "Spanish", "French", "German", "Japanese", "Korean", "Mandarin", "Arabic", "Hindi", "Portuguese"] as const;

export const conversationSpeedOptions: { value: "slow" | "normal" | "fast"; label: string }[] = [
  { value: "slow", label: "Slow" },
  { value: "normal", label: "Normal" },
  { value: "fast", label: "Fast" },
];

export const themeOptions: { value: "dark" | "light" | "system"; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
];

export const fontSizeOptions: { value: "small" | "medium" | "large"; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];