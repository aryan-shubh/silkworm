import { cn } from "@/lib/utils";

const COLORS = {
  running:  "bg-lime",
  finished: "bg-bone-dim",
  failed:   "bg-rust",
  crashed:  "bg-amber",
  queued:   "bg-bone-faint",
  killed:   "bg-rust/60",
} as const;

export function StatusDot({ status, size = 8 }: { status: keyof typeof COLORS; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "inline-block rounded-full",
        COLORS[status],
        status === "running" && "blink ring-2 ring-lime/20",
      )}
    />
  );
}
