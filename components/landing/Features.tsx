export default function Features() {
  const features = [
    {
      title: "AI Memory",
      description:
        "Your AI remembers your conversations, mistakes, and learning progress.",
    },
    {
      title: "Voice Conversations",
      description:
        "Practice speaking naturally with real-time AI voice interaction.",
    },
    {
      title: "100-Day Challenge",
      description:
        "Complete daily conversations, vocabulary, quizzes, and speaking tasks.",
    },
    {
      title: "Smart Translation",
      description:
        "Switch naturally between your native language and the target language.",
    },
    {
      title: "Personal Notebook",
      description:
        "Automatically save vocabulary, grammar, expressions, and your own notes.",
    },
    {
      title: "Adaptive AI Coach",
      description:
        "The AI adjusts lessons according to your level and learning progress.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white">
          Why Choose Y-Lingo?
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-gray-400">
          More than just an AI chatbot — your personal language coach.
        </p>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-8 transition duration-300 hover:border-blue-500/40 hover:bg-white/10"
          >
            <h3 className="text-2xl font-semibold text-white">
              {feature.title}
            </h3>

            <p className="mt-4 leading-7 text-gray-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}