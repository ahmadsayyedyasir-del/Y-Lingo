import Button from "@/components/ui/Button";

interface WelcomeBannerProps {
  userName: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function WelcomeBanner({ userName }: WelcomeBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-400">
            {getGreeting()}, {userName}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            Ready to keep your streak alive?
          </h1>
          <p className="mt-2 max-w-md text-sm text-gray-400">
            A few minutes of practice today keeps your progress moving — your AI Coach is ready when you are.
          </p>
        </div>
        <Button variant="primary" className="shrink-0">
          Continue Learning
        </Button>
      </div>
    </section>
  );
}