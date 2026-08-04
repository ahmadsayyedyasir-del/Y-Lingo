import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function Hero() {
  return (
    <section className="mx-auto flex min-h-[90vh] max-w-7xl items-center px-6 py-20">
      <div className="grid w-full items-center gap-16 lg:grid-cols-2">
        {/* Left Side */}
        <div>
          <Badge>🚀 AI Powered Language Learning</Badge>

          <h1 className="mt-8 text-4xl font-extrabold leading-tight text-white md:text-5xl">
            Learn Languages
            <br />
            Through Real
            <span className="text-blue-500"> Conversations.</span>
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-8 text-gray-400">
            Practice speaking with an AI that remembers your progress,
            corrects your mistakes, translates when needed, and helps
            you become a confident speaker.
          </p>

          <div className="mt-10 flex gap-4">
            <Button>Start Learning</Button>

            <Button variant="secondary">
              Watch Demo
            </Button>
          </div>

          <div className="mt-12 flex gap-10">
            <div>
              <h3 className="text-3xl font-bold text-white">100+</h3>
              <p className="text-gray-400">Conversation Topics</p>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-white">24/7</h3>
              <p className="text-gray-400">AI Coach</p>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-white">100 Days</h3>
              <p className="text-gray-400">Learning Challenge</p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <Card>
          <div className="space-y-5">
            <div className="rounded-2xl bg-black/40 p-5">
              <p className="font-semibold text-blue-400">🤖 AI</p>

              <p className="mt-2 text-gray-300">
                Welcome back, Yasir! Ready for today&apos;s English practice?
              </p>
            </div>

            <div className="rounded-2xl bg-blue-600/20 p-5">
              <p className="font-semibold text-white">😊 You</p>

              <p className="mt-2 text-gray-300">
                Yes! I want to improve my speaking confidence.
              </p>
            </div>

            <div className="rounded-2xl bg-black/40 p-5">
              <p className="font-semibold text-blue-400">🤖 AI</p>

              <p className="mt-2 text-gray-300">
                Don&apos;t worry. We&apos;ll practice naturally and
                I&apos;ll help you improve step by step.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
              <p className="text-sm text-blue-300">
                ✅ AI Memory Active
              </p>

              <p className="mt-2 text-gray-300">
                Last Session: Past Tense (82%)
                <br />
                Today&apos;s Goal: Improve Speaking Fluency
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}