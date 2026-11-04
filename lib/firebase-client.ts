import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  browserLocalPersistence,
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
  return app ? getAuth(app) : null;
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

// Keep durable sessions; never silently fall back to an in-memory login.
async function prepareEmailPersistence(auth: Auth): Promise<void> {
  try {
    // setPersistence alone does not test writing when there is no current user.
    const key = `auth-storage-probe:${Date.now()}:${Math.random()}`;
    try {
      window.localStorage.setItem(key, key);
      if (window.localStorage.getItem(key) !== key) throw new Error("Storage write failed");
    } finally {
      window.localStorage.removeItem(key);
    }
    await setPersistence(auth, browserLocalPersistence);
  } catch {
    try {
      await setPersistence(auth, indexedDBLocalPersistence);
    } catch {
      throw Object.assign(new Error("ログイン状態を端末に保存できません。空き容量を確認し、同じサイトの他のタブを閉じて再試行してください。改善しない場合は管理者へ連絡してください。ブラウザのデータは削除しないでください。"), { code: "auth/persistence-unavailable" });
    }
  }
}

export function describeAuthError(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  switch (code) {
    case "auth/persistence-unavailable": return (error as Error).message;
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email": return "メールアドレスまたはパスワードを確認して再試行してください。";
    case "auth/network-request-failed": return "認証サーバーに接続できません。通信状態を確認して再試行してください。";
    case "auth/too-many-requests": return "試行回数が多いため一時的に制限されています。時間をおいて再試行してください。";
    case "auth/user-disabled": return "このアカウントは無効です。管理者へお問い合わせください。";
    case "auth/web-storage-unsupported": return "ブラウザの保存領域を利用できません。空き容量を確認し、管理者へお問い合わせください。";
    case "auth/internal-error": return "認証またはログイン状態の保存に失敗しました。同じサイトの他のタブを閉じて再試行し、改善しない場合は管理者へ連絡してください。（auth/internal-error）";
    default: return `認証処理に失敗しました。再試行し、改善しない場合は管理者へ連絡してください。（${code || "詳細不明"}）`;
  }
}

export async function signInWithGoogle(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase設定がありません。");
  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInWithPopup(auth, new GoogleAuthProvider());
  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase設定がありません。");
  await prepareEmailPersistence(auth);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function createAccountWithEmail(email: string, password: string): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase設定がありません。");
  await prepareEmailPersistence(auth);
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signOutFromFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}
