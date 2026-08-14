// app/ielts/writing/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

export default function IELTSWritingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [task1, setTask1] = useState('');
  const [task2, setTask2] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (task1.length > 50 && task2.length > 100) {
      setSubmitted(true);
    } else {
      alert('Please write at least 50 words for Task 1 and 100 words for Task 2.');
    }
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
        <h1 className="text-3xl font-bold text-white mb-2">✍️ IELTS Writing</h1>
        <p className="text-gray-400 mb-6">Practice Task 1 & Task 2 writing</p>

        {submitted ? (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">✍️</div>
            <h2 className="text-2xl font-bold text-white">Writing Submitted!</h2>
            <p className="text-gray-400 mt-2">Your responses have been recorded.</p>
            <p className="text-gray-500 text-sm mt-4">Task 1: {task1.length} words | Task 2: {task2.length} words</p>
            <button
              onClick={() => { setSubmitted(false); setTask1(''); setTask2(''); }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Practice Again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Task 1 */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-2">📊 Task 1: Describe the chart</h2>
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4 text-center text-gray-300">
                [Bar Chart] Student enrollment in UK universities (2000-2020)
                <div className="flex justify-around mt-2 text-sm">
                  <span>📊 2000: 50K</span>
                  <span>📊 2010: 75K</span>
                  <span>📊 2020: 100K</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                <span className="text-yellow-400">Task:</span> Summarize the information by selecting and reporting the main features.
              </p>
              <textarea
                placeholder="Write your Task 1 description here (minimum 50 words)..."
                rows={6}
                value={task1}
                onChange={(e) => setTask1(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-500 text-sm mt-2">Words: {task1.length}</p>
            </div>

            {/* Task 2 */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-2">📝 Task 2: Essay</h2>
              <p className="text-gray-300 mb-4">
                "Some people believe that unpaid community service should be a compulsory part of high school programs. To what extent do you agree or disagree?"
              </p>
              <p className="text-gray-400 text-sm mb-3">
                <span className="text-yellow-400">Task:</span> Write an essay responding to the question.
              </p>
              <textarea
                placeholder="Write your essay here (minimum 100 words)..."
                rows={8}
                value={task2}
                onChange={(e) => setTask2(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-500 text-sm mt-2">Words: {task2.length}</p>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition"
            >
              Submit Writing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}