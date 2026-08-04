import { User, Mail, MapPin, Clock, Languages } from "lucide-react";
import { ProfileUser } from "@/types/profile";

interface ProfileCardProps {
  user: ProfileUser;
}

const fields = [
  { key: "fullName" as const, label: "Full name", icon: User },
  { key: "email" as const, label: "Email", icon: Mail },
  { key: "country" as const, label: "Country", icon: MapPin },
  { key: "timezone" as const, label: "Timezone", icon: Clock },
  { key: "nativeLanguage" as const, label: "Native language", icon: Languages },
  { key: "learningLanguage" as const, label: "Learning language", icon: Languages },
];

export default function ProfileCard({ user }: ProfileCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="text-sm font-semibold text-white">Account details</h2>
      <dl className="mt-5 space-y-4">
        {fields.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
              <Icon size={14} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="mt-0.5 truncate text-sm font-medium text-white">{user[key]}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}