import Button from "@/components/ui/Button";
import { Bot, MessageCircle, Mic } from "lucide-react";

export default function AICoachCard() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-white/5 to-indigo-600/20 p-8 backdrop-blur-xl">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
            <Bot size={24} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Your AI Coach is ready</h2>
            <p className="mt-1 max-w-md text-sm text-gray-400">
              Pick up your conversation, start something new, or work on your pronunciation.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="primary">
            <span className="flex items-center gap-2">
              <MessageCircle size={16} aria-hidden="true" />
              Continue Conversation
            </span>
          </Button>
          <Button variant="secondary">Start New Lesson</Button>
          <Button variant="secondary">
            <span className="flex items-center gap-2">
              <Mic size={16} aria-hidden="true" />
              Practice Speaking
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
}