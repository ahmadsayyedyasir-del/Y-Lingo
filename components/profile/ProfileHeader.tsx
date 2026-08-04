"use client";

import { ProfileUser } from "@/types/profile";
import AvatarUploader from "./AvatarUploader";
import EditProfileButton from "./EditProfileButton";

interface ProfileHeaderProps {
  user: ProfileUser;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <AvatarUploader initials={user.avatarInitials} fullName={user.fullName} />
          <div>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">{user.fullName}</h1>
            <p className="mt-1 text-sm text-gray-400">@{user.username}</p>
            <p className="mt-1 text-sm text-gray-500">{user.email}</p>
            <p className="mt-2 text-xs text-gray-500">Member since {user.memberSince}</p>
          </div>
        </div>
        <EditProfileButton />
      </div>
    </section>
  );
}