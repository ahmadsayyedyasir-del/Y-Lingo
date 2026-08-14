// app/rag/search/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { ragEndpoints } from '@/lib/endpoints';

interface SearchResult {
  chunk_id: string;
  document_id: string;
  content: string;
  similarity_score: number;
  document: {
    title: string;
    filename: string;
  };
}

export default function RAGSearchPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter a search query.');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await ragEndpoints.search({
        query: query.trim(),
        top_k: 10,
        category: category || undefined,
      });
      setResults(response.data.results || []);
    } catch (err) {
      setError('Failed to search documents.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-4xl mx-auto p-8">
        <Link href="/rag" className="text-blue-400 hover:text-blue-300 text-sm">
          ← Back to Documents
        </Link>

        <h1 className="text-3xl font-bold text-white mt-4 mb-2">🔍 Search Documents</h1>
        <p className="text-gray-400 mb-6">Search through your uploaded documents</p>

        <form onSubmit={handleSearch} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your search query..."
              className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Filter by Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="ielts">IELTS</option>
              <option value="grammar">Grammar</option>
              <option value="vocabulary">Vocabulary</option>
              <option value="conversation">Conversation</option>
              <option value="general">General</option>
            </select>
          </div>
        </form>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mt-4 text-sm">
            {error}
          </div>
        )}

        {searched && (
          <div className="mt-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-white text-xl">Searching...</div>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 bg-gray-900/50 rounded-xl border border-gray-800">
                <p className="text-gray-400">No results found for "{query}"</p>
                <p className="text-gray-500 text-sm mt-2">Try different keywords or upload more documents</p>
              </div>
            ) : (
              <>
                <p className="text-gray-400 mb-4">Found {results.length} results</p>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div
                      key={result.chunk_id}
                      className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-semibold">
                          {result.document.title || result.document.filename}
                        </h3>
                        <span className="text-sm text-gray-500">
                          Score: {(result.similarity_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {result.content.length > 500 
                          ? result.content.substring(0, 500) + '...'
                          : result.content
                        }
                      </p>
                      {index < results.length - 1 && (
                        <div className="border-t border-gray-800 mt-4 pt-4" />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}