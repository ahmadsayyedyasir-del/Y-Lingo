interface DividerProps {
  label?: string;
}

export default function Divider({ label = "or" }: DividerProps) {
  return (
    <div className="flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-white/10" />
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}