import type { AppState, SavedEstimateProject, StaffMember } from "./types";

export interface PendingProject {
  project: SavedEstimateProject;
  baseUpdatedAt: string | null;
}
export interface SharedCache {
  projects: SavedEstimateProject[];
  staff: StaffMember[];
  pending: Record<string, PendingProject>;
  draft: AppState | null;
  draftBaseUpdatedAt?: string | null;
}
const empty = (): SharedCache => ({ projects: [], staff: [], pending: {}, draft: null });
const key = (uid: string) => `estimate_shared_v1:${uid}`;

// Legacy anonymous/personal projects are deliberately not imported into shared data.
export function readSharedCache(uid: string): SharedCache {
  try {
    const raw = localStorage.getItem(key(uid));
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch {
    return empty();
  }
}
export function writeSharedCache(uid: string, cache: SharedCache): void {
  // Propagate quota/private-mode failures rather than claiming a durable offline save.
  localStorage.setItem(key(uid), JSON.stringify(cache));
}
export function overlayPending(cache: SharedCache): SavedEstimateProject[] {
  const projects = new Map(cache.projects.map((p) => [p.id, p]));
  Object.values(cache.pending).forEach(({ project }) => projects.set(project.id, project));
  return [...projects.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
