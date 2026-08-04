export default function WhyYLingo() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        {/* Left Content */}
        <div>
          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
            Why Y-Lingo?
          </span>

          <h2 className="mt-8 text-5xl font-bold leading-tight text-white">
            Learning a language should feel like talking to a real person.
          </h2>

          <p className="mt-8 text-lg leading-8 text-gray-400">
            Most language apps make learners memorize vocabulary and complete
            repetitive exercises. Y-Lingo creates natural conversations where
            AI remembers you, corrects your mistakes, adapts to your level, and
            helps you become confident through daily speaking practice.
          </p>

          <div className="mt-10 space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <p className="text-gray-300">
                Real conversation instead of robotic exercises.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <p className="text-gray-300">
                AI remembers your learning journey.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <p className="text-gray-300">
                Personalized lessons based on your progress.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <p className="text-gray-300">
                Speak with confidence every single day.
              </p>
            </div>
          </div>
        </div>

        {/* Right Conversation Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-sm">
          <h3 className="text-3xl font-bold text-white">
            Imagine This...
          </h3>

          <div className="mt-8 space-y-6">
            <div className="rounded-xl bg-black/40 p-5">
              <p className="font-medium text-blue-400">AI</p>
              <p className="mt-2 text-gray-300">
                Welcome back, Yasir! Yesterday we practiced job interview
                English. Ready for Day 12?
              </p>
            </div>

            <div className="rounded-xl bg-blue-600/20 p-5">
              <p className="font-medium text-white">You</p>
              <p className="mt-2 text-gray-300">
                Yes! But I still confuse Past Perfect.
              </p>
            </div>

            <div className="rounded-xl bg-black/40 p-5">
              <p className="font-medium text-blue-400">AI</p>
              <p className="mt-2 text-gray-300">
                No problem. We&apos;ll practice it naturally during
                today&apos;s conversation, and I&apos;ll correct you whenever
                needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}