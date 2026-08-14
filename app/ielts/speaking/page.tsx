// app/ielts/speaking/page.tsx
'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { ieltsEndpoints } from '@/lib/endpoints';

interface SpeakingResult {
  band_estimate: string;
  overall_band: number;
  fluency_coherence: number;
  lexical_resource: number;
  grammatical_range: number;
  pronunciation_estimate: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  model_answer_hint: string;
  transcribed_text: string;
}

const parts = [
  {
    id: 1,
    label: 'Part 1 — Introduction',
    questions: [
      'Do you work or study? Tell me about it.',
      'What do you do in your free time?',
      'Tell me about your hometown.',
      'Do you enjoy cooking? Why or why not?',
    ],
  },
  {
    id: 2,
    label: 'Part 2 — Cue Card',
    questions: [
      'Describe a gift you received recently. You should say: what the gift was, who gave it to you, and why it was special.',
      'Describe a place you have visited that you found interesting. Say where it is, when you went there, and why you found it interesting.',
    ],
  },
  {
    id: 3,
    label: 'Part 3 — Discussion',
    questions: [
      'What are the benefits of giving gifts in modern society?',
      'Do you think gift-giving habits have changed in recent years? How?',
      'How important is it to learn from travel experiences?',
    ],
  },
];

function bandColor(b: number) {
  if (b >= 7.5) return 'text-green-400';
  if (b >= 6.0) return 'text-yellow-400';
  if (b >= 5.0) return 'text-orange-400';
  return 'text-red-400';
}

export default function IELTSSpeakingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [activePart, setActivePart] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [recording, setRecording] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<SpeakingResult | null>(null);
  const [error, setError] = useState('');
  const [micError, setMicError] = useState('');
  const [textMode, setTextMode] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const part = parts[activePart];
  const question = part.questions[activeQuestion];

  const startRecording = async () => {
    setMicError('');
    setError('');
    audioChunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicError('Microphone access denied. Please allow microphone access in browser settings.');
      return;
    }

    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start(250);
    setRecording(true);
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
  };

  const stopAndEvaluate = async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setRecording(false);

    // Wait for onstop to fire
    await new Promise((res) => setTimeout(res, 300));

    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    if (blob.size < 500) {
      setError('Recording too short. Please speak for at least 5 seconds.');
      return;
    }

    setEvaluating(true);
    try {
      const file = new File([blob], 'speaking.webm', { type: 'audio/webm' });
      const res = await ieltsEndpoints.evaluateSpeakingAudio(part.id, question, file);
      setResult(res.data);
    } catch {
      setError('Evaluation failed. Try the text mode below.');
    } finally {
      setEvaluating(false);
    }
  };

  const evaluateText = async () => {
    if (!typedAnswer.trim() || typedAnswer.split(' ').length < 5) {
      setError('Please write at least 5 words.');
      return;
    }
    setEvaluating(true);
    setError('');
    try {
      const res = await ieltsEndpoints.evaluateSpeakingText(part.id, question, typedAnswer);
      setResult(res.data);
    } catch {
      setError('Evaluation failed. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  const reset = () => { setResult(null); setTypedAnswer(''); setError(''); };

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
          <h1 className="text-2xl font-bold text-white">🗣️ IELTS Speaking</h1>
        </div>

        {/* Part tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {parts.map((p, i) => (
            <button
              key={p.id}
              onClick={() => { setActivePart(i); setActiveQuestion(0); reset(); }}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                activePart === i ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Question selector */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {part.questions.map((_, qi) => (
            <button
              key={qi}
              onClick={() => { setActiveQuestion(qi); reset(); }}
              className={`px-3 py-1 rounded-lg text-xs transition ${
                activeQuestion === qi ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
              }`}
            >
              Q{qi + 1}
            </button>
          ))}
        </div>

        {/* Current question */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 mb-5">
          <p className="text-yellow-400 font-medium text-sm mb-1">Question:</p>
          <p className="text-white text-lg leading-relaxed">{question}</p>
          {part.id === 2 && (
            <p className="text-gray-500 text-xs mt-2">💡 You have 1 minute to prepare, then speak for 1-2 minutes.</p>
          )}
        </div>

        {/* Result */}
        {result ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-xl">Speaking Evaluation</h2>
              <div className="text-center">
                <p className={`text-5xl font-bold ${bandColor(result.overall_band)}`}>{result.band_estimate}</p>
                <p className="text-gray-400 text-xs mt-1">Overall Band</p>
              </div>
            </div>

            {/* Criterion scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Fluency', value: result.fluency_coherence },
                { label: 'Vocabulary', value: result.lexical_resource },
                { label: 'Grammar', value: result.grammatical_range },
                { label: 'Pronunciation', value: result.pronunciation_estimate },
              ].map((c) => (
                <div key={c.label} className="bg-gray-800/50 rounded-xl p-3 text-center">
                  <p className={`text-2xl font-bold ${bandColor(c.value)}`}>{c.value.toFixed(1)}</p>
                  <p className="text-gray-500 text-xs mt-1">{c.label}</p>
                </div>
              ))}
            </div>

            {/* Transcription */}
            {result.transcribed_text && (
              <div className="bg-gray-800/30 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Your response (transcribed):</p>
                <p className="text-gray-300 text-sm italic">"{result.transcribed_text}"</p>
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-300 text-sm">{result.feedback}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {result.strengths.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-2">✅ Strengths</h3>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => <li key={i} className="text-gray-300 text-sm">• {s}</li>)}
                  </ul>
                </div>
              )}
              {result.improvements.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-2">📈 Improvements</h3>
                  <ul className="space-y-1">
                    {result.improvements.map((s, i) => <li key={i} className="text-gray-300 text-sm">• {s}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {result.model_answer_hint && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
                <p className="text-purple-300 text-sm">💡 Hint: {result.model_answer_hint}</p>
              </div>
            )}

            <button onClick={reset} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Try Another Question
            </button>
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4">
            {micError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                {micError}
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Recording controls */}
            <div className="text-center">
              {!recording && !evaluating && (
                <button
                  onClick={startRecording}
                  className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-4xl hover:opacity-90 transition shadow-lg"
                >
                  🎤
                </button>
              )}
              {recording && (
                <button
                  onClick={stopAndEvaluate}
                  className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 text-4xl animate-pulse transition"
                >
                  ⏹
                </button>
              )}
              {evaluating && (
                <div className="w-20 h-20 rounded-full bg-yellow-600/30 border border-yellow-600/50 flex items-center justify-center mx-auto text-3xl animate-pulse">
                  ⏳
                </div>
              )}
              <p className="text-gray-400 text-sm mt-3">
                {recording
                  ? `🔴 Recording... ${recordingSeconds}s (tap to stop & evaluate)`
                  : evaluating
                  ? 'AI is evaluating your response...'
                  : 'Tap mic to start recording'}
              </p>
            </div>

            {/* Text mode toggle */}
            <div className="border-t border-gray-800 pt-4">
              <button
                onClick={() => setTextMode(!textMode)}
                className="text-gray-500 hover:text-gray-300 text-sm transition"
              >
                {textMode ? '🎤 Switch to voice' : '⌨️ No microphone? Type your answer instead'}
              </button>
              {textMode && (
                <div className="mt-3 space-y-3">
                  <textarea
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={5}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <button
                    onClick={evaluateText}
                    disabled={evaluating}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
                  >
                    {evaluating ? '⏳ Evaluating...' : '🤖 Get AI Feedback'}
                  </button>
                </div>
              )}
            </div>

            <div className="text-center">
              <Link href="/ielts/chat" className="text-purple-400 hover:text-purple-300 text-sm">
                💬 Practice with AI Coach instead →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
