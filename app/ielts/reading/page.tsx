// app/ielts/reading/page.tsx — Multiple passages with timer
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { ieltsEndpoints } from '@/lib/endpoints';

interface Question {
  id: number;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  question: string;
  options?: string[];
  correctAnswer: string;
}

interface Passage {
  id: string;
  title: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  questions: Question[];
  timeLimit: number; // seconds
}

const PASSAGES: Passage[] = [
  {
    id: 'passage-1',
    title: 'The History of Chocolate',
    difficulty: 'easy',
    topic: 'Food & History',
    timeLimit: 10 * 60,
    text: `Chocolate has been consumed for nearly 4,000 years. It originated in ancient Mesoamerica, where the Olmec civilization was among the first to cultivate the cacao plant. The word "chocolate" itself is believed to derive from the Aztec word "xocoatl," which referred to a bitter drink brewed from cacao beans.

The Maya and Aztec civilizations treasured chocolate, using cacao beans as currency and preparing a spiced beverage for religious ceremonies and elite consumption. When Spanish explorers arrived in the Americas in the 16th century, they encountered chocolate and introduced it to Europe. Initially, it was consumed as a bitter drink mixed with honey or sugar.

By the 17th century, chocolate houses had become popular meeting places in England. The Industrial Revolution of the 19th century transformed chocolate from an expensive luxury to an affordable treat. In 1847, Joseph Fry & Sons created the first modern chocolate bar by combining cocoa butter, cocoa powder, and sugar. Swiss chocolatier Daniel Peter invented milk chocolate in 1875 by adding condensed milk.

Today, the global chocolate industry is worth over $130 billion annually. The Ivory Coast and Ghana produce more than 60% of the world's cocoa. Dark chocolate, which contains higher cocoa content, has been linked to potential health benefits including improved cardiovascular function and reduced stress hormones.`,
    questions: [
      { id: 1, type: 'multiple-choice', question: 'Which civilization is believed to have first cultivated the cacao plant?',
        options: ['Maya', 'Aztec', 'Olmec', 'Inca'], correctAnswer: 'Olmec' },
      { id: 2, type: 'true-false', question: 'The word "chocolate" is derived from a Spanish word.',
        options: ['True', 'False'], correctAnswer: 'False' },
      { id: 3, type: 'multiple-choice', question: 'Who invented milk chocolate?',
        options: ['Joseph Fry', 'Daniel Peter', 'A Spanish explorer', 'A Maya priest'], correctAnswer: 'Daniel Peter' },
      { id: 4, type: 'fill-blank', question: 'The global chocolate industry is worth over $_____ billion annually.', correctAnswer: '130' },
      { id: 5, type: 'true-false', question: 'The Ivory Coast and Ghana produce more than 60% of world cocoa.',
        options: ['True', 'False'], correctAnswer: 'True' },
    ],
  },
  {
    id: 'passage-2',
    title: 'Climate Change and Polar Ice',
    difficulty: 'medium',
    topic: 'Environment & Science',
    timeLimit: 13 * 60,
    text: `The polar ice caps have been melting at an accelerating rate over the past century. According to NASA satellite data, Arctic sea ice has declined by approximately 13% per decade since 1979. The Greenland Ice Sheet, which holds enough water to raise global sea levels by about 7 meters, is losing mass at an unprecedented rate of 280 billion tonnes per year.

The primary driver of polar ice melt is global warming caused by increased atmospheric concentrations of greenhouse gases, particularly carbon dioxide and methane. These gases trap heat from the sun, raising average global temperatures. Since pre-industrial times, global average temperatures have risen by approximately 1.1 degrees Celsius.

The consequences of polar ice loss extend far beyond rising sea levels. Arctic sea ice reflects sunlight back into space, a phenomenon known as the albedo effect. As this ice melts, darker ocean water absorbs more heat, creating a feedback loop that accelerates warming. Additionally, thawing permafrost releases methane, a potent greenhouse gas, further amplifying the problem.

Scientists project that the Arctic could experience ice-free summers as early as 2035 under current emissions trajectories. This would dramatically alter weather patterns, ocean currents, and ecosystems across the Northern Hemisphere. Urgent international cooperation is needed to reduce emissions and limit warming to 1.5 degrees Celsius above pre-industrial levels, as outlined in the Paris Agreement.`,
    questions: [
      { id: 1, type: 'multiple-choice', question: 'By how much has Arctic sea ice declined per decade since 1979?',
        options: ['7%', '10%', '13%', '15%'], correctAnswer: '13%' },
      { id: 2, type: 'fill-blank', question: 'Global average temperatures have risen by approximately _____ degrees Celsius since pre-industrial times.', correctAnswer: '1.1' },
      { id: 3, type: 'true-false', question: 'Arctic sea ice absorbs more sunlight than dark ocean water.',
        options: ['True', 'False'], correctAnswer: 'False' },
      { id: 4, type: 'multiple-choice', question: 'What is the albedo effect?',
        options: ['Ocean water absorbing heat', 'Ice reflecting sunlight', 'Methane release from permafrost', 'Rising sea levels'],
        correctAnswer: 'Ice reflecting sunlight' },
      { id: 5, type: 'multiple-choice', question: 'When could the Arctic experience ice-free summers?',
        options: ['2025', '2035', '2050', '2100'], correctAnswer: '2035' },
      { id: 6, type: 'true-false', question: 'The Paris Agreement aims to limit warming to 2 degrees Celsius.',
        options: ['True', 'False'], correctAnswer: 'False' },
    ],
  },
  {
    id: 'passage-3',
    title: 'The Psychology of Social Media',
    difficulty: 'hard',
    topic: 'Technology & Society',
    timeLimit: 16 * 60,
    text: `Social media platforms have fundamentally transformed human communication patterns, with profound psychological implications that researchers are only beginning to understand. The global social media user base exceeded 4.5 billion in 2023, representing over 56% of the world's population. These platforms have created unprecedented opportunities for connection and information sharing, while simultaneously raising serious concerns about mental health, attention spans, and democratic discourse.

The neurological underpinnings of social media addiction are well-documented. Each notification, like, or comment triggers a release of dopamine — the neurotransmitter associated with pleasure and reward — creating behavioral patterns analogous to gambling or substance use. This variable reward schedule, where users never know when the next positive interaction will arrive, is particularly potent in sustaining compulsive checking behaviors.

Research published in the Journal of Social and Clinical Psychology found that limiting social media use to 30 minutes per day significantly reduced loneliness and depression among college students over a three-week period. Paradoxically, platforms designed to connect people may be contributing to an epidemic of loneliness. This "social media paradox" manifests when curated online interactions replace deeper, more authentic offline relationships.

The phenomenon of social comparison — evaluating one's circumstances against others — is greatly amplified by social media. Users are exposed to carefully curated highlight reels of others' lives, potentially distorting their perception of normal human experience. This is particularly concerning for adolescents, whose identities are still forming. A landmark 2021 internal Facebook study, revealed in 2021 by whistleblower Frances Haugen, found that Instagram makes body image issues worse for 32% of teenage girls.

Conversely, social media has demonstrated remarkable positive applications in mental health advocacy, social movements, and crisis communication. The challenge for society lies in harnessing these benefits while mitigating the documented harms through digital literacy education, platform regulation, and conscious usage habits.`,
    questions: [
      { id: 1, type: 'fill-blank', question: 'Global social media users exceeded _____ billion in 2023.', correctAnswer: '4.5' },
      { id: 2, type: 'multiple-choice', question: 'Which neurotransmitter is linked to social media reward responses?',
        options: ['Serotonin', 'Adrenaline', 'Dopamine', 'Cortisol'], correctAnswer: 'Dopamine' },
      { id: 3, type: 'multiple-choice', question: 'How long should social media use be limited to reduce loneliness?',
        options: ['15 minutes', '30 minutes', '45 minutes', '1 hour'], correctAnswer: '30 minutes' },
      { id: 4, type: 'true-false', question: 'The Facebook internal study found Instagram worsened body image for 32% of teenage boys.',
        options: ['True', 'False'], correctAnswer: 'False' },
      { id: 5, type: 'fill-blank', question: 'Frances _____ was the whistleblower who revealed the Facebook internal study.', correctAnswer: 'Haugen' },
      { id: 6, type: 'multiple-choice', question: 'What is the "social media paradox"?',
        options: ['Using social media for mental health', 'Online connections replacing offline relationships', 'Dopamine addiction', 'Platform regulation'],
        correctAnswer: 'Online connections replacing offline relationships' },
      { id: 7, type: 'true-false', question: 'Social media has shown positive applications in mental health advocacy.',
        options: ['True', 'False'], correctAnswer: 'True' },
    ],
  },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function IELTSReadingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [activePassageIndex, setActivePassageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(PASSAGES[0].timeLimit);
  const [timerActive, setTimerActive] = useState(false);
  const [bandEstimate, setBandEstimate] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const passage = PASSAGES[activePassageIndex];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  // Timer
  useEffect(() => {
    if (timerActive && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleSubmit(true); // auto-submit on timeout
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive, submitted]);

  const startTimer = () => {
    setTimeLeft(passage.timeLimit);
    setTimerActive(true);
  };

  const handlePassageChange = (index: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActivePassageIndex(index);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setTimerActive(false);
    setTimeLeft(PASSAGES[index].timeLimit);
  };

  const handleSubmit = async (autoSubmit = false) => {
    setTimerActive(false);
    if (timerRef.current) clearInterval(timerRef.current);

    let correct = 0;
    passage.questions.forEach(q => {
      if ((answers[q.id] || '').toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) correct++;
    });
    setScore(correct);
    setSubmitted(true);

    // Band estimate
    const pct = correct / passage.questions.length;
    if (pct >= 0.9) setBandEstimate('8.0 – 9.0');
    else if (pct >= 0.75) setBandEstimate('7.0 – 7.5');
    else if (pct >= 0.6) setBandEstimate('6.0 – 6.5');
    else if (pct >= 0.4) setBandEstimate('5.0 – 5.5');
    else setBandEstimate('4.0 – 4.5');

    try {
      await ieltsEndpoints.saveScore('reading', correct, passage.questions.length);
    } catch { /* non-blocking */ }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">Loading...</div>
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-5xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/ielts" className="text-gray-400 hover:text-white text-sm">← IELTS</Link>
            <h1 className="text-xl font-bold text-white">📖 Reading Practice</h1>
          </div>
          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
            timeLeft < 60 && timerActive ? 'bg-red-500/10 border-red-500/40 text-red-400 animate-pulse' : 'bg-gray-800/50 border-gray-700 text-gray-300'
          }`}>
            <span className="text-sm">⏱</span>
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Passage selector */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {PASSAGES.map((p, i) => (
            <button key={p.id} onClick={() => handlePassageChange(i)}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                activePassageIndex === i ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              <span>Passage {i + 1}</span>
              <span className={`ml-2 text-xs ${p.difficulty === 'hard' ? 'text-red-400' : p.difficulty === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                {p.difficulty}
              </span>
            </button>
          ))}
        </div>

        {/* Result */}
        {submitted && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Results</h2>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-400">{score}/{passage.questions.length}</p>
                <p className="text-gray-400 text-xs">Estimated band: <span className="text-green-400 font-medium">{bandEstimate}</span></p>
              </div>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                style={{ width: `${(score / passage.questions.length) * 100}%` }} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setSubmitted(false); setAnswers({}); setTimeLeft(passage.timeLimit); }}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm">
                Try Again
              </button>
              <button onClick={() => handlePassageChange((activePassageIndex + 1) % PASSAGES.length)}
                className="px-5 py-2 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 transition text-sm">
                Next Passage →
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          {/* Passage text */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-white font-semibold">{passage.title}</h2>
                <p className="text-gray-500 text-xs mt-0.5">{passage.topic} • {passage.questions.length} questions</p>
              </div>
              {!timerActive && !submitted && (
                <button onClick={startTimer}
                  className="px-4 py-1.5 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition text-sm">
                  ▶ Start Timer
                </button>
              )}
            </div>
            <div className="h-[500px] overflow-y-auto pr-2">
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{passage.text}</p>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Questions</h3>
            <div className="space-y-5 h-[500px] overflow-y-auto pr-2">
              {passage.questions.map((q) => (
                <div key={q.id} className={`p-3 rounded-xl border ${
                  submitted
                    ? (answers[q.id] || '').toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                    : 'bg-gray-800/30 border-gray-700'
                }`}>
                  <p className="text-gray-200 text-sm mb-3">{q.id}. {q.question}</p>
                  {q.type === 'multiple-choice' || q.type === 'true-false' ? (
                    <div className="space-y-1.5">
                      {q.options!.map(opt => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name={`q-${q.id}`} value={opt}
                            checked={answers[q.id] === opt}
                            disabled={submitted}
                            onChange={() => setAnswers(a => ({...a, [q.id]: opt}))}
                            className="accent-blue-600" />
                          <span className={`text-sm ${submitted && opt === q.correctAnswer ? 'text-green-400 font-medium' : 'text-gray-300'}`}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input type="text" value={answers[q.id] || ''} disabled={submitted}
                      onChange={e => setAnswers(a => ({...a, [q.id]: e.target.value}))}
                      placeholder="Your answer..."
                      className="w-full px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  )}
                  {submitted && (answers[q.id] || '').toLowerCase().trim() !== q.correctAnswer.toLowerCase().trim() && (
                    <p className="text-green-400 text-xs mt-2">✓ Correct: {q.correctAnswer}</p>
                  )}
                </div>
              ))}
            </div>

            {!submitted && (
              <button onClick={() => handleSubmit()}
                disabled={Object.keys(answers).length < passage.questions.length}
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition disabled:opacity-50">
                Submit Answers ({Object.keys(answers).length}/{passage.questions.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
