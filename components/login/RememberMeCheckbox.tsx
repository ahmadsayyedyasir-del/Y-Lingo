"use client";

interface RememberMeCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function RememberMeCheckbox({ checked, onChange }: RememberMeCheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 text-blue-500 accent-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-0"
      />
      Remember me
    </label>
  );
}