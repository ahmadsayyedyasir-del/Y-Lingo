import { ReactNode } from "react";

interface SettingsCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function SettingsCard({ title, description, children }: SettingsCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}