"use client";

import { useState } from "react";
import SettingsCard from "./SettingsCard";
import ToggleSwitch from "./ToggleSwitch";
import { NotificationSettings } from "@/types/settings";

interface NotificationSectionProps {
  notifications: NotificationSettings;
}

export default function NotificationSection({ notifications }: NotificationSectionProps) {
  const [daily, setDaily] = useState(notifications.dailyReminder);
  const [practice, setPractice] = useState(notifications.practiceReminder);
  const [email, setEmail] = useState(notifications.emailNotifications);
  const [weekly, setWeekly] = useState(notifications.weeklyProgressReport);

  function persist() {
    // Backend integration point: PATCH /settings/notifications
  }

  return (
    <SettingsCard title="Notifications" description="Stay on track without noise">
      <ToggleSwitch
        id="daily-reminder"
        checked={daily}
        onChange={(v) => {
          setDaily(v);
          persist();
        }}
        label="Daily reminder"
        description="A nudge to keep your streak alive"
      />
      <ToggleSwitch
        id="practice-reminder"
        checked={practice}
        onChange={(v) => {
          setPractice(v);
          persist();
        }}
        label="Practice reminder"
        description="When you haven't practised for a while"
      />
      <ToggleSwitch
        id="email-notifications"
        checked={email}
        onChange={(v) => {
          setEmail(v);
          persist();
        }}
        label="Email notifications"
        description="Product updates and important account mail"
      />
      <ToggleSwitch
        id="weekly-progress"
        checked={weekly}
        onChange={(v) => {
          setWeekly(v);
          persist();
        }}
        label="Weekly progress report"
        description="Summary of XP, lessons, and streak every week"
      />
    </SettingsCard>
  );
}