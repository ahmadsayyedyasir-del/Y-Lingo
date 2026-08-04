import Button from "@/components/ui/Button";

export default function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-600/20 to-slate-900 p-12 text-center">

        <h2 className="text-4xl font-bold text-white">
          Start Speaking with Confidence Today
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
          Join Y-Lingo and improve your speaking through real AI conversations,
          personalized feedback, and daily practice.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Button>
            Get Started Free
          </Button>

          <Button variant="secondary">
            Learn More
          </Button>
        </div>

      </div>
    </section>
  );
}