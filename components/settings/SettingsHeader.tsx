export default function SettingsHeader() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Settings</h1>
        <p className="mt-2 max-w-lg text-sm text-gray-400">
          Manage your account, learning preferences, AI Coach behaviour, and privacy.
        </p>
      </div>
    </section>
  );
}