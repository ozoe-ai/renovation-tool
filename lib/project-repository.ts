import { collection, doc, onSnapshot, runTransaction, type Unsubscribe } from "firebase/firestore";
import { getCurrentFirebaseUser, getFirestoreDb } from "./firebase-client";
import type { SavedEstimateProject, StaffMember } from "./types";
import type { PendingProject } from "./shared-project-cache";

export function watchMembership(uid: string, next: (member: StaffMember | null, cached: boolean) => void, error: (error: Error) => void): Unsubscribe {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firebase設定がありません。");
  return onSnapshot(doc(db, "staff_members", uid), { includeMetadataChanges: true }, (snapshot) => {
    next(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as StaffMember : null, snapshot.metadata.fromCache);
  }, error);
}

export function watchSharedProjects(next: (projects: SavedEstimateProject[], cached: boolean) => void, error: (error: Error) => void): Unsubscribe {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firebase設定がありません。");
  return onSnapshot(collection(db, "estimate_projects"), { includeMetadataChanges: true }, (snapshot) => {
    next(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as SavedEstimateProject), snapshot.metadata.fromCache);
  }, error);
}

export function watchStaff(next: (staff: StaffMember[]) => void, error: (error: Error) => void): Unsubscribe {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firebase設定がありません。");
  return onSnapshot(collection(db, "staff_members"), (snapshot) => {
    next(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as StaffMember));
  }, error);
}

export async function saveSharedProject(uid: string, pending: PendingProject): Promise<SavedEstimateProject> {
  const db = getFirestoreDb();
  const user = await getCurrentFirebaseUser();
  if (!db || user?.uid !== uid) throw new Error("ログイン状態が変わりました。再度ログインしてください。");
  const ref = doc(db, "estimate_projects", pending.project.id);
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const existing = snapshot.exists() ? snapshot.data() as SavedEstimateProject : null;
    // A prior successful upload may have lost its acknowledgement during a disconnect.
    if (existing?.clientSaveId && existing.clientSaveId === pending.project.clientSaveId) return existing;
    if ((existing?.updatedAt ?? null) !== pending.baseUpdatedAt) {
      throw new Error("他の端末で更新されています。未同期の内容を確認し、共有版を開き直してください。");
    }
    const project = {
      ...existing,
      ...pending.project,
      ownerId: existing?.ownerId ?? uid,
      createdAt: existing?.createdAt ?? pending.project.createdAt,
    };
    transaction.set(ref, project);
    return project;
  });
}
