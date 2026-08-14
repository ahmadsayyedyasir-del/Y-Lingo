// app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', { email });
      // Always show the success screen — backend never reveals if email exists
      setSubmitted(true);
    } catch (err) {
      const apiError = err as ApiError;
      const detail = apiError?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Success screen ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-white mb-2">Check Your Email</h1>
            <p className="text-gray-400 mb-2">
              If an account exists for{' '}
              <span className="text-white font-medium">{email}</span>,
              a 6-digit reset code has been sent.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              The code expires in 15 minutes. Check your spam folder if you don't see it.
            </p>
            <button
              onClick={() =>
                router.push(`/reset-password?email=${encodeURIComponent(email)}`)
              }
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition"
            >
              Enter Reset Code →
            </button>
            <p className="text-center text-gray-500 mt-4 text-sm">
              Didn't receive it?{' '}
              <button
                onClick={() => setSubmitted(false)}
                className="text-blue-400 hover:text-blue-300"
              >
                Try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Email input screen ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-2xl font-bold text-white">Forgot Password?</h1>
            <p className="text-gray-400 mt-2 text-sm">
              Enter your email address and we'll send you a 6-digit reset code.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6 text-sm">
            Remember your password?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
