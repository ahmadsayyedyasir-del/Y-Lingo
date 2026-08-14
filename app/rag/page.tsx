// app/rag/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { ragEndpoints } from '@/lib/endpoints';

interface Document {
  id: string;
  filename: string;
  title: string;
  description: string;
  category: string;
  file_type: string;
  file_size: number;
  chunk_count: number;
  status: string;
  created_at: string;
}

export default function RAGPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await ragEndpoints.listDocuments();
        setDocuments(response.data || []);
      } catch (err) {
        console.error('Failed to fetch documents:', err);
        setError('Failed to load documents.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [isAuthenticated, isLoading, router]);

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await ragEndpoints.deleteDocument(documentId);
      setDocuments(documents.filter((doc) => doc.id !== documentId));
    } catch (err) {
      setError('Failed to delete document.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading || loading) {
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">📚 RAG Documents</h1>
            <p className="text-gray-400">Upload and manage documents for AI context</p>
          </div>
          <Link
            href="/rag/upload"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Upload Document
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Documents</p>
            <p className="text-2xl font-bold text-white">{documents.length}</p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Chunks</p>
            <p className="text-2xl font-bold text-white">
              {documents.reduce((sum, doc) => sum + doc.chunk_count, 0)}
            </p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Categories</p>
            <p className="text-2xl font-bold text-white">
              {new Set(documents.map((doc) => doc.category)).size}
            </p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Size</p>
            <p className="text-2xl font-bold text-white">
              {formatFileSize(documents.reduce((sum, doc) => sum + doc.file_size, 0))}
            </p>
          </div>
        </div>

        {/* Document List */}
        {documents.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
            <p className="text-gray-400">No documents uploaded yet.</p>
            <Link href="/rag/upload" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
              Upload your first document →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {doc.file_type === 'pdf' ? '📄' : '📎'}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{doc.title}</h3>
                        <p className="text-gray-400 text-sm">{doc.filename}</p>
                      </div>
                    </div>
                    {doc.description && (
                      <p className="text-gray-500 text-sm mt-1">{doc.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <span>📂 {doc.category}</span>
                      <span>📄 {doc.file_type}</span>
                      <span>📏 {formatFileSize(doc.file_size)}</span>
                      <span>🧩 {doc.chunk_count} chunks</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        doc.status === 'processed' ? 'bg-green-500/20 text-green-400' :
                        doc.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/rag/upload"
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition text-center"
          >
            <h3 className="text-lg font-semibold text-white">📤 Upload Document</h3>
            <p className="text-gray-400 text-sm">Upload PDFs for AI context</p>
          </Link>
          <Link
            href="/rag/search"
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition text-center"
          >
            <h3 className="text-lg font-semibold text-white">🔍 Search Documents</h3>
            <p className="text-gray-400 text-sm">Search through your documents</p>
          </Link>
        </div>
      </div>
    </div>
  );
}