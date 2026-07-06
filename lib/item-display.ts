import type { SelectedWorkItem } from "./types";

type DisplaySelection = {
  label: string;
  value: string;
};

const FIELD_LABELS: Record<string, string> = {
  selectedOption: "仕様",
  selectedOptionLabel: "仕様",
  storageWidth: "サイズ",
  storageDepth: "奥行",
  storageShape: "形状",
  storageMirror: "鏡",
  kitchenExisting: "既存仕様",
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
  kitchenEndPanel: "エンドパネル",
  lightColor: "色",
  lightDiameter: "径",
  lightBodyColor: "本体色",
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

export function normalizeRoomLabel(label: string) {
  return label === "全体項目（必須で入れる）" ? "全体項目" : label;
}

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

export function translateSelectionValue(value: unknown) {
  if (typeof value === "boolean") return value ? "有" : "";
  const text = String(value);
  const commaParts = text.split(",").map((part) => part.trim()).filter(Boolean);
  if (commaParts.length > 1) return commaParts.map(translateSelectionValue).filter(Boolean).join("・");

  const mappedValue = VALUE_LABELS[text.toLowerCase()];
  if (mappedValue) return mappedValue;

  const translatedValue = text.replace(/\b[A-Z]+(?:_[A-Z]+)*(?:_\d+)?\b/g, (match) => {
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

export function formatNote(note?: string) {
  const trimmed = note?.trim() || "";
  return trimmed ? `※備考：${trimmed}` : "";
}

export function buildItemSelections(item: SelectedWorkItem) {
  const selections: DisplaySelection[] = [];
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
    const valueText = translateSelectionValue(value);
    if (!valueText || usedValues.has(valueText)) return;
    selections.push({ label: FIELD_LABELS[key] || key, value: valueText });
    usedValues.add(valueText);
  });

  return selections;
}

export function formatItemDisplayName(item: SelectedWorkItem, options?: { includeNote?: boolean }) {
  const selections = buildItemSelections(item);
  const parts = [item.title, ...selections.map((selection) => selection.value).filter(Boolean)];
  const note = options?.includeNote === false ? "" : formatNote(item.note);
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

export function formatItemSelectionSummary(item: SelectedWorkItem) {
  const details = buildItemSelections(item).map((selection) => selection.value);
  details.push(`数量${item.qty}`);
  details.push(`単位 ${item.unit || ""}`);
  details.push(`単価 ¥${Number(item.unitPrice || 0).toLocaleString()}`);
  return details.filter(Boolean).join("\n");
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
