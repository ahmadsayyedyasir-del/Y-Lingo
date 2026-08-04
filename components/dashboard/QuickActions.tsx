import Link from "next/link";
import { MessageSquare, BookOpen, SpellCheck2, User } from "lucide-react";

const actions = [
  { label: "AI Chat", href: "/ai-coach", icon: MessageSquare },
  { label: "Lessons", href: "/lessons", icon: BookOpen },
  { label: "Vocabulary", href: "/vocabulary", icon: SpellCheck2 },
  { label: "Profile", href: "/profile", icon: User },
];

export default function QuickActions() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-white">Quick actions</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
              <action.icon size={18} aria-hidden="true" />
            </div>
            <span className="text-xs font-medium text-white">{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}