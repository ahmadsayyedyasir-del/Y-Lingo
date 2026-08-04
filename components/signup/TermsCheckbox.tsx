"use client";

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export default function TermsCheckbox({ checked, onChange, error }: TermsCheckboxProps) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 text-blue-500 accent-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-0"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "terms-error" : undefined}
        />
        <span>
          I agree to the{" "}
          <a href="/terms" className="text-blue-400 underline-offset-2 hover:underline focus:underline">
            Terms &amp; Conditions
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-blue-400 underline-offset-2 hover:underline focus:underline">
            Privacy Policy
          </a>
          .
        </span>
      </label>
      {error && (
        <p id="terms-error" role="alert" className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}