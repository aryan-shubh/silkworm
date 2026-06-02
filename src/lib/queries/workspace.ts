import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { orgs, users, projects, runs } from "../schema";

export type Sweep = {
  id: string;
  slug: string;
  projectSlug: string;
  name: string;
  method: "bayes" | "grid" | "random" | "hyperband";
  status: "running" | "finished" | "queued" | "paused";
  trialsRun: number;
  trialsTotal: number;
  activeWorkers: number;
  startedAt: string;
  bestMetricName: string;
  bestMetricValue: number;
  bestRunName: string;
  bestRunId: string;
  bestSoFar: number[];
  bestConfig: Record<string, string | number>;
  objective: "min" | "max";
};

export type AlertRule = {
  id: string;
  name: string;
  description: string;
  scope: "global" | string;
  metric: string;
  condition: string;
  severity: "info" | "warn" | "critical";
  channels: ("email" | "slack" | "pagerduty" | "webhook")[];
  enabled: boolean;
  triggeredCount: number;
  lastTriggered: string | null;
  createdBy: string;
};

export type AlertEvent = {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: "info" | "warn" | "critical";
  projectSlug: string;
  runName: string;
  runId: string;
  message: string;
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedBy: string | null;
};

export type CurrentUser = {
  name: string;
  email: string;
  initials: string;
};

export type CurrentOrg = {
  slug: string;
  name: string;
};

export async function listSweeps(_orgId: string): Promise<Sweep[]> {
  // No sweeps table yet — Phase 3 work. Empty for now.
  return [];
}

export async function listAlertRules(_orgId: string): Promise<AlertRule[]> {
  // No alert_rules table yet — Phase 3 work.
  return [];
}

export async function listAlertEvents(_orgId: string): Promise<AlertEvent[]> {
  return [];
}

export async function getCurrentUser(): Promise<CurrentUser> {
  // Until Better Auth is wired, return the single seeded user.
  const db = getDb();
  const [u] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .limit(1);
  const name = u?.name ?? "Aryan";
  const email = u?.email ?? "pahwani.aryan@gmail.com";
  return {
    name,
    email,
    initials: name
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };
}

export async function getCurrentOrg(): Promise<CurrentOrg> {
  const db = getDb();
  const [o] = await db.select({ slug: orgs.slug, name: orgs.name }).from(orgs).limit(1);
  return { slug: o?.slug ?? "anthrop-labs", name: o?.name ?? "Anthrop Labs" };
}

export type WorkspaceSummary = {
  projectCount: number;
  runningCount: number;
  activeAlerts: number;
  recentArtifactCount: number;
};

export async function getWorkspaceSummary(
  orgId: string,
): Promise<WorkspaceSummary> {
  const db = getDb();
  const ps = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.orgId, orgId));
  let runningCount = 0;
  for (const p of ps) {
    const rs = await db
      .select({ status: runs.status })
      .from(runs)
      .where(eq(runs.projectId, p.id));
    runningCount += rs.filter((r) => r.status === "running").length;
  }
  return {
    projectCount: ps.length,
    runningCount,
    activeAlerts: 0,
    recentArtifactCount: 0,
  };
}
