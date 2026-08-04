import type { Metadata } from "next";
import SettingsLayout from "@/components/settings/SettingsLayout";
import SettingsHeader from "@/components/settings/SettingsHeader";
import AccountSection from "@/components/settings/AccountSection";
import LanguageSection from "@/components/settings/LanguageSection";
import AICoachSection from "@/components/settings/AICoachSection";
import NotificationSection from "@/components/settings/NotificationSection";
import AppearanceSection from "@/components/settings/AppearanceSection";
import PrivacySection from "@/components/settings/PrivacySection";
import AboutSection from "@/components/settings/AboutSection";
import { settingsData } from "@/data/settingsData";

export const metadata: Metadata = {
  title: "Settings — Y-Lingo",
  description: "Manage your Y-Lingo account, languages, AI Coach, notifications, and privacy.",
};

export default function SettingsPage() {
  return (
    <SettingsLayout userName={settingsData.account.fullName}>
      <SettingsHeader />
      <AccountSection account={settingsData.account} />
      <LanguageSection language={settingsData.language} />
      <AICoachSection aiCoach={settingsData.aiCoach} />
      <NotificationSection notifications={settingsData.notifications} />
      <AppearanceSection appearance={settingsData.appearance} />
      <PrivacySection />
      <AboutSection about={settingsData.about} />
    </SettingsLayout>
  );
}