// app/ielts/mock-test/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

interface Question {
  id: number;
  section: 'reading' | 'writing' | 'listening';
  type: 'mcq' | 'text' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string;
  userAnswer?: string;
}

export default function IELTSMockTestPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const sections = [
    {
      name: 'Reading',
      icon: '📖',
      questions: [
        { id: 1, section: 'reading', type: 'mcq', question: 'What is the main topic of the passage?', options: ['A) History', 'B) Science', 'C) Art', 'D) Music'], correctAnswer: 'A) History' },
        { id: 2, section: 'reading', type: 'mcq', question: 'According to the passage, which is most important?', options: ['A) Speed', 'B) Accuracy', 'C) Cost', 'D) Quality'], correctAnswer: 'B) Accuracy' },
      ] as Question[],
    },
    {
      name: 'Writing',
      icon: '✍️',
      questions: [
        { id: 3, section: 'writing', type: 'essay', question: 'Write a short essay (100-150 words) on: "What are the benefits of learning a second language?"' },
      ] as Question[],
    },
    {
      name: 'Listening',
      icon: '👂',
      questions: [
        { id: 4, section: 'listening', type: 'text', question: 'What time does the concert start?', correctAnswer: '8:00 PM' },
        { id: 5, section: 'listening', type: 'text', question: 'How much does the ticket cost?', correctAnswer: '$25' },
      ] as Question[],
    },
  ];

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const currentSectionData = sections[currentSection];

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSubmit = () => {
    let correct = 0;
    sections.forEach((section) => {
      section.questions.forEach((q) => {
        if (q.correctAnswer && answers[q.id]?.trim() === q.correctAnswer) {
          correct++;
        }
      });
    });
    setScore(correct);
    setSubmitted(true);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white text-xl">Loading...</div>;
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (submitted) {
    const percentage = Math.round((score / totalQuestions) * 100);
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white">Mock Test Complete!</h2>
            <p className="text-4xl font-bold text-blue-400 mt-4">{score}/{totalQuestions}</p>
            <p className="text-gray-400 mt-2">{percentage}% Score</p>
            <p className="text-gray-500 text-sm mt-4">
              {percentage >= 80 ? 'Excellent! You\'re well prepared! 🏆' :
               percentage >= 50 ? 'Good effort! Keep practicing! 💪' :
               'Review your answers and try again! 📚'}
            </p>
            <button
              onClick={() => { setSubmitted(false); setAnswers({}); setCurrentSection(0); }}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Retake Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-white mb-2">📊 IELTS Mock Test</h1>
        <p className="text-gray-400 mb-6">Complete full practice test</p>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {sections.map((section, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSection(idx)}
              className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                currentSection === idx ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {section.icon} {section.name}
            </button>
          ))}
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
          <div className="mb-4 flex justify-between text-sm text-gray-400">
            <span>Section {currentSection + 1} of {sections.length}</span>
            <span>{currentSectionData.questions.length} questions</span>
          </div>

          {currentSectionData.questions.map((q, idx) => (
            <div key={q.id} className="mb-6 pb-6 border-b border-gray-800 last:border-0">
              <p className="text-white font-medium mb-3">{idx+1}. {q.question}</p>
              {q.type === 'mcq' && q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt) => (
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
              ) : (
                <textarea
                  placeholder="Type your answer..."
                  rows={q.type === 'essay' ? 6 : 2}
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
          >
            Previous Section
          </button>
          {currentSection === sections.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition"
            >
              Submit Test
            </button>
          ) : (
            <button
              onClick={() => setCurrentSection(currentSection + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Next Section
            </button>
          )}
        </div>
      </div>
    </div>
  );
}