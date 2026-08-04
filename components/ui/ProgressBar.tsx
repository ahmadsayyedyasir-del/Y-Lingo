interface ProgressBarProps {
  value: number;
}

export default function ProgressBar({
  value,
}: ProgressBarProps) {
  return (
    <div className="mt-4 h-2 w-full rounded-full bg-white/10">
      <div
        className="h-2 rounded-full bg-blue-500 transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}