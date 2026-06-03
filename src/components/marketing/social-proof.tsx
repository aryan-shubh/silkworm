const LOGOS: { name: string; label: string }[] = [
  { name: "Anthrop Labs", label: "Anthrop Labs" },
  { name: "Halcyon Robotics", label: "Halcyon Robotics" },
  { name: "Obsidian AI", label: "Obsidian AI" },
  { name: "Polyglot ML", label: "Polyglot ML" },
  { name: "Retina Diagnostics", label: "Retina Diagnostics" },
];

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  avatarBg: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We switched from W&B mid-way through viscount-lm pretraining. The dashboard was live in an afternoon and ingest latency dropped by half. Silkworm just gets out of the way.",
    name: "Mira Osei",
    role: "ML Infrastructure Lead, Anthrop Labs",
    initials: "MO",
    avatarBg: "bg-accent-soft text-accent-ink",
  },
  {
    quote:
      "The overlay comparison view alone saved us from shipping a broken checkpoint. Being able to spot the gradient spike visually — versus digging through logs — is genuinely a different workflow.",
    name: "Daniel Cho",
    role: "Research Scientist, Halcyon Robotics",
    initials: "DC",
    avatarBg: "bg-success-soft text-success",
  },
];

export function SocialProof() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1200px] px-8 py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">
          trusted by teams
        </p>
        <h2 className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-ink">
          Trusted by teams shipping real models.
        </h2>

        {/* Logo row */}
        <div
          className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4"
          aria-label="Customer logos"
        >
          {LOGOS.map((logo) => (
            <span
              key={logo.name}
              className="font-mono text-[13px] font-medium text-ink-3 opacity-60 grayscale transition-opacity hover:opacity-100"
              aria-label={logo.label}
            >
              {logo.name}
            </span>
          ))}
        </div>

        {/* Testimonial cards */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="rounded-lg border border-line bg-surface p-8"
            >
              <blockquote className="text-[15px] leading-relaxed text-ink-2">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${t.avatarBg}`}
                  aria-hidden
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-ink">
                    {t.name}
                  </div>
                  <div className="text-[12px] text-ink-3">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
