import { Activity, GitCompareArrows, Package } from "lucide-react";

const FEATURES: {
  icon: React.ReactNode;
  title: string;
  body: string;
}[] = [
  {
    icon: <Activity size={18} className="text-accent" aria-hidden />,
    title: "Real-time metric streaming",
    body: "Per-step values stream straight into the dashboard as your training loop runs. Charts re-render on arrival — no polling, no refresh.",
  },
  {
    icon: <GitCompareArrows size={18} className="text-accent" aria-hidden />,
    title: "Side-by-side run comparison",
    body: "Select two runs and silkworm overlays their metric series on shared axes. Spot regressions before they reach production.",
  },
  {
    icon: <Package size={18} className="text-accent" aria-hidden />,
    title: "Artifact & checkpoint tracking",
    body: "Log model checkpoints, configs, and evaluation outputs alongside metrics. Every artifact is versioned and linked to its originating run.",
  },
];

export function FeatureBand() {
  return (
    <section id="features" className="border-b border-line">
      <div className="mx-auto max-w-[1200px] px-8 py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">
          capabilities
        </p>
        <h2 className="mt-4 max-w-[36ch] text-3xl font-semibold leading-[1.1] tracking-tight text-ink">
          Everything you&apos;d build yourself — but you don&apos;t have to.
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-canvas p-8">
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-[15px] font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Legacy two-column band — kept for other uses if needed. */
export function FeatureBandLegacy({
  eyebrow,
  title,
  body,
  visual,
  reverse = false,
  id,
}: {
  eyebrow: string;
  title: string;
  body: string;
  visual: React.ReactNode;
  reverse?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className="border-b border-line">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-8 py-28 md:grid-cols-2 md:items-center">
        <div className={reverse ? "md:order-2" : ""}>
          <p className="font-mono text-[11px] tracking-wider text-ink-3">
            {eyebrow}
          </p>
          <h2 className="mt-4 max-w-[18ch] text-[40px] font-semibold leading-[1.05] tracking-tight text-ink">
            {title}
          </h2>
          <p className="mt-6 max-w-[44ch] text-[15px] leading-relaxed text-ink-2">
            {body}
          </p>
        </div>
        <div className={reverse ? "md:order-1" : ""}>{visual}</div>
      </div>
    </section>
  );
}
