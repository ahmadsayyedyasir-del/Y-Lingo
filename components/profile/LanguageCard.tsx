import { Languages } from "lucide-react";
import { ProfileUser } from "@/types/profile";

interface LanguageCardProps {
  user: ProfileUser;
}

export default function LanguageCard({ user }: LanguageCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
          <Languages size={18} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Languages</h2>
          <p className="text-xs text-gray-500">Your learning pair</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Native</p>
          <p className="mt-1 text-sm font-semibold text-white">{user.nativeLanguage}</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
          <p className="text-[11px] uppercase tracking-wide text-blue-400">Learning</p>
          <p className="mt-1 text-sm font-semibold text-white">{user.learningLanguage}</p>
        </div>
      </div>
    </section>
  );
}