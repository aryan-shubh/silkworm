export function FeatureBand({
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
          <h2 className="mt-4 max-w-[18ch] font-serif text-[40px] leading-[1.05] tracking-tight text-ink">
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
