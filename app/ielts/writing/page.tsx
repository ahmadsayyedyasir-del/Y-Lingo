// app/ielts/writing/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { ieltsEndpoints } from '@/lib/endpoints';

interface WritingResult {
  band_estimate: string;
  overall_band: number;
  task_achievement: number;
  coherence_cohesion: number;
  lexical_resource: number;
  grammatical_range: number;
  word_count: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  grammar_examples: { error: string; correction: string; explanation: string }[];
  vocabulary_feedback: string;
  band_justification: string;
  meets_word_requirement: boolean;
  min_words_required: number;
}

const tasks = [
  {
    id: 'task1',
    label: 'Task 1 — Describe a Chart',
    minWords: 150,
    prompt: 'The bar chart below shows student enrollment in UK universities from 2000 to 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    hint: 'Describe the overall trend, highlight key data points and comparisons.',
  },
  {
    id: 'task2',
    label: 'Task 2 — Essay',
    minWords: 250,
    prompt: 'Some people believe that unpaid community service should be a compulsory part of high school programs. To what extent do you agree or disagree? Give reasons for your answer and include relevant examples.',
    hint: 'Write a well-structured essay with an introduction, body paragraphs and conclusion.',
  },
];

function bandColor(b: number) {
  if (b >= 7.5) return 'text-green-400';
  if (b >= 6.0) return 'text-yellow-400';
  if (b >= 5.0) return 'text-orange-400';
  return 'text-red-400';
}

export default function IELTSWritingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTask, setActiveTask] = useState(0);
  const [text, setText] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<WritingResult | null>(null);
  const [error, setError] = useState('');

  const task = tasks[activeTask];
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleSubmit = async () => {
    if (wordCount < 30) {
      setError('Please write at least 30 words before submitting.');
      return;
    }
    setEvaluating(true);
    setError('');
    setResult(null);
    try {
      const res = await ieltsEndpoints.evaluateWriting(task.id, task.prompt, text);
      setResult(res.data);
    } catch {
      setError('Evaluation failed. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white text-xl">Loading...</div>
  );
  if (!isAuthenticated) { router.push('/login'); return null; }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/ielts')} className="text-gray-400 hover:text-white text-sm">← IELTS</button>
          <h1 className="text-2xl font-bold text-white">✍️ IELTS Writing</h1>
        </div>

        {/* Task tabs */}
        <div className="flex gap-2 mb-6">
          {tasks.map((t, i) => (
            <button
              key={t.id}
              onClick={() => { setActiveTask(i); setText(''); setResult(null); setError(''); }}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                activeTask === i ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Task prompt */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 mb-4">
          <p className="text-gray-300 leading-relaxed">{task.prompt}</p>
          <p className="text-gray-500 text-sm mt-2">💡 {task.hint}</p>
          <p className="text-gray-500 text-xs mt-1">Minimum: {task.minWords} words</p>
        </div>

        {/* Result */}
        {result ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-5">
            {/* Overall band */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-xl">AI Evaluation Result</h2>
                <p className="text-gray-400 text-sm">{result.word_count} words submitted</p>
              </div>
              <div className="text-center">
                <p className={`text-5xl font-bold ${bandColor(result.overall_band)}`}>{result.band_estimate}</p>
                <p className="text-gray-400 text-xs mt-1">Overall Band</p>
              </div>
            </div>

            {/* Criterion scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Task Achievement', value: result.task_achievement },
                { label: 'Coherence & Cohesion', value: result.coherence_cohesion },
                { label: 'Lexical Resource', value: result.lexical_resource },
                { label: 'Grammar Range', value: result.grammatical_range },
              ].map((c) => (
                <div key={c.label} className="bg-gray-800/50 rounded-xl p-3 text-center">
                  <p className={`text-2xl font-bold ${bandColor(c.value)}`}>{c.value.toFixed(1)}</p>
                  <p className="text-gray-500 text-xs mt-1">{c.label}</p>
                </div>
              ))}
            </div>

            {/* Feedback */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-300 text-sm leading-relaxed">{result.feedback}</p>
            </div>
            {result.band_justification && (
              <p className="text-gray-400 text-sm italic">{result.band_justification}</p>
            )}

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-4">
              {result.strengths.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-2">✅ Strengths</h3>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="text-gray-300 text-sm flex gap-2"><span>•</span>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.improvements.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-2">📈 Improvements</h3>
                  <ul className="space-y-1">
                    {result.improvements.map((imp, i) => (
                      <li key={i} className="text-gray-300 text-sm flex gap-2"><span>•</span>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Grammar examples */}
            {result.grammar_examples.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-2">📝 Grammar Corrections</h3>
                <div className="space-y-2">
                  {result.grammar_examples.map((g, i) => (
                    <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm">
                      <span className="text-red-400 line-through">"{g.error}"</span>
                      <span className="text-gray-400 mx-2">→</span>
                      <span className="text-green-400">"{g.correction}"</span>
                      {g.explanation && <p className="text-gray-500 text-xs mt-1">{g.explanation}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.vocabulary_feedback && (
              <p className="text-gray-400 text-sm">📚 {result.vocabulary_feedback}</p>
            )}

            <button
              onClick={() => { setResult(null); setText(''); }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Write Again
            </button>
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Write your ${task.id === 'task1' ? 'description' : 'essay'} here...`}
              rows={12}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <p className={`text-sm ${wordCount >= task.minWords ? 'text-green-400' : 'text-gray-500'}`}>
                {wordCount} / {task.minWords} words {wordCount >= task.minWords ? '✅' : ''}
              </p>
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
            <button
              onClick={handleSubmit}
              disabled={evaluating || wordCount < 30}
              className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {evaluating ? '⏳ AI is evaluating...' : '🤖 Get AI Band Score'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
