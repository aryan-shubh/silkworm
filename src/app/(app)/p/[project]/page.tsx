import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Sparkline } from "@/components/ui/sparkline";
import { StatusDot } from "@/components/ui/status-dot";
import { Pill } from "@/components/ui/pill";
import { TickRule } from "@/components/ui/tick-rule";
import { getProject, runsForProject, CURRENT_ORG } from "@/lib/mock";
import { formatDuration, formatNum, relTime, seriesColor } from "@/lib/utils";

export default async function ProjectPage({ params }: { params: Promise<{ project: string }> }) {
  const { project: slug } = await params;
  const project = getProject(slug);
  if (!project) return notFound();
  const runs = runsForProject(slug, 80);

  const activeCount = runs.filter((r) => r.status === "running").length;
  const finishedCount = runs.filter((r) => r.status === "finished").length;
  const failedCount = runs.filter((r) => r.status === "failed" || r.status === "crashed").length;

  return (
    <>
      <PageHeader
        crumbs={[
          { href: "/", label: CURRENT_ORG.slug },
          { label: project.slug },
        ]}
        title={<>{project.name}</>}
        meta={
          <>
            <span>{project.description}</span>
            <span>·</span>
            <span>{project.framework}</span>
          </>
        }
        actions={
          <>
            <button className="border border-rule px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-bone-dim hover:border-rule-2 hover:text-bone">
              Compare
            </button>
            <button className="border border-rule px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-bone-dim hover:border-rule-2 hover:text-bone">
              Sweeps
            </button>
            <button className="bg-lime px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink hover:bg-bone">
              + run
            </button>
          </>
        }
      />

      <div className="space-y-6 p-8">
        {/* summary stat row */}
        <div className="grid grid-cols-2 gap-px bg-rule md:grid-cols-4">
          <StatBlock label="runs" value={runs.length} sublabel={`${activeCount} live`} accent={activeCount > 0} />
          <StatBlock label="finished" value={finishedCount} sublabel="last 24h" />
          <StatBlock label="failed" value={failedCount} sublabel="needs review" tone={failedCount > 0 ? "rust" : "neutral"} />
          <StatBlock label="best val_loss" value={Math.min(...runs.map((r) => r.summary.val_loss)).toFixed(3)} sublabel="↘ from 0.61" tone="lime" />
        </div>

        {/* overlay chart of all train_loss */}
        <div className="border border-rule bg-ink-2/40">
          <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="eyebrow">overlay · train_loss</span>
              <span className="font-mono text-[10px] text-bone-faint">{runs.length} runs</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-bone-faint">
              <Pill>x: step</Pill>
              <Pill>y: log</Pill>
              <Pill>smooth 0.6</Pill>
            </div>
          </div>
          <div className="relative h-[280px] px-6 pt-4 pb-2">
            <div aria-hidden className="grid-bg absolute inset-0 opacity-30" />
            <div className="relative h-full">
              {runs.slice(0, 24).map((r, i) => (
                <div key={r.id} className="absolute inset-0">
                  <Sparkline
                    data={r.metrics.find((m) => m.name === "train_loss")!.data}
                    width={1200}
                    height={250}
                    color={seriesColor(i)}
                    strokeWidth={r.status === "running" ? 1.4 : 0.6}
                  />
                </div>
              ))}
            </div>
          </div>
          <TickRule ticks />
          <div className="flex items-center justify-between px-4 py-2 font-mono text-[10px] text-bone-faint">
            <span>step 0 → 200,000</span>
            <span>hover a row to highlight · ⌘-click to pin</span>
          </div>
        </div>

        {/* runs table */}
        <div className="border border-rule bg-ink-2/30">
          <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
            <div className="flex items-center gap-2">
              <input
                placeholder="filter: lr<3e-4 and tag:baseline"
                className="w-72 border border-rule bg-ink px-2 py-1 font-mono text-[11px] text-bone placeholder:text-bone-faint focus:border-lime focus:outline-none"
              />
              <Pill>all</Pill>
              <Pill tone="lime">running ({activeCount})</Pill>
              <Pill>failed</Pill>
            </div>
            <div className="font-mono text-[10px] text-bone-faint">
              showing 1–{Math.min(runs.length, 50)} of {runs.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-rule font-mono text-[10px] uppercase tracking-[0.14em] text-bone-faint">
                  <th className="w-8 pl-4 py-2 text-left font-normal">·</th>
                  <th className="text-left font-normal">run</th>
                  <th className="text-left font-normal">user</th>
                  <th className="text-left font-normal">group</th>
                  <th className="text-right font-normal">started</th>
                  <th className="text-right font-normal">dur</th>
                  <th className="text-right font-normal">lr</th>
                  <th className="text-right font-normal">train_loss</th>
                  <th className="text-right font-normal">val_loss</th>
                  <th className="text-right font-normal">acc</th>
                  <th className="text-right font-normal">trace</th>
                  <th className="w-6 pr-4 text-right font-normal">↗</th>
                </tr>
              </thead>
              <tbody className="text-[12px] text-bone-dim">
                {runs.slice(0, 50).map((r, i) => (
                  <tr key={r.id} className="group border-b border-rule/40 hover:bg-ink-3/40">
                    <td className="py-2.5 pl-4">
                      <StatusDot status={r.status} />
                    </td>
                    <td className="py-2.5">
                      <Link href={`/p/${slug}/runs/${r.id}`} className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 shrink-0"
                          style={{ background: seriesColor(i) }}
                        />
                        <span className="font-mono text-bone group-hover:text-lime">{r.name}</span>
                        {r.tags.slice(0, 2).map((t) => (
                          <span key={t} className="font-mono text-[10px] text-bone-faint">·{t}</span>
                        ))}
                      </Link>
                    </td>
                    <td className="py-2.5 text-bone-dim">{r.user}</td>
                    <td className="py-2.5 font-mono text-[11px] text-bone-faint">{r.group ?? "—"}</td>
                    <td className="py-2.5 text-right text-bone-faint">{relTime(r.startedAt)}</td>
                    <td className="py-2.5 text-right font-mono tabular">{formatDuration(r.durationS)}</td>
                    <td className="py-2.5 text-right font-mono tabular">{formatNum(r.config.lr as number)}</td>
                    <td className="py-2.5 text-right font-mono tabular text-bone">
                      {r.summary.train_loss.toFixed(3)}
                    </td>
                    <td className="py-2.5 text-right font-mono tabular">{r.summary.val_loss.toFixed(3)}</td>
                    <td className="py-2.5 text-right font-mono tabular">
                      <span className={r.summary.accuracy > 0.9 ? "text-lime" : "text-bone"}>
                        {(r.summary.accuracy * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <Sparkline
                        data={r.metrics.find((m) => m.name === "train_loss")!.data.slice(0, 80)}
                        width={92}
                        height={22}
                        color={seriesColor(i)}
                      />
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-bone-faint group-hover:text-lime">↗</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function StatBlock({
  label,
  value,
  sublabel,
  accent = false,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sublabel: string;
  accent?: boolean;
  tone?: "neutral" | "lime" | "rust";
}) {
  const toneCls = tone === "lime" ? "text-lime" : tone === "rust" ? "text-rust" : "text-bone";
  return (
    <div className="bg-ink p-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        {accent && <span className="h-1.5 w-1.5 rounded-full bg-lime blink" />}
      </div>
      <div className={`mt-2 display text-[36px] leading-none tabular ${toneCls}`}>{value}</div>
      <div className="mt-1 font-mono text-[10px] text-bone-faint">{sublabel}</div>
    </div>
  );
}
