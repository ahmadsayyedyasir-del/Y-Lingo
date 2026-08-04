import Button from "@/components/ui/Button";
import OptionCard from "@/components/ui/OptionCard";
import { levels } from "@/data/levels";

interface StepTwoProps {
  level: string;
  setLevel: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function StepTwo({
  level,
  setLevel,
  onBack,
  onContinue,
}: StepTwoProps) {
  return (
    <>
      <h1 className="mt-8 text-4xl font-bold text-white">
        What is your current level?
      </h1>

      <p className="mt-3 text-gray-400">
        This helps us recommend lessons that match your ability.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {levels.map((item) => (
          <OptionCard
            key={item}
            title={item}
            selected={level === item}
            onClick={() => setLevel(item)}
          />
        ))}
      </div>

      <div className="mt-10 flex justify-between">
        <Button
          variant="secondary"
          onClick={onBack}
        >
          Back
        </Button>

        <Button
          disabled={!level}
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </>
  );
}