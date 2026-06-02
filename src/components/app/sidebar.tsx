import Link from "next/link";
import {
  LayoutGrid, FlaskConical, Database, GitBranch, Bell, Settings,
  KeyRound, Users, BookOpen,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Kbd } from "@/components/ui/kbd";
import { CURRENT_ORG, CURRENT_USER } from "@/lib/mock";

const PRIMARY = [
  { href: "/",            label: "projects",    icon: LayoutGrid, kbd: "g p" },
  { href: "/runs",        label: "all runs",    icon: FlaskConical, kbd: "g r" },
  { href: "/artifacts",   label: "artifacts",   icon: Database, kbd: "g a" },
  { href: "/sweeps",      label: "sweeps",      icon: GitBranch, kbd: "g s" },
  { href: "/alerts",      label: "alerts",      icon: Bell, kbd: "g i" },
];
const SECONDARY = [
  { href: "/team",   label: "team",     icon: Users },
  { href: "/keys",   label: "api keys", icon: KeyRound },
  { href: "/docs",   label: "docs",     icon: BookOpen },
  { href: "/settings", label: "settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-dvh w-[232px] shrink-0 flex-col border-r border-rule bg-ink-2/40">
      {/* org switcher / brand row */}
      <div className="border-b border-rule p-3">
        <Link href="/" className="block px-1">
          <Brand />
        </Link>
        <button className="mt-3 flex w-full items-center justify-between border border-rule bg-ink-3/60 px-2 py-1.5 text-left hover:border-rule-2">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center bg-lime font-mono text-[10px] text-ink">
              AL
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12px] text-bone">{CURRENT_ORG.name}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-bone-faint">team · 14 seats</div>
            </div>
          </div>
          <span className="font-mono text-[10px] text-bone-faint">⇅</span>
        </button>
      </div>

      {/* primary nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="eyebrow px-2 pb-2">workspace</div>
        <ul className="space-y-px">
          {PRIMARY.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className="group flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-[12px] text-bone-dim hover:bg-ink-3 hover:text-bone"
              >
                <span className="flex items-center gap-2.5">
                  <it.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span className="font-mono lowercase tracking-wide">{it.label}</span>
                </span>
                <span className="font-mono text-[9px] text-bone-faint opacity-0 group-hover:opacity-100">
                  {it.kbd}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="eyebrow mt-6 px-2 pb-2">account</div>
        <ul className="space-y-px">
          {SECONDARY.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className="flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-[12px] text-bone-dim hover:bg-ink-3 hover:text-bone"
              >
                <it.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="font-mono lowercase tracking-wide">{it.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 border border-rule bg-ink-3/40 p-3">
          <div className="eyebrow mb-1">trial · open beta</div>
          <div className="font-mono text-[11px] text-bone-dim">
            <div className="flex justify-between"><span>artifacts</span><span className="text-bone tabular">1.4 / 5 GB</span></div>
            <div className="mt-1.5 h-1 w-full bg-rule">
              <div className="h-full bg-lime" style={{ width: "28%" }} />
            </div>
            <div className="mt-3 flex justify-between"><span>seats</span><span className="text-bone tabular">3 / 14</span></div>
          </div>
        </div>
      </nav>

      {/* user footer */}
      <div className="flex items-center justify-between gap-2 border-t border-rule p-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-bone font-mono text-[10px] text-ink">
            {CURRENT_USER.initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12px] text-bone">{CURRENT_USER.name}</div>
            <div className="truncate font-mono text-[10px] text-bone-faint">{CURRENT_USER.email}</div>
          </div>
        </div>
        <button title="command palette" className="border border-rule px-1.5 py-1 hover:border-rule-2">
          <Kbd>⌘K</Kbd>
        </button>
      </div>
    </aside>
  );
}
