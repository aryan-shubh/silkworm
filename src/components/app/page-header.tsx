import Link from "next/link";
import { TickRule } from "@/components/ui/tick-rule";

type Crumb = { href?: string; label: string };

export function PageHeader({
  crumbs,
  title,
  meta,
  actions,
}: {
  crumbs?: Crumb[];
  title: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-rule bg-ink/60">
      <div className="px-8 pt-6 pb-5">
        {crumbs && (
          <div className="mb-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-bone-faint">
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                {c.href ? (
                  <Link href={c.href} className="hover:text-bone-dim">{c.label}</Link>
                ) : (
                  <span className="text-bone-dim">{c.label}</span>
                )}
                {i < crumbs.length - 1 && <span className="text-bone-faint/60">/</span>}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="display text-[44px] leading-none text-bone">{title}</h1>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
        {meta && <div className="mt-3 flex items-center gap-3 font-mono text-[11px] text-bone-faint">{meta}</div>}
      </div>
      <TickRule ticks />
    </div>
  );
}
