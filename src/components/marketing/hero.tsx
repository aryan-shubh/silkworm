import Link from "next/link";

export function Hero() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1200px] px-8 py-32">
        <p className="font-mono text-[11px] tracking-wider text-ink-3">
          silkworm · experiment tracking
        </p>
        <h1 className="mt-6 max-w-[16ch] font-serif text-[72px] leading-[0.95] tracking-tight text-ink">
          Experiment tracking, sharper.
        </h1>
        <p className="mt-8 max-w-[52ch] text-[16px] leading-relaxed text-ink-2">
          Log metrics, runs, and artifacts from any training loop. Compare runs
          side-by-side. Built for research teams who care about ingest latency
          and disk pressure.
        </p>
        <div className="mt-10 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2.5 text-[13px] font-medium text-canvas hover:bg-accent-hover"
          >
            Open dashboard
          </Link>
          <a
            href="#sdk"
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-4 py-2.5 text-[13px] font-medium text-ink-2 hover:border-line-strong hover:text-ink"
          >
            See the SDK
          </a>
        </div>
      </div>
    </section>
  );
}
