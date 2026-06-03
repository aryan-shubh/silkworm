/**
 * Deterministic mock data so SSR + client render the same thing.
 * Most projects/runs are synthetic — the one exception is `mnist-mlp /
 * demo-run-1`, which is real metrics captured by `_training/train.py`.
 */

import { DEMO_RUN, DEMO_SUMMARY } from "./demo-run";

type Status = "running" | "finished" | "failed" | "crashed" | "queued";

export type MockProject = {
  id: string;
  slug: string;
  name: string;
  description: string;
  framework: string;
  runCount: number;
  activeCount: number;
  updated: string;
};

export type MockRun = {
  id: string;
  projectSlug: string;
  name: string;
  user: string;
  status: Status;
  group: string | null;
  startedAt: string;
  durationS: number;
  tags: string[];
  config: Record<string, string | number | boolean>;
  summary: {
    train_loss: number;
    val_loss: number;
    accuracy: number;
    lr: number;
  };
  metrics: { name: string; data: number[] }[];
  arch: string;
  gpu: string;
};

// LCG for deterministic pseudo-random
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const ADJ = [
  "wise",
  "brisk",
  "amber",
  "velvet",
  "iron",
  "feral",
  "lucent",
  "noble",
  "tidal",
  "spiral",
  "obsidian",
  "cobalt",
  "muted",
  "hollow",
  "ember",
  "stoic",
  "fern",
  "slate",
  "lyric",
  "crisp",
  "vapor",
  "azure",
  "ashen",
  "thorn",
  "polar",
  "midnight",
  "saffron",
  "umbra",
  "candle",
];
const NOUN = [
  "sweep",
  "yak",
  "comet",
  "drift",
  "fern",
  "owl",
  "kite",
  "harbor",
  "lichen",
  "magnet",
  "ridge",
  "orbit",
  "ember",
  "fjord",
  "hare",
  "spruce",
  "willow",
  "totem",
  "delta",
  "thicket",
  "amber",
  "knot",
  "tundra",
  "cinder",
  "moth",
  "vellum",
  "quarry",
];

// FIX 3: Per-project arch pools — avoids cross-domain arch contamination.
const ARCH_BY_PROJECT: Record<string, string[]> = {
  "viscount-lm":      ["transformer-1.4B", "transformer-3B-moe", "mamba-2.8b"],
  "retina-seg":       ["unet++", "unet-attn", "swin-unet"],
  "halcyon-rl":       ["iql-mlp", "sac-mlp", "ppo-cnn"],
  "obsidian-diffusion": ["dit-xl-512", "dit-l-256", "u-vit-h-512"],
  "thrush-asr":       ["conformer-m", "conformer-l", "whisper-small"],
  "ledger-forecast":  ["patchtst-base", "patchtst-large", "tide-base"],
  "mnist-mlp":        ["mlp-256-128"],
};

// Fallback pool for unmatched project slugs.
const ARCHS = [
  "transformer-1.4B",
  "unet++",
  "iql-mlp",
  "conformer-m",
  "dit-xl-512",
  "patchtst-base",
];

const GPUS = [
  "8× H100 SXM",
  "4× A100 80G",
  "1× H100 PCIe",
  "16× H100 SXM",
  "2× L40S",
];

// FIX 5: Per-project sweep slugs from SWEEPS fixture.
// Projects with no sweeps get null (runs won't be grouped).
const SWEEPS_BY_PROJECT: Record<string, string[]> = {
  "viscount-lm":      ["viscount-lr-bayes"],
  "retina-seg":       ["retina-aug-grid"],
  "halcyon-rl":       ["halcyon-policy-bayes"],
  "thrush-asr":       ["thrush-vocab-random"],
  "obsidian-diffusion": ["obsidian-cfg-hyperband"],
};

export const PROJECTS: MockProject[] = [
  {
    id: "p_demo",
    slug: "mnist-mlp",
    name: "MNIST-MLP",
    description: `Real MLP trained on MNIST · ${DEMO_SUMMARY.epochs} epochs, ${DEMO_SUMMARY.optimizer}, lr=${DEMO_SUMMARY.lr}`,
    framework: "pytorch",
    runCount: 1,
    activeCount: DEMO_RUN.status === "running" ? 1 : 0,
    updated: DEMO_RUN.startedAt,
  },
  {
    id: "p_01",
    slug: "viscount-lm",
    name: "Viscount-LM",
    description: "1.4B param decoder-only, FineWeb-edu pretraining",
    framework: "pytorch",
    runCount: 247,
    activeCount: 6,
    updated: "2026-06-03T09:14:00Z",
  },
  {
    id: "p_02",
    slug: "retina-seg",
    name: "Retina-Seg",
    description: "OCT layer segmentation, U-Net++ with attention",
    framework: "pytorch-lightning",
    runCount: 89,
    activeCount: 1,
    updated: "2026-06-02T22:01:00Z",
  },
  {
    id: "p_03",
    slug: "halcyon-rl",
    name: "Halcyon-RL",
    description: "Offline RL for robotic grasping, IQL baseline",
    framework: "jax",
    runCount: 412,
    activeCount: 3,
    updated: "2026-06-03T07:46:00Z",
  },
  {
    id: "p_04",
    slug: "thrush-asr",
    name: "Thrush-ASR",
    description: "Streaming Conformer ASR, 8 languages",
    framework: "pytorch",
    runCount: 156,
    activeCount: 0,
    updated: "2026-05-31T15:32:00Z",
  },
  {
    id: "p_05",
    slug: "obsidian-diffusion",
    name: "Obsidian-Diffusion",
    description: "Flow-matching text-to-image, 512px",
    framework: "pytorch",
    runCount: 74,
    activeCount: 2,
    updated: "2026-06-03T10:02:00Z",
  },
  {
    id: "p_06",
    slug: "ledger-forecast",
    name: "Ledger-Forecast",
    description: "Timeseries foundation model fine-tuning",
    framework: "pytorch",
    runCount: 31,
    activeCount: 0,
    updated: "2026-05-28T09:00:00Z",
  },
];

const TAGS_POOL = [
  "baseline",
  "ablation",
  "lr-search",
  "long-ctx",
  "muon",
  "warm-start",
  "fp8",
  "tp2",
  "ema",
  "schedfree",
];

// FIX 1: Extract the loss curve generator so val_loss is derived from train_loss.
function synthLoss(r: () => number, len: number): number[] {
  const out: number[] = [];
  let v = 3.2 + r() * 0.6;
  for (let i = 0; i < len; i++) {
    v *= 0.992 + r() * 0.004;
    out.push(Math.max(0.3, v + (r() - 0.5) * 0.06));
  }
  return out;
}

export function runsForProject(slug: string, count = 60): MockRun[] {
  // The mnist-mlp project shows the real demo run only.
  if (slug === "mnist-mlp") return [DEMO_RUN];

  const r = rng(slug.split("").reduce((a, c) => a + c.charCodeAt(0), 7));
  const archPool = ARCH_BY_PROJECT[slug] ?? ARCHS;
  const sweepSlugs = SWEEPS_BY_PROJECT[slug] ?? null;
  const out: MockRun[] = [];

  // FIX 4: Generate 2-4 short smoke-test runs per project.
  const smokeCount = 2 + Math.floor(r() * 3);
  for (let si = 0; si < smokeCount; si++) {
    // Advance RNG to keep sequence consistent with the main loop's name generation.
    void ADJ[Math.floor(r() * ADJ.length)];
    void NOUN[Math.floor(r() * NOUN.length)];
    void Math.floor(r() * 999);
    const smokeStatusRoll = r();
    const smokeStatus: Status =
      smokeStatusRoll < 0.7 ? "finished" : smokeStatusRoll < 0.85 ? "failed" : "crashed";
    const smokeDurationS = Math.floor(30 + r() * 210);
    const smokeLr = [3e-4, 1e-4, 5e-4, 6e-5, 2e-4][Math.floor(r() * 5)];
    const smokeBs = [128, 256, 512, 1024, 2048][Math.floor(r() * 5)];
    const smokeOptimizer = ["adamw", "muon", "schedule-free", "lion"][Math.floor(r() * 4)];
    const smokeTotalSteps = 50;
    const smokeStartedAt = new Date(
      Date.now() - (si + 1) * 1000 * 60 * (1 + r() * 10),
    ).toISOString();
    const smokeTrainLoss = synthLoss(r, 50);
    const smokeValLoss = smokeTrainLoss.map((v) => {
      const gap = 0.05 + r() * 0.15;
      const jitter = (r() - 0.5) * 0.04;
      return v + gap + jitter;
    });
    const smokeSummaryTrain = smokeTrainLoss[smokeTrainLoss.length - 1] ?? 2.0;
    const smokeSummaryVal = smokeValLoss[smokeValLoss.length - 1] ?? 2.1;
    const smokeMetrics = [
      { name: "train_loss", data: smokeTrainLoss },
      { name: "val_loss", data: smokeValLoss },
      { name: "accuracy", data: synthSeries(r, "accuracy", 50) },
      { name: "grad_norm", data: synthSeries(r, "grad_norm", 50) },
      { name: "lr", data: synthLrSeries(smokeLr, 50, smokeTotalSteps) },
      { name: "gpu_util", data: synthSeries(r, "gpu_util", 50) },
    ];
    out.push({
      id: `r_${slug}_smoke_${si.toString().padStart(2, "0")}`,
      projectSlug: slug,
      name: `smoke-${slug}-${si + 1}`,
      user: ["aryan", "kai", "nori", "siva", "fenwick"][Math.floor(r() * 5)],
      status: smokeStatus,
      group: null,
      startedAt: smokeStartedAt,
      durationS: smokeDurationS,
      tags: Array.from(
        new Set([
          "smoke-test",
          ...Array.from({ length: Math.floor(r() * 2) }, () =>
            TAGS_POOL[Math.floor(r() * TAGS_POOL.length)],
          ),
        ]),
      ),
      config: {
        lr: smokeLr,
        batch_size: smokeBs,
        optimizer: smokeOptimizer,
        seed: Math.floor(r() * 9999),
        max_steps: 50,
        smoke_test: true,
        total_steps: smokeTotalSteps,
        epochs: 1,
        log_every_n_steps: 5,
        warmup_steps: Math.floor(smokeTotalSteps * (0.02 + r() * 0.06)),
        weight_decay: 0.1,
      },
      summary: { train_loss: smokeSummaryTrain, val_loss: smokeSummaryVal, accuracy: 0.1, lr: smokeLr },
      metrics: smokeMetrics,
      arch: archPool[Math.floor(r() * archPool.length)],
      gpu: GPUS[Math.floor(r() * GPUS.length)],
    });
  }

  // Main run loop.
  for (let i = 0; i < count; i++) {
    const a = ADJ[Math.floor(r() * ADJ.length)];
    const n = NOUN[Math.floor(r() * NOUN.length)];
    const num = Math.floor(r() * 999);
    const name = `${a}-${n}-${num}`;
    const statusRoll = r();
    const status: Status =
      statusRoll < 0.08
        ? "running"
        : statusRoll < 0.14
          ? "failed"
          : statusRoll < 0.16
            ? "crashed"
            : statusRoll < 0.18
              ? "queued"
              : "finished";

    // FIX 6: Add total_steps and epochs to config; proportional warmup.
    const lr = [3e-4, 1e-4, 5e-4, 6e-5, 2e-4][Math.floor(r() * 5)];
    const bs = [128, 256, 512, 1024, 2048][Math.floor(r() * 5)];
    const optimizer = ["adamw", "muon", "schedule-free", "lion"][Math.floor(r() * 4)];
    const totalSteps = 1000 + Math.floor(r() * 19000);
    const epochs = 1 + Math.floor(r() * 9);
    const warmupSteps = Math.floor(totalSteps * (0.02 + r() * 0.06));

    const baseLoss = 2.6 - i * 0.018 + (r() - 0.5) * 0.35;
    const train_loss_summary = Math.max(0.32, baseLoss + (r() - 0.5) * 0.2);
    const val_loss_summary = train_loss_summary + 0.04 + r() * 0.18;
    const accuracy = Math.min(0.998, 0.42 + i * 0.0065 + (r() - 0.5) * 0.05);
    const durationS = Math.floor(440 + r() * 60 * 60 * 12);
    const startedAt = new Date(
      Date.now() - (i + 1) * 1000 * 60 * (5 + r() * 80),
    ).toISOString();
    const tags = Array.from(
      new Set(
        Array.from(
          { length: Math.floor(r() * 3) + 1 },
          () => TAGS_POOL[Math.floor(r() * TAGS_POOL.length)],
        ),
      ),
    );

    // FIX 1: val_loss derived from train_loss series.
    const trainLossSeries = synthLoss(r, 200);
    const valLossSeries = trainLossSeries.map((v, i) => {
      const gap = 0.05 + r() * 0.15;
      const jitter = (r() - 0.5) * 0.04;
      const overfit = i > 140 && r() < 0.2 ? (i - 140) * 0.002 : 0;
      return v + gap + jitter + overfit;
    });

    // FIX 2: LR series uses run's config.lr as peak.
    const lrSeries = synthLrSeries(lr, 200, totalSteps);

    const metrics = [
      { name: "train_loss", data: trainLossSeries },
      { name: "val_loss", data: valLossSeries },
      { name: "accuracy", data: synthSeries(r, "accuracy", 200) },
      { name: "grad_norm", data: synthSeries(r, "grad_norm", 200) },
      { name: "lr", data: lrSeries },
      { name: "gpu_util", data: synthSeries(r, "gpu_util", 200) },
    ];

    // FIX 5: Group from project-scoped sweep slugs, not "sweep-N".
    const groupRoll = r();
    let group: string | null = null;
    if (sweepSlugs && sweepSlugs.length > 0 && groupRoll > 0.6) {
      group = sweepSlugs[Math.floor(r() * sweepSlugs.length)];
    } else if (sweepSlugs && sweepSlugs.length > 0) {
      // roll used but not grouped — consume sweep-index roll for sequence stability
      r();
    }

    out.push({
      id: `r_${slug}_${i.toString().padStart(4, "0")}`,
      projectSlug: slug,
      name,
      user: ["aryan", "kai", "nori", "siva", "fenwick"][Math.floor(r() * 5)],
      status,
      group,
      startedAt,
      durationS,
      tags,
      config: {
        lr,
        batch_size: bs,
        optimizer,
        seed: Math.floor(r() * 9999),
        total_steps: totalSteps,
        epochs,
        log_every_n_steps: 5,
        warmup_steps: warmupSteps,
        weight_decay: 0.1,
      },
      summary: { train_loss: train_loss_summary, val_loss: val_loss_summary, accuracy, lr },
      metrics,
      arch: archPool[Math.floor(r() * archPool.length)],
      gpu: GPUS[Math.floor(r() * GPUS.length)],
    });
  }
  return out;
}

// FIX 2: LR series generator that uses run's peakLr instead of hardcoded 3e-4.
function synthLrSeries(peakLr: number, len: number, totalSteps: number): number[] {
  const warmupFraction = Math.min(20, Math.floor(totalSteps * 0.05));
  return Array.from({ length: len }, (_, i) => {
    const warm = Math.min(1, i / Math.max(1, warmupFraction));
    const decay = Math.cos((Math.PI / 2) * (i / len)) ** 2;
    return peakLr * warm * decay;
  });
}

function synthSeries(r: () => number, kind: string, len: number): number[] {
  const out: number[] = [];
  if (kind === "accuracy") {
    let v = 0.34 + r() * 0.1;
    for (let i = 0; i < len; i++) {
      v += (0.992 - v) * 0.012 + (r() - 0.5) * 0.01;
      out.push(Math.min(0.998, Math.max(0, v)));
    }
  } else if (kind === "grad_norm") {
    // FIX 7: Early spike decaying to steady baseline.
    for (let i = 0; i < len; i++) {
      const earlySpike = Math.exp(-i / 20) * (4 + r() * 3);
      const steady = 0.8 + Math.sin(i / 13) * 0.15;
      const noise = (r() - 0.5) * 0.2;
      out.push(earlySpike + steady + noise);
    }
  } else {
    // gpu_util
    for (let i = 0; i < len; i++)
      out.push(78 + Math.sin(i / 7) * 8 + (r() - 0.5) * 12);
  }
  return out;
}

export function getProject(slug: string) {
  return PROJECTS.find((p) => p.slug === slug) ?? null;
}
export function getRun(slug: string, runId: string) {
  const r = runsForProject(slug, 120).find((x) => x.id === runId);
  return r ?? null;
}

export const CURRENT_USER = {
  name: "Aryan",
  email: "pahwani.aryan@gmail.com",
  initials: "AP",
};
export const CURRENT_ORG = { slug: "anthrop-labs", name: "Anthrop Labs" };
