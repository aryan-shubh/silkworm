import { cn } from "@/lib/utils";

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center border border-rule bg-ink-2 px-1.5",
        "font-mono text-[10px] text-bone-dim leading-none",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
