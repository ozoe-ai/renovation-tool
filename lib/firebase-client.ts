import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  inMemoryPersistence,
  initializeAuth,
  updateCurrentUser,
  indexedDBLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
  type Unsubscribe,
  type User,
} from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  return getApps()[0] ?? initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    return initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch (error) {
    if (getAuthErrorCode(error) === "auth/already-initialized") return getAuth(app);
    throw error;
  }
}

let firestore: Firestore | null = null;
export function getFirestoreDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app || typeof window === "undefined") return null;
  firestore ??= initializeFirestore(app, {
    // Optional estimate fields (e.g. an unentered totalAreaSqm) are not values.
    // Keep valid fields unchanged and omit undefined properties during writes.
    ignoreUndefinedProperties: true,
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  return firestore;
}

export async function getCurrentFirebaseUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  await auth.authStateReady();
  return auth.currentUser?.isAnonymous ? null : auth.currentUser;
}

export function onFirebaseUserChanged(callback: (user: User | null) => void, onError?: (error: unknown) => void): Unsubscribe {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  let active = true;
  const stop = onAuthStateChanged(auth, callback, error => { if (active) onError?.(error); });
  void auth.authStateReady().catch(error => { if (active) onError?.(error); });
  return () => { active = false; stop(); };
}

function getAuthErrorCode(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return "";
  return typeof error.code === "string" && /^auth\/[a-z0-9-]+$/.test(error.code) ? error.code : "";
}

function isStorageError(error: unknown): boolean {
  if (getAuthErrorCode(error) === "auth/web-storage-unsupported") return true;
  if (typeof error !== "object" || error === null || !("name" in error)) return false;
  return ["QuotaExceededError", "SecurityError", "InvalidStateError", "NotAllowedError", "AbortError", "UnknownError"].includes(String(error.name));
}

export function describeAuthError(error: unknown): string {
  const code = getAuthErrorCode(error) || (isStorageError(error) ? "auth/storage-failed" : "auth/unexpected-error");
  let message: string;
  switch (code) {
    case "auth/storage-failed":
    case "auth/persistence-unavailable":
    case "auth/web-storage-unsupported": message = "ログイン状態の保存に失敗しました。通常のブラウザで開いて再試行してください。"; break;
    case "auth/configuration-missing":
    case "auth/invalid-api-key":
    case "auth/app-not-authorized":
    case "auth/unauthorized-domain":
    case "auth/operation-not-allowed": message = "認証設定を確認できません。管理者へお問い合わせください。"; break;
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email": message = "メールアドレスまたはパスワードを確認して再試行してください。"; break;
    case "auth/network-request-failed": message = "認証サーバーに接続できません。通信状態を確認して再試行してください。"; break;
    case "auth/too-many-requests": message = "試行回数が多いため一時的に制限されています。時間をおいて再試行してください。"; break;
    case "auth/user-disabled": message = "このアカウントは無効です。管理者へお問い合わせください。"; break;
    default: message = "認証処理に失敗しました。再試行し、改善しない場合は管理者へ連絡してください。";
  }
  return message + "（" + code + "）";
}

export async function signInWithGoogle(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) throw Object.assign(new Error("Firebase設定がありません。"), { code: "auth/configuration-missing" });
  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInWithPopup(auth, new GoogleAuthProvider());
  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) throw Object.assign(new Error("Firebase設定がありません。"), { code: "auth/configuration-missing" });
  const previousUser = auth.currentUser;
  try {
    return (await signInWithEmailAndPassword(auth, email, password)).user;
  } catch (error) {
    // The SDK assigns currentUser before writing it to persistence.
    // Recover only a newly authenticated user and never retry credentials.
    const user = auth.currentUser;
    if (!isStorageError(error) || !user || user === previousUser) throw error;
    await setPersistence(auth, inMemoryPersistence);
    await updateCurrentUser(auth, user);
    return user;
  }
}

export async function createAccountWithEmail(email: string, password: string): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) throw Object.assign(new Error("Firebase設定がありません。"), { code: "auth/configuration-missing" });
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signOutFromFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}
