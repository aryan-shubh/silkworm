interface FaqItem {
  question: string;
  answer: string;
}

const ITEMS: FaqItem[] = [
  {
    question: "How is this different from W&B, Comet, or MLflow?",
    answer:
      "Silkworm is a drop-in replacement for wandb.log() — same mental model, no proprietary lock-in. The ingest path is a single Postgres table with no intermediary services, so latency is lower and storage costs are yours to control. We deliberately omit the features that bloat bigger platforms (sweeps-as-a-service, registry marketplace) and focus on logging, charts, and comparison.",
  },
  {
    question: "What gets logged automatically?",
    answer:
      "The Python client auto-captures GPU utilization, CPU and RAM usage, gradient norms (when using PyTorch autograd hooks), and the learning rate schedule. Anything else — loss values, eval metrics, custom scalars — you pass to run.log() explicitly.",
  },
  {
    question:
      "Does it work with PyTorch Lightning, Hugging Face Trainer, or JAX?",
    answer:
      "Yes. There is a one-line HuggingFace Trainer callback and a Lightning logger class. JAX users can call run.log() directly in their training loop — no framework adapter needed.",
  },
  {
    question: "Can I self-host?",
    answer:
      "Self-hosting is on the roadmap. The data model is a small Postgres schema and the server is a standard Next.js app — it is designed to deploy to any Postgres-backed host. Follow the changelog for release updates.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Free while in early access. Paid tiers (per-seat or usage-based storage) will be announced before GA. Teams already using the product will be grandfathered at a discounted rate.",
  },
  {
    question: "What about hyperparameter sweeps?",
    answer:
      "Silkworm tracks the runs your sweep produces — whatever orchestration tool you use (Optuna, Ray Tune, Ax, plain grid search). Native sweep scheduling is not currently in scope; the comparison and overlay views are built precisely to analyse sweep results after the fact.",
  },
  {
    question: "Is there an open-source version?",
    answer:
      "The core schema and Python client are MIT-licensed and available on GitHub. The hosted dashboard is source-available under a BSL-style license that converts to MIT after three years.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-b border-line">
      <div className="mx-auto max-w-[1200px] px-8 py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">
          FAQ
        </p>
        <h2 className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-ink">
          Common questions.
        </h2>
        <div className="mt-10 divide-y divide-line">
          {ITEMS.map((item) => (
            <details
              key={item.question}
              className="group py-5 [&[open]>summary>span]:rotate-45"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                <span className="text-[15px] font-medium text-ink">
                  {item.question}
                </span>
                <span
                  className="mt-0.5 shrink-0 text-[20px] leading-none text-ink-3 transition-transform duration-200"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-[64ch] text-[14px] leading-relaxed text-ink-2">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
