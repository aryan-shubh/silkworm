import { cn } from "@/lib/utils";

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "lime" | "amber" | "rust" | "cyan";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-rule text-bone-dim",
    lime:    "border-lime/40 text-lime",
    amber:   "border-amber/40 text-amber",
    rust:    "border-rust/50 text-rust",
    cyan:    "border-cyan/40 text-cyan",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
