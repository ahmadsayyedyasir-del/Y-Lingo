"use client";

import { useState } from "react";

import ProgressBar from "@/components/ui/ProgressBar";

import StepOne from "@/components/onboarding/StepOne";
import StepTwo from "@/components/onboarding/StepTwo";
import StepThree from "@/components/onboarding/StepThree";
import StepFour from "@/components/onboarding/StepFour";
import StepFive from "@/components/onboarding/StepFive";
import LoadingScreen from "@/components/onboarding/LoadingScreen";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);

  const [nativeLanguage, setNativeLanguage] = useState("");
  const [learningLanguage, setLearningLanguage] = useState("");
  const [level, setLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [skill, setSkill] = useState("");
  const [dailyGoal, setDailyGoal] = useState("");

  const finishOnboarding = () => {
    console.log("✅ Finish button clicked");

    const onboardingData = {
      nativeLanguage,
      learningLanguage,
      level,
      goal,
      learningStyle: skill,
      dailyGoal,
      completedAt: new Date().toISOString(),
    };

    console.log("📦 Data to save:", onboardingData);

    localStorage.setItem(
      "ylingo-onboarding",
      JSON.stringify(onboardingData)
    );

    console.log(
      "💾 Saved Data:",
      localStorage.getItem("ylingo-onboarding")
    );

    setStep(6);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030712] px-6">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur">

        {step <= 5 && (
          <>
            <p className="text-sm text-blue-400">
              Step {step} of 5
            </p>

            <ProgressBar value={(step / 5) * 100} />
          </>
        )}

        {step === 1 && (
          <StepOne
            nativeLanguage={nativeLanguage}
            learningLanguage={learningLanguage}
            setNativeLanguage={setNativeLanguage}
            setLearningLanguage={setLearningLanguage}
            onContinue={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <StepTwo
            level={level}
            setLevel={setLevel}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <StepThree
            onBack={() => setStep(2)}
            onContinue={(selectedGoals) => {
              setGoal(selectedGoals.join(", "));
              setStep(4);
            }}
          />
        )}

        {step === 4 && (
          <StepFour
            learningStyle={skill}
            setLearningStyle={setSkill}
            onBack={() => setStep(3)}
            onContinue={() => setStep(5)}
          />
        )}

        {step === 5 && (
          <StepFive
            dailyGoal={dailyGoal}
            setDailyGoal={setDailyGoal}
            onBack={() => setStep(4)}
            onContinue={finishOnboarding}
          />
        )}

        {step === 6 && <LoadingScreen />}

      </div>
    </main>
  );
}