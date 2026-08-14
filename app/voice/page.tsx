// app/voice/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

interface Scenario {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

const scenarios: Scenario[] = [
  { id: 'casual', name: 'Casual Chat', emoji: '💬', description: 'Everyday conversation with a friend' },
  { id: 'interview', name: 'Job Interview', emoji: '💼', description: 'Practice professional interview questions' },
  { id: 'travel', name: 'Travel', emoji: '✈️', description: 'Practice travel situations and conversations' },
  { id: 'daily', name: 'Daily Life', emoji: '🌅', description: 'Talk about your day and daily routines' },
  { id: 'ielts', name: 'IELTS Speaking', emoji: '📚', description: 'IELTS-style speaking practice' },
  { id: 'business', name: 'Business', emoji: '📊', description: 'Business meetings and professional talk' },
];

const levels = [
  { id: 'beginner', label: '🌱 Beginner', description: 'Simple vocabulary, slow speech' },
  { id: 'intermediate', label: '🌿 Intermediate', description: 'Natural conversation, moderate pace' },
  { id: 'advanced', label: '🌳 Advanced', description: 'Fluent speech, complex topics' },
];

export default function VoicePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [selectedScenario, setSelectedScenario] = useState('casual');
  const [selectedLevel, setSelectedLevel] = useState('intermediate');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleStart = () => {
    setIsStarting(true);
    const params = new URLSearchParams({
      scenario: selectedScenario,
      level: selectedLevel,
    });
    router.push(`/voice/call?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🎙️</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Voice Practice
          </h1>
          
          {/* ✅ Developer Name — Sayyed Yasir's AI */}
          <div className="max-w-2xl mx-auto">
            <p className="text-gray-400 text-lg">
              Speak with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold">Sayyed Yasir's</span> Trained AI
            </p>
            <p className="text-gray-500 text-sm mt-2 flex items-center justify-center gap-2">
              <span>🤖</span>
              <span>AI developed by <span className="text-white font-medium">Sayyed Yasir Ahmad</span></span>
            </p>
            <p className="text-gray-500 text-xs mt-1">
              🎯 Trained to help you practice English naturally
            </p>
          </div>

          {user && (
            <div className="mt-4 inline-block bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5">
              <p className="text-blue-400 text-sm flex items-center gap-2">
                <span>👋</span>
                Welcome, <span className="font-semibold text-white">{user.full_name}</span>!
              </p>
            </div>
          )}
        </div>

        {/* Scenario Selection */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">
            Choose Your Scenario
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Select what kind of conversation you want to practice
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario.id)}
                className={`p-4 rounded-xl border text-left transition ${
                  selectedScenario === scenario.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-900/50 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-1">{scenario.emoji}</div>
                <div className="text-white font-medium text-sm">{scenario.name}</div>
                <div className="text-gray-500 text-xs mt-1">{scenario.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Level Selection */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">
            Your English Level
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            The AI will adapt to your level
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {levels.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`p-4 rounded-xl border text-center transition ${
                  selectedLevel === level.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-900/50 hover:border-gray-500'
                }`}
              >
                <div className="text-white font-medium">{level.label}</div>
                <div className="text-gray-500 text-xs mt-1">{level.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg rounded-2xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-3 mx-auto"
          >
            {isStarting ? (
              <>
                <span className="animate-spin">⏳</span>
                Starting...
              </>
            ) : (
              <>
                <span>📞</span>
                Start Call
              </>
            )}
          </button>
          <p className="text-gray-500 text-sm mt-4">
            💡 Make sure your microphone is enabled. You'll speak naturally with SAYYED YASIR's AI.
          </p>
        </div>
      </div>
    </div>
  );
}