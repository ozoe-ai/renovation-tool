import { AppState, SelectedWorkItem, RoomCountSettings, LoanCalc, BottomTab } from "./types";
import { generateRooms } from "./config";

const STORAGE_KEY = "estimate_app_state";

export function initialState(): AppState {
  return {
    currentStep: 0,
    projectName: "",
    customerName: "",
    multiplier: null,
    roomCountSettings: null,
    generatedRooms: [],
    selectedRoomKey: null,
    selectedWorkItems: [],
    editingWorkItem: null,
    memo: "",
    activeBottomTab: null,
    loan: null,
  };
}

export function save(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function load(): AppState | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function clear(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// ========== Derived calculations ==========

export function sumCost(items: SelectedWorkItem[]): number {
  return items.reduce((acc, i) => acc + i.lineSubtotal, 0);
}

export function sumSell(items: SelectedWorkItem[], multiplier: number | null): number | null {
  if (multiplier == null || multiplier <= 0) return null;
  return Math.round(sumCost(items) * multiplier);
}

export function sumSellTax(items: SelectedWorkItem[], multiplier: number | null): number | null {
  const sell = sumSell(items, multiplier);
  if (sell == null) return null;
  return Math.round(sell * 1.1);
}

export function calcLoan(principal: number, annualRate: number, years: number): LoanCalc {
  if (years <= 0 || annualRate < 0) {
    return { principal, annualRate, years, monthlyPayment: 0, totalPayment: 0 };
  }
  const monthlyRate = annualRate / 100 / 12;
  const n = years * 12;
  if (monthlyRate === 0) {
    const mp = Math.round(principal / n);
    return { principal, annualRate, years, monthlyPayment: mp, totalPayment: mp * n };
  }
  const mp = Math.round(
    principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
  );
  return { principal, annualRate, years, monthlyPayment: mp, totalPayment: mp * n };
}

// ========== State updaters ==========

export function setRoomCounts(state: AppState, settings: RoomCountSettings): AppState {
  const rooms = generateRooms(settings);
  return { ...state, roomCountSettings: settings, generatedRooms: rooms };
}

export function addWorkItem(state: AppState, item: SelectedWorkItem): AppState {
  // instanceId がある場合：同じinstanceIdが既にあれば更新、なければ追加
  if (item.instanceId) {
    const existing = state.selectedWorkItems.find((i) => i.instanceId === item.instanceId);
    if (existing) {
      return {
        ...state,
        selectedWorkItems: state.selectedWorkItems.map((i) =>
          i.instanceId === item.instanceId ? item : i
        ),
      };
    }
    return { ...state, selectedWorkItems: [...state.selectedWorkItems, item] };
  }
  // instanceId なし（従来動作）: 同じ workItemId かつ instanceId なしのものを置き換え
  const idx = state.selectedWorkItems.findIndex(
    (i) => i.workItemId === item.workItemId && !i.instanceId
  );
  if (idx >= 0) {
    const next = [...state.selectedWorkItems];
    next[idx] = item;
    return { ...state, selectedWorkItems: next };
  }
  return { ...state, selectedWorkItems: [...state.selectedWorkItems, item] };
}

export function removeWorkItem(state: AppState, id: string): AppState {
  // instanceId で削除を試みる
  const byInstanceId = state.selectedWorkItems.filter((i) => i.instanceId !== id);
  if (byInstanceId.length !== state.selectedWorkItems.length) {
    return { ...state, selectedWorkItems: byInstanceId };
  }
  // 従来の動作: workItemId で削除
  return {
    ...state,
    selectedWorkItems: state.selectedWorkItems.filter((i) => i.workItemId !== id),
  };
}

export function updateWorkItem(state: AppState, updated: SelectedWorkItem): AppState {
  return {
    ...state,
    selectedWorkItems: state.selectedWorkItems.map((i) => {
      if (updated.instanceId && i.instanceId === updated.instanceId) return updated;
      if (!updated.instanceId && i.workItemId === updated.workItemId && !i.instanceId) return updated;
      return i;
    }),
  };
}
