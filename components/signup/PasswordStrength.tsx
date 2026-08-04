"use client";

import { getPasswordStrength, passwordRequirements } from "@/lib/validators";

interface PasswordStrengthProps {
  password: string;
}

const LEVEL_STYLES: Record<string, { bar: string; text: string }> = {
  weak: { bar: "bg-red-500", text: "text-red-400" },
  medium: { bar: "bg-amber-500", text: "text-amber-400" },
  strong: { bar: "bg-blue-500", text: "text-blue-400" },
  "very-strong": { bar: "bg-indigo-400", text: "text-indigo-300" },
};

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, level, label } = getPasswordStrength(password);
  const totalRequirements = passwordRequirements.length;
  const filledSegments = password ? Math.max(score, 1) : 0;
  const styles = LEVEL_STYLES[level];

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5" role="presentation">
        {Array.from({ length: totalRequirements }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              index < filledSegments ? styles.bar : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {password && (
        <p className={`mt-1.5 text-xs font-medium ${styles.text}`}>{label} password</p>
      )}

      <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {passwordRequirements.map((requirement) => {
          const met = requirement.test(password);
          return (
            <li
              key={requirement.label}
              className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                met ? "text-blue-400" : "text-gray-500"
              }`}
            >
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] ${
                  met ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-gray-500"
                }`}
                aria-hidden="true"
              >
                {met ? "✓" : "•"}
              </span>
              {requirement.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}