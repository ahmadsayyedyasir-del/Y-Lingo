'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface StepCompleteProps {
  formData: {
    native_language: string;
    learning_language: string;
    level: string;
    learning_style: string;
    daily_goal: number;
  };
}

export default function StepComplete({ formData }: StepCompleteProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="text-center py-8">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-white mb-2">You&apos;re All Set!</h2>
      <p className="text-gray-400 mb-4">
        Your preferences have been saved. Let&apos;s start learning!
      </p>
      <div className="bg-gray-800/50 rounded-lg p-4 text-left text-sm">
        <p className="text-gray-300">📖 Learning: <span className="text-white">{formData.learning_language}</span></p>
        <p className="text-gray-300">📊 Level: <span className="text-white">{formData.level}</span></p>
        <p className="text-gray-300">🎯 Daily Goal: <span className="text-white">{formData.daily_goal} min</span></p>
      </div>
      <p className="text-gray-500 text-sm mt-4">Redirecting to dashboard...</p>
    </div>
  );
}