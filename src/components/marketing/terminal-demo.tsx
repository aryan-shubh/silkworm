type LineToken =
  | { kind: "prompt"; text: string }
  | { kind: "cmd"; text: string }
  | { kind: "success"; text: string }
  | { kind: "arrow"; text: string }
  | { kind: "url"; text: string }
  | { kind: "plain"; text: string };

type TermLine = { tokens: LineToken[] };

const LINES: TermLine[] = [
  {
    tokens: [
      { kind: "prompt", text: "$ " },
      { kind: "cmd", text: "npm install -g @silkworm/cli" },
    ],
  },
  {
    tokens: [
      { kind: "prompt", text: "$ " },
      { kind: "cmd", text: "silkworm init my-experiment" },
    ],
  },
  {
    tokens: [
      { kind: "success", text: " ✓ " },
      { kind: "plain", text: "project linked: " },
      { kind: "cmd", text: "anthrop-labs/my-experiment" },
    ],
  },
  {
    tokens: [
      { kind: "prompt", text: "$ " },
      { kind: "cmd", text: "silkworm run -- python train.py" },
    ],
  },
  {
    tokens: [
      { kind: "arrow", text: " → " },
      { kind: "plain", text: "tracking run " },
      { kind: "cmd", text: "mlp-256-128" },
      { kind: "plain", text: " (id: 01j6qkr…)" },
    ],
  },
  {
    tokens: [
      { kind: "arrow", text: " → " },
      { kind: "plain", text: "logging to " },
      { kind: "url", text: "https://silkworm.dev/r/01j6qkr" },
    ],
  },
];

const TOKEN_CLASS: Record<LineToken["kind"], string> = {
  prompt: "text-zinc-500",
  cmd: "text-zinc-50",
  success: "text-lime-400",
  arrow: "text-cyan-400",
  url: "text-cyan-300 underline underline-offset-2",
  plain: "text-zinc-400",
};

function TermToken({ token }: { token: LineToken }) {
  return (
    <span className={TOKEN_CLASS[token.kind]}>{token.text}</span>
  );
}

export function TerminalDemo() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1200px] px-8 py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">
          quickstart
        </p>
        <h2 className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-ink">
          Up and logging in four commands.
        </h2>
        <div className="mt-10 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
          {/* Fake window chrome */}
          <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
            <span
              className="h-3 w-3 rounded-full bg-red-500"
              aria-hidden
            />
            <span
              className="h-3 w-3 rounded-full bg-yellow-400"
              aria-hidden
            />
            <span
              className="h-3 w-3 rounded-full bg-green-500"
              aria-hidden
            />
            <span className="mx-auto font-mono text-[11px] text-zinc-500">
              ~ silkworm
            </span>
          </div>
          {/* Terminal body */}
          <pre
            className="overflow-x-auto px-5 py-5 font-mono text-[13px] leading-[1.8] md:text-[14px]"
            aria-label="Terminal demo showing silkworm CLI commands"
          >
            {LINES.map((line, i) => (
              <div key={i}>
                {line.tokens.map((token, j) => (
                  <TermToken key={j} token={token} />
                ))}
              </div>
            ))}
          </pre>
        </div>
      </div>
    </section>
  );
}
