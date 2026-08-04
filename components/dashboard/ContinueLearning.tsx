import { BookOpen, SpellCheck2, PenLine, Headphones } from "lucide-react";
import { LessonCardData, LessonCategory } from "@/types/dashboard";

interface ContinueLearningProps {
  lessons: LessonCardData[];
}

const categoryConfig: Record<LessonCategory, { icon: typeof BookOpen; accent: string; label: string }> = {
  vocabulary: { icon: SpellCheck2, accent: "bg-blue-500/15 text-blue-400", label: "Vocabulary" },
  grammar: { icon: PenLine, accent: "bg-indigo-500/15 text-indigo-400", label: "Grammar" },
  speaking: { icon: BookOpen, accent: "bg-emerald-500/15 text-emerald-400", label: "Speaking" },
  listening: { icon: Headphones, accent: "bg-amber-500/15 text-amber-400", label: "Listening" },
};

export default function ContinueLearning({ lessons }: ContinueLearningProps) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-white">Continue learning</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {lessons.map((lesson) => {
          const config = categoryConfig[lesson.category];
          const Icon = config.icon;

          return (
            <button
              key={lesson.id}
              type="button"
              className="flex flex-col items-start rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${config.accent}`}>
                <Icon size={18} aria-hidden="true" />
              </div>
              <p className="text-xs font-medium text-gray-400">{config.label}</p>
              <p className="mt-1 text-sm font-semibold text-white">{lesson.title}</p>

              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${lesson.progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">{lesson.progress}% complete</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}