// components/chat/CoachingReport.tsx
'use client';

import { useEffect, useState } from 'react';

interface Report {
  session_id: string;
  fluency_score: number;
  grammar_score: number;
  vocabulary_score: number;
  pronunciation_readiness_score: number;
  strengths: string[];
  weaknesses: string[];
  improvement_tips: string[];
  new_vocabulary: any[];
  grammar_mistakes: any[];
  summary: string;
  recommended_practice: string;
  generated_at: string;
}

interface CoachingReportProps {
  report: Report;
  onClose: () => void;
}

export default function CoachingReport({ report, onClose }: CoachingReportProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!report) return null;

  // ✅ Safely get values with defaults
  const fluency = report.fluency_score ?? 0;
  const grammar = report.grammar_score ?? 0;
  const vocabulary = report.vocabulary_score ?? 0;
  const pronunciation = report.pronunciation_readiness_score ?? 0;
  const strengths = report.strengths ?? [];
  const weaknesses = report.weaknesses ?? [];
  const tips = report.improvement_tips ?? [];
  const mistakes = report.grammar_mistakes ?? [];
  const vocabulary_items = report.new_vocabulary ?? [];
  const summary = report.summary ?? 'Good session! Keep practicing.';
  const recommended = report.recommended_practice ?? 'Continue daily conversations.';

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div
      className={`fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📊</span> Coaching Report
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition text-2xl"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-6">{summary}</p>

        {/* Scores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className={`text-2xl font-bold ${getScoreColor(fluency)}`}>
              {fluency}%
            </p>
            <p className="text-xs text-gray-400">Fluency</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className={`text-2xl font-bold ${getScoreColor(grammar)}`}>
              {grammar}%
            </p>
            <p className="text-xs text-gray-400">Grammar</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className={`text-2xl font-bold ${getScoreColor(vocabulary)}`}>
              {vocabulary}%
            </p>
            <p className="text-xs text-gray-400">Vocabulary</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className={`text-2xl font-bold ${getScoreColor(pronunciation)}`}>
              {pronunciation}%
            </p>
            <p className="text-xs text-gray-400">Pronunciation</p>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-white font-semibold mb-2">✅ Strengths</h3>
            <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
              {strengths.length > 0 ? (
                strengths.map((s, i) => <li key={i}>{s}</li>)
              ) : (
                <li className="text-gray-500">Keep practicing to discover strengths!</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-2">📈 Areas to Improve</h3>
            <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
              {weaknesses.length > 0 ? (
                weaknesses.map((w, i) => <li key={i}>{w}</li>)
              ) : (
                <li className="text-gray-500">Great job! No major weaknesses detected.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Grammar Mistakes */}
        {mistakes.length > 0 && (
          <div className="mb-4">
            <h3 className="text-white font-semibold mb-2">📝 Grammar Mistakes</h3>
            <div className="space-y-1">
              {mistakes.map((m, i) => (
                <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm">
                  <p className="text-gray-300">
                    <span className="text-red-400">“{m.original || '?'}”</span>
                    {' → '}
                    <span className="text-green-400">“{m.correction || '?'}”</span>
                  </p>
                  {m.explanation && (
                    <p className="text-gray-400 text-xs mt-1">{m.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Tips */}
        {tips.length > 0 && (
          <div className="mb-4">
            <h3 className="text-white font-semibold mb-2">💡 Improvement Tips</h3>
            <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
              {tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Practice */}
        {recommended && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
            <p className="text-blue-400 text-sm flex items-center gap-2">
              <span>🎯</span> {recommended}
            </p>
          </div>
        )}

        {/* Vocabulary */}
        {vocabulary_items.length > 0 && (
          <div className="mb-4">
            <h3 className="text-white font-semibold mb-2">📚 New Vocabulary</h3>
            <div className="flex flex-wrap gap-2">
              {vocabulary_items.map((item, i) => (
                <span key={i} className="bg-gray-800/50 px-3 py-1 rounded-full text-sm text-gray-300">
                  {item.word || item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-4">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition"
          >
            Close
          </button>
          <p className="text-gray-500 text-xs mt-2">
            Report generated at {report.generated_at ? new Date(report.generated_at).toLocaleString() : 'now'}
          </p>
        </div>
      </div>
    </div>
  );
}