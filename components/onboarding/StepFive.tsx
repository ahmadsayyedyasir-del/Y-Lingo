import Button from "@/components/ui/Button";
import OptionCard from "@/components/ui/OptionCard";
import { dailyGoals } from "@/data/dailyGoals";

interface StepFiveProps {
  dailyGoal: string;
  setDailyGoal: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function StepFive({
  dailyGoal,
  setDailyGoal,
  onBack,
  onContinue,
}: StepFiveProps) {
  return (
    <>
      <h1 className="mt-8 text-4xl font-bold text-white">
        Daily Practice Goal
      </h1>

      <p className="mt-3 text-gray-400">
        Choose how much time you can practice every day.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {dailyGoals.map((item) => (
          <OptionCard
            key={item}
            title={item}
            selected={dailyGoal === item}
            onClick={() => setDailyGoal(item)}
          />
        ))}
      </div>

      <div className="mt-10 flex justify-between">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>

        <Button
          disabled={!dailyGoal}
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </>
  );
}