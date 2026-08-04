"use client";

import Button from "@/components/ui/Button";
import OptionCard from "@/components/ui/OptionCard";
import { learningStyles } from "@/data/learningStyles";

interface StepFourProps {
  learningStyle: string;
  setLearningStyle: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function StepFour({
  learningStyle,
  setLearningStyle,
  onBack,
  onContinue,
}: StepFourProps) {
  return (
    <>
      <h1 className="mt-8 text-4xl font-bold text-white">
        How do you prefer to learn?
      </h1>

      <p className="mt-3 text-gray-400">
        Choose the learning style that fits you best.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {learningStyles.map((style) => (
          <OptionCard
            key={style.id}
            title={`${style.emoji} ${style.title}`}
            description={style.description}
            selected={learningStyle === style.id}
            onClick={() => setLearningStyle(style.id)}
          />
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
        <p className="text-sm text-gray-300">
          🤖 Don&apos;t worry... You can change your learning style anytime from
          Settings.
        </p>
      </div>

      <div className="mt-10 flex justify-between">
        <Button
          variant="secondary"
          onClick={onBack}
        >
          Back
        </Button>

        <Button
          disabled={!learningStyle}
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </>
  );
}