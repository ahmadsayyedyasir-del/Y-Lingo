import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "rounded-xl px-6 py-3 font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50";

  const styles = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30",

    secondary:
      "border border-white/20 text-white hover:border-blue-500 hover:text-blue-400",
  };

  return (
    <button
      className={`${base} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}