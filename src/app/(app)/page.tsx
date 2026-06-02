import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Sparkline } from "@/components/ui/sparkline";
import { Pill } from "@/components/ui/pill";
import { TickRule } from "@/components/ui/tick-rule";
import { PROJECTS, CURRENT_ORG } from "@/lib/mock";
import { relTime } from "@/lib/utils";

// deterministic-per-project sparkline shape
function projSpark(seed: string): number[] {
  const h = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: 40 }, (_, i) => {
    return 0.5 + Math.sin((i + h) / 5) * 0.25 + Math.cos((i + h) / 11) * 0.18;
  });
}

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: CURRENT_ORG.slug }]}
        title={<>Projects</>}
        meta={
          <>
            <span>{PROJECTS.length} projects</span>
            <span>·</span>
            <span>{PROJECTS.reduce((s, p) => s + p.runCount, 0)} runs</span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lime blink" />
              {PROJECTS.reduce((s, p) => s + p.activeCount, 0)} active
            </span>
          </>
        }
        actions={
          <>
            <button className="border border-rule px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-bone-dim hover:border-rule-2 hover:text-bone">
              Filter
            </button>
            <button className="bg-lime px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink hover:bg-bone">
              New project
            </button>
          </>
        }
      />

      <div className="p-8">
        <div className="grid grid-cols-1 gap-px bg-rule md:grid-cols-2 xl:grid-cols-3">
          {PROJECTS.map((p, i) => (
            <Link
              key={p.id}
              href={`/p/${p.slug}`}
              className="group relative flex flex-col gap-4 bg-ink p-5 transition-colors hover:bg-ink-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-bone-faint">[{(i + 1).toString().padStart(2, "0")}]</span>
                    <h3 className="truncate display text-[28px] leading-none text-bone group-hover:text-lime">
                      {p.name}
                    </h3>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-bone-dim">
                    {p.description}
                  </p>
                </div>
                {p.activeCount > 0 && (
                  <Pill tone="lime">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime blink" />
                    {p.activeCount} live
                  </Pill>
                )}
              </div>

              <TickRule />

              <div className="flex items-end justify-between gap-4">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[10px]">
                  <div>
                    <dt className="text-bone-faint">runs</dt>
                    <dd className="text-[14px] text-bone tabular">{p.runCount}</dd>
                  </div>
                  <div>
                    <dt className="text-bone-faint">framework</dt>
                    <dd className="text-[12px] text-bone">{p.framework}</dd>
                  </div>
                  <div>
                    <dt className="text-bone-faint">updated</dt>
                    <dd className="text-[12px] text-bone">{relTime(p.updated)}</dd>
                  </div>
                  <div>
                    <dt className="text-bone-faint">visibility</dt>
                    <dd className="text-[12px] text-bone">private</dd>
                  </div>
                </dl>
                <Sparkline
                  data={projSpark(p.slug)}
                  width={140}
                  height={48}
                  color={p.activeCount > 0 ? "var(--color-lime)" : "var(--color-bone-dim)"}
                  fill
                />
              </div>
            </Link>
          ))}
          {/* "new project" tile */}
          <div className="flex flex-col items-center justify-center gap-2 bg-ink p-5 text-bone-faint hover:bg-ink-2">
            <span className="font-mono text-[32px] leading-none">+</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em]">new project</span>
          </div>
        </div>
      </div>
    </>
  );
}
