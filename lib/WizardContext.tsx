"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  AppState,
  SelectedWorkItem,
  RoomCountSettings,
  LoanCalc,
  BottomTab,
} from "./types";
import * as store from "./store";

interface AppContextType {
  state: AppState;
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
  // Step 4
  setEditingWorkItem: (item: SelectedWorkItem | null) => void;
  // Step 5
  setMemo: (v: string) => void;
  // Bottom tabs
  setActiveBottomTab: (tab: BottomTab | null) => void;
  // Loan
  setLoan: (loan: LoanCalc | null) => void;
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fresh") === "1") {
      store.clear();
      setState(store.initialState());
      window.history.replaceState(null, "", window.location.pathname);
      setHydrated(true);
      return;
    }
    const saved = store.load();
    if (saved) setState(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) store.save(state);
  }, [state, hydrated]);

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
    setState(store.initialState());
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        setStep,
        setProjectName,
        setCustomerName,
        setMultiplier,
        setRoomCounts,
        selectRoom,
        addWorkItem,
        removeWorkItem,
        updateWorkItem,
        setEditingWorkItem,
        setMemo,
        setActiveBottomTab,
        setLoan,
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
