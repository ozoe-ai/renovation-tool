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
} from "./types";
import * as store from "./store";
import * as projectRepository from "./project-repository";
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
  saveProject: (status: ProjectStatus, stateOverride?: AppState) => string;
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

  const refreshProjects = useCallback(async () => {
    const localProjects = store.loadProjects();
    const remoteProjects = await projectRepository.loadProjects();
    const mergedProjects = projectRepository.mergeProjects(remoteProjects, localProjects);
    setProjects(mergedProjects);
    store.saveProjects(mergedProjects);
    await projectRepository.syncLocalProjectsToFirestore(mergedProjects);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams(window.location.search);
    if (params.get("fresh") === "1") {
      store.clear();
      window.history.replaceState(null, "", window.location.pathname);
    }

    const localProjects = store.loadProjects();
    setProjects(localProjects);
    setState(store.initialState());
    setHydrated(true);

    refreshProjects()
      .then(() => {
        if (cancelled) return;
      })
      .catch((error) => {
        console.error("Failed to load projects from Firestore", error);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshProjects]);

  useEffect(() => {
    const unsubscribe = onFirebaseUserChanged((user) => {
      setAuthUser(
        user
          ? {
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              isAnonymous: user.isAnonymous,
            }
          : null
      );
      setAuthReady(true);
      refreshProjects().catch((error) => {
        console.error("Failed to refresh projects after auth change", error);
      });
    });

    return unsubscribe;
  }, [refreshProjects]);

  useEffect(() => {
    if (hydrated) store.save(state);
  }, [state, hydrated]);

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

  const saveProject = useCallback((status: ProjectStatus, stateOverride?: AppState) => {
    const project = store.makeProjectRecord(stateOverride ?? state, status);
    setProjects((current) => {
      const next = store.upsertProject(current, project);
      store.saveProjects(next);
      return next;
    });
    projectRepository.saveProject(project).catch((error) => {
      console.error("Failed to save project to Firestore", error);
    });
    setState((s) => ({
      ...s,
      activeProjectId: project.id,
      activeProjectStatus: status,
      projectName: project.state.projectName,
      customerName: project.state.customerName,
    }));
    return project.id;
  }, [state]);

  const loadProject = useCallback((projectId: string) => {
    const project =
      projects.find((item) => item.id === projectId) ??
      store.loadProjects().find((item) => item.id === projectId);
    if (!project) return;
    setProjects((current) => projectRepository.mergeProjects(current, store.loadProjects()));
    setState({
      ...project.state,
      activeProjectId: project.id,
      activeProjectStatus: project.status,
      activeBottomTab: null,
      editingWorkItem: null,
    });
  }, [projects]);

  const startNewProject = useCallback(() => {
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
      await refreshProjects();
    } catch (error) {
      console.error("Failed to sign in with Google", error);
      setAuthError("Googleログインに失敗しました。Firebase ConsoleでGoogleプロバイダが有効か確認してください。");
    }
  }, [refreshProjects]);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInWithEmail(email, password);
      await refreshProjects();
    } catch (error) {
      console.error("Failed to sign in with email", error);
      setAuthError("メールログインに失敗しました。メールアドレスとパスワードを確認してください。");
    }
  }, [refreshProjects]);

  const registerWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      await createAccountWithEmail(email, password);
      await refreshProjects();
    } catch (error) {
      console.error("Failed to create email account", error);
      setAuthError("メールアカウント作成に失敗しました。Firebase Consoleでメール/パスワードが有効か確認してください。");
    }
  }, [refreshProjects]);

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
        hasUnsavedChanges,
        authUser,
        authReady,
        authError,
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
