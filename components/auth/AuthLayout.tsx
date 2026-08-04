import { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030712] px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-white">
          {title}
        </h1>

        <p className="mt-3 text-gray-400">
          {subtitle}
        </p>

        <div className="mt-8">
          {children}
        </div>
      </div>
    </main>
  );
}