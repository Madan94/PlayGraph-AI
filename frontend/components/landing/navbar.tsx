import Link from "next/link";
import { Zap } from "lucide-react";

export function LandingNavbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-100/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-black">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
            <Zap className="h-4 w-4 text-white" />
          </span>
          PlayGraphAI
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          <a href="#problem" className="transition hover:text-black">Problem</a>
          <a href="#features" className="transition hover:text-black">Features</a>
          <a href="#workflow" className="transition hover:text-black">How it works</a>
          <a href="#cognee" className="transition hover:text-black">Why Cognee</a>
          <a href="#faq" className="transition hover:text-black">FAQ</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/auth/athlete" className="btn-secondary hidden sm:inline-flex">
            Athlete
          </Link>
          <Link href="/auth/coach" className="btn-primary">
            Coach Login
          </Link>
        </div>
      </div>
    </header>
  );
}
