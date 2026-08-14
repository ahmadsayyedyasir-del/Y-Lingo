// app/ielts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { ragEndpoints } from '@/lib/endpoints';

export default function IELTSPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await ragEndpoints.listDocuments();
        const ieltsDocs = response.data?.filter((doc: any) => doc.category === 'ielts') || [];
        setDocuments(ieltsDocs);
      } catch (error) {
        console.error('Failed to fetch IELTS data:', error);
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-white mb-2">📚 IELTS Preparation</h1>
        <p className="text-gray-400 mb-6">Complete IELTS preparation with AI-powered coaching</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/ielts/reading" className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition text-center">
            <div className="text-4xl mb-2">📖</div>
            <h3 className="text-white font-semibold">Reading</h3>
          </Link>
          <Link href="/ielts/writing" className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition text-center">
            <div className="text-4xl mb-2">✍️</div>
            <h3 className="text-white font-semibold">Writing</h3>
          </Link>
          <Link href="/ielts/speaking" className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition text-center">
            <div className="text-4xl mb-2">🗣️</div>
            <h3 className="text-white font-semibold">Speaking</h3>
          </Link>
          <Link href="/ielts/chat" className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition text-center">
            <div className="text-4xl mb-2">💬</div>
            <h3 className="text-white font-semibold">AI Coach</h3>
          </Link>
        </div>

        <div className="mt-8 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">📚 Uploaded IELTS Books</h2>
          {documents.length === 0 ? (
            <p className="text-gray-400">No IELTS books uploaded yet.</p>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between bg-gray-800/30 rounded-lg px-4 py-2 mb-2">
                <span className="text-gray-300">📄 {doc.title}</span>
                <span className="text-green-400 text-sm">✅ Processed</span>
              </div>
            ))
          )}
          <Link href="/rag/upload" className="text-blue-400 hover:text-blue-300 text-sm mt-4 inline-block">
            + Upload IELTS Books
          </Link>
        </div>
      </div>
    </div>
  );
}