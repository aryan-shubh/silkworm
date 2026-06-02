import Link from "next/link";
import { Brand } from "@/components/brand";

const COLS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "product",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "SDK", href: "#sdk" },
      { label: "Pricing", href: "#" },
    ],
  },
  {
    heading: "resources",
    links: [
      { label: "Docs", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    heading: "legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-[1200px] px-8 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_repeat(3,minmax(0,140px))]">
          <div>
            <Brand />
            <p className="mt-3 max-w-xs text-[12px] text-ink-3">
              Research-grade experiment tracking. W&amp;B-shaped, with sharper
              edges and a saner ingest path.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.heading}>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
                {col.heading}
              </div>
              <ul className="mt-3 space-y-2 text-[12px] text-ink-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href === "#" ? (
                      <span className="cursor-default text-ink-3">
                        {l.label}
                      </span>
                    ) : (
                      <Link href={l.href} className="hover:text-ink">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex items-center justify-between border-t border-line pt-6 text-[11px] text-ink-3">
          <span>© 2026 silkworm</span>
          <a href="https://github.com" className="font-mono hover:text-ink">
            github.com/silkworm
          </a>
        </div>
      </div>
    </footer>
  );
}
