// app/ielts/vocabulary/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

const vocabularyList = [
  { word: 'Significant', definition: 'Important or meaningful', example: 'The new policy had a significant impact.' },
  { word: 'Contribute', definition: 'To give or add to something', example: 'Technology contributes to economic growth.' },
  { word: 'Impact', definition: 'A strong effect', example: 'Climate change has a huge impact on weather.' },
  { word: 'Innovate', definition: 'To introduce new methods', example: 'Companies must innovate to survive.' },
  { word: 'Sustainable', definition: 'Able to be maintained', example: 'We need sustainable energy sources.' },
  { word: 'Benefit', definition: 'An advantage', example: 'Exercise has many health benefits.' },
  { word: 'Challenge', definition: 'A difficult task', example: 'Learning a new language is a challenge.' },
  { word: 'Expand', definition: 'To grow or increase', example: 'The company plans to expand internationally.' },
];

export default function IELTSVocabularyPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showAnswer, setShowAnswer] = useState<number | null>(null);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white text-xl">Loading...</div>;
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-white mb-2">📝 IELTS Vocabulary</h1>
        <p className="text-gray-400 mb-6">Learn essential IELTS vocabulary</p>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vocabularyList.map((item, index) => (
              <div
                key={index}
                className="bg-gray-800/30 rounded-lg p-4 hover:bg-gray-800/50 transition cursor-pointer"
                onClick={() => setShowAnswer(showAnswer === index ? null : index)}
              >
                <p className="text-white font-semibold text-lg">{item.word}</p>
                {showAnswer === index && (
                  <div className="mt-2">
                    <p className="text-yellow-400 text-sm">📖 {item.definition}</p>
                    <p className="text-gray-400 text-sm mt-1">💡 "{item.example}"</p>
                  </div>
                )}
                {showAnswer !== index && (
                  <p className="text-gray-500 text-sm mt-1">Click to reveal definition</p>
                )}
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-sm text-center mt-6">Click on any word to see its definition and example.</p>
          <button
            onClick={() => setShowAnswer(null)}
            className="mt-4 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition text-sm w-full"
          >
            Hide All
          </button>
        </div>
      </div>
    </div>
  );
}