// app/voice/call/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import VoiceCall from '@/components/voice/VoiceCall';

function CallContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scenario = searchParams?.get('scenario') || 'casual';
  const level = searchParams?.get('level') || 'intermediate';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
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
      <VoiceCall scenario={scenario} level={level} />
    </div>
  );
}

export default function VoiceCallPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl">Loading call...</div>
      </div>
    }>
      <CallContent />
    </Suspense>
  );
}