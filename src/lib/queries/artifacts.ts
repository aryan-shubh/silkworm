import { desc, eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { artifacts, projects, runs } from "../schema";

export type Artifact = {
  id: string;
  projectSlug: string;
  name: string;
  type: "model" | "dataset" | "code" | "result";
  latestVersion: number;
  versionCount: number;
  sizeBytes: number;
  sha256: string;
  sourceRunId: string;
  sourceRunName: string;
  createdAt: string;
  downloads: number;
};

async function shape(
  rows: Array<{
    id: string;
    name: string;
    type: Artifact["type"];
    version: number;
    sizeBytes: number;
    sha256: string;
    runId: string | null;
    sourceRunName: string | null;
    metadata: unknown;
    createdAt: Date;
    projectSlug: string;
  }>,
): Promise<Artifact[]> {
  return rows.map((r) => {
    const meta = (r.metadata ?? {}) as {
      downloads?: number;
      sourceRunName?: string;
    };
    return {
      id: r.id,
      projectSlug: r.projectSlug,
      name: r.name,
      type: r.type,
      latestVersion: r.version,
      versionCount: r.version, // schema doesn't track multi-version separately yet
      sizeBytes: r.sizeBytes,
      sha256: `0x${r.sha256.slice(0, 8)}…`,
      sourceRunId: r.runId ?? "",
      sourceRunName: meta.sourceRunName ?? r.sourceRunName ?? "—",
      createdAt: r.createdAt.toISOString(),
      downloads: meta.downloads ?? 0,
    };
  });
}

export async function listArtifactsForProject(
  orgId: string,
  projectSlug?: string,
): Promise<Artifact[]> {
  const db = getDb();
  const base = db
    .select({
      id: artifacts.id,
      name: artifacts.name,
      type: artifacts.type,
      version: artifacts.version,
      sizeBytes: artifacts.sizeBytes,
      sha256: artifacts.sha256,
      runId: artifacts.runId,
      sourceRunName: runs.displayName,
      metadata: artifacts.metadata,
      createdAt: artifacts.createdAt,
      projectSlug: projects.slug,
    })
    .from(artifacts)
    .innerJoin(projects, eq(artifacts.projectId, projects.id))
    .leftJoin(runs, eq(artifacts.runId, runs.id))
    .orderBy(desc(artifacts.createdAt));

  const rows = projectSlug
    ? await base.where(
        and(eq(projects.orgId, orgId), eq(projects.slug, projectSlug)),
      )
    : await base.where(eq(projects.orgId, orgId));

  return shape(rows);
}

export async function listArtifactsForRun(runId: string): Promise<Artifact[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: artifacts.id,
      name: artifacts.name,
      type: artifacts.type,
      version: artifacts.version,
      sizeBytes: artifacts.sizeBytes,
      sha256: artifacts.sha256,
      runId: artifacts.runId,
      sourceRunName: runs.displayName,
      metadata: artifacts.metadata,
      createdAt: artifacts.createdAt,
      projectSlug: projects.slug,
    })
    .from(artifacts)
    .innerJoin(projects, eq(artifacts.projectId, projects.id))
    .leftJoin(runs, eq(artifacts.runId, runs.id))
    .where(eq(artifacts.runId, runId))
    .orderBy(desc(artifacts.createdAt));
  return shape(rows);
}
