// app/rag/upload/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/layout/Navbar';
import { ragEndpoints } from '@/lib/endpoints';

const categories = [
  { value: 'ielts', label: '📚 IELTS' },
  { value: 'grammar', label: '✏️ Grammar' },
  { value: 'vocabulary', label: '📝 Vocabulary' },
  { value: 'conversation', label: '💬 Conversation' },
  { value: 'general', label: '📖 General' },
];

export default function RAGUploadPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      return;
    }

    if (selected.size > 20 * 1024 * 1024) {
      setError('File size exceeds 20MB limit.');
      return;
    }

    setFile(selected);
    setError('');
    if (!title) {
      setTitle(selected.name.replace('.pdf', ''));
    }
    setStatusMessage(`File selected: ${selected.name} (${(selected.size / 1024).toFixed(1)} KB)`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setProgress(0);
    setStatusMessage('Uploading file...');

    try {
      setProgress(10);
      setStatusMessage('Uploading to server...');
      
      const response = await ragEndpoints.uploadDocument(file, title, description, category);
      
      setProgress(50);
      setStatusMessage('Processing document (text extraction & chunking)...');
      
      // Simulate progress for processing
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 5;
        });
      }, 1000);

      // Wait for response
      const result = response.data;
      
      clearInterval(interval);
      setProgress(100);
      setSuccess(`Document "${title}" uploaded successfully! ${result.chunk_count} chunks processed.`);
      setStatusMessage('✅ Upload complete!');
      
      setTimeout(() => {
        router.push('/rag');
      }, 2500);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err?.response?.data?.detail || 'Failed to upload document. Please try again.';
      setError(errorMessage);
      setStatusMessage('❌ Upload failed');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setCategory('general');
    setProgress(0);
    setError('');
    setSuccess('');
    setStatusMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-3xl mx-auto p-8">
        <Link href="/rag" className="text-blue-400 hover:text-blue-300 text-sm">
          ← Back to Documents
        </Link>

        <h1 className="text-3xl font-bold text-white mt-4 mb-2">📤 Upload Document</h1>
        <p className="text-gray-400 mb-6">Upload PDF documents for AI context and search</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 rounded-lg p-3 mb-4 text-sm">
            {success}
          </div>
        )}

        {statusMessage && !error && !success && (
          <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg p-3 mb-4 text-sm">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">File (PDF only)</label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            {file && (
              <p className="text-gray-500 text-sm mt-2">
                📄 Selected: {file.name} ({ (file.size / 1024).toFixed(1) } KB)
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">Max file size: 20MB. Only PDF files are supported.</p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter document title"
              required
              disabled={uploading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the document"
              disabled={uploading}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={uploading}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Progress Bar */}
          {progress > 0 && progress < 100 && (
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {progress === 100 && (
            <div className="text-center text-green-400 text-sm">
              ✅ Done! Redirecting...
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Processing...' : 'Upload Document'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={uploading}
              className="px-6 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}