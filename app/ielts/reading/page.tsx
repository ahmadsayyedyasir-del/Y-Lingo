// app/ielts/reading/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { ieltsEndpoints } from '@/lib/endpoints';

interface Question {
  id: number;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  question: string;
  options?: string[];
  correctAnswer: string;
}

export default function IELTSReadingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const passage = `The history of chocolate begins with the ancient Mesoamerican civilizations. The Olmecs, who lived around 1500 BCE, are believed to be the first to discover the cacao plant. Later, the Maya and Aztecs used cacao beans as currency and to make a bitter drink called "xocolātl," which was used in religious ceremonies. 

  When the Spanish arrived in the Americas in the 16th century, they brought cacao back to Europe. Initially, it was consumed as a sweetened drink by the elite. It wasn't until the Industrial Revolution that chocolate became a solid food. In 1847, Joseph Fry created the first solid chocolate bar. Today, chocolate is a multi-billion dollar industry with Switzerland, Belgium, and the United States being major producers.`;

  const questions: Question[] = [
    {
      id: 1,
      type: 'multiple-choice',
      question: 'Who are believed to be the first to discover the cacao plant?',
      options: ['A) The Maya', 'B) The Aztecs', 'C) The Olmecs', 'D) The Spanish'],
      correctAnswer: 'C) The Olmecs',
    },
    {
      id: 2,
      type: 'multiple-choice',
      question: 'What did the Maya and Aztecs use cacao beans for?',
      options: ['A) Only as currency', 'B) Only for religious ceremonies', 'C) As currency and for a bitter drink', 'D) To make solid chocolate'],
      correctAnswer: 'C) As currency and for a bitter drink',
    },
    {
      id: 3,
      type: 'true-false',
      question: 'The Spanish consumed chocolate as a solid food when they first brought it to Europe.',
      options: ['True', 'False'],
      correctAnswer: 'False',
    },
    {
      id: 4,
      type: 'fill-blank',
      question: 'The first solid chocolate bar was created in ______.',
      correctAnswer: '1847',
    },
  ];

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    // Persist score to DB
    try {
      await ieltsEndpoints.saveScore('reading', correct, questions.length);
    } catch { /* non-blocking */ }
  };

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
        <h1 className="text-3xl font-bold text-white mb-2">📖 IELTS Reading</h1>
        <p className="text-gray-400 mb-6">Read the passage and answer the questions</p>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-3">Passage: The History of Chocolate</h2>
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">{passage}</p>
        </div>

        {submitted ? (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-white">Your Score: {score}/{questions.length}</h2>
            <p className="text-gray-400 mt-2">
              {score === questions.length ? 'Perfect! Excellent reading skills! 🎉' : 
               score >= questions.length / 2 ? 'Good effort! Keep practicing! 💪' : 
               'Review the passage and try again! 📖'}
            </p>
            <button
              onClick={() => { setSubmitted(false); setAnswers({}); }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            {questions.map((q) => (
              <div key={q.id} className="mb-6 pb-6 border-b border-gray-800 last:border-0">
                <p className="text-white font-medium mb-3">{q.id}. {q.question}</p>
                {q.type === 'fill-blank' ? (
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="space-y-2">
                    {q.options?.map((opt) => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={(e) => handleAnswer(q.id, e.target.value)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-gray-300">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition"
            >
              Submit Answers
            </button>
          </div>
        )}
      </div>
    </div>
  );
}