import LoginHeader from "./LoginHeader";
import LoginForm from "./LoginForm";
import SignupRedirect from "./SignupRedirect";
import SocialProof from "@/components/signup/SocialProof";

const highlights = [
  "Pick up right where you left off",
  "Your AI Coach remembers your progress",
  "New lessons and challenges every day",
];

export default function LoginContainer() {
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
          Welcome back. Your streak missed you.
        </h2>
        <p className="mt-4 max-w-sm text-base text-gray-400">
          Pick up your conversation practice right where you left it — your AI Coach kept your progress.
        </p>

        <ul className="mt-10 space-y-4">
          {highlights.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400"
                aria-hidden="true"
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <SocialProof rating="4.9/5" />
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <LoginHeader />
          <LoginForm />
          <div className="mt-6 space-y-4 lg:hidden">
            <SocialProof rating="4.9/5" />
          </div>
          <div className="mt-6">
            <SignupRedirect />
          </div>
        </div>
      </div>
    </div>
  );
}