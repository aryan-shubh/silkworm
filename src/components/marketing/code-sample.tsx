const SNIPPET = `import silkworm

run = silkworm.init(project="mnist-mlp")
for step, (x, y) in enumerate(loader):
    loss = train_step(x, y)
    run.log({"train_loss": loss}, step=step)
`;

export function CodeSample() {
  const lines = SNIPPET.trimEnd().split("\n");
  return (
    <div className="overflow-hidden border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2 text-[11px] text-ink-3">
        <span className="font-mono">train.py</span>
        <span className="font-mono">python</span>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[12px] leading-[1.7] text-ink">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-4">
            <span className="w-5 select-none text-right text-ink-3">{i + 1}</span>
            <span>{line || " "}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
