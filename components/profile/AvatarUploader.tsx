"use client";

import { Camera } from "lucide-react";

interface AvatarUploaderProps {
  initials: string;
  fullName: string;
  onUploadClick?: () => void;
}

export default function AvatarUploader({ initials, fullName, onUploadClick }: AvatarUploaderProps) {
  return (
    <div className="relative">
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-semibold text-white shadow-lg shadow-blue-500/20 sm:h-28 sm:w-28 sm:text-3xl"
        aria-label={`Avatar for ${fullName}`}
      >
        {initials}
      </div>
      <button
        type="button"
        onClick={onUploadClick}
        className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-[#030712] text-gray-300 transition-colors duration-200 hover:border-blue-500/50 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        aria-label="Upload new avatar"
      >
        <Camera size={14} aria-hidden="true" />
      </button>
    </div>
  );
}