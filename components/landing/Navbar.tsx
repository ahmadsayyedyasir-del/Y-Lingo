import Button from "@/components/ui/Button";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-black/70 px-8 py-5 backdrop-blur-md">
      <div>
        <h1 className="text-2xl font-bold tracking-wide text-white">
          Y-Lingo
        </h1>
      </div>

      <div className="flex items-center gap-8 text-gray-300">
        <a href="#" className="transition hover:text-white">
          Features
        </a>

        <a href="#" className="transition hover:text-white">
          About
        </a>

        <a href="#" className="transition hover:text-white">
          Contact
        </a>

        <Button>Get Started</Button>
      </div>
    </nav>
  );
}