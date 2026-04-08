import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-white tracking-tight text-lg">
          Portfolio<span className="text-blue-500">.</span>
        </Link>
        <div className="flex gap-6 text-sm">
          <Link
            href="/"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Home
          </Link>
          <Link
            href="/projects"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Projects
          </Link>
        </div>
      </div>
    </nav>
  );
}
