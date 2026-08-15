// app/verify-email/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';

interface ApiError {
  response?: { data?: { detail?: string } };
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    const e = searchParams?.get('email');
    if (e) setEmail(decodeURIComponent(e));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    setIsLoading(true);
    try {
      await apiClient.post('/auth/verify-email', { email, code });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      const detail = (err as ApiError).response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMsg('');
    try {
      await apiClient.post('/auth/resend-verification', { email });
      setResendMsg('A new code has been sent to your email.');
    } catch {
      setResendMsg('Could not resend. Please try again in a moment.');
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="w-full max-w-md bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
          <p className="text-gray-400 mb-4">Your account is now active. Redirecting to login...</p>
          <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm">
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">📧</div>
            <h1 className="text-2xl font-bold text-white">Verify Your Email</h1>
            <p className="text-gray-400 mt-2 text-sm">
              We sent a 6-digit code to{' '}
              <span className="text-white font-medium">{email || 'your email'}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}
          {resendMsg && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 rounded-lg p-3 mb-4 text-sm">
              {resendMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!email && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">6-Digit Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                disabled={isLoading}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center text-lg font-mono"
              />
              <p className="text-gray-500 text-xs mt-1">Check your inbox and spam folder.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
            >
              {isResending ? 'Sending...' : "Didn't receive it? Resend code"}
            </button>
            <br />
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-300">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
