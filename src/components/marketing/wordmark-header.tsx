import Link from "next/link";
import { Brand } from "@/components/brand";

export function WordmarkHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-8 py-4">
        <Link href="/" className="block" aria-label="Silkworm home">
          <Brand />
        </Link>
        <nav
          className="flex items-center gap-6 text-[12px] text-ink-2"
          aria-label="Main navigation"
        >
          <a href="#features" className="hover:text-ink">
            Features
          </a>
          <a href="#faq" className="hover:text-ink">
            FAQ
          </a>
          <Link href="/sign-in" className="hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-3 py-1.5 font-medium text-ink hover:border-line-strong"
          >
            Dashboard →
          </Link>
        </nav>
      </div>
    </header>
  );
}
