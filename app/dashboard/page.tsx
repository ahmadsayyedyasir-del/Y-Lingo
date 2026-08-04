import type { Metadata } from "next";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import StatsCards from "@/components/dashboard/StatsCards";
import AICoachCard from "@/components/dashboard/AICoachCard";
import ContinueLearning from "@/components/dashboard/ContinueLearning";
import DailyChallenge from "@/components/dashboard/DailyChallenge";
import ProgressChart from "@/components/dashboard/ProgressChart";
import Achievements from "@/components/dashboard/Achievements";
import LearningStreak from "@/components/dashboard/LearningStreak";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import {
  userStats,
  continueLessons,
  dailyChallenge,
  weeklyProgress,
  achievements,
  recentActivity,
  streakCalendar,
} from "@/data/dashboardData";

export const metadata: Metadata = {
  title: "Dashboard — Y-Lingo",
  description: "Your Y-Lingo learning dashboard — streaks, XP, lessons, and your AI Coach.",
};

const userName = "Alex"; // Backend integration point: replace with authenticated user's name.

export default function DashboardPage() {
  return (
    <DashboardLayout userName={userName}>
      <WelcomeBanner userName={userName} />
      <StatsCards stats={userStats} />
      <AICoachCard />

      <ContinueLearning lessons={continueLessons} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProgressChart data={weeklyProgress} />
        </div>
        <DailyChallenge challenge={dailyChallenge} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity items={recentActivity} />
        </div>
        <LearningStreak days={streakCalendar} streakCount={userStats.streakDays} />
      </div>

      <Achievements achievements={achievements} />
      <QuickActions />
    </DashboardLayout>
  );
}