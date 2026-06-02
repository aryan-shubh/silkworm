import { ARTIFACTS } from "../workspace-mock";
import type { MockArtifact } from "../workspace-mock";

export type Artifact = MockArtifact;

export async function listArtifactsForProject(
  _orgId: string,
  projectSlug?: string,
): Promise<Artifact[]> {
  if (!projectSlug) return ARTIFACTS;
  return ARTIFACTS.filter((a) => a.projectSlug === projectSlug);
}

export async function listArtifactsForRun(runId: string): Promise<Artifact[]> {
  return ARTIFACTS.filter((a) => a.sourceRunId === runId);
}
