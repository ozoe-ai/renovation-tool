import { createHash } from "node:crypto";
﻿import { NextRequest, NextResponse } from "next/server";
import type { AppState } from "@/lib/types";

export const runtime = "nodejs";

const DEFAULT_GAS_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzXNXU3VTgc9ZXGhcWnva40xJpNYaUMTM2C9veDKCs3PkRqqQhHI16_2CEiWQnoqg/exec";

type GasSelection = {
  label: string;
  value: string;
};

type GasItemPayload = Record<string, unknown> & {
  category: string;
  itemName: string;
  selections: GasSelection[];
  note: string;
  title: string;
  selectedOptionLabel: string;
};

const FIELD_LABELS: Record<string, string> = {
  selectedOption: "仕様",
  selectedOptionLabel: "仕様",
  storageWidth: "サイズ",
  storageDepth: "奥行",
  storageShape: "形状",
  storageMirror: "鏡",
  lightColor: "色",
  lightDiameter: "径",
  lightBodyColor: "本体色",
  kitchenShape: "形状",
  kitchenDepth: "奥行",
  kitchenWidth: "サイズ",
  kitchenLSize: "サイズ",
  kitchenHeating: "加熱機器",
  kitchenDrawer: "引き出し",
  kitchenWallCabinet: "吊戸",
  kitchenWallCabinetHeight: "吊戸高さ",
  kitchenDishwasherExisting: "既存食洗機",
  kitchenDishwasherAfter: "食洗機",
  kitchenWorktop: "ワークトップ",
  kitchenSink: "シンク",
  kitchenExisting: "既存仕様",
  kitchenEndPanel: "エンドパネル",
  toiletDrainage: "排水",
  toiletFloorDrainMm: "排水芯",
  roukaStorageSpec: "仕様",
  roukaStorageType: "仕様",
  roukaStorageWidth: "W",
  roukaStorageDepth: "D",
  roukaStorageFrame: "枠",
  yoshitsuStorageW: "W",
  yoshitsuStorageD: "D",
  yoshitsuStorageSpec: "仕様",
  ubBodySize: "サイズ",
  senmenBodySize: "サイズ",
};

Object.assign(FIELD_LABELS, {
  intercomAutoLock: "オートロック",
  intercomDetail: "インターホン",
  ldkTateguKagi: "鍵",
  ldkTateguFloorMikiri: "床見切り",
  ldkTateguFloorMikiriType: "床見切り種類",
  ldkTateguFloorMikiriSize: "床見切りサイズ",
  ldkTateguFloorMikiriImage: "床見切り画像情報",
  ldkOutsetKatahikiKagi: "表示錠",
  ldkOutsetKatahikiHikite: "引手方向",
  ldkOutsetKatahikiRailWidth: "レール幅",
  ldkOutsetKatahikiCh: "CH",
  yoshitsuTateguKagi: "鍵",
  yoshitsuTateguFloorMikiri: "床見切り",
  yoshitsuTateguFloorMikiriType: "床見切り種類",
  yoshitsuTateguFloorMikiriSize: "床見切りサイズ",
  yoshitsuTateguFloorMikiriImage: "床見切り画像情報",
  yoshitsuOutsetKatahikiKagi: "表示錠",
  yoshitsuOutsetKatahikiHikite: "引手方向",
  yoshitsuOutsetKatahikiRailWidth: "レール幅",
  yoshitsuOutsetKatahikiCh: "CH",
});

const ROOM_VALUE_LABELS: Record<string, string> = {
  GENKAN: "玄関",
  ROUKA: "廊下",
  LD: "LDK",
  KITCHEN: "キッチン",
  YOSHITSU_1: "洋室1",
  YOSHITSU_2: "洋室2",
  YOSHITSU_3: "洋室3",
  WASHITSU_1: "和室",
  WASHITSU_YOSHITSU: "和室から洋室",
  UB_1: "ユニットバス",
  SENMEN_1: "洗面室",
  TOILET_1: "トイレ",
  KAIDAN: "階段",
};

const VALUE_LABELS: Record<string, string> = {
  keep: "既存残し",
  change: "交換",
  meister: "マイスターコーティング",
  no: "無",
  yes: "有",
  right: "右",
  left: "左",
  yuka: "床",
  wall: "壁",
  floor: "床",
  ceiling: "天井",
  single: "片開き",
  double: "両開き",
  sliding: "引戸",
  advance: "アドバンス",
  oredo: "折れ戸",
  ryobiraki: "両開き",
  kadodana: "可動棚",
  makuradana_hp: "枕棚+HP",
  chudan: "中段",
  makuradana: "枕棚",
  hp: "HP",
  utsuri: "上吊",
  yguruma: "Y戸車",
  order: "オーダー",
  dl_change: "DL交換",
  dl_new: "DL新規",
  right_hikite: "右引手",
  left_hikite: "左引手",
};

const ROOM_LIST_LABELS = new Set(Object.values(ROOM_VALUE_LABELS));

const EXCLUDED_SELECTION_FIELDS = new Set([
  "workItemId",
  "roomKey",
  "roomType",
  "roomLabel",
  "title",
  "selectedOption",
  "selectedOptionLabel",
  "kitchenExisting",
  "qty",
  "unit",
  "unitPrice",
  "lineSubtotal",
  "instanceId",
  "instanceNumber",
  "baseWorkItemId",
  "count",
  "note",
  "selections",
]);

const CALCULATION_FIELD_PATTERNS = [
  "estimated",
  "meter",
  "manualqty",
  "qtyoverridden",
  "quantity",
  "subtotal",
  "calculated",
  "calculation",
  "cost",
  "amount",
];

function isSelectionField(key: string, value: unknown) {
  const lower = key.toLowerCase();
  if (EXCLUDED_SELECTION_FIELDS.has(key)) return false;
  if (CALCULATION_FIELD_PATTERNS.some((pattern) => lower.includes(pattern))) return false;
  if (lower.includes("photo") || lower.includes("image") || lower.includes("photos")) return false;
  if (lower.includes("price") || lower.includes("subtotal")) return false;
  if (value === undefined || value === null || value === "") return false;
  if (typeof value === "number" && !Number.isInteger(value)) return false;
  if (typeof value === "string" && /^-?\d+\.\d+$/.test(value.trim())) return false;
  if (typeof value === "object") return false;
  if (typeof value === "boolean") return value;
  return true;
}

function selectionValue(value: unknown) {
  if (typeof value === "boolean") return value ? "有" : "";
  return translateSelectionValue(String(value));
}

function translateSelectionValue(value: string): string {
  const commaParts = value.split(",").map((part) => part.trim()).filter(Boolean);
  if (commaParts.length > 1) return commaParts.map(translateSelectionValue).filter(Boolean).join("・");

  const mappedValue = VALUE_LABELS[value.toLowerCase()];
  if (mappedValue) return mappedValue;

  const translatedValue = value.replace(/\b[A-Z]+(?:_[A-Z]+)*(?:_\d+)?\b/g, (match) => {
    return ROOM_VALUE_LABELS[match] || match;
  });
  return formatRoomListValue(translatedValue);
}

function formatRoomListValue(value: string) {
  if (!value.includes(",")) return value;
  const hasRoomLabel = value.split(",").some((part) => ROOM_LIST_LABELS.has(part.trim()));
  return hasRoomLabel ? value.split(",").map((part) => part.trim()).filter(Boolean).join("・") : value;
}

function isRoomListValue(value: string) {
  return value.includes("・") && value.split("・").some((part) => ROOM_LIST_LABELS.has(part.trim()));
}

function formatNote(note?: string) {
  const trimmed = note?.trim() || "";
  return trimmed ? `※備考：${trimmed}` : "";
}

function buildSelections(item: AppState["selectedWorkItems"][number]) {
  const selections: GasSelection[] = [];
  const usedValues = new Set<string>();
  const translatedOption = translateSelectionValue(item.selectedOption);
  const primaryOption =
    translatedOption && translatedOption !== item.selectedOption
      ? translatedOption
      : item.selectedOptionLabel || translatedOption;

  if (primaryOption) {
    selections.push({ label: FIELD_LABELS.selectedOption, value: primaryOption });
    usedValues.add(primaryOption);
  }

  Object.entries(item).forEach(([key, value]) => {
    if (!isSelectionField(key, value)) return;
    const valueText = selectionValue(value);
    if (!valueText || usedValues.has(valueText)) return;
    selections.push({ label: FIELD_LABELS[key] || key, value: valueText });
    usedValues.add(valueText);
  });

  return selections;
}

function formatSpreadsheetItemName(itemName: string, selections: GasSelection[], note: string) {
  const parts = [itemName, ...selections.map((selection) => selection.value).filter(Boolean)];
  if (note) parts.push(note);
  const roomListIndex = parts.findIndex(isRoomListValue);
  if (roomListIndex > 0) {
    const beforeRoomList = parts.slice(0, roomListIndex).join("　");
    const roomList = parts[roomListIndex];
    const afterRoomList = parts.slice(roomListIndex + 1).join("　");
    return wrapLongDisplayText([beforeRoomList, roomList, afterRoomList].filter(Boolean).join("\n"));
  }
  return wrapLongDisplayText(parts.join("　"));
}

function wrapLongDisplayText(text: string) {
  return text
    .split("\n")
    .flatMap((line) => wrapDisplayLine(line))
    .join("\n");
}

function wrapDisplayLine(line: string) {
  const maxLength = 42;
  if (line.length <= maxLength) return [line];

  const tokens = line.split(/([　・,])/);
  const lines: string[] = [];
  let current = "";

  tokens.forEach((token) => {
    if (!token) return;
    const next = current + token;
    if (current && next.length > maxLength) {
      lines.push(current.replace(/[　・,]$/, ""));
      current = token.replace(/^[　・,]/, "");
      return;
    }
    current = next;
  });

  if (current) lines.push(current);
  return lines;
}

function dedupeKey(item: AppState["selectedWorkItems"][number]) {
  return item.instanceId || item.workItemId || `${item.roomKey}:${item.title}`;
}

function normalizeRoomLabel(label: string) {
  return label === "全体項目（必須で入れる）" ? "全体項目" : label;
}

function calculateTotal(state: AppState) {
  return state.selectedWorkItems.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0), 0);
}

function buildGasItems(state: AppState) {
  const seen = new Set<string>();

  return state.selectedWorkItems.reduce<GasItemPayload[]>((items, item) => {
    const key = dedupeKey(item);
    if (seen.has(key)) return items;
    seen.add(key);

    const selections = buildSelections(item);
    const note = formatNote(item.note);
    const title = formatSpreadsheetItemName(item.title, selections, note);

    items.push({
      ...item,
      category: normalizeRoomLabel(item.roomLabel),
      itemName: item.title,
      selections,
      note,
      title,
      name: title,
      selectedOptionLabel: "",
    });

    return items;
  }, []);
}

const PROTOCOL = "quote-export-v2";
const STAGE_LABELS: Record<string, string> = {
  authentication: "保存先GASの認証",
  validation: "担当者情報の確認", gateway: "保存先GASへの接続", folder: "担当者フォルダの確認・作成",
  template: "見積テンプレートの確認", copy: "見積ファイルの生成", write: "見積内容の書き込み", verify: "保存結果の確認",
};

export async function POST(request: NextRequest) {
  let requestId: string | undefined;
  let stage = "validation";
  const fail = (code: string, status: number, httpStatus?: number) => {
    console.error("[export-quote]", { requestId, stage, code, httpStatus });
    const message = code === "GAS_UPGRADE_REQUIRED"
      ? "保存先GASが再試行対応版に更新されていません。管理者にGASの更新と接続先URLの確認を依頼してください。"
      : code === "ASSIGNEE_MISSING"
        ? "案件に保存された担当者名を確認できません。最新版の画面で案件を開き直してください。"
        : code === "PROJECT_ID_MISSING"
          ? "再試行用の案件情報を保存できません。最新版の画面から再試行してください。"
          : code === "ACCESS_DENIED"
            ? `${STAGE_LABELS[stage] || "保存処理"}で認証・権限の確認に失敗しました。管理者にGASの実行アカウント、テンプレートと保存先のアクセス権を確認してもらい、同じ内容で再試行してください。`
          : code === "COPY_UNCERTAIN"
            ? "ファイル生成の結果を確認中です。重複を防ぐため新規作成を停止しています。同じ内容で再試行してください。改善しない場合は管理者へ連絡してください。"
            : `${STAGE_LABELS[stage] || "見積の保存"}に失敗しました。入力内容は保持しています。同じ内容で再試行し、改善しない場合は管理者へ連絡してください。`;
    return NextResponse.json({ ok: false, error: message, code, stage, requestId: requestId?.slice(0, 12) }, { status });
  };
  try {
    const state = (await request.json()) as AppState;
    if (!state || !Array.isArray(state.selectedWorkItems)) return fail("INVALID_PAYLOAD", 400);
    const assigneeId = state.assigneeIds?.[0];
    const assigneeName = assigneeId ? state.assigneeNames?.[assigneeId]?.trim() : "";
    if (!assigneeName) return fail("ASSIGNEE_MISSING", 400);
    if (!state.activeProjectId || typeof state.activeProjectId !== "string") return fail("PROJECT_ID_MISSING", 400);
    const totalAmount = calculateTotal(state);
    const payload = {
      assigneeId, assigneeName, assigneeIds: state.assigneeIds,
      projectName: state.projectName || "", customerName: "", honorific: "様", discount: 0,
      total: totalAmount, totalAmount, quoteTotal: totalAmount,
      estimateAmountCell: "BC6", estimateAmount: totalAmount, items: buildGasItems(state),
    };
    // UI filters/navigation, timestamps, credentials and sync metadata are excluded.
    requestId = createHash("sha256").update(JSON.stringify({ projectId: state.activeProjectId, ...payload })).digest("hex");
    const gasUrl = process.env.GAS_WEB_APP_URL || DEFAULT_GAS_WEB_APP_URL;
    stage = "gateway";
    const health = await fetch(gasUrl, { cache: "no-store", signal: AbortSignal.timeout(15000) });
    const capabilities = await health.json().catch(() => null);
    if (!health.ok || capabilities?.protocolVersion !== PROTOCOL) return fail("GAS_UPGRADE_REQUIRED", 502, health.status);
    const response = await fetch(gasUrl, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, signal: AbortSignal.timeout(65000),
      body: JSON.stringify({ ...payload, protocolVersion: PROTOCOL, requestId, apiSecret: process.env.GAS_API_SECRET || "" }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.ok !== true) {
      stage = typeof result?.stage === "string" && result.stage in STAGE_LABELS ? result.stage : "gateway";
      const code = ["COPY_UNCERTAIN", "ACCESS_DENIED", "DRIVE_ERROR", "WRITE_FAILED", "VERIFY_FAILED", "BUSY", "INVALID_PAYLOAD"].includes(result?.code) ? result.code : "GAS_FAILED";
      return fail(code, response.ok ? 502 : response.status, response.status);
    }
    stage = "verify";
    if (result.protocolVersion !== PROTOCOL || result.requestId !== requestId || !/^[A-Za-z0-9_-]{10,}$/.test(result.spreadsheetId || "")) return fail("INVALID_RECEIPT", 502);
    console.info("[export-quote]", { requestId, stage: "complete", code: "OK", reused: result.reused === true });
    return NextResponse.json({ ok: true, spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${result.spreadsheetId}/edit`, fileName: result.fileName, requestId });
  } catch (error) {
    const code = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError") ? "NETWORK_TIMEOUT" : "REQUEST_FAILED";
    return fail(code, 502);
  }
}
