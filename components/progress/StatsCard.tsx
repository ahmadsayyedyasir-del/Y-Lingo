// components/progress/StatsCard.tsx
'use client';

interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtitle: string;
}

export default function StatsCard({ icon, label, value, subtitle }: StatsCardProps) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 text-center">
      <div className="text-3xl mb-1">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
    </div>
  );
}