import { AppState, SelectedWorkItem, RoomCountSettings, LoanCalc, ProjectStatus, SavedEstimateProject } from "./types";
import { generateRooms } from "./config";

const STORAGE_KEY = "estimate_app_state";
const PROJECTS_STORAGE_KEY = "estimate_projects";
export const PROJECT_LIST_STEP = 7;

export function initialState(): AppState {
  return { ...newEstimateState(), currentStep: PROJECT_LIST_STEP };
}

export function newEstimateState(): AppState {
  return {
    activeProjectId: null,
    activeProjectStatus: null,
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

export function loadProjects(): SavedEstimateProject[] {
  if (typeof window === "undefined") return [];
  try {
    const s = localStorage.getItem(PROJECTS_STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: SavedEstimateProject[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch { /* ignore */ }
}

export function projectSnapshot(state: AppState, projectId = state.activeProjectId, status = state.activeProjectStatus): AppState {
  return {
    ...state,
    activeProjectId: projectId,
    activeProjectStatus: status,
    editingWorkItem: null,
    activeBottomTab: null,
  };
}

export function isBlankEstimate(state: AppState): boolean {
  const current = { ...projectSnapshot(state, null, null), currentStep: 0 };
  return JSON.stringify(current) === JSON.stringify(projectSnapshot(newEstimateState(), null, null));
}

export function makeProjectRecord(state: AppState, status: ProjectStatus, now = new Date()): SavedEstimateProject {
  const id = state.activeProjectId ?? `project-${now.getTime()}-${Math.random().toString(36).slice(2, 9)}`;
  const existing = loadProjects().find((project) => project.id === id);
  const snapshot = projectSnapshot(state, id, status);
  return {
    id,
    name: snapshot.projectName.trim() || "名称未設定",
    status,
    createdAt: existing?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
    state: snapshot,
  };
}

export function upsertProject(projects: SavedEstimateProject[], project: SavedEstimateProject): SavedEstimateProject[] {
  const existingIndex = projects.findIndex((item) => item.id === project.id);
  if (existingIndex === -1) return [project, ...projects];
  const next = [...projects];
  next[existingIndex] = project;
  return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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

export function copyRoomWorkItems(state: AppState, sourceRoomKey: string, targetRoomKey: string): AppState {
  const sourceItems = state.selectedWorkItems.filter((i) => i.roomKey === sourceRoomKey);
  const targetRoom = state.generatedRooms.find((room) => room.roomKey === targetRoomKey);
  if (!targetRoom || sourceItems.length === 0 || sourceRoomKey === targetRoomKey) return state;

  const targetRoomLabel = targetRoom.label;
  const copiedItems = sourceItems.map((item, index) => ({
    ...item,
    roomKey: targetRoom.roomKey,
    roomLabel: targetRoomLabel,
    instanceId: `${item.baseWorkItemId || item.workItemId}-${targetRoom.roomKey}-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
  }));

  const firstTargetIndex = state.selectedWorkItems.findIndex((item) => item.roomKey === targetRoomKey);
  if (firstTargetIndex === -1) {
    return { ...state, selectedWorkItems: [...state.selectedWorkItems, ...copiedItems] };
  }

  const nextItems = state.selectedWorkItems.filter((item) => item.roomKey !== targetRoomKey);
  nextItems.splice(firstTargetIndex, 0, ...copiedItems);
  return { ...state, selectedWorkItems: nextItems };
}
