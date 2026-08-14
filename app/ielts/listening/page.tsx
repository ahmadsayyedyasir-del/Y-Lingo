// app/ielts/listening/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { ieltsEndpoints } from '@/lib/endpoints';

export default function IELTSListeningPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const transcript = `You will hear a conversation between a student and a university advisor.

  Advisor: Good morning, how can I help you?
  Student: Hi, I'm interested in studying computer science. Can you tell me about the courses?
  Advisor: Of course. We offer three main programs: a Bachelor of Science in Computer Science, a Bachelor of Information Technology, and a Diploma in Web Development.
  Student: What is the duration of these programs?
  Advisor: The Bachelor programs are 3 years full-time, while the Diploma is 18 months.
  Student: And when does the academic year start?
  Advisor: The main intake is in September, but we also have a January intake for some courses.
  Student: That's good to know. Thank you!`;

  const questions = [
    { id: 1, question: 'What program is the student interested in?', correctAnswer: 'computer science' },
    { id: 2, question: 'How many main programs does the advisor mention?', correctAnswer: '3' },
    { id: 3, question: 'How long is the Diploma program?', correctAnswer: '18 months' },
    { id: 4, question: 'When is the main intake?', correctAnswer: 'september' },
    { id: 5, question: 'Is there a January intake?', correctAnswer: 'yes' },
  ];

  const handleAnswer = (id: number, value: string) => {
    setAnswers({ ...answers, [id]: value });
  };

  const handleSubmit = async () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id]?.toLowerCase().trim() === q.correctAnswer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    try {
      await ieltsEndpoints.saveScore('listening', correct, questions.length);
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
        <h1 className="text-3xl font-bold text-white mb-2">👂 IELTS Listening</h1>
        <p className="text-gray-400 mb-6">Listen to the recording (read transcript) and answer questions</p>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-3">🎧 Listening Transcript</h2>
          <div className="bg-gray-800/30 rounded-lg p-4 text-gray-300 leading-relaxed">
            {transcript}
          </div>
          <p className="text-gray-500 text-sm mt-3">📌 *For practice, read the transcript and answer the questions below. In the real test, you would listen to audio.*</p>
        </div>

        {submitted ? (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🎧</div>
            <h2 className="text-2xl font-bold text-white">Score: {score}/{questions.length}</h2>
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
              <div key={q.id} className="mb-4">
                <p className="text-white mb-2">{q.id}. {q.question}</p>
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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