import { cached } from "./cache";
import * as runs from "./queries/runs";
import * as projects from "./queries/projects";
import * as workspace from "./queries/workspace";

// ── Cached wrappers ──────────────────────────────────────────────────────────
// These override the raw query functions for read paths that benefit from
// short-lived Redis caching. When Redis is absent, `cached` passes through
// directly to the fetcher — no behaviour change.

export const listRunsForProject = (
  projectSlug: string,
  opts?: { limit?: number },
) =>
  cached(`runs:list:${projectSlug}:${opts?.limit ?? 80}`, 30, () =>
    runs.listRunsForProject(projectSlug, opts),
  );

export const getRunById = (projectSlug: string, runId: string) =>
  cached(`runs:byId:${projectSlug}:${runId}`, 60, () =>
    runs.getRunById(projectSlug, runId),
  );

export const getRunMetrics = (runId: string, metricName: string) =>
  cached(`runs:metrics:${runId}:${metricName}`, 60, () =>
    runs.getRunMetrics(runId, metricName),
  );

export const listProjects = (orgId: string) =>
  cached(`projects:list:${orgId}`, 30, () => projects.listProjects(orgId));

export const getProjectBySlug = (orgId: string, slug: string) =>
  cached(`projects:bySlug:${orgId}:${slug}`, 60, () =>
    projects.getProjectBySlug(orgId, slug),
  );

export const getCurrentOrg = () =>
  cached(`workspace:currentOrg`, 60, () => workspace.getCurrentOrg());

export const getCurrentUser = () =>
  cached(`workspace:currentUser`, 60, () => workspace.getCurrentUser());

// ── Non-cached pass-throughs ─────────────────────────────────────────────────
// Explicitly re-exported so callers have a single import surface.
// Wildcard re-exports are avoided here to prevent name collisions with the
// wrapped functions above.

// From queries/runs
export type { Run } from "./queries/runs";

// From queries/projects
export type { Project } from "./queries/projects";

// From queries/workspace
export {
  listSweeps,
  listAlertRules,
  listAlertEvents,
  getWorkspaceSummary,
} from "./queries/workspace";
export type {
  Sweep,
  AlertRule,
  AlertEvent,
  CurrentUser,
  CurrentOrg,
  WorkspaceSummary,
} from "./queries/workspace";

// From queries/artifacts
export {
  listArtifactsForProject,
  listArtifactsForRun,
} from "./queries/artifacts";
export type { Artifact } from "./queries/artifacts";

// From demo-ids (consumed by live-demo.tsx and overlay-demo.tsx)
export { ACME_DEMO_ORG_ID, DEMO_RUN_ID } from "./demo-ids";
