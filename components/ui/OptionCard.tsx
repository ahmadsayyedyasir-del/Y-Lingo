interface OptionCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}

export default function OptionCard({
  title,
  description,
  selected,
  onClick,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
        selected
          ? "border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/20"
          : "border-white/10 bg-white/5 text-gray-300 hover:border-blue-400 hover:bg-white/10"
      }`}
    >
      <h3 className="text-lg font-semibold">
        {title}
      </h3>

      {description && (
        <p className="mt-2 text-sm text-gray-400">
          {description}
        </p>
      )}
    </button>
  );
}