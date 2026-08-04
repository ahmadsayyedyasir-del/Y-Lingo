import Button from "@/components/ui/Button";
import OptionCard from "@/components/ui/OptionCard";
import {
  nativeLanguages,
  learningLanguages,
} from "@/data/languages";

interface StepOneProps {
  nativeLanguage: string;
  learningLanguage: string;
  setNativeLanguage: (value: string) => void;
  setLearningLanguage: (value: string) => void;
  onContinue: () => void;
}

export default function StepOne({
  nativeLanguage,
  learningLanguage,
  setNativeLanguage,
  setLearningLanguage,
  onContinue,
}: StepOneProps) {
  return (
    <>
      <h1 className="mt-8 text-4xl font-bold text-white">
        Let&apos;s personalize your learning
      </h1>

      <p className="mt-3 text-gray-400">
        Tell us a little about yourself so your AI Coach can personalize your
        learning journey.
      </p>

      <div className="mt-10">
        <label className="mb-3 block text-lg font-medium text-white">
          🌍 What is your native language?
        </label>

        <select
          value={nativeLanguage}
          onChange={(e) => setNativeLanguage(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500"
        >
          <option value="">
            Select your native language
          </option>

          {nativeLanguages.map((language) => (
            <option
              key={language}
              value={language}
            >
              {language}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-10">
        <label className="mb-4 block text-lg font-medium text-white">
          🎯 Which language do you want to learn?
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          {learningLanguages.map((language) => (
            <OptionCard
              key={language}
              title={language}
              selected={learningLanguage === language}
              onClick={() => setLearningLanguage(language)}
            />
          ))}
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <Button
          disabled={!nativeLanguage || !learningLanguage}
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </>
  );
}