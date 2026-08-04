export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">

        <div>
          <h3 className="text-xl font-bold text-white">
            Y-Lingo
          </h3>

          <p className="mt-2 text-sm text-gray-400">
            Master Languages Through Real AI Conversations.
          </p>
        </div>

        <p className="text-sm text-gray-500">
          © 2026 Y-Lingo. All rights reserved.
        </p>

      </div>
    </footer>
  );
}