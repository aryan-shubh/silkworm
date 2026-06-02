import { cn } from "@/lib/utils";

/**
 * Wordmark. The "silkworm" is rendered as a stylized italic display + a small
 * geometric mark — a stack of three diminishing horizontal rules suggesting
 * a moulting larva / signal trace. Intentionally hand-tuned.
 */
export function Brand({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span aria-hidden className="relative inline-block h-3.5 w-3.5 shrink-0">
        <span className="absolute left-0 top-[2px] h-px w-full bg-bone" />
        <span className="absolute left-[14%] top-[6px] h-px w-[72%] bg-bone" />
        <span className="absolute left-[28%] top-[10px] h-px w-[44%] bg-lime" />
      </span>
      {mono ? (
        <span className="font-mono text-[12px] tracking-[0.2em] uppercase">silkworm</span>
      ) : (
        <span className="display text-[22px] leading-none">silkworm</span>
      )}
    </span>
  );
}
