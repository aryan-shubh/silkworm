import { cn } from "@/lib/utils";

/** Hairline horizontal rule with optional tick marks every N px. Pure decoration. */
export function TickRule({ className, ticks = false }: { className?: string; ticks?: boolean }) {
  return (
    <div className={cn("relative h-px w-full bg-rule", className)}>
      {ticks && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, var(--color-rule-2) 0 1px, transparent 1px 16px)",
          }}
        />
      )}
    </div>
  );
}
