"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  AppState,
  SelectedWorkItem,
  RoomCountSettings,
  LoanCalc,
  BottomTab,
  ProjectStatus,
  SavedEstimateProject,
  StaffMember,
} from "./types";
import * as store from "./store";
import * as projectRepository from "./project-repository";
import { overlayPending, readSharedCache, writeSharedCache, type SharedCache } from "./shared-project-cache";
import {
  createAccountWithEmail,
  onFirebaseUserChanged,
  signInWithEmail,
  signInWithGoogle,
  signOutFromFirebase,
} from "./firebase-client";

interface AuthUserInfo {
  uid: string;
  displayName: string | null;
  email: string | null;
  isAnonymous: boolean;
}

interface AppContextType {
  state: AppState;
  projects: SavedEstimateProject[];
  hasUnsavedChanges: boolean;
  authUser: AuthUserInfo | null;
  authReady: boolean;
  authError: string | null;
  staff: StaffMember[];
  memberActive: boolean;
  syncError: string | null;
  fromCache: boolean;
  pendingIds: string[];
  retrySync: () => void;
  discardPending: (id: string) => void;
  setAssigneeIds: (ids: string[]) => void;
  // Navigation
  setStep: (step: number) => void;
  // Step 0
  setProjectName: (v: string) => void;
  setCustomerName: (v: string) => void;
  // Step 1
  setMultiplier: (v: number | null) => void;
  // Step 2
  setRoomCounts: (settings: RoomCountSettings) => void;
  // Step 3
  selectRoom: (roomKey: string | null) => void;
  addWorkItem: (item: SelectedWorkItem) => void;
  removeWorkItem: (workItemId: string) => void;
  updateWorkItem: (item: SelectedWorkItem) => void;
  copyRoomWorkItems: (sourceRoomKey: string, targetRoomKey: string) => void;
  // Step 4
  setEditingWorkItem: (item: SelectedWorkItem | null) => void;
  // Step 5
  setMemo: (v: string) => void;
  // Bottom tabs
  setActiveBottomTab: (tab: BottomTab | null) => void;
  // Loan
  setLoan: (loan: LoanCalc | null) => void;
  // Projects
  saveProject: (status: ProjectStatus, stateOverride?: AppState) => Promise<void>;
  loadProject: (projectId: string) => void;
  startNewProject: () => void;
  resetCurrentEstimate: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Derived
  getSumCost: () => number;
  getSumSell: () => number | null;
  getSumSellTax: () => number | null;
  getItemsForRoom: (roomKey: string) => SelectedWorkItem[];
  // Reset
  reset: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(store.initialState());
  const [projects, setProjects] = useState<SavedEstimateProject[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUserInfo | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [registeredActive, setMemberActive] = useState(false);
  const [editLock, setEditLock] = useState<"waiting" | "available" | "blocked">("waiting");
  const [lockRevision, setLockRevision] = useState(0);
  const memberActive = registeredActive && editLock === "available";
  const [syncError, setSyncError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(true);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  const cacheRef = React.useRef<SharedCache>({ projects: [], staff: [], pending: {}, draft: null });
  const uidRef = React.useRef<string | null>(null);
  const baseRef = React.useRef<string | null>(null);
  const flushing = React.useRef(false);
  const flushRequested = React.useRef(false);

  const persist = useCallback((cache: SharedCache) => {
    const uid = uidRef.current;
    if (!uid) return;
    writeSharedCache(uid, cache);
    cacheRef.current = cache;
    setProjects(overlayPending(cache));
    setStaff(cache.staff);
    setPendingIds(Object.keys(cache.pending));
  }, []);
  const retrySync = useCallback(() => { setSyncError(null); setRevision(v => v + 1); setLockRevision(v => v + 1); }, []);

  useEffect(() => {
    return onFirebaseUserChanged((user) => {
      const uid = user && !user.isAnonymous ? user.uid : null;
      uidRef.current = uid;
      setMemberActive(false);
      setEditLock("waiting");
      setAuthError(null);
      setSyncError(null);
      setFromCache(true);
      baseRef.current = null;
      const cache = uid ? readSharedCache(uid) : { projects: [], staff: [], pending: {}, draft: null };
      cacheRef.current = cache;
      setProjects([]);
      setStaff([]);
      setPendingIds(Object.keys(cache.pending));
      setState(cache.draft ?? store.initialState());
      if (cache.draft?.activeProjectId) {
        const queued = cache.pending[cache.draft.activeProjectId];
        baseRef.current = "draftBaseUpdatedAt" in cache ? cache.draftBaseUpdatedAt ?? null : queued ? queued.baseUpdatedAt
          : cache.projects.find(p => p.id === cache.draft?.activeProjectId)?.updatedAt ?? null;
      }
      setAuthUser(uid && user ? { uid, displayName: user.displayName, email: user.email, isAnonymous: false } : null);
      setAuthReady(true);
      setHydrated(true);
    });
  }, []);

  // One editor per account/browser avoids two tabs overwriting the durable outbox.
  useEffect(() => {
    if (!authUser) return;
    if (!navigator.locks) { setEditLock("available"); return; }
    let cancelled = false;
    let release = () => {};
    const held = new Promise<void>(resolve => { release = resolve; });
    setEditLock("waiting");
    navigator.locks.request(`estimate-editor:${authUser.uid}`, { ifAvailable: true }, async lock => {
      if (cancelled) return;
      if (!lock) { setEditLock("blocked"); return; }
      // A previously active tab may have saved offline work while this tab waited.
      const cache = readSharedCache(authUser.uid);
      cacheRef.current = cache;
      setProjects(overlayPending(cache));
      setStaff(cache.staff);
      setPendingIds(Object.keys(cache.pending));
      setState(cache.draft ?? store.initialState());
      const id = cache.draft?.activeProjectId;
      baseRef.current = "draftBaseUpdatedAt" in cache ? cache.draftBaseUpdatedAt ?? null
        : id ? cache.pending[id]?.baseUpdatedAt ?? cache.projects.find(p => p.id === id)?.updatedAt ?? null : null;
      setEditLock("available");
      await held;
    }).catch(() => { if (!cancelled) setEditLock("blocked"); });
    return () => { cancelled = true; release(); };
  }, [authUser, lockRevision]);

  useEffect(() => {
    if (!authUser) return;
    const uid = authUser.uid;
    let stop = () => {};
    try {
      stop = projectRepository.watchMembership(uid, (member, cached) => {
        if (uidRef.current !== uid) return;
        if (cached && !member) return;
        const active = member?.active === true;
        setMemberActive(active);
        if (!active) {
          setProjects([]); setStaff([]);
          setAuthError("このアカウントは有効な社内メンバーに登録されていません。管理者にUIDの登録を依頼してください。");
          return;
        }
        setAuthError(null);
        setProjects(overlayPending(cacheRef.current));
        setStaff(cacheRef.current.staff);
      }, () => {
        if (uidRef.current !== uid) return;
        setMemberActive(false); setProjects([]); setStaff([]);
        setAuthError("メンバー確認に失敗しました。通信とFirestoreルールを確認して再試行してください。");
      });
    } catch (error) { setAuthError(error instanceof Error ? error.message : "初期化に失敗しました。"); }
    return () => stop();
  }, [authUser, revision]);

  useEffect(() => {
    if (!authUser || !memberActive) return;
    const uid = authUser.uid;
    const failed = () => { if (uidRef.current === uid) setSyncError("共有データの取得に失敗しました。通信とFirestoreルールを確認してください。"); };
    const stops: Array<() => void> = [];
    try {
      stops.push(projectRepository.watchSharedProjects((projects, cached) => {
        if (uidRef.current !== uid) return;
        setFromCache(cached);
        // An empty initial cache must not erase a previously stored offline list.
        if (cached && projects.length === 0) return;
        try { persist({ ...cacheRef.current, projects }); } catch { setSyncError("端末内の保存容量を確認してください。"); }
      }, failed));
      stops.push(projectRepository.watchStaff((staff) => {
        if (uidRef.current !== uid) return;
        try { persist({ ...cacheRef.current, staff }); } catch { setSyncError("担当者情報を端末へ保存できませんでした。"); }
      }, failed));
    } catch { failed(); }
    return () => stops.forEach(stop => stop());
  }, [authUser, memberActive, persist, revision]);

  useEffect(() => {
    if (!hydrated || !authUser || !memberActive) return;
    try { persist({ ...cacheRef.current, draft: state, draftBaseUpdatedAt: baseRef.current }); }
    catch { setSyncError("編集内容を端末へ保存できませんでした。ブラウザの保存容量を確認してください。"); }
  }, [state, hydrated, authUser, memberActive, persist]);

  useEffect(() => {
    const online = () => setRevision(v => v + 1);
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, []);

  useEffect(() => {
    if (!authUser || !memberActive || !navigator.onLine) return;
    if (flushing.current) { flushRequested.current = true; return; }
    const uid = authUser.uid;
    flushing.current = true;
    (async () => {
      for (const [id, pending] of Object.entries(cacheRef.current.pending)) {
        if (uidRef.current !== uid) break;
        try {
          const project = await projectRepository.saveSharedProject(uid, pending);
          if (uidRef.current !== uid) break;
          const cache = cacheRef.current;
          const nextPending = { ...cache.pending };
          // Preserve a newer edit made while this write was in flight.
          if (nextPending[id]?.project.updatedAt === pending.project.updatedAt) delete nextPending[id];
          else if (nextPending[id]) nextPending[id] = { ...nextPending[id], baseUpdatedAt: project.updatedAt };
          const projects = store.upsertProject(cache.projects, project);
          persist({ ...cache, projects, pending: nextPending,
            draftBaseUpdatedAt: cache.draft?.activeProjectId === id ? project.updatedAt : cache.draftBaseUpdatedAt });
          if (Object.keys(nextPending).length === 0) setSyncError(null);
          if (cache.draft?.activeProjectId === id) baseRef.current = project.updatedAt;
        } catch (error) {
          if (uidRef.current !== uid) break;
          setSyncError(error instanceof Error ? error.message : "共有保存に失敗しました。端末内の未同期データは保持されています。");
        }
      }
    })().finally(() => {
      flushing.current = false;
      if (flushRequested.current) { flushRequested.current = false; setRevision(v => v + 1); }
    });
  }, [authUser, memberActive, revision, persist]);

  const setAssigneeIds = useCallback((ids: string[]) => setState(s => ({ ...s, assigneeIds: ids })), []);
  const discardPending = useCallback((id: string) => {
    if (flushing.current) { setSyncError("同期処理中です。完了またはエラー表示を待ってから操作してください。"); return; }
    const cache = cacheRef.current;
    const pending = { ...cache.pending };
    delete pending[id];
    const project = cache.projects.find(p => p.id === id);
    const draft = state.activeProjectId === id ? (project?.state ?? store.initialState()) : state;
    try {
      persist({ ...cache, pending, draft,
        draftBaseUpdatedAt: state.activeProjectId === id ? project?.updatedAt ?? null : baseRef.current });
      setState(draft);
      if (state.activeProjectId === id) baseRef.current = project?.updatedAt ?? null;
      setSyncError(null);
    } catch { setSyncError("端末への保存に失敗しました。"); }
  }, [persist, state]);

  const hasUnsavedChanges = React.useMemo(() => {
    if (!hydrated) return false;
    const activeProject = projects.find((project) => project.id === state.activeProjectId);
    if (!activeProject) return !store.isBlankEstimate(state);
    return JSON.stringify(store.projectSnapshot(state, activeProject.id, activeProject.status)) !== JSON.stringify(activeProject.state);
  }, [hydrated, projects, state]);

  const setStep = useCallback((step: number) => {
    setState((s) => ({ ...s, currentStep: step }));
  }, []);

  const setProjectName = useCallback((v: string) => {
    setState((s) => ({ ...s, projectName: v }));
  }, []);

  const setCustomerName = useCallback((v: string) => {
    setState((s) => ({ ...s, customerName: v }));
  }, []);

  const setMultiplier = useCallback((v: number | null) => {
    setState((s) => ({ ...s, multiplier: v }));
  }, []);

  const setRoomCounts = useCallback((settings: RoomCountSettings) => {
    setState((s) => store.setRoomCounts(s, settings));
  }, []);

  const selectRoom = useCallback((roomKey: string | null) => {
    setState((s) => ({ ...s, selectedRoomKey: roomKey }));
  }, []);

  const addWorkItem = useCallback((item: SelectedWorkItem) => {
    setState((s) => store.addWorkItem(s, item));
  }, []);

  const removeWorkItem = useCallback((workItemId: string) => {
    setState((s) => store.removeWorkItem(s, workItemId));
  }, []);

  const updateWorkItem = useCallback((item: SelectedWorkItem) => {
    setState((s) => store.updateWorkItem(s, item));
  }, []);

  const copyRoomWorkItems = useCallback((sourceRoomKey: string, targetRoomKey: string) => {
    setState((s) => store.copyRoomWorkItems(s, sourceRoomKey, targetRoomKey));
  }, []);

  const setEditingWorkItem = useCallback((item: SelectedWorkItem | null) => {
    setState((s) => ({ ...s, editingWorkItem: item }));
  }, []);

  const setMemo = useCallback((v: string) => {
    setState((s) => ({ ...s, memo: v }));
  }, []);

  const setActiveBottomTab = useCallback((tab: BottomTab | null) => {
    setState((s) => ({ ...s, activeBottomTab: s.activeBottomTab === tab ? null : tab }));
  }, []);

  const setLoan = useCallback((loan: LoanCalc | null) => {
    setState((s) => ({ ...s, loan: loan }));
  }, []);

  const saveProject = useCallback(async (status: ProjectStatus, stateOverride?: AppState) => {
    if (!authUser || !memberActive) throw new Error("有効な社内アカウントでログインしてください。");
    const cache = cacheRef.current;
    const input = stateOverride ?? state;
    const id = input.activeProjectId ?? `project-${crypto.randomUUID()}`;
    const existing = overlayPending(cache).find(p => p.id === id);
    const project = store.makeProjectRecord({ ...input, activeProjectId: id }, status);
    project.clientSaveId = crypto.randomUUID();
    project.ownerId = existing?.ownerId ?? authUser.uid;
    project.createdAt = existing?.createdAt ?? project.createdAt;
    project.updatedAt = new Date(Math.max(Date.now(), Date.parse(existing?.updatedAt ?? "") + 1 || 0)).toISOString();
    const draft = { ...input, activeProjectId: id, activeProjectStatus: status };
    const previous = cache.pending[id];
    const pending = { project, baseUpdatedAt: previous ? previous.baseUpdatedAt : baseRef.current };
    try { persist({ ...cache, draft, draftBaseUpdatedAt: baseRef.current, pending: { ...cache.pending, [id]: pending } }); }
    catch { throw new Error("端末内へ保存できませんでした。保存容量を確認してください。"); }
    setState(draft);
    setSyncError(null);
    setRevision(v => v + 1);
  }, [state, authUser, memberActive, persist]);

  const loadProject = useCallback((projectId: string) => {
    const project = overlayPending(cacheRef.current).find(p => p.id === projectId);
    if (!project) return;
    const pending = cacheRef.current.pending[projectId];
    baseRef.current = pending ? pending.baseUpdatedAt : project.updatedAt;
    setState({ ...store.newEstimateState(), ...project.state, activeProjectId: project.id, activeProjectStatus: project.status, activeBottomTab: null, editingWorkItem: null });
  }, []);

  const startNewProject = useCallback(() => {
    baseRef.current = null;
    setState(store.newEstimateState());
  }, []);

  const resetCurrentEstimate = useCallback(() => {
    setState((s) => ({
      ...store.newEstimateState(),
      activeProjectId: s.activeProjectId,
      activeProjectStatus: s.activeProjectStatus,
    }));
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Failed to sign in with Google", error);
      setAuthError("Googleログインに失敗しました。Firebase ConsoleでGoogleプロバイダが有効か確認してください。");
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInWithEmail(email, password);
    } catch (error) {
      console.error("Failed to sign in with email", error);
      setAuthError("メールログインに失敗しました。メールアドレスとパスワードを確認してください。");
    }
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      await createAccountWithEmail(email, password);
    } catch (error) {
      console.error("Failed to create email account", error);
      setAuthError("メールアカウント作成に失敗しました。Firebase Consoleでメール/パスワードが有効か確認してください。");
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    try {
      await signOutFromFirebase();
      setAuthUser(null);
    } catch (error) {
      console.error("Failed to sign out", error);
      setAuthError("ログアウトに失敗しました。");
    }
  }, []);

  const getSumCost = useCallback(() => {
    return store.sumCost(state.selectedWorkItems);
  }, [state.selectedWorkItems]);

  const getSumSell = useCallback(() => {
    return store.sumSell(state.selectedWorkItems, state.multiplier);
  }, [state.selectedWorkItems, state.multiplier]);

  const getSumSellTax = useCallback(() => {
    return store.sumSellTax(state.selectedWorkItems, state.multiplier);
  }, [state.selectedWorkItems, state.multiplier]);

  const getItemsForRoom = useCallback(
    (roomKey: string) => state.selectedWorkItems.filter((i) => i.roomKey === roomKey),
    [state.selectedWorkItems]
  );

  const reset = useCallback(() => {
    store.clear();
    setState(store.newEstimateState());
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        projects,
        staff, memberActive, syncError, fromCache, pendingIds, retrySync, discardPending, setAssigneeIds,
        hasUnsavedChanges,
        authUser,
        authReady,
        authError: editLock === "blocked" ? "別のタブでこのアカウントの案件を開いています。そのタブを閉じて「再確認」を押してください。" : authError,
        setStep,
        setProjectName,
        setCustomerName,
        setMultiplier,
        setRoomCounts,
        selectRoom,
        addWorkItem,
        removeWorkItem,
        updateWorkItem,
        copyRoomWorkItems,
        setEditingWorkItem,
        setMemo,
        setActiveBottomTab,
        setLoan,
        saveProject,
        loadProject,
        startNewProject,
        resetCurrentEstimate,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        getSumCost,
        getSumSell,
        getSumSellTax,
        getItemsForRoom,
        reset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
