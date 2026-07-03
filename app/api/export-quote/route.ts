import { NextRequest, NextResponse } from "next/server";
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
  kitchenHeating: "加熱機器",
  kitchenDrawer: "引き出し",
  kitchenWallCabinet: "吊戸",
  kitchenWallCabinetHeight: "吊戸高さ",
  kitchenDishwasherExisting: "既存食洗機",
  kitchenDishwasherAfter: "食洗機",
  kitchenWorktop: "ワークトップ",
  kitchenSink: "シンク",
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
  no: "無",
  yes: "有",
  right: "右",
  left: "左",
  yuka: "床",
  wall: "壁",
  ceiling: "天井",
  single: "片開き",
  double: "両開き",
  sliding: "引戸",
};

const ROOM_LIST_LABELS = new Set(Object.values(ROOM_VALUE_LABELS));

const EXCLUDED_SELECTION_FIELDS = new Set([
  "workItemId",
  "roomKey",
  "roomType",
  "roomLabel",
  "title",
  "selectedOption",
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

function translateSelectionValue(value: string) {
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

  if (item.selectedOptionLabel) {
    selections.push({ label: FIELD_LABELS.selectedOptionLabel, value: item.selectedOptionLabel });
    usedValues.add(item.selectedOptionLabel);
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
      category: item.roomLabel,
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

export async function POST(request: NextRequest) {
  try {
    const state = (await request.json()) as AppState;

    if (!state || !Array.isArray(state.selectedWorkItems)) {
      return NextResponse.json({ error: "Invalid quote payload." }, { status: 400 });
    }

    const gasUrl = process.env.GAS_WEB_APP_URL || DEFAULT_GAS_WEB_APP_URL;

    const gasItems = buildGasItems(state);
    const response = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        projectName: state.projectName || "",
        customerName: state.customerName || "",
        honorific: "\u69d8",
        discount: 0,
        items: gasItems,
        apiSecret: process.env.GAS_API_SECRET || "",
      }),
    });

    const result = await response.json().catch(() => null);
    const succeeded = result?.ok === true || result?.success === true;
    if (!response.ok || !succeeded) {
      return NextResponse.json(
        { error: result?.error || result?.message || "Failed to export quote." },
        { status: response.ok ? 500 : response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl || result.url,
      fileName: result.fileName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export quote.";
    console.error("[export-quote]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
