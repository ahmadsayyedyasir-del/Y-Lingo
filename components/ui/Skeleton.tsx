// components/ui/Skeleton.tsx
// Reusable skeleton shimmer components for loading states.
'use client';

interface SkeletonProps {
  className?: string;
}

// Base shimmer element
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-800/60 ${className}`}
    />
  );
}

// ─── Composed skeleton layouts ───────────────────────────────────────────────

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-3 ${className}`}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
      {/* Progress bar */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
      </div>
      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

export function SkeletonMessages() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 space-y-6">
        {/* Avatar + name row */}
        <div className="flex items-center gap-6 pb-6 border-b border-gray-800">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        {/* Grid fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonProgress() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Full-page centered spinner for simple loading
export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-4">
      <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}
