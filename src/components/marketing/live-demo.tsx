import { DEMO_RUN_ID, getRunMetrics } from "@/lib/queries";
import { MetricChart } from "@/components/charts/metric-chart";

const GRADIENT: [string, string] = [
  "oklch(0.46 0.12 262)",
  "oklch(0.58 0.13 262)",
];

export async function LiveDemo() {
  const data = await getRunMetrics(DEMO_RUN_ID, "train_loss");
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-2 flex items-center justify-between text-[11px] text-ink-3">
        <span className="font-mono">mnist-mlp / demo-run-1</span>
        <span className="font-mono">train_loss</span>
      </div>
      <MetricChart
        data={data}
        label="train_loss"
        dataKey="train_loss"
        gradient={GRADIENT}
        format="decimal"
      />
    </div>
  );
}
