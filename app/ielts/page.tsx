// app/ielts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { ieltsEndpoints, ragEndpoints } from '@/lib/endpoints';

interface BandData {
  writing: string | null;
  reading: string | null;
  listening: string | null;
  speaking: string | null;
  mock: string | null;
}

interface AttemptItem {
  attempt_id: string;
  skill: string;
  band_estimate: string | null;
  raw_score: number | null;
  max_score: number | null;
  task_type: string | null;
  feedback: string | null;
  created_at: string | null;
}

const skills = [
  { id: 'reading',   label: 'Reading',  emoji: '📖', href: '/ielts/reading' },
  { id: 'writing',   label: 'Writing',  emoji: '✍️',  href: '/ielts/writing' },
  { id: 'listening', label: 'Listening',emoji: '👂', href: '/ielts/listening' },
  { id: 'speaking',  label: 'Speaking', emoji: '🗣️', href: '/ielts/speaking' },
  { id: 'mock',      label: 'Mock Test',emoji: '📊', href: '/ielts/mock-test' },
  { id: 'chat',      label: 'AI Coach', emoji: '💬', href: '/ielts/chat' },
  { id: 'vocabulary',label: 'Vocabulary',emoji:'📚', href: '/ielts/vocabulary' },
];

function bandColor(band: string | null): string {
  if (!band) return 'text-gray-500';
  const n = parseFloat(band);
  if (n >= 7.5) return 'text-green-400';
  if (n >= 6.0) return 'text-yellow-400';
  if (n >= 5.0) return 'text-orange-400';
  return 'text-red-400';
}

function bandLabel(band: string | null): string {
  if (!band) return 'Not attempted';
  const n = parseFloat(band);
  if (n >= 8.0) return 'Expert';
  if (n >= 7.0) return 'Good user';
  if (n >= 6.0) return 'Competent';
  if (n >= 5.0) return 'Modest';
  return 'Limited';
}

export default function IELTSPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [latestBands, setLatestBands] = useState<BandData>({
    writing: null, reading: null, listening: null, speaking: null, mock: null,
  });
  const [overallEstimate, setOverallEstimate] = useState<string | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<AttemptItem[]>([]);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [documents, setDocuments] = useState<unknown[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [historyRes, docsRes] = await Promise.all([
          ieltsEndpoints.getHistory(),
          ragEndpoints.listDocuments(),
        ]);

        const h = historyRes.data;
        setLatestBands(h.latest_bands || {});
        setOverallEstimate(h.overall_estimate || null);
        setTotalAttempts(h.total_attempts || 0);

        // Flatten all attempts and take the 5 most recent
        const all: AttemptItem[] = Object.values(h.attempts || {}).flat() as AttemptItem[];
        all.sort((a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        setRecentAttempts(all.slice(0, 5));

        const ieltsDocs = (docsRes.data || []).filter(
          (d: { category: string }) => d.category === 'ielts'
        );
        setDocuments(ieltsDocs);
      } catch {
        // History unavailable (e.g. table not migrated yet) — show empty state
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">📚 IELTS Preparation</h1>
            <p className="text-gray-400 mt-1">AI-powered IELTS coaching — writing, speaking, reading, listening</p>
          </div>
          {overallEstimate && (
            <div className="text-center bg-gray-900/60 border border-gray-700 rounded-2xl px-6 py-3">
              <p className="text-gray-400 text-xs mb-1">Overall Estimate</p>
              <p className={`text-4xl font-bold ${bandColor(overallEstimate)}`}>{overallEstimate}</p>
              <p className="text-gray-500 text-xs mt-1">{bandLabel(overallEstimate)}</p>
            </div>
          )}
        </div>

        {/* Band scores per skill */}
        {!loadingData && totalAttempts > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {(['writing', 'reading', 'listening', 'speaking', 'mock'] as const).map((skill) => {
              const band = latestBands[skill];
              const emoji = skills.find(s => s.id === skill)?.emoji || '📝';
              return (
                <div key={skill} className="bg-gray-900/50 border border-gray-800 rounded-xl p-3 text-center">
                  <p className="text-lg mb-1">{emoji}</p>
                  <p className="text-gray-400 text-xs capitalize mb-1">{skill}</p>
                  {band ? (
                    <p className={`text-2xl font-bold ${bandColor(band)}`}>{band}</p>
                  ) : (
                    <p className="text-gray-600 text-sm">—</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Skill navigation cards */}
        <h2 className="text-lg font-semibold text-white mb-3">Practice Skills</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {skills.map((skill) => {
            const band = skill.id in latestBands
              ? latestBands[skill.id as keyof BandData]
              : null;
            return (
              <Link
                key={skill.id}
                href={skill.href}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-5 hover:border-blue-500 transition group"
              >
                <div className="text-3xl mb-2">{skill.emoji}</div>
                <h3 className="text-white font-semibold text-sm group-hover:text-blue-400 transition">
                  {skill.label}
                </h3>
                {band && (
                  <p className={`text-sm font-bold mt-1 ${bandColor(band)}`}>Band {band}</p>
                )}
              </Link>
            );
          })}
        </div>

        {/* Recent attempts */}
        {recentAttempts.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">
              🕐 Recent Attempts
              <span className="text-gray-500 text-sm font-normal ml-2">({totalAttempts} total)</span>
            </h2>
            <div className="space-y-2">
              {recentAttempts.map((a) => (
                <div key={a.attempt_id} className="flex items-center justify-between bg-gray-800/30 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {skills.find(s => s.id === a.skill)?.emoji || '📝'}
                    </span>
                    <div>
                      <p className="text-white text-sm capitalize">
                        {a.skill}{a.task_type ? ` — ${a.task_type}` : ''}
                      </p>
                      {a.raw_score != null && a.max_score != null && (
                        <p className="text-gray-500 text-xs">{a.raw_score}/{a.max_score} correct</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {a.band_estimate && (
                      <p className={`text-lg font-bold ${bandColor(a.band_estimate)}`}>
                        {a.band_estimate}
                      </p>
                    )}
                    {a.created_at && (
                      <p className="text-gray-600 text-xs">
                        {new Date(a.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded IELTS books */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">📚 IELTS Reference Books</h2>
          {documents.length === 0 ? (
            <p className="text-gray-400 text-sm">No IELTS books uploaded yet. Upload PDFs to give the AI more context.</p>
          ) : (
            <div className="space-y-1">
              {(documents as { id: string; title: string }[]).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between bg-gray-800/30 rounded-lg px-4 py-2">
                  <span className="text-gray-300 text-sm">📄 {doc.title}</span>
                  <span className="text-green-400 text-xs">✅ Active</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/rag/upload" className="text-blue-400 hover:text-blue-300 text-sm mt-3 inline-block">
            + Upload IELTS Books
          </Link>
        </div>

      </div>
    </div>
  );
}
