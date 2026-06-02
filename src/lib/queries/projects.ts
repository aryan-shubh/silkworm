import { PROJECTS, getProject } from "../mock";
import type { MockProject } from "../mock";

export type Project = MockProject;

export async function listProjects(_orgId: string): Promise<Project[]> {
  // Phase A: orgId ignored, mock returns the canonical 7 projects.
  return PROJECTS;
}

export async function getProjectBySlug(
  _orgId: string,
  slug: string,
): Promise<Project | null> {
  return getProject(slug);
}
