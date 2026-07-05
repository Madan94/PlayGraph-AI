import Link from "next/link";
import { Zap } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2 font-semibold text-black">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
                <Zap className="h-4 w-4 text-white" />
              </span>
              PlayGraphAI
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted">
              Memory-first athlete intelligence. Powered by Cognee.
            </p>
          </div>

          <div className="flex gap-16 text-sm">
            <div>
              <p className="mb-3 font-semibold text-black">Platform</p>
              <div className="space-y-2 text-muted">
                <a href="#features" className="block hover:text-black">Features</a>
                <a href="#workflow" className="block hover:text-black">How it works</a>
                <a href="#cognee" className="block hover:text-black">Why Cognee</a>
                <a href="#faq" className="block hover:text-black">FAQ</a>
              </div>
            </div>
            <div>
              <p className="mb-3 font-semibold text-black">Get started</p>
              <div className="space-y-2 text-muted">
                <Link href="/auth/coach" className="block hover:text-black">Coach signup</Link>
                <Link href="/auth/athlete" className="block hover:text-black">Athlete signup</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-100 pt-8 text-center text-sm text-muted">
          © {new Date().getFullYear()} PlayGraphAI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
