"use client";

import Button from "@/components/ui/Button";
import { Pencil } from "lucide-react";

interface EditProfileButtonProps {
  onClick?: () => void;
}

export default function EditProfileButton({ onClick }: EditProfileButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      className="shrink-0"
      onClick={onClick}
      aria-label="Edit profile"
    >
      <span className="flex items-center gap-2">
        <Pencil size={16} aria-hidden="true" />
        Edit Profile
      </span>
    </Button>
  );
}