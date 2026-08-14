// app/ielts/speaking/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function IELTSSpeakingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [part, setPart] = useState(1);

  const part1Questions = [
    'Do you work or study?',
    'What do you do in your free time?',
    'Tell me about your hometown.',
    'Do you enjoy cooking? Why/Why not?',
  ];

  const part2CueCard = {
    topic: 'Describe a gift you received recently.',
    points: [
      'What the gift was',
      'Who gave it to you',
      'Why it was special to you',
    ],
  };

  const part3Questions = [
    'What are the benefits of giving gifts?',
    'Do you think gift-giving is important in society? Why?',
    'How has gift-giving changed in recent years?',
  ];

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
        <h1 className="text-3xl font-bold text-white mb-2">🗣️ IELTS Speaking</h1>
        <p className="text-gray-400 mb-6">Practice speaking with real IELTS questions</p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setPart(1)}
            className={`px-4 py-2 rounded-lg transition ${part === 1 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Part 1
          </button>
          <button
            onClick={() => setPart(2)}
            className={`px-4 py-2 rounded-lg transition ${part === 2 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Part 2
          </button>
          <button
            onClick={() => setPart(3)}
            className={`px-4 py-2 rounded-lg transition ${part === 3 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Part 3
          </button>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
          {part === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Part 1: Introduction</h2>
              <p className="text-gray-400 text-sm mb-4">Answer these questions naturally (1-2 minutes)</p>
              <ul className="space-y-3">
                {part1Questions.map((q, i) => (
                  <li key={i} className="bg-gray-800/30 rounded-lg px-4 py-3 text-gray-300">
                    {i+1}. {q}
                  </li>
                ))}
              </ul>
              <p className="text-gray-500 text-sm mt-4">💡 Tip: Give full sentences, not just one-word answers.</p>
              <Link href="/ielts/chat" className="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                Practice with AI Coach →
              </Link>
            </div>
          )}

          {part === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Part 2: Cue Card</h2>
              <p className="text-gray-400 text-sm mb-4">You have 1 minute to prepare, then speak for 1-2 minutes</p>
              <div className="bg-gray-800/50 rounded-lg p-6 mb-4">
                <p className="text-yellow-400 font-medium">Describe a gift you received recently.</p>
                <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                  {part2CueCard.points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => alert('Practice speaking out loud! Record yourself for best results.')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Start Practice (1 min prep)
              </button>
            </div>
          )}

          {part === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Part 3: Discussion</h2>
              <p className="text-gray-400 text-sm mb-4">Expand on your answers (2-3 minutes per question)</p>
              <ul className="space-y-3">
                {part3Questions.map((q, i) => (
                  <li key={i} className="bg-gray-800/30 rounded-lg px-4 py-3 text-gray-300">
                    {i+1}. {q}
                  </li>
                ))}
              </ul>
              <p className="text-gray-500 text-sm mt-4">💡 Tip: Give examples and justify your opinions.</p>
              <Link href="/ielts/chat" className="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                Practice with AI Coach →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}