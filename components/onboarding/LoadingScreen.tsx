"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const messages = [
  "🔍 Analyzing your profile...",
  "🤖 Creating your AI Coach...",
  "📚 Preparing personalized lessons...",
  "🎯 Setting your daily goals...",
  "🚀 Almost Ready...",
];

export default function LoadingScreen() {
  const router = useRouter();

  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 20;

        if (next >= 100) {
          clearInterval(interval);

          setTimeout(() => {
            router.push("/dashboard");
          }, 700);

          return 100;
        }

        return next;
      });

      setMessageIndex((prev) =>
        prev < messages.length - 1 ? prev + 1 : prev
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-20">

      <div className="h-20 w-20 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />

      <h2 className="mt-10 text-3xl font-bold text-white">
        Preparing Your Experience
      </h2>

      <p className="mt-4 text-gray-400">
        {messages[messageIndex]}
      </p>

      <div className="mt-10 h-3 w-full rounded-full bg-white/10">
        <div
          className="h-3 rounded-full bg-blue-500 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-4 text-sm text-gray-400">
        {progress}%
      </p>

    </div>
  );
}