import {
  collection,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { getCurrentFirebaseUser, getFirestoreDb, isFirebaseConfigured } from "./firebase-client";
import { SavedEstimateProject } from "./types";
import * as localStore from "./store";

const USERS_COLLECTION = "users";
const PROJECTS_COLLECTION = "estimate_projects";

function sortByUpdatedAt(projects: SavedEstimateProject[]) {
  return [...projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function canUseFirestore(): boolean {
  return isFirebaseConfigured();
}

export async function loadProjects(): Promise<SavedEstimateProject[]> {
  if (!canUseFirestore()) return localStore.loadProjects();

  const db = getFirestoreDb();
  const user = await getCurrentFirebaseUser();
  if (!db || !user) return localStore.loadProjects();

  const snapshot = await getDocs(collection(db, USERS_COLLECTION, user.uid, PROJECTS_COLLECTION));

  return sortByUpdatedAt(snapshot.docs.map((item) => {
    return item.data() as SavedEstimateProject;
  }));
}

export async function saveProject(project: SavedEstimateProject): Promise<void> {
  localStore.saveProjects(localStore.upsertProject(localStore.loadProjects(), project));

  if (!canUseFirestore()) return;

  const db = getFirestoreDb();
  const user = await getCurrentFirebaseUser();
  if (!db || !user) return;

  await setDoc(doc(db, USERS_COLLECTION, user.uid, PROJECTS_COLLECTION, project.id), project);
}

export async function syncLocalProjectsToFirestore(projects: SavedEstimateProject[]): Promise<void> {
  if (!canUseFirestore() || projects.length === 0) return;

  await Promise.all(projects.map((project) => saveProject(project)));
}

export function mergeProjects(
  remoteProjects: SavedEstimateProject[],
  localProjects: SavedEstimateProject[]
): SavedEstimateProject[] {
  const byId = new Map<string, SavedEstimateProject>();
  for (const project of [...localProjects, ...remoteProjects]) {
    const existing = byId.get(project.id);
    if (!existing || new Date(project.updatedAt) > new Date(existing.updatedAt)) {
      byId.set(project.id, project);
    }
  }
  return sortByUpdatedAt(Array.from(byId.values()));
}
