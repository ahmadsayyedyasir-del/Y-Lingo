import SignupHeader from "./SignupHeader";
import SignupForm from "./SignupForm";
import SocialProof from "./SocialProof";
import LoginRedirect from "./LoginRedirect";

const features = [
  "Practice real conversations with your AI Coach",
  "Get instant, personalized feedback",
  "Track your progress across every language",
];

export default function SignupContainer() {
  return (
    <div className="flex min-h-screen bg-[#030712]">
      <div className="relative hidden w-1/2 flex-col justify-center overflow-hidden px-16 lg:flex">
        <div
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl"
          aria-hidden="true"
        />

        <span className="text-lg font-semibold tracking-tight text-white">Y-Lingo</span>

        <h2 className="mt-8 max-w-md text-4xl font-semibold leading-tight text-white">
          Learn a language the way you&apos;d actually enjoy it.
        </h2>
        <p className="mt-4 max-w-sm text-base text-gray-400">
          Skip the flashcards. Talk it out with an AI Coach that adapts to how you learn.
        </p>

        <ul className="mt-10 space-y-4">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-gray-300">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400"
                aria-hidden="true"
              >
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <SocialProof />
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <SignupHeader />
          <SignupForm />
          <div className="mt-6 space-y-4 lg:hidden">
            <SocialProof />
          </div>
          <div className="mt-6">
            <LoginRedirect />
          </div>
        </div>
      </div>
    </div>
  );
}