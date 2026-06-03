import Link from "next/link";
import { LiveDemo } from "@/components/marketing/live-demo";

export function Hero() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 px-8 py-24 md:grid-cols-2 md:py-32">
        {/* Left column */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">
            Training Observability
          </p>
          <h1 className="mt-5 font-sans text-5xl font-semibold leading-[1.05] tracking-tight text-ink md:text-7xl">
            Track every run.
            <span className="block text-3xl font-normal text-ink-2 md:text-5xl">
              From smoke test to production.
            </span>
          </h1>
          <p className="mt-6 max-w-[44ch] text-[16px] leading-relaxed text-ink-2">
            Log metrics, compare runs, and capture artifacts from any training
            loop — with a drop-in Python client and a real-time dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-[13px] font-medium text-canvas transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Start tracking
            </Link>
            <a
              href="#faq"
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-5 py-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            >
              View docs
            </a>
          </div>
        </div>

        {/* Right column — live chart card */}
        <div className="rounded-lg border border-line bg-surface p-4 shadow-sm">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-ink-3">
            demo-run-1 &middot; train_loss &middot; live from postgres
          </p>
          <LiveDemo />
        </div>
      </div>
    </section>
  );
}
