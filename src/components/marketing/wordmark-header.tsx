import Link from "next/link";
import { Brand } from "@/components/brand";

export function WordmarkHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-8 py-4">
        <Link href="/" className="block">
          <Brand />
        </Link>
        <nav className="flex items-center gap-6 text-[12px] text-ink-2">
          <a href="#sdk" className="hover:text-ink">
            SDK
          </a>
          <a href="#track" className="hover:text-ink">
            Track
          </a>
          <a href="#compare" className="hover:text-ink">
            Compare
          </a>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-3 py-1.5 font-medium text-ink hover:border-line-strong"
          >
            Open dashboard →
          </Link>
        </nav>
      </div>
    </header>
  );
}
