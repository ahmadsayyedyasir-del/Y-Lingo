import type { Metadata } from "next";
import ProfileLayout from "@/components/profile/ProfileLayout";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileCard from "@/components/profile/ProfileCard";
import LanguageCard from "@/components/profile/LanguageCard";
import LearningGoalsCard from "@/components/profile/LearningGoalsCard";
import StatsOverview from "@/components/profile/StatsOverview";
import ProgressOverview from "@/components/profile/ProgressOverview";
import AchievementsCard from "@/components/profile/AchievementsCard";
import RecentLearningCard from "@/components/profile/RecentLearningCard";
import {
  profileUser,
  learningGoals,
  profileStats,
  skillProgress,
  profileAchievements,
  recentLessons,
  recentConversations,
} from "@/data/profileData";

export const metadata: Metadata = {
  title: "Profile — Y-Lingo",
  description: "Manage your Y-Lingo learning identity, goals, stats, and achievements.",
};

export default function ProfilePage() {
  return (
    <ProfileLayout userName={profileUser.fullName}>
      <ProfileHeader user={profileUser} />

      <StatsOverview stats={profileStats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ProfileCard user={profileUser} />
        <LanguageCard user={profileUser} />
        <ProgressOverview progress={skillProgress} />
      </div>

      <LearningGoalsCard goals={learningGoals} />

      <AchievementsCard achievements={profileAchievements} />

      <RecentLearningCard lessons={recentLessons} conversations={recentConversations} />
    </ProfileLayout>
  );
}