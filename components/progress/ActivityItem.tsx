// components/progress/ActivityItem.tsx
'use client';

import { useRouter } from 'next/navigation';

interface ActivityItemProps {
  id: string;
  title: string;
  date: string;
  score?: number;
  status: string;
}

export default function ActivityItem({ id, title, date, score, status }: ActivityItemProps) {
  const router = useRouter();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'ended' ? 'text-green-400' : 'text-yellow-400';
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div
      onClick={() => router.push(`/history/${id}`)}
      className="flex items-center justify-between bg-gray-800/30 rounded-lg px-4 py-3 hover:bg-gray-800/50 transition cursor-pointer"
    >
      <div className="flex-1">
        <p className="text-white text-sm font-medium">{title}</p>
        <p className="text-gray-400 text-xs">{formatDate(date)}</p>
      </div>
      <div className="text-right">
        {score !== undefined && (
          <p className={`text-sm font-semibold ${getScoreColor(score)}`}>
            {score}%
          </p>
        )}
        <p className={`text-xs ${getStatusColor(status)}`}>
          {status === 'ended' ? '✅ Done' : '🔄 Active'}
        </p>
      </div>
    </div>
  );
}