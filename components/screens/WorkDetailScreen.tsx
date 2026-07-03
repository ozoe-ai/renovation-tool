"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useApp } from "@/lib/WizardContext";
import { getWorkItemsForRoom, getRoomTypeDef } from "@/lib/config";
import { TateguDetail } from "./TateguDetail";
import { StorageDetail } from "./StorageDetail";
import { StorageInsideSection, type StorageInsideState } from "./StorageInsideSection";
import { KitchenBodySection, type KitchenBodyState } from "./KitchenBodySection";
import { ProductSelectionSection, type ProductCandidate } from "./ProductSelectionSection";

const ROSETTE_IMAGE = "/images/dl照明/rosette.jpg";
const WASHITSU_SIZE_COUNT_OPTIONS = Array.from({ length: 10 }, (_, i) => `${i + 1}`);
const getWashitsuSizeValue = (value: string, prefix: "大" | "小") =>
  value.split(",").find((item) => item.startsWith(prefix))?.replace(prefix, "") ?? "";
const setWashitsuSizeValue = (value: string, prefix: "大" | "小", count: string) => {
  const otherPrefix = prefix === "大" ? "小" : "大";
  const otherValue = value.split(",").find((item) => item.startsWith(otherPrefix));
  const nextValue = getWashitsuSizeValue(value, prefix) === count ? "" : `${prefix}${count}`;
  return [nextValue, otherValue].filter(Boolean).join(",");
};

const instanceSuffix = (index?: number) => {
  if (!index) return "";
  const circled = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
  return circled[index - 1] ?? `(${index})`;
};

const parseIntegerQuantity = (value: string) => {
  if (value === "") return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
};

const UB_SIZES = ["1116", "1216", "1218", "1317", "1416", "1418", "1616", "1618", "1620", "1818", "1820", "その他手入力"];
const SENMEN_SIZES = ["W600", "W750", "W900", "W1000", "W1200"];
const PRODUCT_DATA: Record<"ub" | "senmen", ProductCandidate[]> = {
  senmen: [
    { id: "senmen-panasonic-w600-standard", maker: "Panasonic", name: "シーライン", size: "W600", spec: "一面鏡", price: 98000 },
    { id: "senmen-lixil-w600-standard", maker: "LIXIL", name: "オフト", size: "W600", spec: "一面鏡", price: 92000 },
    { id: "senmen-takara-w600-standard", maker: "タカラスタンダード", name: "オンディーヌ", size: "W600", spec: "一面鏡", price: 108000 },
    { id: "senmen-toto-w600-standard", maker: "TOTO", name: "Vシリーズ", size: "W600", spec: "一面鏡", price: 95000 },
    { id: "senmen-panasonic-w750-standard", maker: "Panasonic", name: "シーライン", size: "W750", spec: "三面鏡", price: 138000 },
    { id: "senmen-lixil-w750-standard", maker: "LIXIL", name: "ピアラ", size: "W750", spec: "三面鏡", price: 132000 },
    { id: "senmen-takara-w750-standard", maker: "タカラスタンダード", name: "ファミーユ", size: "W750", spec: "三面鏡", price: 152000 },
    { id: "senmen-toto-w750-standard", maker: "TOTO", name: "サクア", size: "W750", spec: "三面鏡", price: 145000 },
    { id: "senmen-panasonic-w900-standard", maker: "Panasonic", name: "シーライン", size: "W900", spec: "三面鏡", price: 178000 },
    { id: "senmen-lixil-w900-standard", maker: "LIXIL", name: "ピアラ", size: "W900", spec: "三面鏡", price: 169000 },
    { id: "senmen-takara-w900-standard", maker: "タカラスタンダード", name: "ファミーユ", size: "W900", spec: "三面鏡", price: 196000 },
    { id: "senmen-toto-w900-standard", maker: "TOTO", name: "サクア", size: "W900", spec: "三面鏡", price: 188000 },
    { id: "senmen-panasonic-w1000-standard", maker: "Panasonic", name: "シーライン", size: "W1000", spec: "三面鏡", price: 218000 },
    { id: "senmen-lixil-w1000-standard", maker: "LIXIL", name: "ルミシス", size: "W1000", spec: "三面鏡", price: 238000 },
    { id: "senmen-takara-w1000-standard", maker: "タカラスタンダード", name: "ファミーユ", size: "W1000", spec: "三面鏡", price: 226000 },
    { id: "senmen-toto-w1000-standard", maker: "TOTO", name: "オクターブ", size: "W1000", spec: "三面鏡", price: 248000 },
    { id: "senmen-panasonic-w1200-standard", maker: "Panasonic", name: "ラシス", size: "W1200", spec: "三面鏡", price: 298000 },
    { id: "senmen-lixil-w1200-standard", maker: "LIXIL", name: "ルミシス", size: "W1200", spec: "三面鏡", price: 318000 },
    { id: "senmen-takara-w1200-standard", maker: "タカラスタンダード", name: "エリーナ", size: "W1200", spec: "三面鏡", price: 338000 },
    { id: "senmen-toto-w1200-standard", maker: "TOTO", name: "エスクア", size: "W1200", spec: "三面鏡", price: 358000 },
  ],
  ub: [
    { id: "ub-panasonic-1116-standard", maker: "Panasonic", name: "オフローラ", size: "1116", spec: "標準仕様", price: 520000 },
    { id: "ub-lixil-1116-standard", maker: "LIXIL", name: "リノビオV", size: "1116", spec: "標準仕様", price: 510000 },
    { id: "ub-housetec-1116-standard", maker: "ハウステック", name: "ルクレ", size: "1116", spec: "標準仕様", price: 500000 },
    { id: "ub-panasonic-1216-standard", maker: "Panasonic", name: "オフローラ", size: "1216", spec: "標準仕様", price: 560000 },
    { id: "ub-lixil-1216-standard", maker: "LIXIL", name: "リノビオV", size: "1216", spec: "標準仕様", price: 548000 },
    { id: "ub-housetec-1216-standard", maker: "ハウステック", name: "ルクレ", size: "1216", spec: "標準仕様", price: 538000 },
    { id: "ub-panasonic-1218-standard", maker: "Panasonic", name: "オフローラ", size: "1218", spec: "標準仕様", price: 592000 },
    { id: "ub-lixil-1218-standard", maker: "LIXIL", name: "リノビオV", size: "1218", spec: "標準仕様", price: 580000 },
    { id: "ub-housetec-1218-standard", maker: "ハウステック", name: "ルクレ", size: "1218", spec: "標準仕様", price: 568000 },
    { id: "ub-panasonic-1317-standard", maker: "Panasonic", name: "オフローラ", size: "1317", spec: "標準仕様", price: 620000 },
    { id: "ub-lixil-1317-standard", maker: "LIXIL", name: "リノビオV", size: "1317", spec: "標準仕様", price: 608000 },
    { id: "ub-housetec-1317-standard", maker: "ハウステック", name: "ルクレ", size: "1317", spec: "標準仕様", price: 598000 },
    { id: "ub-panasonic-1416-standard", maker: "Panasonic", name: "オフローラ", size: "1416", spec: "標準仕様", price: 640000 },
    { id: "ub-lixil-1416-standard", maker: "LIXIL", name: "リノビオV", size: "1416", spec: "標準仕様", price: 628000 },
    { id: "ub-housetec-1416-standard", maker: "ハウステック", name: "ルクレ", size: "1416", spec: "標準仕様", price: 615000 },
    { id: "ub-panasonic-1418-standard", maker: "Panasonic", name: "オフローラ", size: "1418", spec: "標準仕様", price: 668000 },
    { id: "ub-lixil-1418-standard", maker: "LIXIL", name: "リノビオV", size: "1418", spec: "標準仕様", price: 654000 },
    { id: "ub-housetec-1418-standard", maker: "ハウステック", name: "ルクレ", size: "1418", spec: "標準仕様", price: 642000 },
    { id: "ub-panasonic-1616-standard", maker: "Panasonic", name: "オフローラ", size: "1616", spec: "標準仕様", price: 700000 },
    { id: "ub-lixil-1616-standard", maker: "LIXIL", name: "リノビオV", size: "1616", spec: "標準仕様", price: 688000 },
    { id: "ub-housetec-1616-standard", maker: "ハウステック", name: "ルクレ", size: "1616", spec: "標準仕様", price: 676000 },
    { id: "ub-panasonic-1618-standard", maker: "Panasonic", name: "オフローラ", size: "1618", spec: "標準仕様", price: 728000 },
    { id: "ub-lixil-1618-standard", maker: "LIXIL", name: "リノビオV", size: "1618", spec: "標準仕様", price: 716000 },
    { id: "ub-housetec-1618-standard", maker: "ハウステック", name: "ルクレ", size: "1618", spec: "標準仕様", price: 704000 },
    { id: "ub-panasonic-1620-standard", maker: "Panasonic", name: "オフローラ", size: "1620", spec: "標準仕様", price: 756000 },
    { id: "ub-lixil-1620-standard", maker: "LIXIL", name: "リノビオV", size: "1620", spec: "標準仕様", price: 742000 },
    { id: "ub-housetec-1620-standard", maker: "ハウステック", name: "ルクレ", size: "1620", spec: "標準仕様", price: 730000 },
    { id: "ub-panasonic-1818-standard", maker: "Panasonic", name: "オフローラ", size: "1818", spec: "標準仕様", price: 820000 },
    { id: "ub-lixil-1818-standard", maker: "LIXIL", name: "リデア", size: "1818", spec: "標準仕様", price: 805000 },
    { id: "ub-housetec-1818-standard", maker: "ハウステック", name: "フェリテ", size: "1818", spec: "標準仕様", price: 790000 },
    { id: "ub-panasonic-1820-standard", maker: "Panasonic", name: "ビバス", size: "1820", spec: "標準仕様", price: 880000 },
    { id: "ub-lixil-1820-standard", maker: "LIXIL", name: "リデア", size: "1820", spec: "標準仕様", price: 862000 },
    { id: "ub-housetec-1820-standard", maker: "ハウステック", name: "フェリテ", size: "1820", spec: "標準仕様", price: 848000 },
  ],
};
const TOILET_STORAGE_UI_OPTIONS = [
  { value: "kadodana", label: "可動棚" },
  { value: "upper", label: "アッパーキャビネット", dimension: "750～950 × 170 × 455", image: "/images/トイレ/収納/アッパーキャビネット.png" },
  { value: "corner", label: "コーナーミドルキャビネット", dimension: "160 × 150 × 880", image: "/images/トイレ/収納/コーナーミドルキャビネット.png" },
  { value: "middle", label: "サイドミドルキャビネット", dimension: "400 × 150 × 695", image: "/images/トイレ/収納/サイドミドルキャビネット.png" },
];
const TOILET_PAPER_HOLDER_SINGLE_IMAGES = [
  "/images/トイレ/紙巻き器/kamimaki1-1.png",
  "/images/トイレ/紙巻き器/kamimaki1-2.png",
  "/images/トイレ/紙巻き器/kamimaki1-3.png",
];
const TOILET_PAPER_HOLDER_DOUBLE_IMAGE = "/images/トイレ/紙巻き器/2renkamimaki.png";
const TOILET_PAPER_HOLDER_SINGLE_PRICES = [4500, 5200, 3900];
const TOILET_PAPER_HOLDER_DOUBLE_PRICE = 6800;
const TOILET_TOWEL_RING_IMAGES = [
  "/images/トイレ/タオルリング/taoruring1.png",
  "/images/トイレ/タオルリング/taoruringu2.png",
];
const TOILET_TOWEL_RING_PRICES = [2500, 3500];
const STORAGE_FRAME_IMAGES: Record<string, { label: string; image: string }> = {
  "ノン下レール三方枠": { label: "ノン下レール3方枠", image: "/images/廊下/廊下収納枠/折れ戸/nonsitare-ru3houwaku2.png" },
  "ノン下3方枠レール": { label: "ノン下レール3方枠", image: "/images/廊下/廊下収納枠/折れ戸/nonsitare-ru3houwaku2.png" },
  "四方枠": { label: "四方枠", image: "/images/廊下/廊下収納枠/折れ戸/sihouwaku2.png" },
  "三方枠": { label: "三方枠", image: "/images/廊下/廊下収納枠/折れ戸/zikadukesitare-ru3houwaku2.png" },
  "直付け下レール三方枠": { label: "三方枠", image: "/images/廊下/廊下収納枠/折れ戸/zikadukesitare-ru3houwaku2.png" },
  "直付け3方枠レール": { label: "三方枠", image: "/images/廊下/廊下収納枠/折れ戸/zikadukesitare-ru3houwaku2.png" },
};
const STORAGE_SPEC_IMAGES_BY_VALUE: Record<string, string> = {
  oredo: "/images/storage_spec/oredo.png",
  ryobiraki: "/images/storage_spec/ryobiraki.png",
};
const STORAGE_SPEC_IMAGES: Record<string, string> = {
  "折れ戸": "/images/storage_spec/oredo.png",
  "両開き": "/images/storage_spec/ryobiraki.png",
  "謚倥ｌ謌ｸ": "/images/storage_spec/oredo.png",
  "荳｡髢九″": "/images/storage_spec/ryobiraki.png",
};
const TATEGU_SPEC_IMAGES: Record<string, string> = {
  "片開き": "/images/tategu_spec/katabiraki_o1.png",
  "片引き": "/images/tategu_spec/katahiki_q1.png",
  "2枚引き違い戸": "/images/tategu_spec/nimai_hikichigai_u5.png",
  "2枚引き違い": "/images/tategu_spec/nimai_hikichigai_u5.png",
  "2枚片引き": "/images/tategu_spec/nimai_renndou_katahiki_u9.png",
  "2枚引き込み": "/images/tategu_spec/nimai_renndou_katahiki_u9.png",
  "3枚引き違い戸": "/images/tategu_spec/sanmai_hikichigai_u7.png",
  "3枚引き違い": "/images/tategu_spec/sanmai_hikichigai_u7.png",
  "3枚片引き": "/images/tategu_spec/sanmai_renndou_katahiki_u8.png",
  "迚・幕縺・": "/images/tategu_spec/katabiraki_o1.png",
  "迚・ｼ輔″": "/images/tategu_spec/katahiki_q1.png",
  "2譫壼ｼ輔″驕輔＞謌ｸ": "/images/tategu_spec/nimai_hikichigai_u5.png",
  "2譫壼ｼ輔″霎ｼ縺ｿ": "/images/tategu_spec/nimai_renndou_katahiki_u9.png",
  "2譫夂援蠑輔″": "/images/tategu_spec/nimai_renndou_katahiki_u9.png",
  "3譫壼ｼ輔″驕輔＞謌ｸ": "/images/tategu_spec/sanmai_hikichigai_u7.png",
  "3譫夂援蠑輔″": "/images/tategu_spec/sanmai_renndou_katahiki_u8.png",
};

const CONCENT_SWITCH_IMAGES: Record<string, string> = {
  round: "/images/全体項目/round.jpg",
  square: "/images/全体項目/square.jpg",
  advance: "/images/全体項目/advance.jpg",
};

const FLOOR_OPTION_IMAGES: Record<string, string> = {
  cf: "/images/floor_cf.png",
  flooring: "/images/floor_fl.png",
  ft: "/images/floor_ft.png",
};

function FloorSpecImage({ option, alt, className = "max-h-40" }: { option: string; alt: string; className?: string }) {
  const src = FLOOR_OPTION_IMAGES[option];
  if (!src) return null;
  return <img src={src} alt={alt} className={`${className} max-w-full object-contain mx-auto rounded`} />;
}

const CROSS_ROOM_WEIGHTS: Record<string, number> = {
  LD: 1.8,
  YOSHITSU: 1.0,
  WASHITSU: 1.0,
  WASHITSU_YOSHITSU: 1.0,
  TOILET: 0.35,
  SENMEN: 0.45,
  UB: 0.2,
  ROUKA: 0.6,
  KAIDAN: 0.8,
  GENKAN: 0.5,
};

const CROSS_SCOPES = ["壁のみ", "天井のみ", "天壁"] as const;
type CrossScope = typeof CROSS_SCOPES[number];

type CrossTargetRoom = {
  key: string;
  label: string;
  roomType: string;
  weight: number;
};

const makeProducts = (kind: "ub" | "senmen", size: string): ProductCandidate[] => {
  return PRODUCT_DATA[kind].filter((product) => product.size === size);
};

function SpecImageButton({
  active,
  className,
  image,
  label,
  onClick,
  disabled,
}: {
  active: boolean;
  className: string;
  image?: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {image && (
        <img
          src={image}
          alt={label}
          className={`mb-2 h-24 w-full max-w-36 rounded object-contain ${active ? "bg-white/90" : "bg-muted/30"}`}
        />
      )}
      {label}
    </button>
  );
}

export function WorkDetailScreen() {
  const { state, addWorkItem, setEditingWorkItem, setStep } = useApp();
  const item = state.editingWorkItem;

  // Find the master definition to get options
  const room = state.generatedRooms.find((r) => r.roomKey === item?.roomKey);
  const masterItems = room ? getWorkItemsForRoom(room.roomKey, room.roomType) : [];
  const masterDef = masterItems.find((m) => m.id === item?.workItemId);

  const [selectedOption, setSelectedOption] = useState(item?.selectedOption ?? "");
  const [selectedOptionLabel, setSelectedOptionLabel] = useState(item?.selectedOptionLabel ?? "");
  const [qty, setQty] = useState(item?.qty ?? 1);
  const [unit, setUnit] = useState(item?.unit ?? "式");
  const [unitPrice, setUnitPrice] = useState(item?.unitPrice ?? 0);
  const [itemNote, setItemNote] = useState(item?.note ?? "");
  const isZentaiCross = masterDef?.id.includes("zentai_cross") ?? false;
  const crossTargetRooms = useMemo<CrossTargetRoom[]>(() => {
    const rooms = state.generatedRooms
      .filter((r) => r.roomType !== "ZENTAI" && r.roomType !== "KITCHEN")
      .map((r) => ({
        key: r.roomKey,
        label: r.label,
        roomType: r.roomType,
        weight: CROSS_ROOM_WEIGHTS[r.roomType] ?? 0,
      }))
      .filter((r) => r.weight > 0);

    if (state.roomCountSettings?.kitchenType === "K" && !rooms.some((r) => r.roomType === "LD")) {
      return [
        {
          key: "K_AREA",
          label: "K",
          roomType: "LD",
          weight: CROSS_ROOM_WEIGHTS.LD,
        },
        ...rooms,
      ];
    }

    return rooms;
  }, [state.generatedRooms, state.roomCountSettings?.kitchenType]);
  const [crossTotalArea, setCrossTotalArea] = useState<number | undefined>(
    item?.crossTotalArea ?? state.roomCountSettings?.totalAreaSqm
  );
  const [crossCeilingHeight, setCrossCeilingHeight] = useState<number | undefined>(item?.crossCeilingHeight);
  const [crossScope, setCrossScope] = useState<CrossScope>((item?.crossScope as CrossScope | undefined) ?? "天壁");
  const [crossSelectedRoomKeys, setCrossSelectedRoomKeys] = useState<string[]>(() =>
    item?.crossTargetRooms !== undefined
      ? item.crossTargetRooms.split(",").filter(Boolean)
      : crossTargetRooms.map((r) => r.key)
  );
  const [crossEstimatedSqm, setCrossEstimatedSqm] = useState(item?.crossEstimatedSqm ?? 0);
  const [crossEstimatedMeters, setCrossEstimatedMeters] = useState(item?.crossEstimatedMeters ?? 0);
  const [crossQtyOverridden, setCrossQtyOverridden] = useState(item?.crossQtyOverridden ?? false);
  const [crossManualQty, setCrossManualQty] = useState<number | undefined>(item?.crossManualQty);

  // 玄関収納用の追加state
  const [storageWidth, setStorageWidth] = useState(item?.storageWidth ?? "");
  const [storageDepth, setStorageDepth] = useState(item?.storageDepth ?? "");
  const [storageShape, setStorageShape] = useState(item?.storageShape ?? "");
  const [storageMirror, setStorageMirror] = useState(item?.storageMirror ?? "");
  // 玄関収納形状別カスタム画像state
  const [storageShapeKonojiImage, setStorageShapeKonojiImage] = useState(item?.storageShapeKonojiImage ?? "");
  const [storageShapeNinojiImage, setStorageShapeNinojiImage] = useState(item?.storageShapeNinojiImage ?? "");
  const [storageShapeShitadaiImage, setStorageShapeShitadaiImage] = useState(item?.storageShapeShitadaiImage ?? "");
  const [storageShapeTallImage, setStorageShapeTallImage] = useState(item?.storageShapeTallImage ?? "");
  // 玄関関連の写真用state
  const [genkanDoorPhoto, setGenkanDoorPhoto] = useState(item?.genkanDoorPhoto ?? "");
  const [genkanFramePhoto, setGenkanFramePhoto] = useState(item?.genkanFramePhoto ?? "");
  const [genkanGuardPhoto, setGenkanGuardPhoto] = useState(item?.genkanGuardPhoto ?? "");
  const [genkanStopperPhoto, setGenkanStopperPhoto] = useState(item?.genkanStopperPhoto ?? "");
  const [genkanDomaPhoto, setGenkanDomaPhoto] = useState(item?.genkanDomaPhoto ?? "");
  const [storageMirrorKonojiPhoto, setStorageMirrorKonojiPhoto] = useState(item?.storageMirrorKonojiPhoto ?? "");
  const [storageMirrorTallPhoto, setStorageMirrorTallPhoto] = useState(item?.storageMirrorTallPhoto ?? "");
  const [genkanLightDlPhoto, setGenkanLightDlPhoto] = useState(item?.genkanLightDlPhoto ?? "");
  const [genkanLightBracketPhoto, setGenkanLightBracketPhoto] = useState(item?.genkanLightBracketPhoto ?? "");
  const [genkanLightColorDenkyu, setGenkanLightColorDenkyu] = useState(item?.genkanLightColorDenkyu ?? "");
  const [genkanLightColorChuhaku, setGenkanLightColorChuhaku] = useState(item?.genkanLightColorChuhaku ?? "");
  const [genkanLightColorOnhaku, setGenkanLightColorOnhaku] = useState(item?.genkanLightColorOnhaku ?? "");
  const [genkanLightBodyBlack, setGenkanLightBodyBlack] = useState(item?.genkanLightBodyBlack ?? "");
  const [genkanLightBodyWhite, setGenkanLightBodyWhite] = useState(item?.genkanLightBodyWhite ?? "");
  const [kamachiLPhoto, setKamachiLPhoto] = useState(item?.kamachiLPhoto ?? "");
  const [kamachiUsuPhoto, setKamachiUsuPhoto] = useState(item?.kamachiUsuPhoto ?? "");
  const [kamachiTilePhoto, setKamachiTilePhoto] = useState(item?.kamachiTilePhoto ?? "");
  const [kamachiSize, setKamachiSize] = useState(item?.kamachiSize ?? "");
  const [habakiWoodPhoto, setHabakiWoodPhoto] = useState(item?.habakiWoodPhoto ?? "");
  const [habakiSoftPhoto, setHabakiSoftPhoto] = useState(item?.habakiSoftPhoto ?? "");
  // 巾木単価用の追加state（土間の中で使用）
  const [habakiUnitPrice, setHabakiUnitPrice] = useState(item?.habakiUnitPrice ?? 0);
  // 玄関照明・廊下照明用の追加state
  const [lightCount, setLightCount] = useState<number | undefined>(item?.lightCount);
  const [lightColor, setLightColor] = useState(item?.lightColor ?? "");
  const [lightDiameter, setLightDiameter] = useState<number | undefined>(item?.lightDiameter);
  const [lightBodyColor, setLightBodyColor] = useState(item?.lightBodyColor ?? "");
  // 廊下床用の追加state
  const [roukaFloorCfPhoto, setRoukaFloorCfPhoto] = useState(item?.roukaFloorCfPhoto ?? "");
  const [roukaFloorFloortilePhoto, setRoukaFloorFloortilePhoto] = useState(item?.roukaFloorFloortilePhoto ?? "");
  const [roukaFloorFlooringPhoto, setRoukaFloorFlooringPhoto] = useState(item?.roukaFloorFlooringPhoto ?? "");
  // 廊下巾木用の追加state
  const [roukaHabakiWoodPhoto, setRoukaHabakiWoodPhoto] = useState(item?.roukaHabakiWoodPhoto ?? "");
  const [roukaHabakiSoftPhoto, setRoukaHabakiSoftPhoto] = useState(item?.roukaHabakiSoftPhoto ?? "");
  // 廊下収納用の追加state
  const [roukaStorageWidth, setRoukaStorageWidth] = useState(item?.roukaStorageWidth ?? "");
  const [roukaStorageDepth, setRoukaStorageDepth] = useState(item?.roukaStorageDepth ?? "");
  const [roukaStorageSpec, setRoukaStorageSpec] = useState(item?.roukaStorageSpec ?? "");
  const [roukaStorageType, setRoukaStorageType] = useState(item?.roukaStorageType ?? "");
  const [roukaStorageOredoPhoto, setRoukaStorageOredoPhoto] = useState(item?.roukaStorageOredoPhoto ?? "");
  const [roukaStorageRyobirakiPhoto, setRoukaStorageRyobirakiPhoto] = useState(item?.roukaStorageRyobirakiPhoto ?? "");
  const [roukaStorageFrame, setRoukaStorageFrame] = useState(item?.roukaStorageFrame ?? "");
  const [roukaStorageFramePhoto, setRoukaStorageFramePhoto] = useState(item?.roukaStorageFramePhoto ?? "");
  const [roukaStorageOredoW, setRoukaStorageOredoW] = useState(item?.roukaStorageOredoW ?? "");
  const [roukaStorageOredoH, setRoukaStorageOredoH] = useState(item?.roukaStorageOredoH ?? "");
  const [roukaStorageRyobirakiW, setRoukaStorageRyobirakiW] = useState(item?.roukaStorageRyobirakiW ?? "");
  const [roukaStorageRyobirakiH, setRoukaStorageRyobirakiH] = useState(item?.roukaStorageRyobirakiH ?? "");
  // 廊下収納内部用の追加state
  const [roukaStorageInsideKadodanaPhoto, setRoukaStorageInsideKadodanaPhoto] = useState(item?.roukaStorageInsideKadodanaPhoto ?? "");
  // 廊下収納内部の複数選択用state：selectedOptionを配列に分割して初期化
  const [roukaStorageInsideMultiple, setRoukaStorageInsideMultiple] = useState<string[]>(
    item?.selectedOption === "kadodana" &&
      !item?.roukaStorageInsideKadodanaPhoto &&
      !item?.roukaStorageInsideKadodanaW &&
      !item?.roukaStorageInsideKadodanaD &&
      !item?.roukaStorageInsideKadodanaSteps
      ? []
      : item?.selectedOption && typeof item.selectedOption === "string" && item.selectedOption.includes(",")
        ? item.selectedOption.split(",")
        : (item?.selectedOption ? [item.selectedOption] : [])
  );
  const [roukaStorageInsideMakuradanaPhoto, setRoukaStorageInsideMakuradanaPhoto] = useState(item?.roukaStorageInsideMakuradanaPhoto ?? "");
  const [roukaStorageInsideHpPhoto, setRoukaStorageInsideHpPhoto] = useState(item?.roukaStorageInsideHpPhoto ?? "");
  const [roukaStorageInsideChuudanPhoto, setRoukaStorageInsideChuudanPhoto] = useState(item?.roukaStorageInsideChuudanPhoto ?? "");
  const [roukaStorageInsideKadodanaFixMethod, setRoukaStorageInsideKadodanaFixMethod] = useState(item?.roukaStorageInsideKadodanaFixMethod ?? "");
  const [roukaStorageInsideKadodanaColor, setRoukaStorageInsideKadodanaColor] = useState(item?.roukaStorageInsideKadodanaColor ?? "");
  const [roukaStorageInsideKadodanaW, setRoukaStorageInsideKadodanaW] = useState<number | undefined>(item?.roukaStorageInsideKadodanaW);
  const [roukaStorageInsideKadodanaD, setRoukaStorageInsideKadodanaD] = useState(item?.roukaStorageInsideKadodanaD ?? "");
  const [roukaStorageInsideKadodanaSteps, setRoukaStorageInsideKadodanaSteps] = useState<number | undefined>(item?.roukaStorageInsideKadodanaSteps);
  const [roukaStorageInsideMakuradanaW, setRoukaStorageInsideMakuradanaW] = useState(item?.roukaStorageInsideMakuradanaW ?? "");
  const [roukaStorageInsideChuudanW, setRoukaStorageInsideChuudanW] = useState(item?.roukaStorageInsideChuudanW ?? "");
  // 旧廊下収納内部用の追加state
  const [storageInsideSteps, setStorageInsideSteps] = useState<number | undefined>(item?.storageInsideSteps);
  const [storageInsideDepth, setStorageInsideDepth] = useState<number | undefined>(item?.storageInsideDepth);
  const [storageInsideWidth, setStorageInsideWidth] = useState<number | undefined>(item?.storageInsideWidth);
  // キッチン本体用の追加state
  const [kitchenBodyWidth, setKitchenBodyWidth] = useState<number | undefined>(item?.kitchenBodyWidth);
  const [kitchenRelocation, setKitchenRelocation] = useState(item?.kitchenRelocation ?? "");
  const [kitchenExisting, setKitchenExisting] = useState(item?.kitchenExisting ?? "");
  const [kitchenShape, setKitchenShape] = useState(item?.kitchenShape ?? "");
  const [kitchenDepth, setKitchenDepth] = useState(item?.kitchenDepth ?? "");
  const [kitchenWidth, setKitchenWidth] = useState(item?.kitchenWidth ?? "");
  const [kitchenHeating, setKitchenHeating] = useState(item?.kitchenHeating ?? "");
  const [kitchenDrawer, setKitchenDrawer] = useState(item?.kitchenDrawer ?? "");
  const [kitchenEndPanel, setKitchenEndPanel] = useState(item?.kitchenEndPanel ?? "");
  const [kitchenLSize, setKitchenLSize] = useState(item?.kitchenLSize ?? "");
  const [kitchenWallCabinet, setKitchenWallCabinet] = useState(item?.kitchenWallCabinet ?? "");
  const [kitchenWallCabinetHeight, setKitchenWallCabinetHeight] = useState(item?.kitchenWallCabinetHeight ?? "");
  const [kitchenDishwasherExisting, setKitchenDishwasherExisting] = useState(item?.kitchenDishwasherExisting ?? "");
  const [kitchenDishwasherAfter, setKitchenDishwasherAfter] = useState(item?.kitchenDishwasherAfter ?? "");
  const [kitchenWorktop, setKitchenWorktop] = useState(item?.kitchenWorktop ?? "");
  const [kitchenSink, setKitchenSink] = useState(item?.kitchenSink ?? "");
  const [kitchenSelectedMaker, setKitchenSelectedMaker] = useState(item?.kitchenSelectedMaker ?? "");
  const [kitchenMakerPhotos, setKitchenMakerPhotos] = useState<Record<string, string>>(item?.kitchenMakerPhotos ?? {});
  // 吊戸用の追加state
  const [tsuritoHeight, setTsuritoHeight] = useState<number | undefined>(item?.tsuritoHeight);
  // 食洗機用の追加state
  const [dishwasherExistK, setDishwasherExistK] = useState(item?.dishwasherExistK ?? "");
  // ワークトップ用の追加state
  const [worktopDrawerType, setWorktopDrawerType] = useState(item?.worktopDrawerType ?? "");
  // 洋室入口建具用の追加state
  const [yoshitsuIriguchiW, setYoshitsuIriguchiW] = useState(item?.yoshitsuIriguchiW ?? "");
  const [yoshitsuIriguchiD, setYoshitsuIriguchiD] = useState(item?.yoshitsuIriguchiD ?? "");
  const [yoshitsuIriguchiSpec, setYoshitsuIriguchiSpec] = useState(item?.yoshitsuIriguchiSpec ?? "");
  // 洋室入口段差用の追加state
  const [yoshitsuDansaMm, setYoshitsuDansaMm] = useState<number | undefined>(item?.yoshitsuDansaMm);
  // 洋室収納用の追加state
  const [yoshitsuStorageW, setYoshitsuStorageW] = useState(item?.yoshitsuStorageW ?? "");
  const [yoshitsuStorageD, setYoshitsuStorageD] = useState(item?.yoshitsuStorageD ?? "");
  const [yoshitsuStorageSpec, setYoshitsuStorageSpec] = useState(item?.yoshitsuStorageSpec ?? "");
  const [yoshitsuStorageKadodana, setYoshitsuStorageKadodana] = useState(item?.yoshitsuStorageKadodana ?? "");
  const [yoshitsuStorageTanabashira, setYoshitsuStorageTanabashira] = useState(item?.yoshitsuStorageTanabashira ?? "");
  // 洋室収納内部用の追加state（旧・互換性維持）
  const [yoshitsuStorageInsideSteps, setYoshitsuStorageInsideSteps] = useState<number | undefined>(item?.yoshitsuStorageInsideSteps);
  const [yoshitsuStorageInsideD, setYoshitsuStorageInsideD] = useState<number | undefined>(item?.yoshitsuStorageInsideD);
  const [yoshitsuStorageInsideW, setYoshitsuStorageInsideW] = useState<number | undefined>(item?.yoshitsuStorageInsideW);

  // ===== LDK 収納内部 新stateブロック（StorageInsideSection対応） =====
  const [ldkStorageInsideSelections, setLdkStorageInsideSelections] = useState<string[]>(
    item?.ldkStorageInsideSelections ? item.ldkStorageInsideSelections.split(",").filter(Boolean) : []
  );
  const [ldkStorageInsideKadodanaSteps, setLdkStorageInsideKadodanaSteps] = useState<number | undefined>(item?.ldkStorageInsideKadodanaSteps);
  const [ldkStorageInsideKadodanaW, setLdkStorageInsideKadodanaW] = useState(item?.ldkStorageInsideKadodanaW ?? "");
  const [ldkStorageInsideKadodanaW_custom, setLdkStorageInsideKadodanaW_custom] = useState<number | undefined>(item?.ldkStorageInsideKadodanaW_custom);
  const [ldkStorageInsideKadodanaD, setLdkStorageInsideKadodanaD] = useState(item?.ldkStorageInsideKadodanaD ?? "");
  const [ldkStorageInsideKadodanaD_custom, setLdkStorageInsideKadodanaD_custom] = useState<number | undefined>(item?.ldkStorageInsideKadodanaD_custom);
  const [ldkStorageInsideKadodanaMethod, setLdkStorageInsideKadodanaMethod] = useState(item?.ldkStorageInsideKadodanaMethod ?? "");
  const [ldkStorageInsideKadodanaRailH, setLdkStorageInsideKadodanaRailH] = useState(item?.ldkStorageInsideKadodanaRailH ?? "");
  const [ldkStorageInsideKadodanaRailColor, setLdkStorageInsideKadodanaRailColor] = useState(item?.ldkStorageInsideKadodanaRailColor ?? "");
  const [ldkStorageInsideMakuradanaW, setLdkStorageInsideMakuradanaW] = useState(item?.ldkStorageInsideMakuradanaW ?? "");
  const [ldkStorageInsideHpW, setLdkStorageInsideHpW] = useState<number | undefined>(item?.ldkStorageInsideHpW);
  const [ldkStorageInsideMakuradanaHpW, setLdkStorageInsideMakuradanaHpW] = useState(item?.ldkStorageInsideMakuradanaHpW ?? "");
  const [ldkStorageInsideChudanNote, setLdkStorageInsideChudanNote] = useState(item?.ldkStorageInsideChudanNote ?? "");
  const [ldkStorageInsideMakuradanaCategory, setLdkStorageInsideMakuradanaCategory] = useState(item?.ldkStorageInsideMakuradanaCategory ?? "");
  const [ldkStorageInsideMakuradanaSize, setLdkStorageInsideMakuradanaSize] = useState(item?.ldkStorageInsideMakuradanaSize ?? "");
  const [ldkStorageInsideMakuradanaDimensions, setLdkStorageInsideMakuradanaDimensions] = useState(item?.ldkStorageInsideMakuradanaDimensions ?? "");
  const [ldkStorageInsideMakuradanaPrice, setLdkStorageInsideMakuradanaPrice] = useState<number | undefined>(item?.ldkStorageInsideMakuradanaPrice);
  const [ldkStorageInsideHpCategory, setLdkStorageInsideHpCategory] = useState(item?.ldkStorageInsideHpCategory ?? "");
  const [ldkStorageInsideHpLength, setLdkStorageInsideHpLength] = useState(item?.ldkStorageInsideHpLength ?? "");
  const [ldkStorageInsideHpPrice, setLdkStorageInsideHpPrice] = useState<number | undefined>(item?.ldkStorageInsideHpPrice);
  const [ldkStorageInsideMakuradanaHpShelfCategory, setLdkStorageInsideMakuradanaHpShelfCategory] = useState(item?.ldkStorageInsideMakuradanaHpShelfCategory ?? "");
  const [ldkStorageInsideMakuradanaHpShelfSize, setLdkStorageInsideMakuradanaHpShelfSize] = useState(item?.ldkStorageInsideMakuradanaHpShelfSize ?? "");
  const [ldkStorageInsideMakuradanaHpShelfDimensions, setLdkStorageInsideMakuradanaHpShelfDimensions] = useState(item?.ldkStorageInsideMakuradanaHpShelfDimensions ?? "");
  const [ldkStorageInsideMakuradanaHpShelfPrice, setLdkStorageInsideMakuradanaHpShelfPrice] = useState<number | undefined>(item?.ldkStorageInsideMakuradanaHpShelfPrice);
  const [ldkStorageInsideMakuradanaHpHpCategory, setLdkStorageInsideMakuradanaHpHpCategory] = useState(item?.ldkStorageInsideMakuradanaHpHpCategory ?? "");
  const [ldkStorageInsideMakuradanaHpHpLength, setLdkStorageInsideMakuradanaHpHpLength] = useState(item?.ldkStorageInsideMakuradanaHpHpLength ?? "");
  const [ldkStorageInsideMakuradanaHpHpPrice, setLdkStorageInsideMakuradanaHpHpPrice] = useState<number | undefined>(item?.ldkStorageInsideMakuradanaHpHpPrice);
  const [ldkStorageInsideChudanCategory, setLdkStorageInsideChudanCategory] = useState(item?.ldkStorageInsideChudanCategory ?? "");
  const [ldkStorageInsideChudanSize, setLdkStorageInsideChudanSize] = useState(item?.ldkStorageInsideChudanSize ?? "");
  const [ldkStorageInsideChudanDimensions, setLdkStorageInsideChudanDimensions] = useState(item?.ldkStorageInsideChudanDimensions ?? "");
  const [ldkStorageInsideChudanPrice, setLdkStorageInsideChudanPrice] = useState<number | undefined>(item?.ldkStorageInsideChudanPrice);
  const [ldkStorageInsideKadodanaPhoto, setLdkStorageInsideKadodanaPhoto] = useState(item?.ldkStorageInsideKadodanaPhoto ?? "");
  const [ldkStorageInsideMakuradanaPhoto, setLdkStorageInsideMakuradanaPhoto] = useState(item?.ldkStorageInsideMakuradanaPhoto ?? "");
  const [ldkStorageInsideHpPhoto, setLdkStorageInsideHpPhoto] = useState(item?.ldkStorageInsideHpPhoto ?? "");
  const [ldkStorageInsideMakuradanaHpPhoto, setLdkStorageInsideMakuradanaHpPhoto] = useState(item?.ldkStorageInsideMakuradanaHpPhoto ?? "");
  const [ldkStorageInsideChudanPhoto, setLdkStorageInsideChudanPhoto] = useState(item?.ldkStorageInsideChudanPhoto ?? "");

  // ===== 洋室 収納内部 新stateブロック（StorageInsideSection対応） =====
  const [yoshitsuStorageInsideSelections, setYoshitsuStorageInsideSelections] = useState<string[]>(
    item?.yoshitsuStorageInsideSelections ? item.yoshitsuStorageInsideSelections.split(",").filter(Boolean) : []
  );
  const [yoshitsuStorageInsideKadodanaSteps, setYoshitsuStorageInsideKadodanaSteps] = useState<number | undefined>(item?.yoshitsuStorageInsideKadodanaSteps);
  const [yoshitsuStorageInsideKadodanaW, setYoshitsuStorageInsideKadodanaW] = useState(item?.yoshitsuStorageInsideKadodanaW ?? "");
  const [yoshitsuStorageInsideKadodanaW_custom, setYoshitsuStorageInsideKadodanaW_custom] = useState<number | undefined>(item?.yoshitsuStorageInsideKadodanaW_custom);
  const [yoshitsuStorageInsideKadodanaD, setYoshitsuStorageInsideKadodanaD] = useState(item?.yoshitsuStorageInsideKadodanaD ?? "");
  const [yoshitsuStorageInsideKadodanaD_custom, setYoshitsuStorageInsideKadodanaD_custom] = useState<number | undefined>(item?.yoshitsuStorageInsideKadodanaD_custom);
  const [yoshitsuStorageInsideKadodanaMethod, setYoshitsuStorageInsideKadodanaMethod] = useState(item?.yoshitsuStorageInsideKadodanaMethod ?? "");
  const [yoshitsuStorageInsideKadodanaRailH, setYoshitsuStorageInsideKadodanaRailH] = useState(item?.yoshitsuStorageInsideKadodanaRailH ?? "");
  const [yoshitsuStorageInsideKadodanaRailColor, setYoshitsuStorageInsideKadodanaRailColor] = useState(item?.yoshitsuStorageInsideKadodanaRailColor ?? "");
  const [yoshitsuStorageInsideMakuradanaW, setYoshitsuStorageInsideMakuradanaW] = useState(item?.yoshitsuStorageInsideMakuradanaW ?? "");
  const [yoshitsuStorageInsideHpW, setYoshitsuStorageInsideHpW] = useState<number | undefined>(item?.yoshitsuStorageInsideHpW);
  const [yoshitsuStorageInsideMakuradanaHpW, setYoshitsuStorageInsideMakuradanaHpW] = useState(item?.yoshitsuStorageInsideMakuradanaHpW ?? "");
  const [yoshitsuStorageInsideChudanNote, setYoshitsuStorageInsideChudanNote] = useState(item?.yoshitsuStorageInsideChudanNote ?? "");
  const [yoshitsuStorageInsideMakuradanaCategory, setYoshitsuStorageInsideMakuradanaCategory] = useState(item?.yoshitsuStorageInsideMakuradanaCategory ?? "");
  const [yoshitsuStorageInsideMakuradanaSize, setYoshitsuStorageInsideMakuradanaSize] = useState(item?.yoshitsuStorageInsideMakuradanaSize ?? "");
  const [yoshitsuStorageInsideMakuradanaDimensions, setYoshitsuStorageInsideMakuradanaDimensions] = useState(item?.yoshitsuStorageInsideMakuradanaDimensions ?? "");
  const [yoshitsuStorageInsideMakuradanaPrice, setYoshitsuStorageInsideMakuradanaPrice] = useState<number | undefined>(item?.yoshitsuStorageInsideMakuradanaPrice);
  const [yoshitsuStorageInsideHpCategory, setYoshitsuStorageInsideHpCategory] = useState(item?.yoshitsuStorageInsideHpCategory ?? "");
  const [yoshitsuStorageInsideHpLength, setYoshitsuStorageInsideHpLength] = useState(item?.yoshitsuStorageInsideHpLength ?? "");
  const [yoshitsuStorageInsideHpPrice, setYoshitsuStorageInsideHpPrice] = useState<number | undefined>(item?.yoshitsuStorageInsideHpPrice);
  const [yoshitsuStorageInsideMakuradanaHpShelfCategory, setYoshitsuStorageInsideMakuradanaHpShelfCategory] = useState(item?.yoshitsuStorageInsideMakuradanaHpShelfCategory ?? "");
  const [yoshitsuStorageInsideMakuradanaHpShelfSize, setYoshitsuStorageInsideMakuradanaHpShelfSize] = useState(item?.yoshitsuStorageInsideMakuradanaHpShelfSize ?? "");
  const [yoshitsuStorageInsideMakuradanaHpShelfDimensions, setYoshitsuStorageInsideMakuradanaHpShelfDimensions] = useState(item?.yoshitsuStorageInsideMakuradanaHpShelfDimensions ?? "");
  const [yoshitsuStorageInsideMakuradanaHpShelfPrice, setYoshitsuStorageInsideMakuradanaHpShelfPrice] = useState<number | undefined>(item?.yoshitsuStorageInsideMakuradanaHpShelfPrice);
  const [yoshitsuStorageInsideMakuradanaHpHpCategory, setYoshitsuStorageInsideMakuradanaHpHpCategory] = useState(item?.yoshitsuStorageInsideMakuradanaHpHpCategory ?? "");
  const [yoshitsuStorageInsideMakuradanaHpHpLength, setYoshitsuStorageInsideMakuradanaHpHpLength] = useState(item?.yoshitsuStorageInsideMakuradanaHpHpLength ?? "");
  const [yoshitsuStorageInsideMakuradanaHpHpPrice, setYoshitsuStorageInsideMakuradanaHpHpPrice] = useState<number | undefined>(item?.yoshitsuStorageInsideMakuradanaHpHpPrice);
  const [yoshitsuStorageInsideChudanCategory, setYoshitsuStorageInsideChudanCategory] = useState(item?.yoshitsuStorageInsideChudanCategory ?? "");
  const [yoshitsuStorageInsideChudanSize, setYoshitsuStorageInsideChudanSize] = useState(item?.yoshitsuStorageInsideChudanSize ?? "");
  const [yoshitsuStorageInsideChudanDimensions, setYoshitsuStorageInsideChudanDimensions] = useState(item?.yoshitsuStorageInsideChudanDimensions ?? "");
  const [yoshitsuStorageInsideChudanPrice, setYoshitsuStorageInsideChudanPrice] = useState<number | undefined>(item?.yoshitsuStorageInsideChudanPrice);
  const [yoshitsuStorageInsideKadodanaPhoto, setYoshitsuStorageInsideKadodanaPhoto] = useState(item?.yoshitsuStorageInsideKadodanaPhoto ?? "");
  const [yoshitsuStorageInsideMakuradanaPhoto, setYoshitsuStorageInsideMakuradanaPhoto] = useState(item?.yoshitsuStorageInsideMakuradanaPhoto ?? "");
  const [yoshitsuStorageInsideHpPhoto, setYoshitsuStorageInsideHpPhoto] = useState(item?.yoshitsuStorageInsideHpPhoto ?? "");
  const [yoshitsuStorageInsideMakuradanaHpPhoto, setYoshitsuStorageInsideMakuradanaHpPhoto] = useState(item?.yoshitsuStorageInsideMakuradanaHpPhoto ?? "");
  const [yoshitsuStorageInsideChudanPhoto, setYoshitsuStorageInsideChudanPhoto] = useState(item?.yoshitsuStorageInsideChudanPhoto ?? "");

  // 洋室網戸用の追加state
  const [yoshitsuAmidoColor, setYoshitsuAmidoColor] = useState(item?.yoshitsuAmidoColor ?? "");
  // 全体項目：給湯器用の追加state
  const [kyutoukiHinban, setKyutoukiHinban] = useState(item?.kyutoukiHinban ?? "");
  // 和室用の追加state
  const [washitsuYoushitsuTatamiMm, setWashitsuYoushitsuTatamiMm] = useState<number | undefined>(item?.washitsuYoushitsuTatamiMm);
  const [washitsuShojiRailFinish, setWashitsuShojiRailFinish] = useState(item?.washitsuShojiRailFinish ?? "");
  const [washitsuCeilingType, setWashitsuCeilingType] = useState(item?.washitsuCeilingType ?? "");
  const [washitsuLightDl, setWashitsuLightDl] = useState<number | undefined>(item?.washitsuLightDl);
  const [washitsuLightColor, setWashitsuLightColor] = useState(item?.washitsuLightColor ?? "");
  const [washitsuOshiireW, setWashitsuOshiireW] = useState<number | undefined>(item?.washitsuOshiireW);
  const [washitsuOshiireH, setWashitsuOshiireH] = useState<number | undefined>(item?.washitsuOshiireH);
  const [washitsuOshiireMikomi, setWashitsuOshiireMikomi] = useState<number | undefined>(item?.washitsuOshiireMikomi);
  const [washitsuTatami, setWashitsuTatami] = useState(item?.washitsuTatami ?? "");
  const [washitsuTatamiBeri, setWashitsuTatamiBeri] = useState(item?.washitsuTatamiBeri ?? "");
  const [washitsuFusumaSize, setWashitsuFusumaSize] = useState(item?.washitsuFusumaSize ?? "");
  const [washitsuFusumaCount, setWashitsuFusumaCount] = useState(item?.washitsuFusumaCount ?? "");
  const [washitsuShojiSize, setWashitsuShojiSize] = useState(item?.washitsuShojiSize ?? "");
  const [washitsuShojiCount, setWashitsuShojiCount] = useState(item?.washitsuShojiCount ?? "");
  const [washitsuMawabuchiDetail, setWashitsuMawabuchiDetail] = useState(item?.washitsuMawabuchiDetail ?? "");
  const [washitsuLightNoSwitchOption, setWashitsuLightNoSwitchOption] = useState(item?.washitsuLightNoSwitchOption ?? "");
  const [kaidanPhoto, setKaidanPhoto] = useState(item?.kaidanPhoto ?? "");
  const [kaidanLightRosette, setKaidanLightRosette] = useState(item?.kaidanLightRosette ?? false);
  const [kaidanLightDlType, setKaidanLightDlType] = useState(item?.kaidanLightDlType ?? "");
  const [kaidanLightIndirect, setKaidanLightIndirect] = useState(item?.kaidanLightIndirect ?? "");
  const [kaidanLightIndirectPhoto, setKaidanLightIndirectPhoto] = useState(item?.kaidanLightIndirectPhoto ?? "");
  const [kaidanLightRosettePhoto, setKaidanLightRosettePhoto] = useState(item?.kaidanLightRosettePhoto ?? "");
  const [kaidanLightDlPhoto, setKaidanLightDlPhoto] = useState(item?.kaidanLightDlPhoto ?? "");
  // UB用の追加state
  const [ubBodySize, setUbBodySize] = useState(item?.ubBodySize ?? "");
  const [ubBodySizeCustom, setUbBodySizeCustom] = useState(item?.ubBodySizeCustom ?? "");
  const [ubSelectedProduct, setUbSelectedProduct] = useState(item?.ubSelectedProduct ?? "");
  const [ubMakerPhotos, setUbMakerPhotos] = useState<Record<string, string>>(item?.ubMakerPhotos ?? {});
  const [ubBodyKeepType, setUbBodyKeepType] = useState(item?.ubBodyKeepType ?? "");
  const [ubBodyEnergyType, setUbBodyEnergyType] = useState(item?.ubBodyEnergyType ?? "");
  const [ubDryerEnergyType, setUbDryerEnergyType] = useState(item?.ubDryerEnergyType ?? "");
  const [ubVentSpec, setUbVentSpec] = useState(item?.ubVentSpec ?? "");
  const [ubExistingHotwater, setUbExistingHotwater] = useState(item?.ubExistingHotwater ?? "");
  const [ubAfterHotwater, setUbAfterHotwater] = useState(item?.ubAfterHotwater ?? "");
  // 洗面室用の追加state
  const [senmenBodyW, setSenmenBodyW] = useState<number | undefined>(item?.senmenBodyW);
  const [senmenBodySize, setSenmenBodySize] = useState(item?.senmenBodySize ?? "");
  const [senmenSelectedProduct, setSenmenSelectedProduct] = useState(item?.senmenSelectedProduct ?? "");
  const [senmenMakerPhotos, setSenmenMakerPhotos] = useState<Record<string, string>>(item?.senmenMakerPhotos ?? {});
  const [senmenWashingPanSize, setSenmenWashingPanSize] = useState(item?.senmenWashingPanSize ?? "");
  const [senmenWashingPanSizeCustom, setSenmenWashingPanSizeCustom] = useState(item?.senmenWashingPanSizeCustom ?? "");
  const [senmenHeightMm, setSenmenHeightMm] = useState<number | undefined>(item?.senmenHeightMm);
  // トイレ用の追加state
  const [toiletBodyW, setToiletBodyW] = useState<number | undefined>(item?.toiletBodyW);
  const [toiletBodyPhoto, setToiletBodyPhoto] = useState(item?.toiletBodyPhoto ?? "");
  const [toiletDrainage, setToiletDrainage] = useState(item?.toiletDrainage ?? "");
  const [toiletFloorDrainMm, setToiletFloorDrainMm] = useState(item?.toiletFloorDrainMm ?? "");
  const [toiletFloorDrainCustomMm, setToiletFloorDrainCustomMm] = useState<number | undefined>(item?.toiletFloorDrainCustomMm);
  const [toiletWallDrainMm, setToiletWallDrainMm] = useState(item?.toiletWallDrainMm ?? "");
  const [toiletHaisuiWallMm, setToiletHaisuiWallMm] = useState<number | undefined>(item?.toiletHaisuiWallMm);
  const [toiletHaisuiFloorMm, setToiletHaisuiFloorMm] = useState<number | undefined>(item?.toiletHaisuiFloorMm);
  // LD用の追加state（洋室と同一ロジック流用）
  const [ldIriguchiW, setLdIriguchiW] = useState(item?.ldIriguchiW ?? "");
  const [ldIriguchiD, setLdIriguchiD] = useState(item?.ldIriguchiD ?? "");
  const [ldIriguchiSpec, setLdIriguchiSpec] = useState(item?.ldIriguchiSpec ?? "");
  const [ldDansaMm, setLdDansaMm] = useState<number | undefined>(item?.ldDansaMm);
  // LD収納用の追加state（修正版）
  const [ldStorageKeepW, setLdStorageKeepW] = useState<number | undefined>(item?.ldStorageKeepW);
  const [ldStorageKeepH, setLdStorageKeepH] = useState<number | undefined>(item?.ldStorageKeepH);
  const [ldStorageKeepD, setLdStorageKeepD] = useState<number | undefined>(item?.ldStorageKeepD);
  const [ldStorageKeepSpec, setLdStorageKeepSpec] = useState(item?.ldStorageKeepSpec ?? "");
  const [ldStorageChangeW, setLdStorageChangeW] = useState<number | undefined>(item?.ldStorageChangeW);
  const [ldStorageChangeH, setLdStorageChangeH] = useState<number | undefined>(item?.ldStorageChangeH);
  const [ldStorageChangeD, setLdStorageChangeD] = useState<number | undefined>(item?.ldStorageChangeD);
  const [ldStorageChangeSpec, setLdStorageChangeSpec] = useState(item?.ldStorageChangeSpec ?? "");
  // ��state（互換性維持）
  const [ldStorageW, setLdStorageW] = useState(item?.ldStorageW ?? "");
  const [ldStorageD, setLdStorageD] = useState(item?.ldStorageD ?? "");
  const [ldStorageSpec, setLdStorageSpec] = useState(item?.ldStorageSpec ?? "");
  const [ldStorageKadodana, setLdStorageKadodana] = useState(item?.ldStorageKadodana ?? "");
  const [ldStorageTanabashira, setLdStorageTanabashira] = useState(item?.ldStorageTanabashira ?? "");
  const [ldStorageInsideSteps, setLdStorageInsideSteps] = useState<number | undefined>(item?.ldStorageInsideSteps);
  const [ldStorageInsideD, setLdStorageInsideD] = useState<number | undefined>(item?.ldStorageInsideD);
  const [ldStorageInsideW, setLdStorageInsideW] = useState<number | undefined>(item?.ldStorageInsideW);
  const [ldAmidoColor, setLdAmidoColor] = useState(item?.ldAmidoColor ?? "");
  // UB既存項目用の追加state
  const [ubKizonsetsubiEnergyType, setUbKizonsetsubiEnergyType] = useState(item?.ubKizonsetsubiEnergyType ?? "");
  // 洗面室用の���加state（洋室と同一ロジック流用）
  const [senmenIriguchiW, setSenmenIriguchiW] = useState(item?.senmenIriguchiW ?? "");
  const [senmenIriguchiD, setSenmenIriguchiD] = useState(item?.senmenIriguchiD ?? "");
  const [senmenIriguchiSpec, setSenmenIriguchiSpec] = useState(item?.senmenIriguchiSpec ?? "");
  const [senmenDansaMm, setSenmenDansaMm] = useState<number | undefined>(item?.senmenDansaMm);
  // トイレ用の追加state（洋室と同一ロジック流用）
  const [toiletIriguchiW, setToiletIriguchiW] = useState(item?.toiletIriguchiW ?? "");
  const [toiletIriguchiD, setToiletIriguchiD] = useState(item?.toiletIriguchiD ?? "");
  const [toiletIriguchiSpec, setToiletIriguchiSpec] = useState(item?.toiletIriguchiSpec ?? "");
  const [toiletDansaMm, setToiletDansaMm] = useState<number | undefined>(item?.toiletDansaMm);
  const [toiletStorageSelections, setToiletStorageSelections] = useState<string[]>(
    item?.toiletStorageSelections
      ? item.toiletStorageSelections.split(",").filter(Boolean)
      : item?.selectedOption && ["kadodana", "upper", "corner", "middle"].includes(item.selectedOption)
        ? [item.selectedOption]
        : []
  );
  const [toiletPaperHolderType, setToiletPaperHolderType] = useState(item?.toiletPaperHolderType ?? "");
  const [toiletPaperHolderSinglePhotos, setToiletPaperHolderSinglePhotos] = useState<string[]>(item?.toiletPaperHolderSinglePhotos ?? []);
  const [toiletPaperHolderDoublePhoto, setToiletPaperHolderDoublePhoto] = useState(item?.toiletPaperHolderDoublePhoto ?? "");
  const [toiletTowelRingPhotos, setToiletTowelRingPhotos] = useState<string[]>(item?.toiletTowelRingPhotos ?? []);

  // ===== コンセント・スイッチプレート state =====
  const [concentSwitchType, setConcentSwitchType] = useState(item?.concentSwitchType ?? "");
  const [concentSwitchQuantities, setConcentSwitchQuantities] = useState<Record<string, number>>({
    square: item?.concentSwitchQuantities?.square ?? (item?.concentSwitchType === "square" ? item?.qty ?? 1 : 0),
    round: item?.concentSwitchQuantities?.round ?? (item?.concentSwitchType === "round" ? item?.qty ?? 1 : 0),
    advance: item?.concentSwitchQuantities?.advance ?? (item?.concentSwitchType === "advance" ? item?.qty ?? 1 : 0),
  });

  // ===== 分電盤 state =====
  const [hanbantaiIseten, setHanbantaiIseten] = useState(item?.hanbantaiIseten ?? "");
  const [hanbantaiAmpere, setHanbantaiAmpere] = useState(item?.hanbantaiAmpere ?? "");
  const [hanbantaiCircuits, setHanbantaiCircuits] = useState(item?.hanbantaiCircuits ?? "");
  const [hanbantaiCircuitsCustom, setHanbantaiCircuitsCustom] = useState<number | undefined>(
    typeof item?.hanbantaiCircuits === "number" ? item.hanbantaiCircuits : undefined
  );

  // ===== LDK 収納 state =====
  const [ldkStorageSpec, setLdkStorageSpec] = useState(item?.ldkStorageSpec ?? "");
  const [ldkStorageHandle, setLdkStorageHandle] = useState(item?.ldkStorageHandle ?? "");
  const [ldkStorageW, setLdkStorageW] = useState(item?.ldkStorageW ?? "");
  const [ldkStorageW_custom, setLdkStorageW_custom] = useState<number | undefined>(item?.ldkStorageW_custom);
  const [ldkStorageH, setLdkStorageH] = useState(item?.ldkStorageH ?? "");
  const [ldkStorageH_custom, setLdkStorageH_custom] = useState<number | undefined>(item?.ldkStorageH_custom);
  const [ldkStoragePhoto, setLdkStoragePhoto] = useState(item?.ldkStoragePhoto ?? "");
  const [ldkStorageFixedFrame, setLdkStorageFixedFrame] = useState(item?.ldkStorageFixedFrame ?? "");
  const [ldkStorageFixedFramePhoto, setLdkStorageFixedFramePhoto] = useState(item?.ldkStorageFixedFramePhoto ?? "");
  // ===== 洋室 収納 追加state（yoshitsuStorageSpec / yoshitsuStorageW は行117-119で宣言済み）=====
  const [yoshitsuStorageHandle, setYoshitsuStorageHandle] = useState(item?.yoshitsuStorageHandle ?? "");
  const [yoshitsuStorageW_custom, setYoshitsuStorageW_custom] = useState<number | undefined>(item?.yoshitsuStorageW_custom);
  const [yoshitsuStorageH, setYoshitsuStorageH] = useState(item?.yoshitsuStorageH ?? "");
  const [yoshitsuStorageH_custom, setYoshitsuStorageH_custom] = useState<number | undefined>(item?.yoshitsuStorageH_custom);
  const [yoshitsuStoragePhoto, setYoshitsuStoragePhoto] = useState(item?.yoshitsuStoragePhoto ?? "");
  const [yoshitsuStorageFixedFrame, setYoshitsuStorageFixedFrame] = useState(item?.yoshitsuStorageFixedFrame ?? "");
  const [yoshitsuStorageFixedFramePhoto, setYoshitsuStorageFixedFramePhoto] = useState(item?.yoshitsuStorageFixedFramePhoto ?? "");

  // ===== LDK・洋室 床用 state =====
  const [ldkFloorKumi, setLdkFloorKumi] = useState(item?.ldkFloorKumi ?? "");
  const [ldkFloorPhoto, setLdkFloorPhoto] = useState(item?.ldkFloorPhoto ?? "");
  const [yoshitsuFloorKumi, setYoshitsuFloorKumi] = useState(item?.yoshitsuFloorKumi ?? "");
  const [yoshitsuFloorPhoto, setYoshitsuFloorPhoto] = useState(item?.yoshitsuFloorPhoto ?? "");
  const [washitsuYoshitsuTatamithickness, setWashitsuYoshitsuTatamithickness] = useState<string | number>(item?.washitsuYoshitsuTatamithickness ?? "");

  // ===== LDK・洋室 巾木写真 state =====
  const [ldkHabakiWoodPhoto, setLdkHabakiWoodPhoto] = useState(item?.ldkHabakiWoodPhoto ?? "");
  const [ldkHabakiSoftPhoto, setLdkHabakiSoftPhoto] = useState(item?.ldkHabakiSoftPhoto ?? "");
  const [yoshitsuHabakiWoodPhoto, setYoshitsuHabakiWoodPhoto] = useState(item?.yoshitsuHabakiWoodPhoto ?? "");
  const [yoshitsuHabakiSoftPhoto, setYoshitsuHabakiSoftPhoto] = useState(item?.yoshitsuHabakiSoftPhoto ?? "");

  // ===== LDK・洋室 照明 state =====
  const [ldkLightRosette, setLdkLightRosette] = useState(item?.ldkLightRosette ?? false);
  const [ldkLightDlType, setLdkLightDlType] = useState(item?.ldkLightDlType ?? "");
  const [ldkLightIndirect, setLdkLightIndirect] = useState(item?.ldkLightIndirect ?? "");
  const [ldkLightRosettePhoto, setLdkLightRosettePhoto] = useState(item?.ldkLightRosettePhoto ?? "");
  const [ldkLightDlPhoto, setLdkLightDlPhoto] = useState(item?.ldkLightDlPhoto ?? "");
  const [yoshitsuLightRosette, setYoshitsuLightRosette] = useState(item?.yoshitsuLightRosette ?? false);
  const [yoshitsuLightDlType, setYoshitsuLightDlType] = useState(item?.yoshitsuLightDlType ?? "");
  const [yoshitsuLightIndirect, setYoshitsuLightIndirect] = useState(item?.yoshitsuLightIndirect ?? "");
  const [yoshitsuLightRosettePhoto, setYoshitsuLightRosettePhoto] = useState(item?.yoshitsuLightRosettePhoto ?? "");
  const [yoshitsuLightDlPhoto, setYoshitsuLightDlPhoto] = useState(item?.yoshitsuLightDlPhoto ?? "");

  // ===== LDK・洋室 建具 state =====
  // LDK建具
  const [ldkTateguDansa, setLdkTateguDansa] = useState(item?.ldkTateguDansa ?? "");
  const [ldkTateguDansaKubun, setLdkTateguDansaKubun] = useState(item?.ldkTateguDansaKubun ?? "");
  const [ldkTateguDansaCustomMm, setLdkTateguDansaCustomMm] = useState<number | undefined>(item?.ldkTateguDansaCustomMm);
  const [ldkTateguSpec, setLdkTateguSpec] = useState(item?.ldkTateguSpec ?? "");
  // LDK 片開き
  const [ldkKatabiraki_w, setLdkKatabiraki_w] = useState(item?.ldkKatabiraki_w ?? "");
  const [ldkKatabiraki_h, setLdkKatabiraki_h] = useState(item?.ldkKatabiraki_h ?? "");
  const [ldkKatabiraki_mikomi, setLdkKatabiraki_mikomi] = useState(item?.ldkKatabiraki_mikomi ?? "");
  const [ldkKatabiraki_tsurimoto, setLdkKatabiraki_tsurimoto] = useState(item?.ldkKatabiraki_tsurimoto ?? "");
  const [ldkKatabiraki_todomatari, setLdkKatabiraki_todomatari] = useState(item?.ldkKatabiraki_todomatari ?? "");
  const [ldkKatabiraki_w_custom, setLdkKatabiraki_w_custom] = useState<number | undefined>(item?.ldkKatabiraki_w_custom);
  const [ldkKatabiraki_h_custom, setLdkKatabiraki_h_custom] = useState<number | undefined>(item?.ldkKatabiraki_h_custom);
  const [ldkKatabiraki_photo, setLdkKatabiraki_photo] = useState(item?.ldkKatabiraki_photo ?? "");
  const [ldkKatabiraki_tsurimoto_photo, setLdkKatabiraki_tsurimoto_photo] = useState(item?.ldkKatabiraki_tsurimoto_photo ?? "");
  const [ldkKatabiraki_todomatari_photo, setLdkKatabiraki_todomatari_photo] = useState(item?.ldkKatabiraki_todomatari_photo ?? "");
  // LDK 片引き
  const [ldkKatahiki_method, setLdkKatahiki_method] = useState(item?.ldkKatahiki_method ?? "");
  const [ldkKatahiki_w, setLdkKatahiki_w] = useState(item?.ldkKatahiki_w ?? "");
  const [ldkKatahiki_h, setLdkKatahiki_h] = useState(item?.ldkKatahiki_h ?? "");
  const [ldkKatahiki_mikomi, setLdkKatahiki_mikomi] = useState(item?.ldkKatahiki_mikomi ?? "");
  const [ldkKatahiki_hikite, setLdkKatahiki_hikite] = useState(item?.ldkKatahiki_hikite ?? "");
  const [ldkKatahiki_w_custom, setLdkKatahiki_w_custom] = useState<number | undefined>(item?.ldkKatahiki_w_custom);
  const [ldkKatahiki_h_custom, setLdkKatahiki_h_custom] = useState<number | undefined>(item?.ldkKatahiki_h_custom);
  const [ldkKatahiki_method_photo, setLdkKatahiki_method_photo] = useState(item?.ldkKatahiki_method_photo ?? "");
  const [ldkKatahiki_hikite_photo, setLdkKatahiki_hikite_photo] = useState(item?.ldkKatahiki_hikite_photo ?? "");
  // LDK 2枚引き違い戸
  const [ldkNimaiHikichigai_method, setLdkNimaiHikichigai_method] = useState(item?.ldkNimaiHikichigai_method ?? "");
  const [ldkNimaiHikichigai_w, setLdkNimaiHikichigai_w] = useState(item?.ldkNimaiHikichigai_w ?? "");
  const [ldkNimaiHikichigai_h, setLdkNimaiHikichigai_h] = useState(item?.ldkNimaiHikichigai_h ?? "");
  const [ldkNimaiHikichigai_mikomi, setLdkNimaiHikichigai_mikomi] = useState(item?.ldkNimaiHikichigai_mikomi ?? "");
  const [ldkNimaiHikichigai_hikite, setLdkNimaiHikichigai_hikite] = useState(item?.ldkNimaiHikichigai_hikite ?? "");
  const [ldkNimaiHikichigai_w_custom, setLdkNimaiHikichigai_w_custom] = useState<number | undefined>(item?.ldkNimaiHikichigai_w_custom);
  const [ldkNimaiHikichigai_h_custom, setLdkNimaiHikichigai_h_custom] = useState<number | undefined>(item?.ldkNimaiHikichigai_h_custom);
  const [ldkNimaiHikichigai_method_photo, setLdkNimaiHikichigai_method_photo] = useState(item?.ldkNimaiHikichigai_method_photo ?? "");
  const [ldkNimaiHikichigai_hikite_photo, setLdkNimaiHikichigai_hikite_photo] = useState(item?.ldkNimaiHikichigai_hikite_photo ?? "");
  // LDK 3枚引き違い戸
  const [ldkSanmaiHikichigai_method, setLdkSanmaiHikichigai_method] = useState(item?.ldkSanmaiHikichigai_method ?? "");
  const [ldkSanmaiHikichigai_w, setLdkSanmaiHikichigai_w] = useState(item?.ldkSanmaiHikichigai_w ?? "");
  const [ldkSanmaiHikichigai_h, setLdkSanmaiHikichigai_h] = useState(item?.ldkSanmaiHikichigai_h ?? "");
  const [ldkSanmaiHikichigai_hikite, setLdkSanmaiHikichigai_hikite] = useState(item?.ldkSanmaiHikichigai_hikite ?? "");
  const [ldkSanmaiHikichigai_w_custom, setLdkSanmaiHikichigai_w_custom] = useState<number | undefined>(item?.ldkSanmaiHikichigai_w_custom);
  const [ldkSanmaiHikichigai_h_custom, setLdkSanmaiHikichigai_h_custom] = useState<number | undefined>(item?.ldkSanmaiHikichigai_h_custom);
  const [ldkSanmaiHikichigai_method_photo, setLdkSanmaiHikichigai_method_photo] = useState(item?.ldkSanmaiHikichigai_method_photo ?? "");
  const [ldkSanmaiHikichigai_hikite_photo, setLdkSanmaiHikichigai_hikite_photo] = useState(item?.ldkSanmaiHikichigai_hikite_photo ?? "");
  // LDK 3枚片引き
  const [ldkSanmaiKatahiki_method, setLdkSanmaiKatahiki_method] = useState(item?.ldkSanmaiKatahiki_method ?? "");
  const [ldkSanmaiKatahiki_w, setLdkSanmaiKatahiki_w] = useState(item?.ldkSanmaiKatahiki_w ?? "");
  const [ldkSanmaiKatahiki_h, setLdkSanmaiKatahiki_h] = useState(item?.ldkSanmaiKatahiki_h ?? "");
  const [ldkSanmaiKatahiki_mikomi, setLdkSanmaiKatahiki_mikomi] = useState(item?.ldkSanmaiKatahiki_mikomi ?? "");
  const [ldkSanmaiKatahiki_hikite, setLdkSanmaiKatahiki_hikite] = useState(item?.ldkSanmaiKatahiki_hikite ?? "");
  const [ldkSanmaiKatahiki_w_custom, setLdkSanmaiKatahiki_w_custom] = useState<number | undefined>(item?.ldkSanmaiKatahiki_w_custom);
  const [ldkSanmaiKatahiki_h_custom, setLdkSanmaiKatahiki_h_custom] = useState<number | undefined>(item?.ldkSanmaiKatahiki_h_custom);
  const [ldkSanmaiKatahiki_method_photo, setLdkSanmaiKatahiki_method_photo] = useState(item?.ldkSanmaiKatahiki_method_photo ?? "");
  const [ldkSanmaiKatahiki_hikite_photo, setLdkSanmaiKatahiki_hikite_photo] = useState(item?.ldkSanmaiKatahiki_hikite_photo ?? "");
  // LDK 2枚片引き
  const [ldkNimaiKatahiki_photo, setLdkNimaiKatahiki_photo] = useState(item?.ldkNimaiKatahiki_photo ?? "");
  const [ldkNimaiKatahiki_w, setLdkNimaiKatahiki_w] = useState(item?.ldkNimaiKatahiki_w ?? "");
  const [ldkNimaiKatahiki_h, setLdkNimaiKatahiki_h] = useState(item?.ldkNimaiKatahiki_h ?? "");
  const [ldkNimaiKatahiki_w_custom, setLdkNimaiKatahiki_w_custom] = useState<number | undefined>(item?.ldkNimaiKatahiki_w_custom);
  const [ldkNimaiKatahiki_h_custom, setLdkNimaiKatahiki_h_custom] = useState<number | undefined>(item?.ldkNimaiKatahiki_h_custom);
  const [ldkNimaiKatahiki_hikite, setLdkNimaiKatahiki_hikite] = useState(item?.ldkNimaiKatahiki_hikite ?? "");
  const [ldkNimaiKatahiki_hikite_photo, setLdkNimaiKatahiki_hikite_photo] = useState(item?.ldkNimaiKatahiki_hikite_photo ?? "");
  // 洋室建具
  const [yoshitsuTateguDansa, setYoshitsuTateguDansa] = useState(item?.yoshitsuTateguDansa ?? "");
  const [yoshitsuTateguDansaKubun, setYoshitsuTateguDansaKubun] = useState(item?.yoshitsuTateguDansaKubun ?? "");
  const [yoshitsuTateguDansaCustomMm, setYoshitsuTateguDansaCustomMm] = useState<number | undefined>(item?.yoshitsuTateguDansaCustomMm);
  const [yoshitsuTateguSpec, setYoshitsuTateguSpec] = useState(item?.yoshitsuTateguSpec ?? "");
  // 洋室 片開き
  const [yoshitsuKatabiraki_w, setYoshitsuKatabiraki_w] = useState(item?.yoshitsuKatabiraki_w ?? "");
  const [yoshitsuKatabiraki_h, setYoshitsuKatabiraki_h] = useState(item?.yoshitsuKatabiraki_h ?? "");
  const [yoshitsuKatabiraki_mikomi, setYoshitsuKatabiraki_mikomi] = useState(item?.yoshitsuKatabiraki_mikomi ?? "");
  const [yoshitsuKatabiraki_tsurimoto, setYoshitsuKatabiraki_tsurimoto] = useState(item?.yoshitsuKatabiraki_tsurimoto ?? "");
  const [yoshitsuKatabiraki_todomatari, setYoshitsuKatabiraki_todomatari] = useState(item?.yoshitsuKatabiraki_todomatari ?? "");
  const [yoshitsuKatabiraki_w_custom, setYoshitsuKatabiraki_w_custom] = useState<number | undefined>(item?.yoshitsuKatabiraki_w_custom);
  const [yoshitsuKatabiraki_h_custom, setYoshitsuKatabiraki_h_custom] = useState<number | undefined>(item?.yoshitsuKatabiraki_h_custom);
  const [yoshitsuKatabiraki_photo, setYoshitsuKatabiraki_photo] = useState(item?.yoshitsuKatabiraki_photo ?? "");
  const [yoshitsuKatabiraki_tsurimoto_photo, setYoshitsuKatabiraki_tsurimoto_photo] = useState(item?.yoshitsuKatabiraki_tsurimoto_photo ?? "");
  const [yoshitsuKatabiraki_todomatari_photo, setYoshitsuKatabiraki_todomatari_photo] = useState(item?.yoshitsuKatabiraki_todomatari_photo ?? "");
  // 洋室 片引き
  const [yoshitsuKatahiki_method, setYoshitsuKatahiki_method] = useState(item?.yoshitsuKatahiki_method ?? "");
  const [yoshitsuKatahiki_w, setYoshitsuKatahiki_w] = useState(item?.yoshitsuKatahiki_w ?? "");
  const [yoshitsuKatahiki_h, setYoshitsuKatahiki_h] = useState(item?.yoshitsuKatahiki_h ?? "");
  const [yoshitsuKatahiki_mikomi, setYoshitsuKatahiki_mikomi] = useState(item?.yoshitsuKatahiki_mikomi ?? "");
  const [yoshitsuKatahiki_hikite, setYoshitsuKatahiki_hikite] = useState(item?.yoshitsuKatahiki_hikite ?? "");
  const [yoshitsuKatahiki_w_custom, setYoshitsuKatahiki_w_custom] = useState<number | undefined>(item?.yoshitsuKatahiki_w_custom);
  const [yoshitsuKatahiki_h_custom, setYoshitsuKatahiki_h_custom] = useState<number | undefined>(item?.yoshitsuKatahiki_h_custom);
  const [yoshitsuKatahiki_method_photo, setYoshitsuKatahiki_method_photo] = useState(item?.yoshitsuKatahiki_method_photo ?? "");
  const [yoshitsuKatahiki_hikite_photo, setYoshitsuKatahiki_hikite_photo] = useState(item?.yoshitsuKatahiki_hikite_photo ?? "");
  // 洋室 2枚引き違い戸
  const [yoshitsuNimaiHikichigai_method, setYoshitsuNimaiHikichigai_method] = useState(item?.yoshitsuNimaiHikichigai_method ?? "");
  const [yoshitsuNimaiHikichigai_w, setYoshitsuNimaiHikichigai_w] = useState(item?.yoshitsuNimaiHikichigai_w ?? "");
  const [yoshitsuNimaiHikichigai_h, setYoshitsuNimaiHikichigai_h] = useState(item?.yoshitsuNimaiHikichigai_h ?? "");
  const [yoshitsuNimaiHikichigai_mikomi, setYoshitsuNimaiHikichigai_mikomi] = useState(item?.yoshitsuNimaiHikichigai_mikomi ?? "");
  const [yoshitsuNimaiHikichigai_hikite, setYoshitsuNimaiHikichigai_hikite] = useState(item?.yoshitsuNimaiHikichigai_hikite ?? "");
  const [yoshitsuNimaiHikichigai_w_custom, setYoshitsuNimaiHikichigai_w_custom] = useState<number | undefined>(item?.yoshitsuNimaiHikichigai_w_custom);
  const [yoshitsuNimaiHikichigai_h_custom, setYoshitsuNimaiHikichigai_h_custom] = useState<number | undefined>(item?.yoshitsuNimaiHikichigai_h_custom);
  const [yoshitsuNimaiHikichigai_method_photo, setYoshitsuNimaiHikichigai_method_photo] = useState(item?.yoshitsuNimaiHikichigai_method_photo ?? "");
  const [yoshitsuNimaiHikichigai_hikite_photo, setYoshitsuNimaiHikichigai_hikite_photo] = useState(item?.yoshitsuNimaiHikichigai_hikite_photo ?? "");
  // 洋室 3枚引き違い戸
  const [yoshitsuSanmaiHikichigai_method, setYoshitsuSanmaiHikichigai_method] = useState(item?.yoshitsuSanmaiHikichigai_method ?? "");
  const [yoshitsuSanmaiHikichigai_w, setYoshitsuSanmaiHikichigai_w] = useState(item?.yoshitsuSanmaiHikichigai_w ?? "");
  const [yoshitsuSanmaiHikichigai_h, setYoshitsuSanmaiHikichigai_h] = useState(item?.yoshitsuSanmaiHikichigai_h ?? "");
  const [yoshitsuSanmaiHikichigai_hikite, setYoshitsuSanmaiHikichigai_hikite] = useState(item?.yoshitsuSanmaiHikichigai_hikite ?? "");
  const [yoshitsuSanmaiHikichigai_w_custom, setYoshitsuSanmaiHikichigai_w_custom] = useState<number | undefined>(item?.yoshitsuSanmaiHikichigai_w_custom);
  const [yoshitsuSanmaiHikichigai_h_custom, setYoshitsuSanmaiHikichigai_h_custom] = useState<number | undefined>(item?.yoshitsuSanmaiHikichigai_h_custom);
  const [yoshitsuSanmaiHikichigai_method_photo, setYoshitsuSanmaiHikichigai_method_photo] = useState(item?.yoshitsuSanmaiHikichigai_method_photo ?? "");
  const [yoshitsuSanmaiHikichigai_hikite_photo, setYoshitsuSanmaiHikichigai_hikite_photo] = useState(item?.yoshitsuSanmaiHikichigai_hikite_photo ?? "");
  // 洋室 3枚片引き
  const [yoshitsuSanmaiKatahiki_method, setYoshitsuSanmaiKatahiki_method] = useState(item?.yoshitsuSanmaiKatahiki_method ?? "");
  const [yoshitsuSanmaiKatahiki_w, setYoshitsuSanmaiKatahiki_w] = useState(item?.yoshitsuSanmaiKatahiki_w ?? "");
  const [yoshitsuSanmaiKatahiki_h, setYoshitsuSanmaiKatahiki_h] = useState(item?.yoshitsuSanmaiKatahiki_h ?? "");
  const [yoshitsuSanmaiKatahiki_mikomi, setYoshitsuSanmaiKatahiki_mikomi] = useState(item?.yoshitsuSanmaiKatahiki_mikomi ?? "");
  const [yoshitsuSanmaiKatahiki_hikite, setYoshitsuSanmaiKatahiki_hikite] = useState(item?.yoshitsuSanmaiKatahiki_hikite ?? "");
  const [yoshitsuSanmaiKatahiki_w_custom, setYoshitsuSanmaiKatahiki_w_custom] = useState<number | undefined>(item?.yoshitsuSanmaiKatahiki_w_custom);
  const [yoshitsuSanmaiKatahiki_h_custom, setYoshitsuSanmaiKatahiki_h_custom] = useState<number | undefined>(item?.yoshitsuSanmaiKatahiki_h_custom);
  const [yoshitsuSanmaiKatahiki_method_photo, setYoshitsuSanmaiKatahiki_method_photo] = useState(item?.yoshitsuSanmaiKatahiki_method_photo ?? "");
  const [yoshitsuSanmaiKatahiki_hikite_photo, setYoshitsuSanmaiKatahiki_hikite_photo] = useState(item?.yoshitsuSanmaiKatahiki_hikite_photo ?? "");
  // 洋室 2枚片引き
  const [yoshitsuNimaiKatahiki_photo, setYoshitsuNimaiKatahiki_photo] = useState(item?.yoshitsuNimaiKatahiki_photo ?? "");
  const [yoshitsuNimaiKatahiki_w, setYoshitsuNimaiKatahiki_w] = useState(item?.yoshitsuNimaiKatahiki_w ?? "");
  const [yoshitsuNimaiKatahiki_h, setYoshitsuNimaiKatahiki_h] = useState(item?.yoshitsuNimaiKatahiki_h ?? "");
  const [yoshitsuNimaiKatahiki_w_custom, setYoshitsuNimaiKatahiki_w_custom] = useState<number | undefined>(item?.yoshitsuNimaiKatahiki_w_custom);
  const [yoshitsuNimaiKatahiki_h_custom, setYoshitsuNimaiKatahiki_h_custom] = useState<number | undefined>(item?.yoshitsuNimaiKatahiki_h_custom);
  const [yoshitsuNimaiKatahiki_hikite, setYoshitsuNimaiKatahiki_hikite] = useState(item?.yoshitsuNimaiKatahiki_hikite ?? "");
  const [yoshitsuNimaiKatahiki_hikite_photo, setYoshitsuNimaiKatahiki_hikite_photo] = useState(item?.yoshitsuNimaiKatahiki_hikite_photo ?? "");

  const lineSubtotal = useMemo(() => qty * unitPrice, [qty, unitPrice]);
  const showCrossCalculator = isZentaiCross && selectedOption === "yes";
  const crossFloorplanCoefficient = useMemo(() => {
    const settings = state.roomCountSettings;
    if (!settings) return 4.3;

    const livingRooms =
      settings.numYoshitsu + settings.numWashitsu + (settings.numWashitsuYoshitsu ?? 0);

    if (settings.kitchenType === "LDK") {
      if (livingRooms <= 1) return 4.3;
      if (livingRooms === 2) return 4.8;
      if (livingRooms === 3) return 5.0;
      return 5.3;
    }

    if (settings.kitchenType === "DK") {
      if (livingRooms <= 1) return 4.0;
      if (livingRooms === 2) return 4.8;
      if (livingRooms === 3) return 5.0;
      return 5.3;
    }

    if (livingRooms <= 0) return 3.4;
    if (livingRooms === 1) return 3.7;
    if (livingRooms === 2) return 4.8;
    if (livingRooms === 3) return 5.0;
    return 5.3;
  }, [state.roomCountSettings]);
  const crossCalculation = useMemo(() => {
    const totalArea = Number(crossTotalArea) || 0;
    const ceilingHeight = Number(crossCeilingHeight) || 2.5;
    const totalWeight = crossTargetRooms.reduce((sum, room) => sum + room.weight, 0);
    const selectedWeight = crossTargetRooms
      .filter((room) => crossSelectedRoomKeys.includes(room.key))
      .reduce((sum, room) => sum + room.weight, 0);
    const roomRatio = totalWeight > 0 ? selectedWeight / totalWeight : 0;
    const ceilingRatio = ceilingHeight / 2.5;
    const effectiveWallCoefficient = Math.max(0, crossFloorplanCoefficient - 2.0);
    const wallSqm = totalArea * effectiveWallCoefficient * ceilingRatio * roomRatio;
    const ceilingSqm = totalArea * roomRatio;
    const estimatedSqm =
      crossScope === "壁のみ" ? wallSqm : crossScope === "天井のみ" ? ceilingSqm : wallSqm + ceilingSqm;
    const estimatedMeters = estimatedSqm / 0.7;

    return {
      totalArea,
      ceilingHeight,
      totalWeight,
      selectedWeight,
      roomRatio,
      wallSqm,
      ceilingSqm,
      estimatedSqm,
      estimatedMeters,
      roundedMeters: Math.round(estimatedMeters),
      hasNoSelectedRooms: crossTargetRooms.length > 0 && crossSelectedRoomKeys.length === 0,
    };
  }, [crossCeilingHeight, crossFloorplanCoefficient, crossScope, crossSelectedRoomKeys, crossTargetRooms, crossTotalArea]);

  useEffect(() => {
    if (!showCrossCalculator) return;
    setUnit("m");
  }, [showCrossCalculator]);

  useEffect(() => {
    if (!showCrossCalculator) return;
    setCrossEstimatedSqm(crossCalculation.estimatedSqm);
    setCrossEstimatedMeters(crossCalculation.estimatedMeters);
    if (!crossQtyOverridden) {
      setQty(crossCalculation.roundedMeters);
    }
  }, [crossCalculation, crossQtyOverridden, showCrossCalculator]);

  // 玄関収納: 既存残しまたは交換の場合に追加項目を表示
  const isGenkanStorage = !!masterDef?.id && masterDef.id.includes("genkan_storage");
  const showStorageOptions = isGenkanStorage && (selectedOption === "keep" || selectedOption === "change");
  // 玄関収納の鏡選択: コの字またはトールの場合のみ
  const showStorageMirror = showStorageOptions && (storageShape === "コの字" || storageShape === "トール");
  // 玄関収納鏡写真: 鏡有選択時のみ
  const showStorageMirrorKonojiPhoto = showStorageMirror && storageShape === "コの字" && storageMirror === "鏡有";
  const showStorageMirrorTallPhoto = showStorageMirror && storageShape === "トール" && storageMirror === "鏡有";

  // 玄関扉・玄関枠・ドアガード・ドアストッパー・土間の写真表示条件
  const isGenkanDoor = masterDef?.id.includes("genkan_door");
  const showGenkanDoorPhoto = isGenkanDoor && selectedOption !== "";
  const isGenkanFrame = masterDef?.id.includes("genkan_frame");
  const showGenkanFramePhoto = isGenkanFrame && selectedOption !== "";
  const isGenkanGuard = masterDef?.id.includes("genkan_guard");
  const showGenkanGuardPhoto = isGenkanGuard && selectedOption !== "";
  const isGenkanCloser = masterDef?.id.includes("genkan_closer");
  const showGenkanCloserPhoto = isGenkanCloser && selectedOption !== "";
  const isGenkanStopper = masterDef?.id.includes("genkan_stopper");
  const showGenkanStopperPhoto = isGenkanStopper && selectedOption !== "";
  const isGenkanDoma = masterDef?.id.includes("genkan_doma");
  const showGenkanDomaPhoto = isGenkanDoma && selectedOption !== "";

  // 框: 既存残し以外はサイズ選択不要に変更
  const isKamachi = masterDef?.id.includes("genkan_kamachi");
  // 框写真表示条件
  const showKamachiLPhoto = isKamachi && selectedOption === "lkamachi";
  const showKamachiUsuPhoto = isKamachi && selectedOption === "usuita";
  const showKamachiTilePhoto = isKamachi && selectedOption === "tile";
  const showKamachiSize = showKamachiLPhoto || showKamachiUsuPhoto;

  // 巾木写真表示条件
  const isGenkanHabaki = masterDef?.id.includes("genkan_habaki");
  const showHabakiWoodPhoto = isGenkanHabaki && selectedOption === "wood";
  const showHabakiSoftPhoto = isGenkanHabaki && selectedOption === "soft";

  // 玄関照明: DL交換またはブラケットライト交換の場合に追加項目を表示
  const isGenkanLight = masterDef?.id.includes("genkan_light");
  const isDlBracketChange = selectedOption === "dl_bracket_change";
  const showGenkanLightOptions = isGenkanLight && (selectedOption === "dl_change" || selectedOption === "bracket_change" || isDlBracketChange);
  // 玄関照明写真表示条件
  const showGenkanLightDlPhoto = isGenkanLight && (selectedOption === "dl_change" || isDlBracketChange);
  const showGenkanLightBracketPhoto = isGenkanLight && (selectedOption === "bracket_change" || isDlBracketChange);

  // 廊下照明: DL交換またはブラケットライト交換の場合に追加項目を表示
  const isRoukaLight = masterDef?.id.includes("rouka_light");
  const showRoukaLightOptions = isRoukaLight && (selectedOption === "dl_change" || selectedOption === "bracket_change" || isDlBracketChange);
  const showRoukaLightDlPhoto = isRoukaLight && (selectedOption === "dl_change" || isDlBracketChange);
  const showRoukaLightBracketPhoto = isRoukaLight && (selectedOption === "bracket_change" || isDlBracketChange);
  const showLightDiameterOptions = (isGenkanLight || isRoukaLight) && (selectedOption === "dl_change" || isDlBracketChange);
  const isSelectedLightDl = selectedOption === "dl_change" || selectedOption === "dl_new" || isDlBracketChange;
  const showLightComboOptions = (isGenkanLight || isRoukaLight) && isDlBracketChange;

  // キッチン照明: DL交換またはDL新規の場合に追加項目を表示
  const isKitchenLight = masterDef?.id.includes("kitchen_light");
  const showKitchenLightOptions = false;

  // 洋室照明: DL交換またはDL新規の場合に追加項目を表示（先に定義が必要）
  const isYoshitsuLight = masterDef?.id.includes("yoshitsu_light");
  const showYoshitsuLightOptions = isYoshitsuLight && (selectedOption === "dl_change" || selectedOption === "dl_new");

  // 照明オプション表示（玄関または廊下またはキッチンまたは洋室）- 全ての照明フラグをここで統合
  const showLightOptions = showGenkanLightOptions || showRoukaLightOptions || showKitchenLightOptions || showYoshitsuLightOptions;

  // 廊下床: CF・フロアタイル・フローリングの場合に写真挿入UI表示
  const isRoukaFloor = masterDef?.id.includes("rouka_floor");
  const showRoukaFloorPhotoUI = isRoukaFloor && (selectedOption === "cf" || selectedOption === "ft" || selectedOption === "flooring");
  
  // 廊下巾木: 木巾木・ソフト巾木の場合に写真挿入UI表示
  const isRoukaHabaki = !!masterDef?.id && (masterDef.id.includes("rouka_habaki") || masterDef.id.includes("kaidan_habaki"));
  const showRoukaHabakiPhotoUI = isRoukaHabaki && (selectedOption === "wood" || selectedOption === "soft");
  // 床でフローリング貼替を選択している場合、巾木で既存残しは選択不可
  // 同じ部屋の床の選択状態を参照
  const roukaFloorItem = state.selectedWorkItems.find(
    (wi) => wi.roomKey === item?.roomKey && wi.workItemId.includes("rouka_floor")
  );
  const isRoukaFloorFlooring = roukaFloorItem?.selectedOption === "flooring";
  // 巾木で既存残しが選択不可かどうか
  const isRoukaHabakiKeepDisabled = isRoukaHabaki && isRoukaFloorFlooring;
  const sameRoomFloorItem = state.selectedWorkItems.find(
    (wi) =>
      wi.roomKey === item?.roomKey &&
      (wi.workItemId.includes("ld_floor") || wi.workItemId.includes("yoshitsu_floor"))
  );
  const isLdYoshitsuHabakiKeepDisabled =
    !!masterDef?.id &&
    (masterDef.id.includes("ld_habaki") || masterDef.id.includes("yoshitsu_habaki")) &&
    sameRoomFloorItem?.selectedOption === "flooring";
  
  // 廊下収納: 折れ戸・両開きの場合に追加項目を表示
  const isRoukaStorage = masterDef?.id.includes("rouka_storage") && !masterDef?.id.includes("rouka_storage_inside");
  const showRoukaStorageOptions = isRoukaStorage && (selectedOption === "oredo" || selectedOption === "ryobiraki");
  // 枠選択の制限: W825・1320・1820・2541の場合はノン下レール三方枠選択不可
  const roukaStorageFrameRestricted = ["825", "1320", "1820", "2541"].includes(roukaStorageOredoW);

  // 廊下収納内部: 可動棚・枕棚・HP・中段の条件分岐（複数選択対応）
  const isRoukaStorageInside = masterDef?.id.includes("rouka_storage_inside");
  const showRoukaStorageInsideKadodana = isRoukaStorageInside && roukaStorageInsideMultiple.includes("kadodana");
  const showRoukaStorageInsideMakuradana = isRoukaStorageInside && roukaStorageInsideMultiple.includes("makuradana");
  const showRoukaStorageInsideHp = isRoukaStorageInside && roukaStorageInsideMultiple.includes("hp");
  const showRoukaStorageInsideChuudan = isRoukaStorageInside && roukaStorageInsideMultiple.includes("chudan");
  // 旧条件（互換性維持）
  const showStorageInsideKadodana = isRoukaStorageInside && selectedOption === "kadodana";
  const showStorageInsideMakuradana = isRoukaStorageInside && selectedOption === "makuradana";

  // キッチン本体: 既存残しまたは交換の場合に寸法入力を表示
  const isKitchenBody = masterDef?.id.includes("kitchen_body");
  const showKitchenBodyWidth = false;

  // 吊戸: 既存有または交換後有の場合に寸法入力を表示
  const isTsurito = masterDef?.id.includes("kitchen_tsurito");
  const showTsuritoHeight = isTsurito && (selectedOption === "exist_yes" || selectedOption === "after_yes");

  // 食洗機: 既存Kの場合に有/無選択を表示
  const isDishwasher = masterDef?.id.includes("kitchen_dishwasher");
  const showDishwasherExistK = isDishwasher && selectedOption === "exist_k";

  // ワークトップ: ステンまたは人工大理石を選択後に開き/スライド選択を表示
  const isWorktop = masterDef?.id.includes("kitchen_worktop");
  const showWorktopDrawerType = isWorktop && (selectedOption === "stainless" || selectedOption === "artificial_marble");

  // 洋室入口建具: 既存残しまたは交換の場合にW/D/仕様を表示
  const isYoshitsuIriguchi = masterDef?.id.includes("yoshitsu_iriguchi");
  const showYoshitsuIriguchiOptions = isYoshitsuIriguchi && (selectedOption === "keep" || selectedOption === "change");

  // 洋室入口段差: ありの場合に段差mm入力を表示
  const isYoshitsuDansa = masterDef?.id.includes("yoshitsu_dansa");
  const showYoshitsuDansaMm = isYoshitsuDansa && selectedOption === "yes";

  // 洋室収納: 既存残しまたは交換の場合にW/D/仕様を表示、交換の場合のみ可動棚・棚柱も表示
  const isYoshitsuStorage = masterDef?.id.includes("yoshitsu_storage") && !masterDef?.id.includes("yoshitsu_storage_inside");
  const showYoshitsuStorageOptions = isYoshitsuStorage && (selectedOption === "keep" || selectedOption === "change");
  const showYoshitsuStorageChangeOnly = isYoshitsuStorage && selectedOption === "change";

  // 洋室収納内部: 可動棚・枕棚・中段の条件分岐
  const isYoshitsuStorageInside = masterDef?.id.includes("yoshitsu_storage_inside");
  const showYoshitsuStorageInsideKadodana = false;
  const showYoshitsuStorageInsideMakuradana = false;
  const showYoshitsuStorageInsideChudan = false;

  // 洋室網戸: 交換の場合に色選択を表示
  const isYoshitsuAmido = masterDef?.id.includes("yoshitsu_amido");
  const showYoshitsuAmidoColor = isYoshitsuAmido && selectedOption === "change";

  // 全体項目：給湯器（品番入力は常に表示）
  const isZentaiKyutouki = masterDef?.id.includes("zentai_kyutouki");
  const showZentaiKyutoukiHinban = isZentaiKyutouki;

  // 全体項目：コンセント・スイッチプレート
  const isZentaiConcent = masterDef?.id.includes("zentai_concent");
  const showConcentSwitchType = isZentaiConcent && selectedOption === "change";

  useEffect(() => {
    if (!showConcentSwitchType) return;
    setQty(
      Object.values(concentSwitchQuantities).reduce((total, quantity) => total + parseIntegerQuantity(String(quantity)), 0)
    );
  }, [concentSwitchQuantities, showConcentSwitchType]);

  // 全体項目：分電盤
  const isZentaiHanbantai = masterDef?.id.includes("zentai_hanbantai");
  const showHanbantaiOptions = isZentaiHanbantai && selectedOption === "change";

  // 和室：照明スイッチ「有」の場合に注意文表示
  const isWashitsuSwitch = masterDef?.id.includes("washitsu_switch");
  const showWashitsuSwitchNote = isWashitsuSwitch && selectedOption === "no";
  const showWashitsuSwitchNoneOption = isWashitsuSwitch && selectedOption === "no";
  const showWashitsuSwitchNewNote = showWashitsuSwitchNoneOption && washitsuLightNoSwitchOption === "新設";

  const isWashitsuTatami = masterDef?.id.includes("washitsu_tatami");
  const showWashitsuTatamiOptions = isWashitsuTatami && (selectedOption === "omote" || selectedOption === "shincho");
  const isWashitsuFusuma = masterDef?.id.includes("washitsu_fusuma");
  const showWashitsuFusumaOptions = isWashitsuFusuma && (selectedOption === "harikae_fusuma" || selectedOption === "harikae_cross");
  const isWashitsuShoji = masterDef?.id.includes("washitsu_shoji");
  const showWashitsuShojiOptions = isWashitsuShoji && selectedOption === "harikae";
  const isWashitsuMawabuchi = masterDef?.id.includes("washitsu_mawabuchi");
  const showWashitsuMawabuchiDetail = isWashitsuMawabuchi && selectedOption === "koukan";

  // 和室：和室→洋室「する」の場合に畳厚み入力
  const isWashitsuYoushitsu = masterDef?.id.includes("washitsu_youshitsu");
  const showWashitsuYoushitsuTatamiMm = isWashitsuYoushitsu && selectedOption === "yes";

  // 和室：障子レール「ベニヤ」の場合に塗装/シート選択
  const isWashitsuShojiRail = masterDef?.id.includes("washitsu_shojirail");
  const showWashitsuShojiRailFinish = isWashitsuShojiRail && selectedOption === "veneer";

  // 和室：天井「交換」の場合に既存クロス/ラミ天選択
  const isWashitsuCeiling = masterDef?.id.includes("washitsu_ceiling");
  const showWashitsuCeilingType = isWashitsuCeiling && selectedOption === "change";

  // 和室：照明「交換」の場合にDL灯数・色入力
  const isWashitsuLight = masterDef?.id.includes("washitsu_light");
  const showWashitsuLightOptions = isWashitsuLight && selectedOption === "change";

  // 和室：押入収納「交換」の場���にW/H/見込み入力
  const isWashitsuOshiire = masterDef?.id.includes("washitsu_oshiire") && !masterDef?.id.includes("washitsu_oshiire_inside");
  const showWashitsuOshiireOptions = isWashitsuOshiire && selectedOption === "change";

  // UB本体：既存/交換の条件分岐（修正：既存選択時の項目を削除）
  const isUbBody = masterDef?.id.includes("ub_body");
  const showUbBodySize = isUbBody && selectedOption === "change";
  const ubProductSize = ubBodySize === "その他手入力" ? ubBodySizeCustom : ubBodySize;
  const ubProducts = showUbBodySize && ubProductSize ? makeProducts("ub", ubProductSize) : [];

  // UB既存（独立項目）：換気扇/浴乾の場合にガス/電気選択
  const isUbKizonsetsubi = masterDef?.id.includes("ub_kizonsetsubi");
  const showUbVentSpec = isUbKizonsetsubi && selectedOption === "change";
  const showUbKizonsetsubiEnergyType = false;

  // UB浴室乾燥機：有/無どちらでもガス/電気選択
  const isUbDryer = masterDef?.id.includes("ub_dryer");
  const showUbDryerEnergyType = isUbDryer;
  const isUbHotwater = masterDef?.id.includes("ub_hotwater");
  const showUbHotwaterOptions = isUbHotwater;

  // 洗面室：洗面本体「交換」の場合にW入力
  const isSenmenBody = masterDef?.id.includes("senmen_body");
  const showSenmenBodyW = isSenmenBody && selectedOption === "change";
  const senmenProducts = showSenmenBodyW && senmenBodySize ? makeProducts("senmen", senmenBodySize) : [];
  const isSenmenWashingPan = masterDef?.id.includes("senmen_washing_pan");
  const showSenmenWashingPanSize = isSenmenWashingPan && selectedOption === "change";

  // 洗面室：洗面取付位置高さ（常に入力可能）
  const isSenmenHeight = masterDef?.id.includes("senmen_height");
  const showSenmenHeight = isSenmenHeight;

  // 洗面室：入口建具
  const isSenmenIriguchi = masterDef?.id.includes("senmen_iriguchi");
  const showSenmenIriguchiOptions = false;

  // 洗面室：入口段差
  const isSenmenDansa = masterDef?.id.includes("senmen_dansa");
  const showSenmenDansaMm = isSenmenDansa && selectedOption === "yes";

  // 洗面室：照明
  const isSenmenLight = masterDef?.id.includes("senmen_light");
  const showSenmenLightOptions = false;

  // トイレ：トイレ本体「交換」の場合にW入力
  const isToiletBody = masterDef?.id.includes("toilet_body");
  const showToiletBodyPhoto = isToiletBody && selectedOption === "change";
  const showToiletBodyW = isToiletBody && selectedOption === "change";

  // トイレ：排水の条件分岐
  const isToiletHaisui = masterDef?.id.includes("toilet_haisui");
  const showToiletHaisuiWallMm = isToiletHaisui && selectedOption === "wall";
  const showToiletHaisuiFloorMm = isToiletHaisui && selectedOption === "floor";

  // トイレ：入口建具
  const isToiletIriguchi = masterDef?.id.includes("toilet_iriguchi");
  const showToiletIriguchiOptions = false;

  // トイレ：入口段差
  const isToiletDansa = masterDef?.id.includes("toilet_dansa");
  const showToiletDansaMm = isToiletDansa && selectedOption === "yes";

  // トイレ：照明
  const isToiletLight = masterDef?.id.includes("toilet_light");
  const showToiletLightOptions = false;
  const isToiletStorage = !!masterDef?.id && masterDef.id.includes("toilet_storage");
  const showToiletStorageKadodana = isToiletStorage && toiletStorageSelections.includes("kadodana");
  const isToiletPaperHolder = masterDef?.id.includes("toilet_paper_holder");
  const showToiletPaperHolderOptions = isToiletPaperHolder && selectedOption === "change";
  const isToiletTowelRing = masterDef?.id.includes("toilet_towel_ring");
  const showToiletTowelRingPhotos = isToiletTowelRing && selectedOption === "change";

  // LD（洋室と同一ロジック）
  const isLdIriguchi = masterDef?.id.includes("ld_iriguchi");
  const showLdIriguchiOptions = isLdIriguchi && (selectedOption === "keep" || selectedOption === "change");

  const isLdDansa = masterDef?.id.includes("ld_dansa");
  const showLdDansaMm = isLdDansa && selectedOption === "yes";

  const isLdStorage = masterDef?.id.includes("ld_storage") && !masterDef?.id.includes("ld_storage_inside");
  const showLdStorageKeep = isLdStorage && selectedOption === "keep";
  const showLdStorageChange = isLdStorage && selectedOption === "change";
  const showLdStorageOptions = isLdStorage && (selectedOption === "keep" || selectedOption === "change");
  const showLdStorageChangeOnly = isLdStorage && selectedOption === "change";

  const isLdStorageInside = masterDef?.id.includes("ld_storage_inside");
  const showLdStorageInsideKadodana = isLdStorageInside && selectedOption === "kadodana";
  const showLdStorageInsideMakuradana = isLdStorageInside && selectedOption === "makuradana";
  const showLdStorageInsideChudan = isLdStorageInside && selectedOption === "chudan";

  const isLdLight = masterDef?.id.includes("ld_light");
  const showLdLightOptions = isLdLight && (selectedOption === "dl_change" || selectedOption === "dl_new");

  const isLdAmido = masterDef?.id.includes("ld_amido");
  const showLdAmidoColor = isLdAmido && selectedOption === "change";

  // ===== LDK 新項目 =====
  // LDK 床
  const isLdkFloor = masterDef?.id.includes("ld_floor");
  const showLdkFloorKumi = isLdkFloor && (selectedOption === "flooring" || selectedOption === "ft" || selectedOption === "cf");
  const isMadowaku = masterDef?.id.includes("madowaku");
  const showMadowakuRailNote = isMadowaku && !masterDef?.id.includes("ld_madowaku") && (selectedOption === "paint" || selectedOption === "sheet");
  // LDK 巾木
  const isLdkHabaki = masterDef?.id.includes("ld_habaki");
  const showLdkHabakiWoodPhoto = isLdkHabaki && selectedOption === "wood";
  const showLdkHabakiSoftPhoto = isLdkHabaki && selectedOption === "soft";
  // LDK 照明
  const isLdkLight = !!masterDef?.id && (masterDef.id.includes("ld_light") || masterDef.id.includes("kitchen_light") || masterDef.id.includes("washitsu_light"));
  const showLdkLightOptions = isLdkLight && selectedOption !== "keep" && selectedOption !== "";
  const showLdkLightDlPart = isLdkLight && (ldkLightDlType === "dl_change" || ldkLightDlType === "dl_new" || selectedOption === "dl_change" || selectedOption === "dl_new");
  const isKaidanBody = masterDef?.id.includes("kaidan_body");
  const showKaidanPhoto = isKaidanBody && selectedOption !== "";
  const isKaidanLight = masterDef?.id.includes("kaidan_light");
  const showKaidanLightOptions = isKaidanLight && selectedOption !== "keep" && selectedOption !== "";
  // LDK 建具
  const isLdkTategu = masterDef?.id.includes("ld_tategu");
  const showLdkTateguChange = isLdkTategu && selectedOption === "change";

  // ===== 洋室 新項目 =====
  // 洋室 床
  const isYoshitsuFloor = masterDef?.id.includes("yoshitsu_floor") || masterDef?.id.includes("senmen_floor") || masterDef?.id.includes("toilet_floor");
  const showYoshitsuFloorKumi = isYoshitsuFloor && (selectedOption === "flooring" || selectedOption === "ft" || selectedOption === "cf");
  const showWashitsuYoshitsuTatamithickness = room?.roomType === "WASHITSU_YOSHITSU" && isYoshitsuFloor && selectedOption !== "" && selectedOption !== "keep";
  // 洋室 巾木
  const isYoshitsuHabaki = masterDef?.id.includes("yoshitsu_habaki") || masterDef?.id.includes("senmen_habaki") || masterDef?.id.includes("toilet_habaki");
  const showYoshitsuHabakiWoodPhoto = isYoshitsuHabaki && selectedOption === "wood";
  const showYoshitsuHabakiSoftPhoto = isYoshitsuHabaki && selectedOption === "soft";
  // 洋室 照明
  const isYoshitsuLightNew = masterDef?.id.includes("yoshitsu_light") || masterDef?.id.includes("senmen_light") || masterDef?.id.includes("toilet_light");
  const showYoshitsuLightNewOptions = isYoshitsuLightNew && selectedOption !== "keep" && selectedOption !== "";
  // 洋室 建具
  const isYoshitsuTategu = masterDef?.id.includes("yoshitsu_tategu") || masterDef?.id.includes("senmen_iriguchi") || masterDef?.id.includes("toilet_iriguchi");
  const showYoshitsuTateguChange = isYoshitsuTategu && selectedOption === "change";
  // LDK 収納（ld_storage のみ、ld_storage_inside は除��）
  const isLdkStorage = masterDef?.id === "ld_storage" || (masterDef?.id.includes("ld_storage") && !masterDef?.id.includes("ld_storage_inside"));
  const isKitchenStorage = !!(masterDef?.id && masterDef.id.includes("kitchen_storage") && !masterDef.id.includes("kitchen_storage_inside"));
  const showLdkStorageChange = (isLdkStorage || isKitchenStorage) && selectedOption === "change";
  // 洋室 収納（yoshitsu_storage のみ）
  const isYoshitsuStorageNew = masterDef?.id === "yoshitsu_storage" || (masterDef?.id.includes("yoshitsu_storage") && !masterDef?.id.includes("yoshitsu_storage_inside"));
  const showYoshitsuStorageChange = isYoshitsuStorageNew && selectedOption === "change";
  // LDK 収納内部（ld_storage_inside）
  const isLdkStorageInside = !!(masterDef?.id && (masterDef.id.includes("ld_storage_inside") || masterDef.id.includes("kitchen_storage_inside") || masterDef.id.includes("rouka_storage_inside")));
  // 洋室 収納内部（yoshitsu_storage_inside）
  const isYoshitsuStorageInsideNew = !!(masterDef?.id && masterDef.id.includes("yoshitsu_storage_inside"));
  const isYoshitsuStorageInsideLike = isYoshitsuStorageInsideNew;
  const hideStorageInsidePrice = isLdkStorageInside || isYoshitsuStorageInsideLike;

  // 統合：照明オプションを全ての部屋で使えるように拡張
  const showAllLightOptions = showLightOptions || showSenmenLightOptions || showToiletLightOptions || showLdLightOptions;
  const showLightColorBodyOptions =
    !!masterDef?.id.includes("_light") &&
    (isSelectedLightDl ||
      showWashitsuLightOptions ||
      showSenmenLightOptions ||
      showToiletLightOptions ||
      showLdLightOptions ||
      ldkLightDlType === "dl_change" ||
      ldkLightDlType === "dl_new" ||
      yoshitsuLightDlType === "dl_change" ||
      yoshitsuLightDlType === "dl_new");
  const showRosettePhoto =
    ((isLdkLight || isYoshitsuLightNew || isKaidanLight) && selectedOption === "rosette") ||
    (isLdkLight && ldkLightRosette) ||
    (isYoshitsuLightNew && yoshitsuLightRosette) ||
    (isKaidanLight && kaidanLightRosette);
  const rosettePhoto = isKaidanLight ? kaidanLightRosettePhoto : isYoshitsuLightNew ? yoshitsuLightRosettePhoto : ldkLightRosettePhoto;
  const setRosettePhoto = isKaidanLight
    ? setKaidanLightRosettePhoto
    : isYoshitsuLightNew
      ? setYoshitsuLightRosettePhoto
      : setLdkLightRosettePhoto;
  const showSelectedLightDlPhoto =
    ((isLdkLight || isYoshitsuLightNew || isKaidanLight) && (selectedOption === "dl_change" || selectedOption === "dl_new")) ||
    (isLdkLight && (ldkLightDlType === "dl_change" || ldkLightDlType === "dl_new")) ||
    (isYoshitsuLightNew && (yoshitsuLightDlType === "dl_change" || yoshitsuLightDlType === "dl_new")) ||
    (isKaidanLight && (kaidanLightDlType === "dl_change" || kaidanLightDlType === "dl_new"));
  const selectedLightDlPhoto = isKaidanLight ? kaidanLightDlPhoto : isYoshitsuLightNew ? yoshitsuLightDlPhoto : ldkLightDlPhoto;
  const setSelectedLightDlPhoto = isKaidanLight
    ? setKaidanLightDlPhoto
    : isYoshitsuLightNew
      ? setYoshitsuLightDlPhoto
      : setLdkLightDlPhoto;
  const selectedLightDlLabel =
    selectedOption === "dl_new" || ldkLightDlType === "dl_new" || yoshitsuLightDlType === "dl_new" || kaidanLightDlType === "dl_new"
      ? "DL新規写真"
      : "DL写真";
  const showWashitsuYoshitsuFloorPhoto =
    room?.roomType === "WASHITSU_YOSHITSU" && isYoshitsuFloor && (selectedOption === "flooring" || selectedOption === "ft" || selectedOption === "cf");

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-52px)] p-6">
        <p className="text-muted-foreground">項目が選択されていません。</p>
      </div>
    );
  }

  const storageInsideLabelMap: Record<string, string> = {
    kadodana: "可動棚",
    makuradana: "枕棚",
    hp: "HP",
    makuradana_hp: "枕棚+HP",
    chudan: "中段",
  };
  const storageInsideSelections = isLdkStorageInside
    ? ldkStorageInsideSelections
    : isYoshitsuStorageInsideLike
      ? yoshitsuStorageInsideSelections
      : [];
  const activeStorageInsideSelections = storageInsideSelections.filter((key) => key !== "hp");
  const storageInsideOptionLabel =
    activeStorageInsideSelections.map((key) => storageInsideLabelMap[key] ?? key).join(" / ") || selectedOptionLabel;
  const storageInsideOptionValue = activeStorageInsideSelections.join(",") || selectedOption;
  const toiletStorageOptionValue = toiletStorageSelections.join(",") || selectedOption;
  const toiletStorageOptionLabel =
    toiletStorageSelections
      .map((key) => TOILET_STORAGE_UI_OPTIONS.find((option) => option.value === key)?.label ?? key)
      .join(" / ") || selectedOptionLabel;

  const handleSave = () => {
    addWorkItem({
      ...item,
      selectedOption: isRoukaStorageInside
        ? roukaStorageInsideMultiple.join(",")
        : isToiletStorage
          ? toiletStorageOptionValue
          : hideStorageInsidePrice
            ? storageInsideOptionValue
            : selectedOption,
      selectedOptionLabel: isRoukaStorageInside
        ? roukaStorageInsideMultiple.join(",")
        : isToiletStorage
          ? toiletStorageOptionLabel
          : hideStorageInsidePrice
            ? storageInsideOptionLabel
            : selectedOptionLabel,
      qty,
      unit,
      unitPrice,
      lineSubtotal,
      note: itemNote.trim(),
      crossTotalArea: showCrossCalculator ? crossCalculation.totalArea : undefined,
      crossCeilingHeight: showCrossCalculator ? crossCeilingHeight : undefined,
      crossScope: showCrossCalculator ? crossScope : undefined,
      crossTargetRooms: showCrossCalculator ? crossSelectedRoomKeys.join(",") : undefined,
      crossEstimatedSqm: showCrossCalculator ? crossCalculation.estimatedSqm : undefined,
      crossEstimatedMeters: showCrossCalculator ? crossCalculation.estimatedMeters : undefined,
      crossManualQty: showCrossCalculator && crossQtyOverridden ? crossManualQty ?? qty : undefined,
      crossQtyOverridden: showCrossCalculator ? crossQtyOverridden : undefined,
      // 玄関収納用
      storageWidth: showStorageOptions ? storageWidth : undefined,
      storageDepth: showStorageOptions ? storageDepth : undefined,
      storageShape: showStorageOptions ? storageShape : undefined,
      storageMirror: showStorageMirror ? storageMirror : undefined,
      // 玄関収納形状別カスタム画像
      storageShapeKonojiImage: showStorageOptions ? storageShapeKonojiImage : undefined,
      storageShapeNinojiImage: showStorageOptions ? storageShapeNinojiImage : undefined,
      storageShapeShitadaiImage: showStorageOptions ? storageShapeShitadaiImage : undefined,
      storageShapeTallImage: showStorageOptions ? storageShapeTallImage : undefined,
      // 玄関��連の写真
      genkanDoorPhoto: showGenkanDoorPhoto ? genkanDoorPhoto : undefined,
      genkanFramePhoto: showGenkanFramePhoto ? genkanFramePhoto : undefined,
      genkanGuardPhoto: showGenkanGuardPhoto ? genkanGuardPhoto : undefined,
      genkanStopperPhoto: showGenkanStopperPhoto ? genkanStopperPhoto : undefined,
      genkanDomaPhoto: showGenkanDomaPhoto ? genkanDomaPhoto : undefined,
      storageMirrorKonojiPhoto: showStorageMirrorKonojiPhoto ? storageMirrorKonojiPhoto : undefined,
      storageMirrorTallPhoto: showStorageMirrorTallPhoto ? storageMirrorTallPhoto : undefined,
      genkanLightDlPhoto: showGenkanLightDlPhoto ? genkanLightDlPhoto : undefined,
      genkanLightBracketPhoto: showGenkanLightBracketPhoto ? genkanLightBracketPhoto : undefined,
      kamachiLPhoto: showKamachiLPhoto ? kamachiLPhoto : undefined,
      kamachiUsuPhoto: showKamachiUsuPhoto ? kamachiUsuPhoto : undefined,
      kamachiTilePhoto: showKamachiTilePhoto ? kamachiTilePhoto : undefined,
      kamachiSize: showKamachiSize ? kamachiSize : undefined,
      habakiWoodPhoto: showHabakiWoodPhoto ? habakiWoodPhoto : undefined,
      habakiSoftPhoto: showHabakiSoftPhoto ? habakiSoftPhoto : undefined,
      // 玄関照明・廊下照明用
      lightCount: showLightOptions ? lightCount : undefined,
      lightDiameter: showLightDiameterOptions ? lightDiameter : undefined,
      lightBodyColor: showLightColorBodyOptions ? lightBodyColor : undefined,
      lightColor: showLightColorBodyOptions ? lightColor : undefined,
      genkanLightColorDenkyu: showLightColorBodyOptions && lightColor === "電球色" ? genkanLightColorDenkyu : undefined,
      genkanLightColorChuhaku: showLightColorBodyOptions && lightColor === "昼白色" ? genkanLightColorChuhaku : undefined,
      genkanLightColorOnhaku: showLightColorBodyOptions && lightColor === "温白色" ? genkanLightColorOnhaku : undefined,
      genkanLightBodyBlack: showLightColorBodyOptions && lightBodyColor === "ブラック" ? genkanLightBodyBlack : undefined,
      genkanLightBodyWhite: showLightColorBodyOptions && lightBodyColor === "ホワイト" ? genkanLightBodyWhite : undefined,
  // 廊下床用
  roukaFloorCfPhoto: (showRoukaFloorPhotoUI && selectedOption === "cf") ? roukaFloorCfPhoto : undefined,
  roukaFloorFloortilePhoto: (showRoukaFloorPhotoUI && selectedOption === "ft") ? roukaFloorFloortilePhoto : undefined,
  roukaFloorFlooringPhoto: (showRoukaFloorPhotoUI && selectedOption === "flooring") ? roukaFloorFlooringPhoto : undefined,
  // 廊下巾木用
  roukaHabakiWoodPhoto: (showRoukaHabakiPhotoUI && selectedOption === "wood") ? roukaHabakiWoodPhoto : undefined,
  roukaHabakiSoftPhoto: (showRoukaHabakiPhotoUI && selectedOption === "soft") ? roukaHabakiSoftPhoto : undefined,
  // 廊下収納用
  roukaStorageWidth: showRoukaStorageOptions ? roukaStorageWidth : undefined,
  roukaStorageDepth: showRoukaStorageOptions ? roukaStorageDepth : undefined,
  roukaStorageSpec: showRoukaStorageOptions ? roukaStorageSpec : undefined,
  roukaStorageType: showRoukaStorageOptions ? selectedOption : undefined,
  roukaStorageOredoPhoto: (showRoukaStorageOptions && selectedOption === "oredo") ? roukaStorageOredoPhoto : undefined,
  roukaStorageRyobirakiPhoto: (showRoukaStorageOptions && selectedOption === "ryobiraki") ? roukaStorageRyobirakiPhoto : undefined,
  roukaStorageFrame: showRoukaStorageOptions ? roukaStorageFrame : undefined,
  roukaStorageFramePhoto: showRoukaStorageOptions ? roukaStorageFramePhoto : undefined,
  roukaStorageOredoW: (showRoukaStorageOptions && selectedOption === "oredo") ? roukaStorageOredoW : undefined,
  roukaStorageOredoH: (showRoukaStorageOptions && selectedOption === "oredo") ? roukaStorageOredoH : undefined,
  roukaStorageRyobirakiW: (showRoukaStorageOptions && selectedOption === "ryobiraki") ? roukaStorageRyobirakiW : undefined,
  roukaStorageRyobirakiH: (showRoukaStorageOptions && selectedOption === "ryobiraki") ? roukaStorageRyobirakiH : undefined,
  // 廊下収納内部用（新仕様）
  roukaStorageInsideKadodanaPhoto: showRoukaStorageInsideKadodana ? roukaStorageInsideKadodanaPhoto : undefined,
  roukaStorageInsideMakuradanaPhoto: showRoukaStorageInsideMakuradana ? roukaStorageInsideMakuradanaPhoto : undefined,
  roukaStorageInsideHpPhoto: showRoukaStorageInsideHp ? roukaStorageInsideHpPhoto : undefined,
  roukaStorageInsideChuudanPhoto: showRoukaStorageInsideChuudan ? roukaStorageInsideChuudanPhoto : undefined,
  roukaStorageInsideKadodanaFixMethod: showRoukaStorageInsideKadodana ? roukaStorageInsideKadodanaFixMethod : undefined,
  roukaStorageInsideKadodanaColor: showRoukaStorageInsideKadodana ? roukaStorageInsideKadodanaColor : undefined,
  roukaStorageInsideKadodanaW: showRoukaStorageInsideKadodana ? roukaStorageInsideKadodanaW : undefined,
  roukaStorageInsideKadodanaD: showRoukaStorageInsideKadodana ? roukaStorageInsideKadodanaD : undefined,
  roukaStorageInsideKadodanaSteps: showRoukaStorageInsideKadodana ? roukaStorageInsideKadodanaSteps : undefined,
  roukaStorageInsideMakuradanaW: showRoukaStorageInsideMakuradana ? roukaStorageInsideMakuradanaW : undefined,
  roukaStorageInsideChuudanW: showRoukaStorageInsideChuudan ? roukaStorageInsideChuudanW : undefined,
  // 廊下収納内部用（旧仕様・互換性維持）
  storageInsideSteps: showStorageInsideKadodana ? storageInsideSteps : undefined,
  storageInsideDepth: showStorageInsideKadodana ? storageInsideDepth : undefined,
  storageInsideWidth: showStorageInsideMakuradana ? storageInsideWidth : undefined,
      // キッチン本体用
        kitchenBodyWidth: showKitchenBodyWidth ? kitchenBodyWidth : undefined,
        kitchenRelocation: isKitchenBody ? kitchenRelocation : undefined,
        kitchenExisting: isKitchenBody ? kitchenExisting : undefined,
        kitchenShape: isKitchenBody ? kitchenShape : undefined,
        kitchenDepth: isKitchenBody ? kitchenDepth : undefined,
        kitchenWidth: isKitchenBody ? kitchenWidth : undefined,
        kitchenHeating: isKitchenBody ? kitchenHeating : undefined,
        kitchenDrawer: isKitchenBody ? kitchenDrawer : undefined,
        kitchenEndPanel: isKitchenBody ? kitchenEndPanel : undefined,
        kitchenLSize: isKitchenBody ? kitchenLSize : undefined,
        kitchenWallCabinet: isKitchenBody ? kitchenWallCabinet : undefined,
        kitchenWallCabinetHeight: isKitchenBody ? kitchenWallCabinetHeight : undefined,
        kitchenDishwasherExisting: isKitchenBody ? kitchenDishwasherExisting : undefined,
        kitchenDishwasherAfter: isKitchenBody ? kitchenDishwasherAfter : undefined,
        kitchenWorktop: isKitchenBody ? kitchenWorktop : undefined,
        kitchenSink: isKitchenBody ? kitchenSink : undefined,
        kitchenSelectedMaker: isKitchenBody ? kitchenSelectedMaker : undefined,
        kitchenMakerPhotos: isKitchenBody ? kitchenMakerPhotos : undefined,
      // 吊戸用
      tsuritoHeight: showTsuritoHeight ? tsuritoHeight : undefined,
      // 食洗機用
      dishwasherExistK: showDishwasherExistK ? dishwasherExistK : undefined,
      // ワークトップ用
      worktopDrawerType: showWorktopDrawerType ? worktopDrawerType : undefined,
      // 洋室入口建具用
      yoshitsuIriguchiW: showYoshitsuIriguchiOptions ? yoshitsuIriguchiW : undefined,
      yoshitsuIriguchiD: showYoshitsuIriguchiOptions ? yoshitsuIriguchiD : undefined,
      yoshitsuIriguchiSpec: showYoshitsuIriguchiOptions ? yoshitsuIriguchiSpec : undefined,
      // 洋室入口段差用
      yoshitsuDansaMm: showYoshitsuDansaMm ? yoshitsuDansaMm : undefined,
      // 洋室収納（旧来フィールドは互換のために残す）
      yoshitsuStorageD: yoshitsuStorageD ?? undefined,
      yoshitsuStorageKadodana: yoshitsuStorageKadodana ?? undefined,
      yoshitsuStorageTanabashira: yoshitsuStorageTanabashira ?? undefined,
      // 洋室収納内部用
      yoshitsuStorageInsideSteps: showYoshitsuStorageInsideKadodana ? yoshitsuStorageInsideSteps : undefined,
      yoshitsuStorageInsideD: showYoshitsuStorageInsideKadodana ? yoshitsuStorageInsideD : undefined,
      yoshitsuStorageInsideW: showYoshitsuStorageInsideMakuradana ? yoshitsuStorageInsideW : undefined,
      // 洋室網戸用
      yoshitsuAmidoColor: showYoshitsuAmidoColor ? yoshitsuAmidoColor : undefined,
      // 全体項目：給湯器用
      kyutoukiHinban: showZentaiKyutoukiHinban ? kyutoukiHinban : undefined,
      // 和室用
      washitsuYoushitsuTatamiMm: showWashitsuYoushitsuTatamiMm ? washitsuYoushitsuTatamiMm : undefined,
      washitsuShojiRailFinish: showWashitsuShojiRailFinish ? washitsuShojiRailFinish : undefined,
      washitsuCeilingType: showWashitsuCeilingType ? washitsuCeilingType : undefined,
      washitsuLightDl: showWashitsuLightOptions ? washitsuLightDl : undefined,
      washitsuLightColor: showWashitsuLightOptions ? washitsuLightColor : undefined,
      washitsuOshiireW: showWashitsuOshiireOptions ? washitsuOshiireW : undefined,
      washitsuOshiireH: showWashitsuOshiireOptions ? washitsuOshiireH : undefined,
      washitsuOshiireMikomi: showWashitsuOshiireOptions ? washitsuOshiireMikomi : undefined,
      washitsuTatami: showWashitsuTatamiOptions ? washitsuTatami : undefined,
      washitsuTatamiBeri: showWashitsuTatamiOptions ? washitsuTatamiBeri : undefined,
      washitsuFusumaSize: showWashitsuFusumaOptions ? washitsuFusumaSize : undefined,
      washitsuFusumaCount: showWashitsuFusumaOptions ? washitsuFusumaCount : undefined,
      washitsuShojiSize: showWashitsuShojiOptions ? washitsuShojiSize : undefined,
      washitsuShojiCount: showWashitsuShojiOptions ? washitsuShojiCount : undefined,
      washitsuMawabuchiDetail: showWashitsuMawabuchiDetail ? washitsuMawabuchiDetail : undefined,
      washitsuLightNoSwitchOption: showWashitsuSwitchNoneOption ? washitsuLightNoSwitchOption : undefined,
      kaidanSpec: isKaidanBody ? selectedOptionLabel : undefined,
      kaidanSideboardSpec: masterDef?.id.includes("kaidan_sideboard") ? selectedOptionLabel : undefined,
      kaidanNonslip: masterDef?.id.includes("kaidan_nonslip") ? selectedOptionLabel : undefined,
      kaidanTeshiro: masterDef?.id.includes("kaidan_tesuri") ? selectedOptionLabel : undefined,
      kaidanKasagi: masterDef?.id.includes("kaidan_kasagi") ? selectedOptionLabel : undefined,
      kaidanHabaki: masterDef?.id.includes("kaidan_habaki") ? selectedOptionLabel : undefined,
      kaidanLight: isKaidanLight ? selectedOptionLabel : undefined,
      kaidanPhoto: showKaidanPhoto ? kaidanPhoto : undefined,
      kaidanLightRosette: isKaidanLight ? kaidanLightRosette : undefined,
      kaidanLightRosettePhoto: isKaidanLight && (selectedOption === "rosette" || kaidanLightRosette) ? kaidanLightRosettePhoto : undefined,
      kaidanLightDlType: isKaidanLight ? kaidanLightDlType : undefined,
      kaidanLightDlPhoto: isKaidanLight && showSelectedLightDlPhoto ? kaidanLightDlPhoto : undefined,
      kaidanLightIndirect: isKaidanLight ? kaidanLightIndirect : undefined,
      kaidanLightIndirectPhoto: isKaidanLight ? kaidanLightIndirectPhoto : undefined,
      // UB用
      ubBodySize: showUbBodySize ? ubBodySize : undefined,
      ubBodySizeCustom: showUbBodySize && ubBodySize === "その他手入力" ? ubBodySizeCustom : undefined,
      ubSelectedProduct: showUbBodySize ? ubSelectedProduct : undefined,
      ubMakerPhotos: showUbBodySize ? ubMakerPhotos : undefined,
      ubKizonsetsubiEnergyType: showUbKizonsetsubiEnergyType ? ubKizonsetsubiEnergyType : undefined,
      ubVentSpec: showUbVentSpec ? ubVentSpec : undefined,
      ubExistingHotwater: showUbHotwaterOptions ? ubExistingHotwater : undefined,
      ubAfterHotwater: showUbHotwaterOptions ? ubAfterHotwater : undefined,
      ubDryerEnergyType: showUbDryerEnergyType ? ubDryerEnergyType : undefined,
      // 洗面������用
      senmenBodyW: showSenmenBodyW ? senmenBodyW : undefined,
      senmenBodySize: showSenmenBodyW ? senmenBodySize : undefined,
      senmenSelectedProduct: showSenmenBodyW ? senmenSelectedProduct : undefined,
      senmenMakerPhotos: showSenmenBodyW ? senmenMakerPhotos : undefined,
      senmenWashingPanSize: showSenmenWashingPanSize ? senmenWashingPanSize : undefined,
      senmenWashingPanSizeCustom: showSenmenWashingPanSize && senmenWashingPanSize === "手入力" ? senmenWashingPanSizeCustom : undefined,
      senmenHeightMm: showSenmenHeight ? senmenHeightMm : undefined,
      senmenIriguchiW: showSenmenIriguchiOptions ? senmenIriguchiW : undefined,
      senmenIriguchiD: showSenmenIriguchiOptions ? senmenIriguchiD : undefined,
      senmenIriguchiSpec: showSenmenIriguchiOptions ? senmenIriguchiSpec : undefined,
      senmenDansaMm: showSenmenDansaMm ? senmenDansaMm : undefined,
      // トイレ用
      toiletBodyW: showToiletBodyW ? toiletBodyW : undefined,
      toiletBodyPhoto: showToiletBodyPhoto ? toiletBodyPhoto : undefined,
      toiletDrainage: showToiletBodyW ? toiletDrainage : undefined,
      toiletFloorDrainMm: showToiletBodyW && toiletDrainage === "床排水" ? toiletFloorDrainMm : undefined,
      toiletFloorDrainCustomMm: showToiletBodyW && toiletDrainage === "床排水" && toiletFloorDrainMm === "手入力" ? toiletFloorDrainCustomMm : undefined,
      toiletWallDrainMm: showToiletBodyW && toiletDrainage === "壁排水" ? toiletWallDrainMm : undefined,
      toiletHaisuiWallMm: showToiletHaisuiWallMm ? toiletHaisuiWallMm : undefined,
      toiletHaisuiFloorMm: showToiletHaisuiFloorMm ? toiletHaisuiFloorMm : undefined,
      toiletIriguchiW: showToiletIriguchiOptions ? toiletIriguchiW : undefined,
      toiletIriguchiD: showToiletIriguchiOptions ? toiletIriguchiD : undefined,
      toiletIriguchiSpec: showToiletIriguchiOptions ? toiletIriguchiSpec : undefined,
      toiletDansaMm: showToiletDansaMm ? toiletDansaMm : undefined,
      toiletStorageSelections: isToiletStorage ? toiletStorageSelections.join(",") : undefined,
      toiletPaperHolderType: showToiletPaperHolderOptions ? toiletPaperHolderType : undefined,
      toiletPaperHolderSinglePhotos: showToiletPaperHolderOptions && toiletPaperHolderType === "1連" ? toiletPaperHolderSinglePhotos : undefined,
      toiletPaperHolderDoublePhoto: showToiletPaperHolderOptions && toiletPaperHolderType === "2連" ? toiletPaperHolderDoublePhoto : undefined,
      toiletTowelRingPhotos: showToiletTowelRingPhotos ? toiletTowelRingPhotos : undefined,
      // LD用
      ldIriguchiW: showLdIriguchiOptions ? ldIriguchiW : undefined,
      ldIriguchiD: showLdIriguchiOptions ? ldIriguchiD : undefined,
      ldIriguchiSpec: showLdIriguchiOptions ? ldIriguchiSpec : undefined,
      ldDansaMm: showLdDansaMm ? ldDansaMm : undefined,
      // LD収納（修正版）
      ldStorageKeepW: showLdStorageKeep ? ldStorageKeepW : undefined,
      ldStorageKeepH: showLdStorageKeep ? ldStorageKeepH : undefined,
      ldStorageKeepD: showLdStorageKeep ? ldStorageKeepD : undefined,
      ldStorageKeepSpec: showLdStorageKeep ? ldStorageKeepSpec : undefined,
      ldStorageChangeW: showLdStorageChange ? ldStorageChangeW : undefined,
      ldStorageChangeH: showLdStorageChange ? ldStorageChangeH : undefined,
      ldStorageChangeD: showLdStorageChange ? ldStorageChangeD : undefined,
      ldStorageChangeSpec: showLdStorageChange ? ldStorageChangeSpec : undefined,
      ldStorageInsideSteps: showLdStorageInsideKadodana ? ldStorageInsideSteps : undefined,
      ldStorageInsideD: showLdStorageInsideKadodana ? ldStorageInsideD : undefined,
      ldStorageInsideW: showLdStorageInsideMakuradana ? ldStorageInsideW : undefined,
      ldAmidoColor: showLdAmidoColor ? ldAmidoColor : undefined,
      // LDK 収納内部（新仕様）
      ldkStorageInsideSelections: isLdkStorageInside ? ldkStorageInsideSelections.join(",") : undefined,
      ldkStorageInsideKadodanaSteps: isLdkStorageInside ? ldkStorageInsideKadodanaSteps : undefined,
      ldkStorageInsideKadodanaW: isLdkStorageInside ? ldkStorageInsideKadodanaW : undefined,
      ldkStorageInsideKadodanaW_custom: isLdkStorageInside ? ldkStorageInsideKadodanaW_custom : undefined,
      ldkStorageInsideKadodanaD: isLdkStorageInside ? ldkStorageInsideKadodanaD : undefined,
      ldkStorageInsideKadodanaD_custom: isLdkStorageInside ? ldkStorageInsideKadodanaD_custom : undefined,
      ldkStorageInsideKadodanaMethod: isLdkStorageInside ? ldkStorageInsideKadodanaMethod : undefined,
      ldkStorageInsideKadodanaRailH: isLdkStorageInside ? ldkStorageInsideKadodanaRailH : undefined,
      ldkStorageInsideKadodanaRailColor: isLdkStorageInside ? ldkStorageInsideKadodanaRailColor : undefined,
      ldkStorageInsideMakuradanaW: isLdkStorageInside ? ldkStorageInsideMakuradanaW : undefined,
      ldkStorageInsideHpW: isLdkStorageInside ? ldkStorageInsideHpW : undefined,
      ldkStorageInsideMakuradanaHpW: isLdkStorageInside ? ldkStorageInsideMakuradanaHpW : undefined,
      ldkStorageInsideChudanNote: isLdkStorageInside ? ldkStorageInsideChudanNote : undefined,
      ldkStorageInsideMakuradanaCategory: isLdkStorageInside ? ldkStorageInsideMakuradanaCategory : undefined,
      ldkStorageInsideMakuradanaSize: isLdkStorageInside ? ldkStorageInsideMakuradanaSize : undefined,
      ldkStorageInsideMakuradanaDimensions: isLdkStorageInside ? ldkStorageInsideMakuradanaDimensions : undefined,
      ldkStorageInsideMakuradanaPrice: isLdkStorageInside ? ldkStorageInsideMakuradanaPrice : undefined,
      ldkStorageInsideHpCategory: isLdkStorageInside ? ldkStorageInsideHpCategory : undefined,
      ldkStorageInsideHpLength: isLdkStorageInside ? ldkStorageInsideHpLength : undefined,
      ldkStorageInsideHpPrice: isLdkStorageInside ? ldkStorageInsideHpPrice : undefined,
      ldkStorageInsideMakuradanaHpShelfCategory: isLdkStorageInside ? ldkStorageInsideMakuradanaHpShelfCategory : undefined,
      ldkStorageInsideMakuradanaHpShelfSize: isLdkStorageInside ? ldkStorageInsideMakuradanaHpShelfSize : undefined,
      ldkStorageInsideMakuradanaHpShelfDimensions: isLdkStorageInside ? ldkStorageInsideMakuradanaHpShelfDimensions : undefined,
      ldkStorageInsideMakuradanaHpShelfPrice: isLdkStorageInside ? ldkStorageInsideMakuradanaHpShelfPrice : undefined,
      ldkStorageInsideMakuradanaHpHpCategory: isLdkStorageInside ? ldkStorageInsideMakuradanaHpHpCategory : undefined,
      ldkStorageInsideMakuradanaHpHpLength: isLdkStorageInside ? ldkStorageInsideMakuradanaHpHpLength : undefined,
      ldkStorageInsideMakuradanaHpHpPrice: isLdkStorageInside ? ldkStorageInsideMakuradanaHpHpPrice : undefined,
      ldkStorageInsideChudanCategory: isLdkStorageInside ? ldkStorageInsideChudanCategory : undefined,
      ldkStorageInsideChudanSize: isLdkStorageInside ? ldkStorageInsideChudanSize : undefined,
      ldkStorageInsideChudanDimensions: isLdkStorageInside ? ldkStorageInsideChudanDimensions : undefined,
      ldkStorageInsideChudanPrice: isLdkStorageInside ? ldkStorageInsideChudanPrice : undefined,
      ldkStorageInsideKadodanaPhoto: isLdkStorageInside ? ldkStorageInsideKadodanaPhoto : undefined,
      ldkStorageInsideMakuradanaPhoto: isLdkStorageInside ? ldkStorageInsideMakuradanaPhoto : undefined,
      ldkStorageInsideHpPhoto: isLdkStorageInside ? ldkStorageInsideHpPhoto : undefined,
      ldkStorageInsideMakuradanaHpPhoto: isLdkStorageInside ? ldkStorageInsideMakuradanaHpPhoto : undefined,
      ldkStorageInsideChudanPhoto: isLdkStorageInside ? ldkStorageInsideChudanPhoto : undefined,
      // 洋室 収納内部（新仕様）
      yoshitsuStorageInsideSelections: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideSelections.join(",") : showToiletStorageKadodana ? "kadodana" : undefined,
      yoshitsuStorageInsideKadodanaSteps: (isYoshitsuStorageInsideLike || showToiletStorageKadodana) ? yoshitsuStorageInsideKadodanaSteps : undefined,
      yoshitsuStorageInsideKadodanaW: (isYoshitsuStorageInsideLike || showToiletStorageKadodana) ? yoshitsuStorageInsideKadodanaW : undefined,
      yoshitsuStorageInsideKadodanaW_custom: (isYoshitsuStorageInsideLike || showToiletStorageKadodana) ? yoshitsuStorageInsideKadodanaW_custom : undefined,
      yoshitsuStorageInsideKadodanaD: (isYoshitsuStorageInsideLike || showToiletStorageKadodana) ? yoshitsuStorageInsideKadodanaD : undefined,
      yoshitsuStorageInsideKadodanaD_custom: (isYoshitsuStorageInsideLike || showToiletStorageKadodana) ? yoshitsuStorageInsideKadodanaD_custom : undefined,
      yoshitsuStorageInsideKadodanaMethod: (isYoshitsuStorageInsideLike || showToiletStorageKadodana) ? yoshitsuStorageInsideKadodanaMethod : undefined,
      yoshitsuStorageInsideKadodanaRailH: (isYoshitsuStorageInsideLike || showToiletStorageKadodana) ? yoshitsuStorageInsideKadodanaRailH : undefined,
      yoshitsuStorageInsideKadodanaRailColor: (isYoshitsuStorageInsideLike || showToiletStorageKadodana) ? yoshitsuStorageInsideKadodanaRailColor : undefined,
      yoshitsuStorageInsideMakuradanaW: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideMakuradanaW : undefined,
      yoshitsuStorageInsideHpW: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideHpW : undefined,
      yoshitsuStorageInsideMakuradanaHpW: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideMakuradanaHpW : undefined,
      yoshitsuStorageInsideChudanNote: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideChudanNote : undefined,
      yoshitsuStorageInsideMakuradanaCategory: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideMakuradanaCategory : undefined,
      yoshitsuStorageInsideMakuradanaSize: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideMakuradanaSize : undefined,
      yoshitsuStorageInsideMakuradanaDimensions: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideMakuradanaDimensions : undefined,
      yoshitsuStorageInsideMakuradanaPrice: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideMakuradanaPrice : undefined,
      yoshitsuStorageInsideHpCategory: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideHpCategory : undefined,
      yoshitsuStorageInsideHpLength: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideHpLength : undefined,
      yoshitsuStorageInsideHpPrice: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideHpPrice : undefined,
      yoshitsuStorageInsideMakuradanaHpShelfCategory: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideMakuradanaHpShelfCategory : undefined,
      yoshitsuStorageInsideMakuradanaHpShelfSize: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideMakuradanaHpShelfSize : undefined,
      yoshitsuStorageInsideMakuradanaHpShelfDimensions: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideMakuradanaHpShelfDimensions : undefined,
      yoshitsuStorageInsideMakuradanaHpShelfPrice: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideMakuradanaHpShelfPrice : undefined,
      yoshitsuStorageInsideMakuradanaHpHpCategory: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideMakuradanaHpHpCategory : undefined,
      yoshitsuStorageInsideMakuradanaHpHpLength: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideMakuradanaHpHpLength : undefined,
      yoshitsuStorageInsideMakuradanaHpHpPrice: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideMakuradanaHpHpPrice : undefined,
      yoshitsuStorageInsideChudanCategory: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideChudanCategory : undefined,
      yoshitsuStorageInsideChudanSize: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideChudanSize : undefined,
      yoshitsuStorageInsideChudanDimensions: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideChudanDimensions : undefined,
      yoshitsuStorageInsideChudanPrice: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideChudanPrice : undefined,
      yoshitsuStorageInsideKadodanaPhoto: (isYoshitsuStorageInsideLike || showToiletStorageKadodana) ? yoshitsuStorageInsideKadodanaPhoto : undefined,
      yoshitsuStorageInsideMakuradanaPhoto: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideMakuradanaPhoto : undefined,
      yoshitsuStorageInsideHpPhoto: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideHpPhoto : undefined,
      yoshitsuStorageInsideMakuradanaHpPhoto: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideMakuradanaHpPhoto : undefined,
      yoshitsuStorageInsideChudanPhoto: isYoshitsuStorageInsideLike ? yoshitsuStorageInsideChudanPhoto : undefined,
      // LDK 収納
      ldkStorageSpec: showLdkStorageChange ? ldkStorageSpec : undefined,
      ldkStorageHandle: showLdkStorageChange ? ldkStorageHandle : undefined,
      ldkStorageW: showLdkStorageChange ? ldkStorageW : undefined,
      ldkStorageW_custom: showLdkStorageChange ? ldkStorageW_custom : undefined,
      ldkStorageH: showLdkStorageChange ? ldkStorageH : undefined,
      ldkStorageH_custom: showLdkStorageChange ? ldkStorageH_custom : undefined,
      ldkStoragePhoto: showLdkStorageChange ? ldkStoragePhoto : undefined,
      ldkStorageFixedFrame: showLdkStorageChange ? ldkStorageFixedFrame : undefined,
      ldkStorageFixedFramePhoto: showLdkStorageChange ? ldkStorageFixedFramePhoto : undefined,
      // 洋室 収納
      yoshitsuStorageSpec: showYoshitsuStorageChange ? yoshitsuStorageSpec : undefined,
      yoshitsuStorageHandle: showYoshitsuStorageChange ? yoshitsuStorageHandle : undefined,
      yoshitsuStorageW: showYoshitsuStorageChange ? yoshitsuStorageW : undefined,
      yoshitsuStorageW_custom: showYoshitsuStorageChange ? yoshitsuStorageW_custom : undefined,
      yoshitsuStorageH: showYoshitsuStorageChange ? yoshitsuStorageH : undefined,
      yoshitsuStorageH_custom: showYoshitsuStorageChange ? yoshitsuStorageH_custom : undefined,
      yoshitsuStoragePhoto: showYoshitsuStorageChange ? yoshitsuStoragePhoto : undefined,
      yoshitsuStorageFixedFrame: showYoshitsuStorageChange ? yoshitsuStorageFixedFrame : undefined,
      yoshitsuStorageFixedFramePhoto: showYoshitsuStorageChange ? yoshitsuStorageFixedFramePhoto : undefined,
      // LDK 床
      ldkFloorKumi: showLdkFloorKumi ? ldkFloorKumi : undefined,
      ldkFloorPhoto: showLdkFloorKumi ? ldkFloorPhoto : undefined,
      // LDK 巾���
      ldkHabakiWoodPhoto: showLdkHabakiWoodPhoto ? ldkHabakiWoodPhoto : undefined,
      ldkHabakiSoftPhoto: showLdkHabakiSoftPhoto ? ldkHabakiSoftPhoto : undefined,
      // LDK 照明
      ldkLightRosette: isLdkLight ? ldkLightRosette : undefined,
      ldkLightRosettePhoto: isLdkLight && (selectedOption === "rosette" || ldkLightRosette) ? ldkLightRosettePhoto : undefined,
      ldkLightDlType: isLdkLight ? ldkLightDlType : undefined,
      ldkLightDlPhoto: isLdkLight && showSelectedLightDlPhoto ? ldkLightDlPhoto : undefined,
      ldkLightIndirect: isLdkLight ? ldkLightIndirect : undefined,
      // LDK 建具
      ldkTateguDansa: isLdkTategu ? ldkTateguDansa : undefined,
      ldkTateguDansaKubun: isLdkTategu ? ldkTateguDansaKubun : undefined,
      ldkTateguDansaCustomMm: isLdkTategu ? ldkTateguDansaCustomMm : undefined,
      ldkTateguSpec: showLdkTateguChange ? ldkTateguSpec : undefined,
      ldkKatabiraki_w: showLdkTateguChange ? ldkKatabiraki_w : undefined,
      ldkKatabiraki_h: showLdkTateguChange ? ldkKatabiraki_h : undefined,
      ldkKatabiraki_mikomi: showLdkTateguChange ? ldkKatabiraki_mikomi : undefined,
      ldkKatabiraki_tsurimoto: showLdkTateguChange ? ldkKatabiraki_tsurimoto : undefined,
      ldkKatabiraki_todomatari: showLdkTateguChange ? ldkKatabiraki_todomatari : undefined,
      ldkKatabiraki_w_custom: showLdkTateguChange ? ldkKatabiraki_w_custom : undefined,
      ldkKatabiraki_h_custom: showLdkTateguChange ? ldkKatabiraki_h_custom : undefined,
      ldkKatahiki_method: showLdkTateguChange ? ldkKatahiki_method : undefined,
      ldkKatahiki_w: showLdkTateguChange ? ldkKatahiki_w : undefined,
      ldkKatahiki_h: showLdkTateguChange ? ldkKatahiki_h : undefined,
      ldkKatahiki_mikomi: showLdkTateguChange ? ldkKatahiki_mikomi : undefined,
      ldkKatahiki_hikite: showLdkTateguChange ? ldkKatahiki_hikite : undefined,
      ldkKatahiki_w_custom: showLdkTateguChange ? ldkKatahiki_w_custom : undefined,
      ldkKatahiki_h_custom: showLdkTateguChange ? ldkKatahiki_h_custom : undefined,
      ldkNimaiHikichigai_method: showLdkTateguChange ? ldkNimaiHikichigai_method : undefined,
      ldkNimaiHikichigai_w: showLdkTateguChange ? ldkNimaiHikichigai_w : undefined,
      ldkNimaiHikichigai_h: showLdkTateguChange ? ldkNimaiHikichigai_h : undefined,
      ldkNimaiHikichigai_mikomi: showLdkTateguChange ? ldkNimaiHikichigai_mikomi : undefined,
      ldkNimaiHikichigai_hikite: showLdkTateguChange ? ldkNimaiHikichigai_hikite : undefined,
      ldkNimaiHikichigai_w_custom: showLdkTateguChange ? ldkNimaiHikichigai_w_custom : undefined,
      ldkNimaiHikichigai_h_custom: showLdkTateguChange ? ldkNimaiHikichigai_h_custom : undefined,
      ldkSanmaiHikichigai_method: showLdkTateguChange ? ldkSanmaiHikichigai_method : undefined,
      ldkSanmaiHikichigai_w: showLdkTateguChange ? ldkSanmaiHikichigai_w : undefined,
      ldkSanmaiHikichigai_h: showLdkTateguChange ? ldkSanmaiHikichigai_h : undefined,
      ldkSanmaiHikichigai_hikite: showLdkTateguChange ? ldkSanmaiHikichigai_hikite : undefined,
      ldkSanmaiHikichigai_w_custom: showLdkTateguChange ? ldkSanmaiHikichigai_w_custom : undefined,
      ldkSanmaiHikichigai_h_custom: showLdkTateguChange ? ldkSanmaiHikichigai_h_custom : undefined,
      ldkSanmaiKatahiki_method: showLdkTateguChange ? ldkSanmaiKatahiki_method : undefined,
      ldkSanmaiKatahiki_w: showLdkTateguChange ? ldkSanmaiKatahiki_w : undefined,
      ldkSanmaiKatahiki_h: showLdkTateguChange ? ldkSanmaiKatahiki_h : undefined,
      ldkSanmaiKatahiki_mikomi: showLdkTateguChange ? ldkSanmaiKatahiki_mikomi : undefined,
      ldkSanmaiKatahiki_hikite: showLdkTateguChange ? ldkSanmaiKatahiki_hikite : undefined,
      ldkSanmaiKatahiki_w_custom: showLdkTateguChange ? ldkSanmaiKatahiki_w_custom : undefined,
      ldkSanmaiKatahiki_h_custom: showLdkTateguChange ? ldkSanmaiKatahiki_h_custom : undefined,
      ldkNimaiKatahiki_photo: showLdkTateguChange ? ldkNimaiKatahiki_photo : undefined,
      ldkNimaiKatahiki_w: showLdkTateguChange ? ldkNimaiKatahiki_w : undefined,
      ldkNimaiKatahiki_h: showLdkTateguChange ? ldkNimaiKatahiki_h : undefined,
      ldkNimaiKatahiki_w_custom: showLdkTateguChange ? ldkNimaiKatahiki_w_custom : undefined,
      ldkNimaiKatahiki_h_custom: showLdkTateguChange ? ldkNimaiKatahiki_h_custom : undefined,
      ldkNimaiKatahiki_hikite: showLdkTateguChange ? ldkNimaiKatahiki_hikite : undefined,
      ldkNimaiKatahiki_hikite_photo: showLdkTateguChange ? ldkNimaiKatahiki_hikite_photo : undefined,
      // 洋室 床
      yoshitsuFloorKumi: showYoshitsuFloorKumi ? yoshitsuFloorKumi : undefined,
      yoshitsuFloorPhoto: showYoshitsuFloorKumi ? yoshitsuFloorPhoto : undefined,
      washitsuYoshitsuTatamithickness: showWashitsuYoshitsuTatamithickness ? washitsuYoshitsuTatamithickness : undefined,
      // 洋室 巾木
      yoshitsuHabakiWoodPhoto: showYoshitsuHabakiWoodPhoto ? yoshitsuHabakiWoodPhoto : undefined,
      yoshitsuHabakiSoftPhoto: showYoshitsuHabakiSoftPhoto ? yoshitsuHabakiSoftPhoto : undefined,
      // 洋室 照明
      yoshitsuLightRosette: isYoshitsuLightNew ? yoshitsuLightRosette : undefined,
      yoshitsuLightRosettePhoto: isYoshitsuLightNew && (selectedOption === "rosette" || yoshitsuLightRosette) ? yoshitsuLightRosettePhoto : undefined,
      yoshitsuLightDlType: isYoshitsuLightNew ? yoshitsuLightDlType : undefined,
      yoshitsuLightDlPhoto: isYoshitsuLightNew && showSelectedLightDlPhoto ? yoshitsuLightDlPhoto : undefined,
      yoshitsuLightIndirect: isYoshitsuLightNew ? yoshitsuLightIndirect : undefined,
      // 洋室 建具
      yoshitsuTateguDansa: isYoshitsuTategu ? yoshitsuTateguDansa : undefined,
      yoshitsuTateguDansaKubun: isYoshitsuTategu ? yoshitsuTateguDansaKubun : undefined,
      yoshitsuTateguDansaCustomMm: isYoshitsuTategu ? yoshitsuTateguDansaCustomMm : undefined,
      yoshitsuTateguSpec: showYoshitsuTateguChange ? yoshitsuTateguSpec : undefined,
      yoshitsuKatabiraki_w: showYoshitsuTateguChange ? yoshitsuKatabiraki_w : undefined,
      yoshitsuKatabiraki_h: showYoshitsuTateguChange ? yoshitsuKatabiraki_h : undefined,
      yoshitsuKatabiraki_mikomi: showYoshitsuTateguChange ? yoshitsuKatabiraki_mikomi : undefined,
      yoshitsuKatabiraki_tsurimoto: showYoshitsuTateguChange ? yoshitsuKatabiraki_tsurimoto : undefined,
      yoshitsuKatabiraki_todomatari: showYoshitsuTateguChange ? yoshitsuKatabiraki_todomatari : undefined,
      yoshitsuKatabiraki_w_custom: showYoshitsuTateguChange ? yoshitsuKatabiraki_w_custom : undefined,
      yoshitsuKatabiraki_h_custom: showYoshitsuTateguChange ? yoshitsuKatabiraki_h_custom : undefined,
      yoshitsuKatahiki_method: showYoshitsuTateguChange ? yoshitsuKatahiki_method : undefined,
      yoshitsuKatahiki_w: showYoshitsuTateguChange ? yoshitsuKatahiki_w : undefined,
      yoshitsuKatahiki_h: showYoshitsuTateguChange ? yoshitsuKatahiki_h : undefined,
      yoshitsuKatahiki_mikomi: showYoshitsuTateguChange ? yoshitsuKatahiki_mikomi : undefined,
      yoshitsuKatahiki_hikite: showYoshitsuTateguChange ? yoshitsuKatahiki_hikite : undefined,
      yoshitsuKatahiki_w_custom: showYoshitsuTateguChange ? yoshitsuKatahiki_w_custom : undefined,
      yoshitsuKatahiki_h_custom: showYoshitsuTateguChange ? yoshitsuKatahiki_h_custom : undefined,
      yoshitsuNimaiHikichigai_method: showYoshitsuTateguChange ? yoshitsuNimaiHikichigai_method : undefined,
      yoshitsuNimaiHikichigai_w: showYoshitsuTateguChange ? yoshitsuNimaiHikichigai_w : undefined,
      yoshitsuNimaiHikichigai_h: showYoshitsuTateguChange ? yoshitsuNimaiHikichigai_h : undefined,
      yoshitsuNimaiHikichigai_mikomi: showYoshitsuTateguChange ? yoshitsuNimaiHikichigai_mikomi : undefined,
      yoshitsuNimaiHikichigai_hikite: showYoshitsuTateguChange ? yoshitsuNimaiHikichigai_hikite : undefined,
      yoshitsuNimaiHikichigai_w_custom: showYoshitsuTateguChange ? yoshitsuNimaiHikichigai_w_custom : undefined,
      yoshitsuNimaiHikichigai_h_custom: showYoshitsuTateguChange ? yoshitsuNimaiHikichigai_h_custom : undefined,
      yoshitsuSanmaiHikichigai_method: showYoshitsuTateguChange ? yoshitsuSanmaiHikichigai_method : undefined,
      yoshitsuSanmaiHikichigai_w: showYoshitsuTateguChange ? yoshitsuSanmaiHikichigai_w : undefined,
      yoshitsuSanmaiHikichigai_h: showYoshitsuTateguChange ? yoshitsuSanmaiHikichigai_h : undefined,
      yoshitsuSanmaiHikichigai_hikite: showYoshitsuTateguChange ? yoshitsuSanmaiHikichigai_hikite : undefined,
      yoshitsuSanmaiHikichigai_w_custom: showYoshitsuTateguChange ? yoshitsuSanmaiHikichigai_w_custom : undefined,
      yoshitsuSanmaiHikichigai_h_custom: showYoshitsuTateguChange ? yoshitsuSanmaiHikichigai_h_custom : undefined,
      yoshitsuSanmaiKatahiki_method: showYoshitsuTateguChange ? yoshitsuSanmaiKatahiki_method : undefined,
      yoshitsuSanmaiKatahiki_w: showYoshitsuTateguChange ? yoshitsuSanmaiKatahiki_w : undefined,
      yoshitsuSanmaiKatahiki_h: showYoshitsuTateguChange ? yoshitsuSanmaiKatahiki_h : undefined,
      yoshitsuSanmaiKatahiki_mikomi: showYoshitsuTateguChange ? yoshitsuSanmaiKatahiki_mikomi : undefined,
      yoshitsuSanmaiKatahiki_hikite: showYoshitsuTateguChange ? yoshitsuSanmaiKatahiki_hikite : undefined,
      yoshitsuSanmaiKatahiki_w_custom: showYoshitsuTateguChange ? yoshitsuSanmaiKatahiki_w_custom : undefined,
      yoshitsuSanmaiKatahiki_h_custom: showYoshitsuTateguChange ? yoshitsuSanmaiKatahiki_h_custom : undefined,
      yoshitsuNimaiKatahiki_photo: showYoshitsuTateguChange ? yoshitsuNimaiKatahiki_photo : undefined,
      yoshitsuNimaiKatahiki_w: showYoshitsuTateguChange ? yoshitsuNimaiKatahiki_w : undefined,
      yoshitsuNimaiKatahiki_h: showYoshitsuTateguChange ? yoshitsuNimaiKatahiki_h : undefined,
      yoshitsuNimaiKatahiki_w_custom: showYoshitsuTateguChange ? yoshitsuNimaiKatahiki_w_custom : undefined,
      yoshitsuNimaiKatahiki_h_custom: showYoshitsuTateguChange ? yoshitsuNimaiKatahiki_h_custom : undefined,
      yoshitsuNimaiKatahiki_hikite: showYoshitsuTateguChange ? yoshitsuNimaiKatahiki_hikite : undefined,
      yoshitsuNimaiKatahiki_hikite_photo: showYoshitsuTateguChange ? yoshitsuNimaiKatahiki_hikite_photo : undefined,
      // コンセント・スイッチプレート
      concentSwitchType: showConcentSwitchType ? concentSwitchType : undefined,
      concentSwitchQuantities: showConcentSwitchType ? concentSwitchQuantities : undefined,
      // 分電盤
      hanbantaiIseten: showHanbantaiOptions ? hanbantaiIseten : undefined,
      hanbantaiAmpere: showHanbantaiOptions ? hanbantaiAmpere : undefined,
      hanbantaiCircuits: showHanbantaiOptions
        ? (hanbantaiCircuits === "custom" ? String(hanbantaiCircuitsCustom ?? "") : hanbantaiCircuits)
        : undefined,
    });
    setEditingWorkItem(null);
    setStep(3);
  };

  const handleCancel = () => {
    setEditingWorkItem(null);
    setStep(3);
  };

  const handleSelectOption = (value: string, label: string) => {
    setSelectedOption(value);
    setSelectedOptionLabel(label);
  };

  const handlePhotoChange = (file: File | undefined, onChange: (value: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  const updatePhotoArray = (photos: string[], index: number, value: string) => {
    const next = [...photos];
    next[index] = value;
    return next;
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-52px)] p-6">
      <div className="w-full max-w-md mx-auto space-y-6 flex-1">
        {/* Header */}
        <div>
          <p className="text-xs text-muted-foreground">{item.roomLabel}</p>
          <h1 className="text-xl font-bold text-foreground">
            {item.title}{instanceSuffix(item.instanceNumber)}
          </h1>
        </div>

        {/* 玄関扉写真エリア */}
        {showGenkanDoorPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">写真</label>
            <div className="border border-input rounded-lg p-4 text-center">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202026-04-06%20133135-zPN5nwT53JcxsU82G0asGU5XO7FQCp.png" alt="玄関扉" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {/* 玄関枠写真エリア */}
        {showGenkanFramePhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">写真</label>
            <div className="border border-input rounded-lg p-4 text-center">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202026-04-06%20133345-e4mpYgEabD67rQYWziKQIBHZbytVyA.png" alt="玄関枠" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {/* ドアガード写真エリア */}
        {showGenkanGuardPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">写真</label>
            <div className="border border-input rounded-lg p-4 text-center">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E3%83%89%E3%82%A2%E3%82%AC%E3%83%BC%E3%83%89-SPsQB4GlB8aZ4IBC6y2c2pM11oK6Pn.jpg" alt="ドアガード" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {/* ドアクローザー写真エリア */}
        {showGenkanCloserPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">写真</label>
            <div className="border border-input rounded-lg p-4 text-center">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202026-04-15%20155533-PxJmuflWgOFaVA168wNqqLQbFTTIim.png" alt="ドアクローザー" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {/* ドアストッパー写真エリア */}
        {showGenkanStopperPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">写真</label>
            <div className="border border-input rounded-lg p-4 text-center">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E3%83%89%E3%82%A2%E3%82%B9%E3%83%88%E3%83%83%E3%83%91%E3%83%BC-aLev2iCcyS8f6W4y7fWUEvP0kwdGMn.jpg" alt="ドアストッパー" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {/* 土間写真エリア */}
        {showGenkanDomaPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">写真</label>
            <div className="border border-input rounded-lg p-4 text-center">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202026-04-06%20133700-l5Ks2n8C4ssfhQmB4mwqU87qxDydQD.png" alt="土間" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {/* 框説明画像エリア（框の位置のみ表示） */}
        {isKamachi && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">框の位置</label>
            <div className="border border-input rounded-lg p-4 text-center">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202026-04-06%20163442-1wc3GU2kAyFUxAgDxp3E0t0zZ5iSVB.png" alt="框の位置" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {/* 框写真エリア（L型框） */}
        {showKamachiLPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">L型框写真</label>
            <div className="border border-input rounded-lg p-4 text-center">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S__6291482-9DSb881FbNlUih3XiSc9z3KIrmCDHo.jpg" alt="L型框" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {/* 框写真エリア（ウスイ��タ） */}
        {showKamachiUsuPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">ウスイータ写真</label>
            <div className="border border-input rounded-lg p-4 text-center">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S__6291484-bKizyW2f63Nx7OHlK0VUSx79UrNMlP.jpg" alt="ウスイータ" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {/* 框写真エリア（タイル） */}
        {showKamachiTilePhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">タイル写真</label>
            <div className="border border-input rounded-lg p-4 text-center">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S__6291485-pgdgH3HWDD77Gext9XcxsDt36UhJid.jpg" alt="タイル" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {showKamachiSize && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">サイズ</label>
            <div className="flex flex-wrap gap-2">
              {["6尺（1800）", "9尺（2700）"].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setKamachiSize(kamachiSize === size ? "" : size)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    kamachiSize === size ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}



        {/* 玄関照明写真エリア（DL） */}
        {showGenkanLightDlPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">DL写真</label>
            <div className="border border-input rounded-lg p-4 text-center">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S__6291477-fhkMI2xjpknprayaUxfM0FcQ6hjlRy.jpg" alt="DL" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {/* 玄関照明写真エリア（ブラケットライト） */}
        {showGenkanLightBracketPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">ブラケットライト写真</label>
            <div className="border border-input rounded-lg p-4 text-center">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S__6291476-g7zljD5G60u77WYRliCkNo8ZkGcqBF.jpg" alt="ブラケットライト" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {showRoukaLightDlPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">DL写真</label>
            <div className="border border-input rounded-lg p-4 text-center">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S__6291477-fhkMI2xjpknprayaUxfM0FcQ6hjlRy.jpg" alt="DL" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {showRoukaLightBracketPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">ブラケットライト写真</label>
            <div className="border border-input rounded-lg p-4 text-center">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/S__6291476-g7zljD5G60u77WYRliCkNo8ZkGcqBF.jpg" alt="ブラケットライト" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {showRosettePhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">ローゼット写真</label>
            <div className="border border-dashed border-input rounded-lg p-4 text-center space-y-3">
              <img src={rosettePhoto || ROSETTE_IMAGE} alt="ローゼット写真" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {showSelectedLightDlPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">{selectedLightDlLabel}</label>
            <div className="border border-dashed border-input rounded-lg p-4 text-center space-y-3">
              {selectedLightDlPhoto ? (
                <img src={selectedLightDlPhoto} alt={selectedLightDlLabel} className="max-h-40 mx-auto rounded" />
              ) : (
                <p className="text-xs text-muted-foreground">{selectedLightDlLabel}を挿入するエリア</p>
              )}
            </div>
          </div>
        )}

  {/* Option Selection */}
  {masterDef && masterDef.options.length > 0 && !isLdkStorageInside && !isYoshitsuStorageInsideLike && !isToiletStorage && !isKitchenBody && (
  <div className="space-y-2">
  <label className="text-sm font-medium text-foreground block">{isWashitsuSwitch ? "既存" : "仕様選択"}</label>
  <div className="flex flex-wrap gap-2">
  {masterDef.options.map((opt) => {
    // 廊下巾木で既存残しが選択不可かどうか
    const isDisabled = (isRoukaHabakiKeepDisabled || isLdYoshitsuHabakiKeepDisabled) && opt.value === "keep";
    // 廊下収納内部の複数選択対応
    const isMultipleSelect = isRoukaStorageInside;
    const isSelected = isMultipleSelect ? roukaStorageInsideMultiple.includes(opt.value) : selectedOption === opt.value;
    const optionImage = isRoukaStorage ? STORAGE_SPEC_IMAGES_BY_VALUE[opt.value] : undefined;
    
    return (
      <button
        key={opt.value}
        onClick={() => {
          if (isDisabled) {
            // 注釈を表示（選択不可）
            return;
          }
          if (isMultipleSelect) {
            if (opt.value === "chudan") {
              setRoukaStorageInsideMultiple(
                roukaStorageInsideMultiple.includes(opt.value)
                  ? roukaStorageInsideMultiple.filter(v => v !== opt.value)
                  : [...roukaStorageInsideMultiple, opt.value]
              );
            } else {
              const chudanSelected = roukaStorageInsideMultiple.includes("chudan");
              setRoukaStorageInsideMultiple(chudanSelected ? [opt.value, "chudan"] : [opt.value]);
            }
          } else {
            // 単一選択
            handleSelectOption(opt.value, opt.label);
          }
        }}
        disabled={isDisabled}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isSelected
            ? "bg-primary text-primary-foreground"
            : isDisabled
              ? "border border-input text-muted-foreground bg-muted cursor-not-allowed"
              : "border border-input text-foreground hover:bg-accent"
        }`}
      >
        {optionImage && (
          <img
            src={optionImage}
            alt={opt.label}
            className={`mb-2 h-24 w-full max-w-36 rounded object-contain ${isSelected ? "bg-white/90" : "bg-muted/30"}`}
          />
        )}
        {opt.label}
      </button>
    );
  })}
  </div>
  {showMadowakuRailNote && (
    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
      <p className="text-sm text-amber-800">※レールベニヤ張り必須</p>
    </div>
  )}
  {/* 廊下巾木でフローリング選択時の注釈 */}
  {isRoukaHabakiKeepDisabled && selectedOption === "keep" && (
    <p className="text-sm text-destructive">FL貼替時は巾木施工してください。</p>
  )}
  {/* 廊下巾木でフローリング選択時に既存残しを押した場合の注釈表示 */}
  {isRoukaHabakiKeepDisabled && (
    <p className="text-xs text-muted-foreground">※FL貼替時は巾木の既存残しは選択できません。</p>
  )}
  {isLdYoshitsuHabakiKeepDisabled && (
    <p className="text-xs text-muted-foreground">※既存残しは選択できません</p>
  )}
  </div>
  )}

        {showKaidanPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">階段写真</label>
            <div className="border border-dashed border-input rounded-lg p-1 text-center space-y-3">
              {kaidanPhoto ? (
                <img src={kaidanPhoto} alt="階段写真" className="max-h-96 w-full object-contain mx-auto rounded" />
              ) : (
                <img src="/images/階段/kaidan.png" alt="階段写真" className="max-h-96 w-full object-contain mx-auto rounded" />
              )}
              {kaidanPhoto && (
                <button
                  type="button"
                  onClick={() => setKaidanPhoto("")}
                  className="text-xs text-destructive underline underline-offset-2"
                >
                  写真を削除
                </button>
              )}
            </div>
          </div>
        )}

        {/* 玄関収納: サイズ・奥行・形状選択 */}
        {showStorageOptions && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">サイズ選択</label>
              <div className="flex flex-wrap gap-2">
                {["W800", "W1200", "W1600"].map((size) => (
                  <button
                    key={size}
                    onClick={() => setStorageWidth(storageWidth === size ? "" : size)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      storageWidth === size
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">奥行選択</label>
              <div className="flex flex-wrap gap-2">
                {["D400", "D350"].map((depth) => (
                  <button
                    key={depth}
                    onClick={() => setStorageDepth(storageDepth === depth ? "" : depth)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      storageDepth === depth
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {depth}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">形状選択</label>
              <div className="flex flex-wrap gap-2">
                {/* コの字 */}
                <button
                  onClick={() => {
                    setStorageShape(storageShape === "コの字" ? "" : "コの字");
                    if (storageShape === "コの字") setStorageMirror("");
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex flex-col items-center ${
                    storageShape === "コの字"
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  <img
                    src={storageShape === "コの字" && storageMirror === "鏡有"
                      ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202026-04-06%20135342-32HV3nWRDpiMQ3QihHxSwokMhrYL07.png"
                      : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202026-04-06%20135022-lhwM4fB1iuHIM9KgFGKEWlxngt3RpY.png"}
                    alt="コの字"
                    className="h-[50px] w-auto object-contain"
                  />
                  コの字
                </button>
                {/* 二の字 */}
                <button
                  onClick={() => {
                    setStorageShape(storageShape === "二の字" ? "" : "二の字");
                    if (storageShape === "二の字") setStorageMirror("");
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex flex-col items-center ${
                    storageShape === "二の字"
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202026-04-06%20134957-9cOnj8PsOEGNygVBXTzbympTkXb7Jc.png"
                    alt="二の字"
                    className="h-[50px] w-auto object-contain"
                  />
                  二の字
                </button>
                {/* 下台のみ */}
                <button
                  onClick={() => {
                    setStorageShape(storageShape === "下台のみ" ? "" : "下台のみ");
                    if (storageShape === "下台のみ") setStorageMirror("");
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex flex-col items-center ${
                    storageShape === "下台のみ"
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202026-04-06%20135016-BPviwqhmgGidjsO3mw2JVlIezZWv8D.png"
                    alt="下台のみ"
                    className="h-[50px] w-auto object-contain"
                  />
                  下台のみ
                </button>
                {/* トール */}
                <button
                  onClick={() => {
                    setStorageShape(storageShape === "トール" ? "" : "トール");
                    if (storageShape === "トール") setStorageMirror("");
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex flex-col items-center ${
                    storageShape === "トール"
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  <img
                    src={storageShape === "トール" && storageMirror === "鏡有"
                      ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202026-03-31%20173122-XXPO0f8OhcweejD2hJwU3mTHU5FokP.png"
                      : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202026-03-31%20173201-1JbYZT8VhGIGLGjMHZtkJs7oPkDX0q.png"}
                    alt="トール"
                    className="h-[50px] w-auto object-contain"
                  />
                  トール
                </button>
              </div>
            </div>
            {/* 鏡有無選択（コの字/トールの場合のみ） */}
            {showStorageMirror && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">鏡</label>
                <div className="flex flex-wrap gap-2">
                  {["鏡有", "鏡無"].map((mirror) => (
                    <button
                      key={mirror}
                      onClick={() => setStorageMirror(storageMirror === mirror ? "" : mirror)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        storageMirror === mirror
                          ? "bg-primary text-primary-foreground"
                          : "border border-input text-foreground hover:bg-accent"
                      }`}
                    >
                      {mirror}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {showStorageMirror && storageMirror && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  {storageMirror}写真
                </label>
                <div className="border border-dashed border-input rounded-lg p-4 text-center space-y-3">
                  {(
                    storageMirror === "鏡有"
                      ? storageShape === "コの字"
                        ? storageMirrorKonojiPhoto
                        : storageMirrorTallPhoto
                      : storageShape === "コの字"
                        ? storageShapeKonojiImage
                        : storageShapeTallImage
                  ) ? (
                    <img
                      src={
                        storageMirror === "鏡有"
                          ? storageShape === "コの字"
                            ? storageMirrorKonojiPhoto
                            : storageMirrorTallPhoto
                          : storageShape === "コの字"
                            ? storageShapeKonojiImage
                            : storageShapeTallImage
                      }
                      alt={`${storageShape}${storageMirror}写真`}
                      className="max-h-40 mx-auto rounded"
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">写真を挿入するエリア</p>
                  )}
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-accent">
                    写真を選択
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        const setter =
                          storageMirror === "鏡有"
                            ? storageShape === "コの字"
                              ? setStorageMirrorKonojiPhoto
                              : setStorageMirrorTallPhoto
                            : storageShape === "コの字"
                              ? setStorageShapeKonojiImage
                              : setStorageShapeTallImage;
                        handlePhotoChange(event.target.files?.[0], setter);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* 廊下床: CF・フロアタイル・フローリング選択時の写真挿入UI */}
        {showRoukaFloorPhotoUI && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">写真挿入</label>
            <div className="flex flex-wrap gap-2">
              {/* CF */}
              {selectedOption === "cf" && (
                <div className="border border-input rounded-lg p-4 text-center flex-1">
                  <p className="text-xs text-muted-foreground mb-2">CF写真</p>
                  <div className="flex items-center justify-center bg-muted rounded overflow-hidden">
                    <FloorSpecImage option="cf" alt="CF写真" className="max-h-40" />
                  </div>
                </div>
              )}
              {/* フロアタイル */}
              {selectedOption === "ft" && (
                <div className="border border-input rounded-lg p-4 text-center flex-1">
                  <p className="text-xs text-muted-foreground mb-2">フロアタイル写真</p>
                  <div className="flex items-center justify-center bg-muted rounded overflow-hidden">
                    <FloorSpecImage option="ft" alt="フロアタイル写真" className="max-h-40" />
                  </div>
                </div>
              )}
              {/* フローリング */}
              {selectedOption === "flooring" && (
                <div className="border border-input rounded-lg p-4 text-center flex-1">
                  <p className="text-xs text-muted-foreground mb-2">フローリング写真</p>
                  <div className="flex items-center justify-center bg-muted rounded overflow-hidden">
                    <FloorSpecImage option="flooring" alt="フローリング写真" className="max-h-40" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 廊下巾木: 木巾木・ソフト巾木選択時の写真挿入UI */}
        {showRoukaHabakiPhotoUI && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">写真挿入</label>
            <div className="flex flex-wrap gap-2">
              {/* 木巾木 */}
              {selectedOption === "wood" && (
                <div className="border border-input rounded-lg p-4 text-center flex-1">
                  <p className="text-xs text-muted-foreground mb-2">木巾木写真</p>
                  <div className="h-20 flex items-center justify-center bg-muted rounded">
                    <img src="/images/巾木/mokuhabaki.png" alt="木巾木写真" className="max-h-20 mx-auto rounded" />
                  </div>
                </div>
              )}
              {/* ソフト巾木 */}
              {selectedOption === "soft" && (
                <div className="border border-input rounded-lg p-4 text-center flex-1">
                  <p className="text-xs text-muted-foreground mb-2">ソフト巾木写真</p>
                  <div className="h-20 flex items-center justify-center bg-muted rounded">
                    <img src="/images/巾木/sohutohabaki.png" alt="ソフト巾木写真" className="max-h-20 mx-auto rounded" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 廊下収納: 折れ戸・両開き選択時のUI */}
        {showRoukaStorageOptions && (
          <>
            {/* 枠選択 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">枠選択</label>
              <div className="flex flex-wrap gap-2">
                {["四方枠", "三方枠", "ノン下レール三方枠"].map((frame) => {
                  // 両開きの場合はノン下レール三方枠を非表示
                  if (frame === "ノン下レール三方枠" && selectedOption === "ryobiraki") {
                    return null;
                  }
                  const isDisabled = frame === "ノン下レール三方枠" && roukaStorageFrameRestricted;
                  return (
                    <button
                      key={frame}
                      onClick={() => !isDisabled && setRoukaStorageFrame(roukaStorageFrame === frame ? "" : frame)}
                      disabled={isDisabled}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        roukaStorageFrame === frame
                          ? "bg-primary text-primary-foreground"
                          : isDisabled
                            ? "border border-input text-muted-foreground bg-muted cursor-not-allowed"
                            : "border border-input text-foreground hover:bg-accent"
                      }`}
                    >
                      {frame}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* 折れ戸のサイズ選択 */}
            {selectedOption === "oredo" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">W選択</label>
                  <div className="flex flex-wrap gap-2">
                    {["735", "825", "1190", "1320", "1645", "1708", "1820", "2541"].map((w) => (
                      <button
                        key={w}
                        onClick={() => {
                          setRoukaStorageOredoW(roukaStorageOredoW === w ? "" : w);
                          // W825・1320・1820・2541選択時はノン下レール三方枠をリセット
                          if (["825", "1320", "1820", "2541"].includes(w) && roukaStorageFrame === "ノン下レール三方枠") {
                            setRoukaStorageFrame("");
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          roukaStorageOredoW === w
                            ? "bg-primary text-primary-foreground"
                            : "border border-input text-foreground hover:bg-accent"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">H選択</label>
                  <div className="flex flex-wrap gap-2">
                    {["2035", "2350"].map((h) => (
                      <button
                        key={h}
                        onClick={() => setRoukaStorageOredoH(roukaStorageOredoH === h ? "" : h)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          roukaStorageOredoH === h
                            ? "bg-primary text-primary-foreground"
                            : "border border-input text-foreground hover:bg-accent"
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* 両開きのサイズ選択 */}
            {selectedOption === "ryobiraki" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">W選択</label>
                  <div className="flex flex-wrap gap-2">
                    {["735", "1190"].map((w) => (
                      <button
                        key={w}
                        onClick={() => setRoukaStorageRyobirakiW(roukaStorageRyobirakiW === w ? "" : w)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          roukaStorageRyobirakiW === w
                            ? "bg-primary text-primary-foreground"
                            : "border border-input text-foreground hover:bg-accent"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">H選択</label>
                  <div className="flex flex-wrap gap-2">
                    {["800", "1200", "1800", "2035", "2350"].map((h) => (
                      <button
                        key={h}
                        onClick={() => setRoukaStorageRyobirakiH(roukaStorageRyobirakiH === h ? "" : h)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          roukaStorageRyobirakiH === h
                            ? "bg-primary text-primary-foreground"
                            : "border border-input text-foreground hover:bg-accent"
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* 廊下収納内部: 可動棚の場合 */}
        {showRoukaStorageInsideKadodana && (
          <>
            {/* 可動棚写真挿入エリア */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">可動棚写真</label>
              <div className="border border-input rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">可動棚写真挿入エリア</p>
              </div>
            </div>
            {/* 固定方法 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">固定方���</label>
              <div className="flex flex-wrap gap-2">
                {["背面固定", "側面固定"].map((method) => (
                  <button
                    key={method}
                    onClick={() => setRoukaStorageInsideKadodanaFixMethod(roukaStorageInsideKadodanaFixMethod === method ? "" : method)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      roukaStorageInsideKadodanaFixMethod === method
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
            {/* 棚柱の色 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">棚柱の色</label>
              <div className="flex flex-wrap gap-2">
                {["ホワイト", "シルバー"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setRoukaStorageInsideKadodanaColor(roukaStorageInsideKadodanaColor === color ? "" : color)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      roukaStorageInsideKadodanaColor === color
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
            {/* W（手入力） */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">W（幅）</label>
              <input
                type="number"
                min="0"
                value={roukaStorageInsideKadodanaW ?? ""}
                onChange={(e) => setRoukaStorageInsideKadodanaW(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="幅を入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {/* D（選択式＋手入力） */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">D（奥行）</label>
              <div className="flex flex-wrap gap-2">
                {["200", "250", "300", "350", "400", "450", "500", "550", "600"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setRoukaStorageInsideKadodanaD(roukaStorageInsideKadodanaD === d ? "" : d)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      roukaStorageInsideKadodanaD === d
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={!["200", "250", "300", "350", "400", "450", "500", "550", "600"].includes(roukaStorageInsideKadodanaD) ? roukaStorageInsideKadodanaD : ""}
                onChange={(e) => setRoukaStorageInsideKadodanaD(e.target.value)}
                placeholder="その他（手入力）"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring mt-2"
              />
            </div>
            {/* 段数（1-5） */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">段数</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <button
                    key={step}
                    onClick={() => setRoukaStorageInsideKadodanaSteps(roukaStorageInsideKadodanaSteps === step ? undefined : step)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      roukaStorageInsideKadodanaSteps === step
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 廊下収納内部: 枕棚の場合 */}
        {showRoukaStorageInsideMakuradana && (
          <>
            {/* 枕棚写真挿入エリア */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">枕棚写真</label>
              <div className="border border-input rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">枕棚写真挿入エリア</p>
              </div>
            </div>
            {/* W選択 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">W選択</label>
              <div className="flex flex-wrap gap-2">
                {["900", "1350", "1810", "2700"].map((w) => (
                  <button
                    key={w}
                    onClick={() => setRoukaStorageInsideMakuradanaW(roukaStorageInsideMakuradanaW === w ? "" : w)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      roukaStorageInsideMakuradanaW === w
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 廊下収納内部: 中段の場合 */}
        {showRoukaStorageInsideChuudan && (
          <>
            {/* 中段写真挿入エリア */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">中段写真</label>
              <div className="border border-input rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">中段写真挿入エリア</p>
              </div>
            </div>
            {/* W選択 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">W選択</label>
              <div className="flex flex-wrap gap-2">
                {["900", "1350", "1810", "2700"].map((w) => (
                  <button
                    key={w}
                    onClick={() => setRoukaStorageInsideChuudanW(roukaStorageInsideChuudanW === w ? "" : w)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      roukaStorageInsideChuudanW === w
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 旧廊下収納内部: 可動棚の場合（互換性維持） */}
        {showStorageInsideKadodana && !showRoukaStorageInsideKadodana && (
          <>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">段数</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={storageInsideSteps ?? ""}
                  onChange={(e) => setStorageInsideSteps(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="段数を入力"
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">段</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">D（奥行）</label>
              <input
                type="number"
                min="0"
                value={storageInsideDepth ?? ""}
                onChange={(e) => setStorageInsideDepth(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="奥行を入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </>
        )}

        {/* 旧廊下収納内部: 枕棚の場合（互換性維持） */}
        {showStorageInsideMakuradana && !showRoukaStorageInsideMakuradana && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">W（幅）</label>
            <input
              type="number"
              min="0"
              value={storageInsideWidth ?? ""}
              onChange={(e) => setStorageInsideWidth(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="幅を入力"
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {/* キッチン本体: 寸法W入力 */}
        {isKitchenBody && (
          <KitchenBodySection
            state={{
              relocation: kitchenRelocation,
              existing: kitchenExisting || selectedOptionLabel,
              shape: kitchenShape,
              depth: kitchenDepth,
              width: kitchenWidth,
              heating: kitchenHeating,
              drawer: kitchenDrawer,
              endPanel: kitchenEndPanel,
              lSize: kitchenLSize,
              wallCabinet: kitchenWallCabinet,
              wallCabinetHeight: kitchenWallCabinetHeight,
              dishwasherExisting: kitchenDishwasherExisting,
              dishwasherAfter: kitchenDishwasherAfter,
              worktop: kitchenWorktop,
              sink: kitchenSink,
              selectedMaker: kitchenSelectedMaker,
              makerPhotos: kitchenMakerPhotos,
            }}
            onChange={(next) => {
              if (next.relocation !== undefined) setKitchenRelocation(next.relocation);
              if (next.existing !== undefined) setKitchenExisting(next.existing);
              if (next.shape !== undefined) setKitchenShape(next.shape);
              if (next.depth !== undefined) setKitchenDepth(next.depth);
              if (next.width !== undefined) setKitchenWidth(next.width);
              if (next.heating !== undefined) setKitchenHeating(next.heating);
              if (next.drawer !== undefined) setKitchenDrawer(next.drawer);
              if (next.endPanel !== undefined) setKitchenEndPanel(next.endPanel);
              if (next.lSize !== undefined) setKitchenLSize(next.lSize);
              if (next.wallCabinet !== undefined) setKitchenWallCabinet(next.wallCabinet);
              if (next.wallCabinetHeight !== undefined) setKitchenWallCabinetHeight(next.wallCabinetHeight);
              if (next.dishwasherExisting !== undefined) setKitchenDishwasherExisting(next.dishwasherExisting);
              if (next.dishwasherAfter !== undefined) setKitchenDishwasherAfter(next.dishwasherAfter);
              if (next.worktop !== undefined) setKitchenWorktop(next.worktop);
              if (next.sink !== undefined) setKitchenSink(next.sink);
              if (next.selectedMaker !== undefined) setKitchenSelectedMaker(next.selectedMaker);
              if (next.makerPhotos !== undefined) setKitchenMakerPhotos(next.makerPhotos);
            }}
            onUnitPriceChange={setUnitPrice}
          />
        )}

        {showKitchenBodyWidth && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              {selectedOption === "keep" ? "既存寸法W" : "寸法W"}
            </label>
            <input
              type="number"
              min="0"
              value={kitchenBodyWidth ?? ""}
              onChange={(e) => setKitchenBodyWidth(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="寸法を入力"
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {/* 吊戸: 既存寸法H入力 */}
        {showTsuritoHeight && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">既存寸法H</label>
            <input
              type="number"
              min="0"
              value={tsuritoHeight ?? ""}
              onChange={(e) => setTsuritoHeight(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="寸��を入力"
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {/* 食洗機: 既存K選択後に有/無���択 */}
        {showDishwasherExistK && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">既存K</label>
            <div className="flex flex-wrap gap-2">
              {["有", "無"].map((k) => (
                <button
                  key={k}
                  onClick={() => setDishwasherExistK(dishwasherExistK === k ? "" : k)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dishwasherExistK === k
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ワークトップ: 開き/スライド選択 */}
        {showWorktopDrawerType && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">引出し仕様</label>
            <div className="flex flex-wrap gap-2">
              {["開き", "スライド"].map((type) => (
                <button
                  key={type}
                  onClick={() => setWorktopDrawerType(worktopDrawerType === type ? "" : type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    worktopDrawerType === type
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 洋室入口建具: W/D/仕様選択 */}
        {showYoshitsuIriguchiOptions && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">W</label>
              <div className="flex flex-wrap gap-2">
                {["800", "1200", "1600"].map((w) => (
                  <button
                    key={w}
                    onClick={() => setYoshitsuIriguchiW(yoshitsuIriguchiW === w ? "" : w)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      yoshitsuIriguchiW === w
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">D</label>
              <div className="flex flex-wrap gap-2">
                {["400", "350"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setYoshitsuIriguchiD(yoshitsuIriguchiD === d ? "" : d)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      yoshitsuIriguchiD === d
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">{selectedOption === "keep" ? "既存仕様" : "交換後仕様"}</label>
              <div className="flex flex-wrap gap-2">
                {["片開き", "片引き", "2枚引き違い", "2枚引き込み", "3枚引き違い"].map((spec) => (
                  <SpecImageButton
                    key={spec}
                    label={spec}
                    image={TATEGU_SPEC_IMAGES[spec]}
                    active={yoshitsuIriguchiSpec === spec}
                    onClick={() => setYoshitsuIriguchiSpec(yoshitsuIriguchiSpec === spec ? "" : spec)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      yoshitsuIriguchiSpec === spec
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* 洋室入口段差: 段差mm入力 */}
        {showYoshitsuDansaMm && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">段差</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={yoshitsuDansaMm ?? ""}
                onChange={(e) => setYoshitsuDansaMm(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="段差を入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">mm</span>
            </div>
          </div>
        )}

        {/* 洋室収納: 旧UIは新StorageDetailUIに統合のため削除済み */}

        {/* 洋室網戸: 色選択 */}
        {showYoshitsuAmidoColor && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">色</label>
            <div className="flex flex-wrap gap-2">
              {["黒", "シルバー"].map((c) => (
                <button
                  key={c}
                  onClick={() => setYoshitsuAmidoColor(yoshitsuAmidoColor === c ? "" : c)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    yoshitsuAmidoColor === c
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 玄関照明・廊下照明・キッチン照明・洋室照明: 灯数・色・Φ入力 */}
        {showLightOptions && (
          <>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">灯数（1〜5）</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      setLightCount(count);
                      // 玄関照明の場合は数量も連動
                      if (isGenkanLight) setQty(count);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      lightCount === count
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {count}灯
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">個数</label>
              <input
                type="number"
                min="0"
                step="1"
                value={qty === 0 ? "" : qty}
                onChange={(e) => setQty(parseIntegerQuantity(e.target.value))}
                onFocus={(e) => { if (qty === 0) e.target.value = ""; }}
                onBlur={(e) => { setQty(parseIntegerQuantity(e.target.value)); }}
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {showLightDiameterOptions && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">直径</label>
                <div className="flex flex-wrap gap-2">
                  {[60, 75, 100, 125, 150].map((diameter) => (
                    <button
                      key={diameter}
                      type="button"
                      onClick={() => setLightDiameter(lightDiameter === diameter ? undefined : diameter)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        lightDiameter === diameter
                          ? "bg-primary text-primary-foreground"
                          : "border border-input text-foreground hover:bg-accent"
                      }`}
                    >
                      {diameter}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {showLightColorBodyOptions && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">本体色</label>
                  <div className="flex flex-wrap gap-2">
                    {["ブラック", "ホワイト"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setLightBodyColor(lightBodyColor === color ? "" : color)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          lightBodyColor === color
                            ? "bg-primary text-primary-foreground"
                            : "border border-input text-foreground hover:bg-accent"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                  {lightBodyColor && (
                    <div className="border border-dashed border-input rounded-lg p-4 text-center">
                      <img
                        src={
                          lightBodyColor === "ブラック"
                            ? "/images/dl照明/hontaisyokuburakku.png"
                            : "/images/dl照明/hontaisyokuhowaito.png"
                        }
                        alt={`本体色 ${lightBodyColor}`}
                        className="max-h-40 mx-auto rounded"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">光色</label>
                  <div className="flex flex-wrap gap-2">
                    {["電球色", "昼白色", "温白色"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setLightColor(lightColor === color ? "" : color)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          lightColor === color
                            ? "bg-primary text-primary-foreground"
                            : "border border-input text-foreground hover:bg-accent"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                  {lightColor && (
                    <div className="border border-dashed border-input rounded-lg p-4 text-center">
                      <img
                        src={
                          lightColor === "電球色"
                            ? "/images/dl照明/denkyusyoku.png"
                            : lightColor === "昼白色"
                            ? "/images/dl照明/tyuhakusyoku.png"
                            : "/images/dl照明/onpakusyoku.png"
                        }
                        alt={`光色 ${lightColor}`}
                        className="max-h-40 mx-auto rounded"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

        </>
        )}
        
        {/* 全体項目：給湯器品番入力 */}
        {showLightColorBodyOptions && !showLightOptions && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">本体色</label>
              <div className="flex flex-wrap gap-2">
                {["ブラック", "ホワイト"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setLightBodyColor(lightBodyColor === color ? "" : color)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      lightBodyColor === color
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
              {lightBodyColor && (
                <div className="border border-dashed border-input rounded-lg p-4 text-center">
                  <img
                    src={
                      lightBodyColor === "ブラック"
                        ? "/images/dl照明/hontaisyokuburakku.png"
                        : "/images/dl照明/hontaisyokuhowaito.png"
                    }
                    alt={`本体色 ${lightBodyColor}`}
                    className="max-h-40 mx-auto rounded"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">光色</label>
              <div className="flex flex-wrap gap-2">
                {["電球色", "昼白色", "温白色"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setLightColor(lightColor === color ? "" : color)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      lightColor === color
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
              {lightColor && (
                <div className="border border-dashed border-input rounded-lg p-4 text-center">
                  <img
                    src={
                      lightColor === "電球色"
                        ? "/images/dl照明/denkyusyoku.png"
                        : lightColor === "昼白色"
                        ? "/images/dl照明/tyuhakusyoku.png"
                        : "/images/dl照明/onpakusyoku.png"
                    }
                    alt={`光色 ${lightColor}`}
                    className="max-h-40 mx-auto rounded"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {showZentaiKyutoukiHinban && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">品番</label>
            <input
              type="text"
              value={kyutoukiHinban}
              onChange={(e) => setKyutoukiHinban(e.target.value)}
              placeholder="品番を入力"
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {/* コンセント・スイッチプレート：交換後の種類選択 */}
        {showConcentSwitchType && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">種類</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "square", label: "スクエア" },
                  { value: "round", label: "ラウンド" },
                  { value: "advance", label: "アドバンス" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setConcentSwitchType(concentSwitchType === opt.value ? "" : opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      concentSwitchType === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {opt.label}
                    {opt.value === "advance" && (
                      <span className="ml-1 text-xs text-amber-600">金額高</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "round", label: "ラウンド" },
                { value: "square", label: "スクエア" },
                { value: "advance", label: "アドバンス" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setConcentSwitchType(concentSwitchType === opt.value ? "" : opt.value)}
                  className={`rounded-lg border p-3 text-center space-y-2 transition-colors ${
                    concentSwitchType === opt.value ? "border-primary bg-primary/5" : "border-input hover:bg-accent/50"
                  }`}
                >
                  <img src={CONCENT_SWITCH_IMAGES[opt.value]} alt={opt.label} className="h-28 w-full object-contain rounded-md bg-muted" />
                  <span className="block text-sm font-medium text-foreground">{opt.label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "square", label: "スクエア" },
                { value: "round", label: "ラウンド" },
                { value: "advance", label: "アドバンス" },
              ].map((opt) => (
                <div key={opt.value}>
                  <label className="text-sm font-medium text-foreground block mb-1.5">{opt.label} 数量</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={concentSwitchQuantities[opt.value] === 0 ? "" : concentSwitchQuantities[opt.value]}
                    onChange={(e) => {
                      const nextQty = parseIntegerQuantity(e.target.value);
                      setConcentSwitchQuantities((prev) => ({ ...prev, [opt.value]: nextQty }));
                    }}
                    onFocus={(e) => { if (concentSwitchQuantities[opt.value] === 0) e.currentTarget.select(); }}
                    onBlur={(e) => {
                      const nextQty = parseIntegerQuantity(e.target.value);
                      setConcentSwitchQuantities((prev) => ({ ...prev, [opt.value]: nextQty }));
                    }}
                    className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* 分電盤：交換後の詳細選択 */}
        {showHanbantaiOptions && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">移設</label>
              <div className="flex flex-wrap gap-2">
                {["有", "無"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setHanbantaiIseten(hanbantaiIseten === opt ? "" : opt)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      hanbantaiIseten === opt
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">アンペア数</label>
              <div className="flex flex-wrap gap-2">
                {["30A", "40A", "50A", "60A", "70A"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setHanbantaiAmpere(hanbantaiAmpere === opt ? "" : opt)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      hanbantaiAmpere === opt
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">回路数</label>
              <div className="flex flex-wrap gap-2">
                {["6", "8", "10", "12", "14", "16", "18", "20", "22", "custom"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setHanbantaiCircuits(hanbantaiCircuits === opt ? "" : opt)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      hanbantaiCircuits === opt
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {opt === "custom" ? "手入力" : opt}
                  </button>
                ))}
              </div>
              {hanbantaiCircuits === "custom" && (
                <input
                  type="number"
                  min="1"
                  value={hanbantaiCircuitsCustom ?? ""}
                  onChange={(e) => setHanbantaiCircuitsCustom(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="回路数を入力"
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground block">仕様参考</label>
              <a
                href="https://www14.arrow.mew.co.jp/vafneb/a2B/KX0201.G03@search"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline underline-offset-2"
              >
                仕様参考
              </a>
            </div>
          </>
        )}

        {showWashitsuTatamiOptions && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">畳サイズ</label>
              <div className="flex flex-wrap gap-2">
                {["1帖", "半帖"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setWashitsuTatami(washitsuTatami === v ? "" : v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      washitsuTatami === v ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">縁</label>
              <div className="flex flex-wrap gap-2">
                {["縁あり", "縁なし"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setWashitsuTatamiBeri(washitsuTatamiBeri === v ? "" : v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      washitsuTatamiBeri === v ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {showWashitsuFusumaOptions && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">サイズ</label>
              <div className="space-y-3">
                {(["大", "小"] as const).map((prefix) => (
                  <div key={prefix} className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground w-6">{prefix}</span>
                    {WASHITSU_SIZE_COUNT_OPTIONS.map((v) => {
                      const active = getWashitsuSizeValue(washitsuFusumaSize, prefix) === v;
                      return (
                        <button
                          key={`${prefix}${v}`}
                          type="button"
                          onClick={() => {
                            setWashitsuFusumaSize(setWashitsuSizeValue(washitsuFusumaSize, prefix, v));
                            setWashitsuFusumaCount("");
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            active ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                          }`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {showWashitsuShojiOptions && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">サイズ</label>
              <div className="space-y-3">
                {(["大", "小"] as const).map((prefix) => (
                  <div key={prefix} className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground w-6">{prefix}</span>
                    {WASHITSU_SIZE_COUNT_OPTIONS.map((v) => {
                      const active = getWashitsuSizeValue(washitsuShojiSize, prefix) === v;
                      return (
                        <button
                          key={`${prefix}${v}`}
                          type="button"
                          onClick={() => {
                            setWashitsuShojiSize(setWashitsuSizeValue(washitsuShojiSize, prefix, v));
                            setWashitsuShojiCount("");
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            active ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                          }`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {showWashitsuMawabuchiDetail && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">廻り縁仕様</label>
            <div className="flex flex-wrap gap-2">
              {["塗装", "クロス巻"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setWashitsuMawabuchiDetail(washitsuMawabuchiDetail === v ? "" : v)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    washitsuMawabuchiDetail === v ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 和室：照明スイッチ「有」の場合に注意文表示 */}
        {showWashitsuSwitchNote && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-sm text-amber-800">※既存無から有にする場合、天井やり替え必須</p>
          </div>
        )}

        {showWashitsuSwitchNoneOption && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">新設</label>
            <div className="flex flex-wrap gap-2">
              {["新設", "なし"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setWashitsuLightNoSwitchOption(washitsuLightNoSwitchOption === v ? "" : v)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    washitsuLightNoSwitchOption === v ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {showWashitsuSwitchNewNote && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-sm text-amber-800">※新設の場合、天井やり替え必須</p>
          </div>
        )}

        {showKaidanLightOptions && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">照明内容</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setKaidanLightRosette(!kaidanLightRosette)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    kaidanLightRosette ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  ローゼット交換
                </button>
                {["dl_change", "dl_new"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setKaidanLightDlType(kaidanLightDlType === v ? "" : v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      kaidanLightDlType === v ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {v === "dl_change" ? "DL交換" : "DL新規"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">間接照明</label>
              <div className="flex flex-wrap gap-2">
                {["コーブ照明", "コーニス照明"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setKaidanLightIndirect(kaidanLightIndirect === v ? "" : v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      kaidanLightIndirect === v ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              {kaidanLightIndirect && (
                <div className="border border-dashed border-input rounded-lg p-4 text-center space-y-3 mt-2">
                  {kaidanLightIndirectPhoto ? (
                    <img src={kaidanLightIndirectPhoto} alt={`${kaidanLightIndirect}写真`} className="max-h-40 mx-auto rounded" />
                  ) : (
                    <img src={kaidanLightIndirect === "コーニス照明" ? "/images/dl照明/cornice.jpg" : "/images/dl照明/cove.jpg"} alt={`${kaidanLightIndirect}写真`} className="max-h-40 mx-auto rounded" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 和室：和室→洋室「する」の場合に畳厚み入力 */}
        {showWashitsuYoushitsuTatamiMm && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">畳厚み</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={washitsuYoushitsuTatamiMm ?? ""}
                onChange={(e) => setWashitsuYoushitsuTatamiMm(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="畳厚みを入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">mm</span>
            </div>
          </div>
        )}

        {/* 和室：障子レール「ベニヤ」の場合に塗装/シート選択 */}
        {showWashitsuShojiRailFinish && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">仕上げ</label>
            <div className="flex flex-wrap gap-2">
              {["塗装", "シート"].map((f) => (
                <button
                  key={f}
                  onClick={() => setWashitsuShojiRailFinish(washitsuShojiRailFinish === f ? "" : f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    washitsuShojiRailFinish === f
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 和室：天井「交換」の場合に既存クロス/ラミ天選択 */}
        {showWashitsuCeilingType && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">天井タイプ</label>
              <div className="flex flex-wrap gap-2">
                {["既存クロス", "ラミ天"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setWashitsuCeilingType(washitsuCeilingType === t ? "" : t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      washitsuCeilingType === t
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {washitsuCeilingType === "ラミ天" && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-800">※増し貼り必須</p>
              </div>
            )}
          </>
        )}

        {/* 和室：照明「交換」の場合にDL灯数・色入力 */}
        {showWashitsuLightOptions && (
          <>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">DL</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={washitsuLightDl ?? ""}
                  onChange={(e) => setWashitsuLightDl(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="灯数を入力"
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">灯</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">色選択</label>
              <div className="flex flex-wrap gap-2">
                {["電球色", "昼白色"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setWashitsuLightColor(washitsuLightColor === c ? "" : c)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      washitsuLightColor === c
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 和室：押入収納「交換」の場合にW/H/見込み入力 */}
        {showWashitsuOshiireOptions && (
          <>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">W</label>
              <input
                type="number"
                min="0"
                value={washitsuOshiireW ?? ""}
                onChange={(e) => setWashitsuOshiireW(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Wを入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">H</label>
              <input
                type="number"
                min="0"
                value={washitsuOshiireH ?? ""}
                onChange={(e) => setWashitsuOshiireH(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Hを入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">見込み</label>
              <input
                type="number"
                min="0"
                value={washitsuOshiireMikomi ?? ""}
                onChange={(e) => setWashitsuOshiireMikomi(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="見込み��入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </>
        )}

        {/* UB本体：交換の場合にサイズ選択 */}
        {showUbBodySize && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">サイズ</label>
              <div className="flex flex-wrap gap-2">
                {UB_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setUbBodySize(ubBodySize === s ? "" : s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ubBodySize === s ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {ubBodySize === "その他手入力" && (
                <input
                  value={ubBodySizeCustom}
                  onChange={(event) => setUbBodySizeCustom(event.target.value)}
                  placeholder="サイズを入力"
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>
            {ubProducts.length > 0 && (
              <ProductSelectionSection
                title="メーカー別UB商品"
                candidates={ubProducts}
                selectedProduct={ubSelectedProduct}
                photos={ubMakerPhotos}
                onPhotoChange={setUbMakerPhotos}
                onSelect={(candidate) => {
                  setUbSelectedProduct(candidate.id);
                  setUnitPrice(candidate.price);
                }}
              />
            )}
          </div>
        )}

        {showUbVentSpec && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">交換内容</label>
            <div className="flex flex-wrap gap-2">
              {["ガス浴乾 → ガス浴乾交換", "ガス浴乾 → 電気浴乾交換", "電気浴乾 → 電気浴乾", "電気浴乾 → ガス浴乾", "換気扇 → 電気浴乾"].map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setUbVentSpec(ubVentSpec === e ? "" : e)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    ubVentSpec === e
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {showUbHotwaterOptions && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">既存方法</label>
              <div className="flex flex-wrap gap-2">
                {["追い炊き", "高温差し湯", "兼用水栓"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setUbExistingHotwater(ubExistingHotwater === v ? "" : v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ubExistingHotwater === v ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">交換後</label>
              <div className="flex flex-wrap gap-2">
                {["追い炊き", "高温差し湯", "兼用水栓"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setUbAfterHotwater(ubAfterHotwater === v ? "" : v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ubAfterHotwater === v ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* UB浴��乾燥機：ガス/電気選択（常に表示） */}
        {showUbDryerEnergyType && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">エネルギータイプ</label>
            <div className="flex flex-wrap gap-2">
              {["電気", "ガス"].map((e) => (
                <button
                  key={e}
                  onClick={() => setUbDryerEnergyType(ubDryerEnergyType === e ? "" : e)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    ubDryerEnergyType === e
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 洗面室：洗面本体「交換」の場合にW入力 */}
        {showSenmenBodyW && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">サイズ</label>
              <div className="flex flex-wrap gap-2">
                {SENMEN_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSenmenBodySize(senmenBodySize === s ? "" : s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      senmenBodySize === s ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm text-amber-800">※H1900があるか要確認</p>
            </div>
            {senmenProducts.length > 0 && (
              <ProductSelectionSection
                title="メーカー別洗面化粧台"
                candidates={senmenProducts}
                selectedProduct={senmenSelectedProduct}
                photos={senmenMakerPhotos}
                onPhotoChange={setSenmenMakerPhotos}
                onSelect={(candidate) => {
                  setSenmenSelectedProduct(candidate.id);
                  setUnitPrice(candidate.price);
                }}
              />
            )}
          </div>
        )}

        {showSenmenWashingPanSize && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">サイズ</label>
            <div className="flex flex-wrap gap-2">
              {["640×640", "640×740", "640×800", "手入力"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSenmenWashingPanSize(senmenWashingPanSize === s ? "" : s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    senmenWashingPanSize === s ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {senmenWashingPanSize === "手入力" && (
              <input
                value={senmenWashingPanSizeCustom}
                onChange={(event) => setSenmenWashingPanSizeCustom(event.target.value)}
                placeholder="サイズを入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>
        )}

        {/* 洗面室：洗面���付位置高さ */}
        {showSenmenHeight && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">取付位置高さ</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={senmenHeightMm ?? ""}
                onChange={(e) => setSenmenHeightMm(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="高さを入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">mm</span>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mt-2">
              <p className="text-sm text-amber-800">※1900未満は設置不可の可能性あり</p>
            </div>
          </div>
        )}

        {/* 洗面室：入口建具 */}
        {showSenmenIriguchiOptions && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">W</label>
              <div className="flex flex-wrap gap-2">
                {["800", "1200", "1600"].map((w) => (
                  <button
                    key={w}
                    onClick={() => setSenmenIriguchiW(senmenIriguchiW === w ? "" : w)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      senmenIriguchiW === w
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">D</label>
              <div className="flex flex-wrap gap-2">
                {["400", "350"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSenmenIriguchiD(senmenIriguchiD === d ? "" : d)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      senmenIriguchiD === d
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">{selectedOption === "keep" ? "既存仕様" : "交換後仕様"}</label>
              <div className="flex flex-wrap gap-2">
                {["片開���", "片引き", "2枚引き違い", "2枚引き込み", "3枚引き違い"].map((spec) => (
                  <SpecImageButton
                    key={spec}
                    label={spec}
                    image={TATEGU_SPEC_IMAGES[spec]}
                    active={senmenIriguchiSpec === spec}
                    onClick={() => setSenmenIriguchiSpec(senmenIriguchiSpec === spec ? "" : spec)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      senmenIriguchiSpec === spec
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* 洗面室：入口段��� */}
        {showSenmenDansaMm && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">段差</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={senmenDansaMm ?? ""}
                onChange={(e) => setSenmenDansaMm(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="段差を入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">mm</span>
            </div>
          </div>
        )}

        {/* トイレ：トイレ本体「交換」の場合にW入力 */}
        {showToiletBodyPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">TOTO 商品写真</label>
            <div className="border border-dashed border-input rounded-lg p-4 text-center space-y-3">
              <img src="/images/toilet_body_tank.png" alt="TOTOトイレ本体" className="max-h-56 max-w-full object-contain mx-auto rounded" />
            </div>
          </div>
        )}

        {showToiletBodyW && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">排水</label>
              <div className="flex flex-wrap gap-2">
                {["床排水", "壁排水"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setToiletDrainage(toiletDrainage === v ? "" : v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      toiletDrainage === v ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {toiletDrainage === "床排水" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">排水芯</label>
                <div className="flex flex-wrap gap-2">
                  {["120", "200", "手入力"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setToiletFloorDrainMm(toiletFloorDrainMm === v ? "" : v)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        toiletFloorDrainMm === v ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {toiletFloorDrainMm === "手入力" && (
                  <input
                    type="number"
                    min="0"
                    value={toiletFloorDrainCustomMm ?? ""}
                    onChange={(e) => setToiletFloorDrainCustomMm(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="排水芯を入力"
                    className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
              </div>
            )}
            {toiletDrainage === "壁排水" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">排水芯</label>
                <div className="flex flex-wrap gap-2">
                  {["120", "155"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setToiletWallDrainMm(toiletWallDrainMm === v ? "" : v)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        toiletWallDrainMm === v ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* トイレ：排水「壁」の場合 */}
        {showToiletHaisuiWallMm && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">床から排水芯</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={toiletHaisuiWallMm ?? ""}
                onChange={(e) => setToiletHaisuiWallMm(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="寸法を入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">mm</span>
            </div>
          </div>
        )}

        {/* トイレ：排水「床」の場合 */}
        {showToiletHaisuiFloorMm && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">背面壁から排水芯</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={toiletHaisuiFloorMm ?? ""}
                onChange={(e) => setToiletHaisuiFloorMm(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="寸法を入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">mm</span>
            </div>
          </div>
        )}

        {/* トイレ：入口建具 */}
        {showToiletIriguchiOptions && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">W</label>
              <div className="flex flex-wrap gap-2">
                {["800", "1200", "1600"].map((w) => (
                  <button
                    key={w}
                    onClick={() => setToiletIriguchiW(toiletIriguchiW === w ? "" : w)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      toiletIriguchiW === w
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">D</label>
              <div className="flex flex-wrap gap-2">
                {["400", "350"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setToiletIriguchiD(toiletIriguchiD === d ? "" : d)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      toiletIriguchiD === d
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">{selectedOption === "keep" ? "既存仕様" : "交換後仕様"}</label>
              <div className="flex flex-wrap gap-2">
                {["片開き", "片引き", "2枚引き違い", "2枚引き込み", "3枚引き違い"].map((spec) => (
                  <SpecImageButton
                    key={spec}
                    label={spec}
                    image={TATEGU_SPEC_IMAGES[spec]}
                    active={toiletIriguchiSpec === spec}
                    onClick={() => setToiletIriguchiSpec(toiletIriguchiSpec === spec ? "" : spec)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      toiletIriguchiSpec === spec
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* トイレ：入口段差 */}
        {showToiletDansaMm && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">段差</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={toiletDansaMm ?? ""}
                onChange={(e) => setToiletDansaMm(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="段差を入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">mm</span>
            </div>
          </div>
        )}

        {isToiletStorage && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">仕様選択</label>
              <div className="flex flex-wrap gap-2">
                {TOILET_STORAGE_UI_OPTIONS.map((option) => {
                  const selected = toiletStorageSelections.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setToiletStorageSelections(selected ? [] : [option.value]);
                        if (option.value === "kadodana" && !selected) {
                          setYoshitsuStorageInsideSelections(["kadodana"]);
                        }
                        if (option.value !== "kadodana") {
                          setUnitPrice(0);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selected ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {showToiletStorageKadodana && (
              <StorageInsideSection
                hideSpecSelector
                state={{
                  selections: ["kadodana"],
                  kadodanaSteps: yoshitsuStorageInsideKadodanaSteps,
                  kadodanaW: yoshitsuStorageInsideKadodanaW,
                  kadodanaW_custom: yoshitsuStorageInsideKadodanaW_custom,
                  kadodanaD: yoshitsuStorageInsideKadodanaD,
                  kadodanaD_custom: yoshitsuStorageInsideKadodanaD_custom,
                  kadodanaMethod: yoshitsuStorageInsideKadodanaMethod,
                  kadodanaRailH: yoshitsuStorageInsideKadodanaRailH,
                  kadodanaRailColor: yoshitsuStorageInsideKadodanaRailColor,
                  makuradanaW: "",
                  hpW: undefined,
                  makuradanaHpW: "",
                  chudanNote: "",
                  kadodanaPhoto: yoshitsuStorageInsideKadodanaPhoto,
                }}
                onChange={(next) => {
                  if (next.kadodanaSteps !== undefined || "kadodanaSteps" in next) setYoshitsuStorageInsideKadodanaSteps(next.kadodanaSteps);
                  if (next.kadodanaW !== undefined) setYoshitsuStorageInsideKadodanaW(next.kadodanaW);
                  if (next.kadodanaW_custom !== undefined || "kadodanaW_custom" in next) setYoshitsuStorageInsideKadodanaW_custom(next.kadodanaW_custom);
                  if (next.kadodanaD !== undefined) setYoshitsuStorageInsideKadodanaD(next.kadodanaD);
                  if (next.kadodanaD_custom !== undefined || "kadodanaD_custom" in next) setYoshitsuStorageInsideKadodanaD_custom(next.kadodanaD_custom);
                  if (next.kadodanaMethod !== undefined) setYoshitsuStorageInsideKadodanaMethod(next.kadodanaMethod);
                  if (next.kadodanaRailH !== undefined) setYoshitsuStorageInsideKadodanaRailH(next.kadodanaRailH);
                  if (next.kadodanaRailColor !== undefined) setYoshitsuStorageInsideKadodanaRailColor(next.kadodanaRailColor);
                  if (next.kadodanaPhoto !== undefined) setYoshitsuStorageInsideKadodanaPhoto(next.kadodanaPhoto);
                }}
                onUnitPriceChange={setUnitPrice}
              />
            )}

            {toiletStorageSelections
              .filter((value) => value !== "kadodana")
              .map((value) => {
                const option = TOILET_STORAGE_UI_OPTIONS.find((item) => item.value === value);
                if (!option || !("image" in option)) return null;
                return (
                  <div key={option.value} className="rounded-lg border border-input overflow-hidden">
                    <div className="bg-muted flex items-center justify-center p-4">
                      <img src={option.image} alt={option.label} className="h-40 w-full object-contain rounded-md" />
                    </div>
                    <div className="p-4 space-y-1">
                      <p className="text-sm font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.dimension}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {showToiletPaperHolderOptions && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">仕様</label>
              <div className="flex flex-wrap gap-2">
                {["1連", "2連"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setToiletPaperHolderType(toiletPaperHolderType === v ? "" : v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      toiletPaperHolderType === v ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {toiletPaperHolderType === "1連" &&
              [0, 1, 2].map((index) => (
                <div key={index} className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">1連写真{index + 1}</label>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setToiletPaperHolderType("1連");
                        setToiletPaperHolderSinglePhotos(updatePhotoArray([], index, TOILET_PAPER_HOLDER_SINGLE_IMAGES[index]));
                        setToiletPaperHolderDoublePhoto("");
                        setUnitPrice(TOILET_PAPER_HOLDER_SINGLE_PRICES[index]);
                      }}
                      className={`w-full border rounded-lg p-4 text-center transition-colors ${
                        toiletPaperHolderSinglePhotos[index] ? "border-primary bg-primary/5" : "border-input hover:bg-accent/50"
                      }`}
                    >
                      <img
                        src={toiletPaperHolderSinglePhotos[index] || TOILET_PAPER_HOLDER_SINGLE_IMAGES[index]}
                        alt={`1連写真${index + 1}`}
                        className="max-h-40 mx-auto rounded"
                      />
                    </button>
                  </div>
                </div>
              ))}
            {toiletPaperHolderType === "2連" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">2連写真</label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setToiletPaperHolderType("2連");
                      setToiletPaperHolderSinglePhotos([]);
                      setToiletPaperHolderDoublePhoto(TOILET_PAPER_HOLDER_DOUBLE_IMAGE);
                      setUnitPrice(TOILET_PAPER_HOLDER_DOUBLE_PRICE);
                    }}
                    className={`w-full border rounded-lg p-4 text-center transition-colors ${
                      toiletPaperHolderDoublePhoto ? "border-primary bg-primary/5" : "border-input hover:bg-accent/50"
                    }`}
                  >
                    <img src={toiletPaperHolderDoublePhoto || TOILET_PAPER_HOLDER_DOUBLE_IMAGE} alt="2連写真" className="max-h-40 mx-auto rounded" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {showToiletTowelRingPhotos && (
          <div className="space-y-4">
            {[0, 1].map((index) => (
              <div key={index} className="space-y-2">
                <label className="text-sm font-medium text-foreground block">タオルリング写真{index + 1}</label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setToiletTowelRingPhotos(updatePhotoArray([], index, TOILET_TOWEL_RING_IMAGES[index]));
                      setUnitPrice(TOILET_TOWEL_RING_PRICES[index]);
                    }}
                    className={`w-full border rounded-lg p-4 text-center transition-colors ${
                      toiletTowelRingPhotos[index] ? "border-primary bg-primary/5" : "border-input hover:bg-accent/50"
                    }`}
                  >
                    <img
                      src={toiletTowelRingPhotos[index] || TOILET_TOWEL_RING_IMAGES[index]}
                      alt={`タオルリング写真${index + 1}`}
                      className="max-h-40 mx-auto rounded"
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LD：入口建具 */}
        {showLdIriguchiOptions && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">W</label>
              <div className="flex flex-wrap gap-2">
                {["800", "1200", "1600"].map((w) => (
                  <button
                    key={w}
                    onClick={() => setLdIriguchiW(ldIriguchiW === w ? "" : w)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ldIriguchiW === w
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">D</label>
              <div className="flex flex-wrap gap-2">
                {["400", "350"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setLdIriguchiD(ldIriguchiD === d ? "" : d)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ldIriguchiD === d
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">{selectedOption === "keep" ? "既存���様" : "交換後仕様"}</label>
              <div className="flex flex-wrap gap-2">
                {["片開き", "片引き", "2枚引き違い", "2枚引き込み", "3枚引き違い"].map((spec) => (
                  <SpecImageButton
                    key={spec}
                    label={spec}
                    image={TATEGU_SPEC_IMAGES[spec]}
                    active={ldIriguchiSpec === spec}
                    onClick={() => setLdIriguchiSpec(ldIriguchiSpec === spec ? "" : spec)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ldIriguchiSpec === spec
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* LD：入口段差 */}
        {showLdDansaMm && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">段差</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={ldDansaMm ?? ""}
                onChange={(e) => setLdDansaMm(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="段差を入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">mm</span>
            </div>
          </div>
        )}

        {/* LD：収納（既存残しの場合） */}
        {showLdStorageKeep && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">W</label>
                <input
                  type="number"
                  min="0"
                  value={ldStorageKeepW ?? ""}
                  onChange={(e) => setLdStorageKeepW(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="W"
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">H</label>
                <input
                  type="number"
                  min="0"
                  value={ldStorageKeepH ?? ""}
                  onChange={(e) => setLdStorageKeepH(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="H"
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">D</label>
                <input
                  type="number"
                  min="0"
                  value={ldStorageKeepD ?? ""}
                  onChange={(e) => setLdStorageKeepD(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="D"
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">既存仕様</label>
              <div className="flex flex-wrap gap-2">
                {["折れ戸", "片開き", "観音開き"].map((spec) => (
                  <button
                    key={spec}
                    onClick={() => setLdStorageKeepSpec(ldStorageKeepSpec === spec ? "" : spec)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ldStorageKeepSpec === spec
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* LD：収納（交換���場合） */}
        {/* LD収納交換UIは新StorageDetailに統合済み */}

        {/* LD：網戸（色選択） */}
        {showLdAmidoColor && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">色</label>
            <div className="flex flex-wrap gap-2">
              {["黒", "シルバー"].map((c) => (
                <button
                  key={c}
                  onClick={() => setLdAmidoColor(ldAmidoColor === c ? "" : c)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    ldAmidoColor === c
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== LDK 収納内部 ===== */}
        {isLdkStorageInside && (
          <StorageInsideSection
            state={{
              selections: ldkStorageInsideSelections,
              kadodanaSteps: ldkStorageInsideKadodanaSteps,
              kadodanaW: ldkStorageInsideKadodanaW,
              kadodanaW_custom: ldkStorageInsideKadodanaW_custom,
              kadodanaD: ldkStorageInsideKadodanaD,
              kadodanaD_custom: ldkStorageInsideKadodanaD_custom,
              kadodanaMethod: ldkStorageInsideKadodanaMethod,
              kadodanaRailH: ldkStorageInsideKadodanaRailH,
              kadodanaRailColor: ldkStorageInsideKadodanaRailColor,
              makuradanaW: ldkStorageInsideMakuradanaW,
              hpW: ldkStorageInsideHpW,
              makuradanaHpW: ldkStorageInsideMakuradanaHpW,
              chudanNote: ldkStorageInsideChudanNote,
              makuradanaCategory: ldkStorageInsideMakuradanaCategory,
              makuradanaSize: ldkStorageInsideMakuradanaSize,
              makuradanaDimensions: ldkStorageInsideMakuradanaDimensions,
              makuradanaPrice: ldkStorageInsideMakuradanaPrice,
              hpCategory: ldkStorageInsideHpCategory,
              hpLength: ldkStorageInsideHpLength,
              hpPrice: ldkStorageInsideHpPrice,
              makuradanaHpShelfCategory: ldkStorageInsideMakuradanaHpShelfCategory,
              makuradanaHpShelfSize: ldkStorageInsideMakuradanaHpShelfSize,
              makuradanaHpShelfDimensions: ldkStorageInsideMakuradanaHpShelfDimensions,
              makuradanaHpShelfPrice: ldkStorageInsideMakuradanaHpShelfPrice,
              makuradanaHpHpCategory: ldkStorageInsideMakuradanaHpHpCategory,
              makuradanaHpHpLength: ldkStorageInsideMakuradanaHpHpLength,
              makuradanaHpHpPrice: ldkStorageInsideMakuradanaHpHpPrice,
              chudanCategory: ldkStorageInsideChudanCategory,
              chudanSize: ldkStorageInsideChudanSize,
              chudanDimensions: ldkStorageInsideChudanDimensions,
              chudanPrice: ldkStorageInsideChudanPrice,
              kadodanaPhoto: ldkStorageInsideKadodanaPhoto,
              makuradanaPhoto: ldkStorageInsideMakuradanaPhoto,
              hpPhoto: ldkStorageInsideHpPhoto,
              makuradanaHpPhoto: ldkStorageInsideMakuradanaHpPhoto,
              chudanPhoto: ldkStorageInsideChudanPhoto,
            }}
            onChange={(next) => {
              if (next.selections !== undefined) setLdkStorageInsideSelections(next.selections);
              if (next.kadodanaSteps !== undefined || "kadodanaSteps" in next) setLdkStorageInsideKadodanaSteps(next.kadodanaSteps);
              if (next.kadodanaW !== undefined) setLdkStorageInsideKadodanaW(next.kadodanaW);
              if (next.kadodanaW_custom !== undefined || "kadodanaW_custom" in next) setLdkStorageInsideKadodanaW_custom(next.kadodanaW_custom);
              if (next.kadodanaD !== undefined) setLdkStorageInsideKadodanaD(next.kadodanaD);
              if (next.kadodanaD_custom !== undefined || "kadodanaD_custom" in next) setLdkStorageInsideKadodanaD_custom(next.kadodanaD_custom);
              if (next.kadodanaMethod !== undefined) setLdkStorageInsideKadodanaMethod(next.kadodanaMethod);
              if (next.kadodanaRailH !== undefined) setLdkStorageInsideKadodanaRailH(next.kadodanaRailH);
              if (next.kadodanaRailColor !== undefined) setLdkStorageInsideKadodanaRailColor(next.kadodanaRailColor);
              if (next.makuradanaW !== undefined) setLdkStorageInsideMakuradanaW(next.makuradanaW);
              if (next.hpW !== undefined || "hpW" in next) setLdkStorageInsideHpW(next.hpW);
              if (next.makuradanaHpW !== undefined) setLdkStorageInsideMakuradanaHpW(next.makuradanaHpW);
              if (next.chudanNote !== undefined) setLdkStorageInsideChudanNote(next.chudanNote);
              if (next.makuradanaCategory !== undefined) setLdkStorageInsideMakuradanaCategory(next.makuradanaCategory);
              if (next.makuradanaSize !== undefined) setLdkStorageInsideMakuradanaSize(next.makuradanaSize);
              if (next.makuradanaDimensions !== undefined) setLdkStorageInsideMakuradanaDimensions(next.makuradanaDimensions);
              if (next.makuradanaPrice !== undefined) setLdkStorageInsideMakuradanaPrice(next.makuradanaPrice);
              if (next.hpCategory !== undefined) setLdkStorageInsideHpCategory(next.hpCategory);
              if (next.hpLength !== undefined) setLdkStorageInsideHpLength(next.hpLength);
              if (next.hpPrice !== undefined) setLdkStorageInsideHpPrice(next.hpPrice);
              if (next.makuradanaHpShelfCategory !== undefined) setLdkStorageInsideMakuradanaHpShelfCategory(next.makuradanaHpShelfCategory);
              if (next.makuradanaHpShelfSize !== undefined) setLdkStorageInsideMakuradanaHpShelfSize(next.makuradanaHpShelfSize);
              if (next.makuradanaHpShelfDimensions !== undefined) setLdkStorageInsideMakuradanaHpShelfDimensions(next.makuradanaHpShelfDimensions);
              if (next.makuradanaHpShelfPrice !== undefined) setLdkStorageInsideMakuradanaHpShelfPrice(next.makuradanaHpShelfPrice);
              if (next.makuradanaHpHpCategory !== undefined) setLdkStorageInsideMakuradanaHpHpCategory(next.makuradanaHpHpCategory);
              if (next.makuradanaHpHpLength !== undefined) setLdkStorageInsideMakuradanaHpHpLength(next.makuradanaHpHpLength);
              if (next.makuradanaHpHpPrice !== undefined) setLdkStorageInsideMakuradanaHpHpPrice(next.makuradanaHpHpPrice);
              if (next.chudanCategory !== undefined) setLdkStorageInsideChudanCategory(next.chudanCategory);
              if (next.chudanSize !== undefined) setLdkStorageInsideChudanSize(next.chudanSize);
              if (next.chudanDimensions !== undefined) setLdkStorageInsideChudanDimensions(next.chudanDimensions);
              if (next.chudanPrice !== undefined) setLdkStorageInsideChudanPrice(next.chudanPrice);
              if (next.kadodanaPhoto !== undefined) setLdkStorageInsideKadodanaPhoto(next.kadodanaPhoto);
              if (next.makuradanaPhoto !== undefined) setLdkStorageInsideMakuradanaPhoto(next.makuradanaPhoto);
              if (next.hpPhoto !== undefined) setLdkStorageInsideHpPhoto(next.hpPhoto);
              if (next.makuradanaHpPhoto !== undefined) setLdkStorageInsideMakuradanaHpPhoto(next.makuradanaHpPhoto);
              if (next.chudanPhoto !== undefined) setLdkStorageInsideChudanPhoto(next.chudanPhoto);
            }}
            onUnitPriceChange={setUnitPrice}
          />
        )}

        {/* ===== 洋室・トイレ 収納内部 ===== */}
        {isYoshitsuStorageInsideLike && (
          <StorageInsideSection
            state={{
              selections: yoshitsuStorageInsideSelections,
              kadodanaSteps: yoshitsuStorageInsideKadodanaSteps,
              kadodanaW: yoshitsuStorageInsideKadodanaW,
              kadodanaW_custom: yoshitsuStorageInsideKadodanaW_custom,
              kadodanaD: yoshitsuStorageInsideKadodanaD,
              kadodanaD_custom: yoshitsuStorageInsideKadodanaD_custom,
              kadodanaMethod: yoshitsuStorageInsideKadodanaMethod,
              kadodanaRailH: yoshitsuStorageInsideKadodanaRailH,
              kadodanaRailColor: yoshitsuStorageInsideKadodanaRailColor,
              makuradanaW: yoshitsuStorageInsideMakuradanaW,
              hpW: yoshitsuStorageInsideHpW,
              makuradanaHpW: yoshitsuStorageInsideMakuradanaHpW,
              chudanNote: yoshitsuStorageInsideChudanNote,
              makuradanaCategory: yoshitsuStorageInsideMakuradanaCategory,
              makuradanaSize: yoshitsuStorageInsideMakuradanaSize,
              makuradanaDimensions: yoshitsuStorageInsideMakuradanaDimensions,
              makuradanaPrice: yoshitsuStorageInsideMakuradanaPrice,
              hpCategory: yoshitsuStorageInsideHpCategory,
              hpLength: yoshitsuStorageInsideHpLength,
              hpPrice: yoshitsuStorageInsideHpPrice,
              makuradanaHpShelfCategory: yoshitsuStorageInsideMakuradanaHpShelfCategory,
              makuradanaHpShelfSize: yoshitsuStorageInsideMakuradanaHpShelfSize,
              makuradanaHpShelfDimensions: yoshitsuStorageInsideMakuradanaHpShelfDimensions,
              makuradanaHpShelfPrice: yoshitsuStorageInsideMakuradanaHpShelfPrice,
              makuradanaHpHpCategory: yoshitsuStorageInsideMakuradanaHpHpCategory,
              makuradanaHpHpLength: yoshitsuStorageInsideMakuradanaHpHpLength,
              makuradanaHpHpPrice: yoshitsuStorageInsideMakuradanaHpHpPrice,
              chudanCategory: yoshitsuStorageInsideChudanCategory,
              chudanSize: yoshitsuStorageInsideChudanSize,
              chudanDimensions: yoshitsuStorageInsideChudanDimensions,
              chudanPrice: yoshitsuStorageInsideChudanPrice,
              kadodanaPhoto: yoshitsuStorageInsideKadodanaPhoto,
              makuradanaPhoto: yoshitsuStorageInsideMakuradanaPhoto,
              hpPhoto: yoshitsuStorageInsideHpPhoto,
              makuradanaHpPhoto: yoshitsuStorageInsideMakuradanaHpPhoto,
              chudanPhoto: yoshitsuStorageInsideChudanPhoto,
            }}
            onChange={(next) => {
              if (next.selections !== undefined) setYoshitsuStorageInsideSelections(next.selections);
              if (next.kadodanaSteps !== undefined || "kadodanaSteps" in next) setYoshitsuStorageInsideKadodanaSteps(next.kadodanaSteps);
              if (next.kadodanaW !== undefined) setYoshitsuStorageInsideKadodanaW(next.kadodanaW);
              if (next.kadodanaW_custom !== undefined || "kadodanaW_custom" in next) setYoshitsuStorageInsideKadodanaW_custom(next.kadodanaW_custom);
              if (next.kadodanaD !== undefined) setYoshitsuStorageInsideKadodanaD(next.kadodanaD);
              if (next.kadodanaD_custom !== undefined || "kadodanaD_custom" in next) setYoshitsuStorageInsideKadodanaD_custom(next.kadodanaD_custom);
              if (next.kadodanaMethod !== undefined) setYoshitsuStorageInsideKadodanaMethod(next.kadodanaMethod);
              if (next.kadodanaRailH !== undefined) setYoshitsuStorageInsideKadodanaRailH(next.kadodanaRailH);
              if (next.kadodanaRailColor !== undefined) setYoshitsuStorageInsideKadodanaRailColor(next.kadodanaRailColor);
              if (next.makuradanaW !== undefined) setYoshitsuStorageInsideMakuradanaW(next.makuradanaW);
              if (next.hpW !== undefined || "hpW" in next) setYoshitsuStorageInsideHpW(next.hpW);
              if (next.makuradanaHpW !== undefined) setYoshitsuStorageInsideMakuradanaHpW(next.makuradanaHpW);
              if (next.chudanNote !== undefined) setYoshitsuStorageInsideChudanNote(next.chudanNote);
              if (next.makuradanaCategory !== undefined) setYoshitsuStorageInsideMakuradanaCategory(next.makuradanaCategory);
              if (next.makuradanaSize !== undefined) setYoshitsuStorageInsideMakuradanaSize(next.makuradanaSize);
              if (next.makuradanaDimensions !== undefined) setYoshitsuStorageInsideMakuradanaDimensions(next.makuradanaDimensions);
              if (next.makuradanaPrice !== undefined) setYoshitsuStorageInsideMakuradanaPrice(next.makuradanaPrice);
              if (next.hpCategory !== undefined) setYoshitsuStorageInsideHpCategory(next.hpCategory);
              if (next.hpLength !== undefined) setYoshitsuStorageInsideHpLength(next.hpLength);
              if (next.hpPrice !== undefined) setYoshitsuStorageInsideHpPrice(next.hpPrice);
              if (next.makuradanaHpShelfCategory !== undefined) setYoshitsuStorageInsideMakuradanaHpShelfCategory(next.makuradanaHpShelfCategory);
              if (next.makuradanaHpShelfSize !== undefined) setYoshitsuStorageInsideMakuradanaHpShelfSize(next.makuradanaHpShelfSize);
              if (next.makuradanaHpShelfDimensions !== undefined) setYoshitsuStorageInsideMakuradanaHpShelfDimensions(next.makuradanaHpShelfDimensions);
              if (next.makuradanaHpShelfPrice !== undefined) setYoshitsuStorageInsideMakuradanaHpShelfPrice(next.makuradanaHpShelfPrice);
              if (next.makuradanaHpHpCategory !== undefined) setYoshitsuStorageInsideMakuradanaHpHpCategory(next.makuradanaHpHpCategory);
              if (next.makuradanaHpHpLength !== undefined) setYoshitsuStorageInsideMakuradanaHpHpLength(next.makuradanaHpHpLength);
              if (next.makuradanaHpHpPrice !== undefined) setYoshitsuStorageInsideMakuradanaHpHpPrice(next.makuradanaHpHpPrice);
              if (next.chudanCategory !== undefined) setYoshitsuStorageInsideChudanCategory(next.chudanCategory);
              if (next.chudanSize !== undefined) setYoshitsuStorageInsideChudanSize(next.chudanSize);
              if (next.chudanDimensions !== undefined) setYoshitsuStorageInsideChudanDimensions(next.chudanDimensions);
              if (next.chudanPrice !== undefined) setYoshitsuStorageInsideChudanPrice(next.chudanPrice);
              if (next.kadodanaPhoto !== undefined) setYoshitsuStorageInsideKadodanaPhoto(next.kadodanaPhoto);
              if (next.makuradanaPhoto !== undefined) setYoshitsuStorageInsideMakuradanaPhoto(next.makuradanaPhoto);
              if (next.hpPhoto !== undefined) setYoshitsuStorageInsideHpPhoto(next.hpPhoto);
              if (next.makuradanaHpPhoto !== undefined) setYoshitsuStorageInsideMakuradanaHpPhoto(next.makuradanaHpPhoto);
              if (next.chudanPhoto !== undefined) setYoshitsuStorageInsideChudanPhoto(next.chudanPhoto);
            }}
            onUnitPriceChange={setUnitPrice}
          />
        )}

        {/* ===== LDK 収納：交換時の仕様選択 ===== */}
        {showLdkStorageChange && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">仕様選択</label>
              <div className="flex flex-wrap gap-2">
                {["折れ戸", "両開き"].map((spec) => (
                  <SpecImageButton
                    key={spec}
                    label={spec}
                    image={STORAGE_SPEC_IMAGES[spec]}
                    active={ldkStorageSpec === spec}
                    onClick={() => setLdkStorageSpec(ldkStorageSpec === spec ? "" : spec)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ldkStorageSpec === spec
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  />
                ))}
              </div>
            </div>
            {ldkStorageSpec && (
              <StorageDetail
                spec={ldkStorageSpec}
                handle={ldkStorageHandle} setHandle={setLdkStorageHandle}
                w={ldkStorageW} setW={setLdkStorageW}
                w_custom={ldkStorageW_custom} setW_custom={setLdkStorageW_custom}
                h={ldkStorageH} setH={setLdkStorageH}
                h_custom={ldkStorageH_custom} setH_custom={setLdkStorageH_custom}
                photo={ldkStoragePhoto} setPhoto={setLdkStoragePhoto}
                fixedFrame={ldkStorageFixedFrame} setFixedFrame={setLdkStorageFixedFrame}
                fixedFramePhoto={ldkStorageFixedFramePhoto} setFixedFramePhoto={setLdkStorageFixedFramePhoto}
                nonShitaAllowedWidths={["735", "825", "1190", "1320", "1645", "1708"]}
              />
            )}
          </div>
        )}

        {/* ===== 洋室 収納：交換時の仕様選択 ===== */}
        {showYoshitsuStorageChange && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">仕様選択</label>
              <div className="flex flex-wrap gap-2">
                {["折れ戸", "両開き"].map((spec) => (
                  <SpecImageButton
                    key={spec}
                    label={spec}
                    image={STORAGE_SPEC_IMAGES[spec]}
                    active={yoshitsuStorageSpec === spec}
                    onClick={() => setYoshitsuStorageSpec(yoshitsuStorageSpec === spec ? "" : spec)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      yoshitsuStorageSpec === spec
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  />
                ))}
              </div>
            </div>
            {yoshitsuStorageSpec && (
              <StorageDetail
                spec={yoshitsuStorageSpec}
                handle={yoshitsuStorageHandle} setHandle={setYoshitsuStorageHandle}
                w={yoshitsuStorageW} setW={setYoshitsuStorageW}
                w_custom={yoshitsuStorageW_custom} setW_custom={setYoshitsuStorageW_custom}
                h={yoshitsuStorageH} setH={setYoshitsuStorageH}
                h_custom={yoshitsuStorageH_custom} setH_custom={setYoshitsuStorageH_custom}
                photo={yoshitsuStoragePhoto} setPhoto={setYoshitsuStoragePhoto}
                fixedFrame={yoshitsuStorageFixedFrame} setFixedFrame={setYoshitsuStorageFixedFrame}
                fixedFramePhoto={yoshitsuStorageFixedFramePhoto} setFixedFramePhoto={setYoshitsuStorageFixedFramePhoto}
              />
            )}
          </div>
        )}

        {/* ===== LDK 床：床組み選択 ===== */}
        {showLdkFloorKumi && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">床組み</label>
            <div className="flex flex-wrap gap-2">
              {["あり", "なし"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setLdkFloorKumi(ldkFloorKumi === v ? "" : v)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    ldkFloorKumi === v
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LDK 床：写真エリア */}
        {isLdkFloor && selectedOption !== "" && selectedOption !== "keep" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">写真</label>
            <div className="border border-dashed border-input rounded-lg p-4 text-center space-y-3">
              <FloorSpecImage option={selectedOption} alt="写真" />
            </div>
          </div>
        )}

        {showWashitsuYoshitsuFloorPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">写真</label>
            <div className="border border-dashed border-input rounded-lg p-4 text-center space-y-3">
              <FloorSpecImage option={selectedOption} alt="写真" />
            </div>
          </div>
        )}

        {/* ===== LDK 巾木：写真エリア ===== */}
        {showLdkHabakiWoodPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">木巾木写真</label>
            <div className="border border-dashed border-input rounded-lg p-4 text-center">
              <img src="/images/巾木/mokuhabaki.png" alt="木巾木写真" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}
        {showLdkHabakiSoftPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">ソフト巾木写真</label>
            <div className="border border-dashed border-input rounded-lg p-4 text-center">
              <img src="/images/巾木/sohutohabaki.png" alt="ソフト巾木写真" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {/* ===== LDK 照明：複数選択UI ===== */}
        {showLdkLightOptions && (
          <div className="space-y-4">
            {/* ローゼット + DL組み合わせ */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">組み合わせ選択</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLdkLightRosette(!ldkLightRosette)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    ldkLightRosette
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  ローゼット交換
                </button>
                <span className="text-xs text-muted-foreground">+</span>
                {["dl_change", "dl_new"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setLdkLightDlType(ldkLightDlType === v ? "" : v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ldkLightDlType === v
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {v === "dl_change" ? "DL交換" : "DL新規"}
                  </button>
                ))}
              </div>
            </div>
            {/* 間接照明（別枠） */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">間接照明</label>
              <div className="flex flex-wrap gap-2">
                {["コーブ照明", "コーニス照明"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setLdkLightIndirect(ldkLightIndirect === v ? "" : v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ldkLightIndirect === v
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              {ldkLightIndirect && (
                <div className="border border-dashed border-input rounded-lg p-4 text-center mt-2">
                  <img src={ldkLightIndirect === "コーニス照明" ? "/images/dl照明/cornice.jpg" : "/images/dl照明/cove.jpg"} alt={`${ldkLightIndirect}写真`} className="max-h-40 mx-auto rounded" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== LDK 建具 ===== */}
        {isLdkTategu && selectedOption === "change" && (
          <div className="space-y-4">
            {/* 仕様選択を��番上に表示（交換選択後） */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">仕様選択</label>
              <div className="flex flex-wrap gap-2">
                {["片開き", "片引き", "2枚引き違い戸", "2枚片引き", "3枚引き違い戸", "3枚片引き"].map((spec) => (
                  <SpecImageButton
                    key={spec}
                    label={spec}
                    image={TATEGU_SPEC_IMAGES[spec]}
                    active={ldkTateguSpec === spec}
                    onClick={() => setLdkTateguSpec(ldkTateguSpec === spec ? "" : spec)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ldkTateguSpec === spec
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  />
                ))}
              </div>
            </div>
            {ldkTateguSpec && (
              <TateguDetail
                spec={ldkTateguSpec}
                dansa={ldkTateguDansa} setDansa={setLdkTateguDansa}
                dansaKubun={ldkTateguDansaKubun} setDansaKubun={setLdkTateguDansaKubun}
                dansaCustomMm={ldkTateguDansaCustomMm} setDansaCustomMm={setLdkTateguDansaCustomMm}
                katabiraki_w={ldkKatabiraki_w} setKatabiraki_w={setLdkKatabiraki_w}
                katabiraki_h={ldkKatabiraki_h} setKatabiraki_h={setLdkKatabiraki_h}
                katabiraki_mikomi={ldkKatabiraki_mikomi} setKatabiraki_mikomi={setLdkKatabiraki_mikomi}
                katabiraki_tsurimoto={ldkKatabiraki_tsurimoto} setKatabiraki_tsurimoto={setLdkKatabiraki_tsurimoto}
                katabiraki_todomatari={ldkKatabiraki_todomatari} setKatabiraki_todomatari={setLdkKatabiraki_todomatari}
                katabiraki_w_custom={ldkKatabiraki_w_custom} setKatabiraki_w_custom={setLdkKatabiraki_w_custom}
                katabiraki_h_custom={ldkKatabiraki_h_custom} setKatabiraki_h_custom={setLdkKatabiraki_h_custom}
                katabiraki_photo={ldkKatabiraki_photo} setKatabiraki_photo={setLdkKatabiraki_photo}
                katabiraki_tsurimoto_photo={ldkKatabiraki_tsurimoto_photo} setKatabiraki_tsurimoto_photo={setLdkKatabiraki_tsurimoto_photo}
                katabiraki_todomatari_photo={ldkKatabiraki_todomatari_photo} setKatabiraki_todomatari_photo={setLdkKatabiraki_todomatari_photo}
                katahiki_method={ldkKatahiki_method} setKatahiki_method={setLdkKatahiki_method}
                katahiki_w={ldkKatahiki_w} setKatahiki_w={setLdkKatahiki_w}
                katahiki_h={ldkKatahiki_h} setKatahiki_h={setLdkKatahiki_h}
                katahiki_mikomi={ldkKatahiki_mikomi} setKatahiki_mikomi={setLdkKatahiki_mikomi}
                katahiki_hikite={ldkKatahiki_hikite} setKatahiki_hikite={setLdkKatahiki_hikite}
                katahiki_w_custom={ldkKatahiki_w_custom} setKatahiki_w_custom={setLdkKatahiki_w_custom}
                katahiki_h_custom={ldkKatahiki_h_custom} setKatahiki_h_custom={setLdkKatahiki_h_custom}
                katahiki_method_photo={ldkKatahiki_method_photo} setKatahiki_method_photo={setLdkKatahiki_method_photo}
                katahiki_hikite_photo={ldkKatahiki_hikite_photo} setKatahiki_hikite_photo={setLdkKatahiki_hikite_photo}
                nimai_hiki_method={ldkNimaiHikichigai_method} setNimai_hiki_method={setLdkNimaiHikichigai_method}
                nimai_hiki_w={ldkNimaiHikichigai_w} setNimai_hiki_w={setLdkNimaiHikichigai_w}
                nimai_hiki_h={ldkNimaiHikichigai_h} setNimai_hiki_h={setLdkNimaiHikichigai_h}
                nimai_hiki_mikomi={ldkNimaiHikichigai_mikomi} setNimai_hiki_mikomi={setLdkNimaiHikichigai_mikomi}
                nimai_hiki_hikite={ldkNimaiHikichigai_hikite} setNimai_hiki_hikite={setLdkNimaiHikichigai_hikite}
                nimai_hiki_w_custom={ldkNimaiHikichigai_w_custom} setNimai_hiki_w_custom={setLdkNimaiHikichigai_w_custom}
                nimai_hiki_h_custom={ldkNimaiHikichigai_h_custom} setNimai_hiki_h_custom={setLdkNimaiHikichigai_h_custom}
                nimai_hiki_method_photo={ldkNimaiHikichigai_method_photo} setNimai_hiki_method_photo={setLdkNimaiHikichigai_method_photo}
                nimai_hiki_hikite_photo={ldkNimaiHikichigai_hikite_photo} setNimai_hiki_hikite_photo={setLdkNimaiHikichigai_hikite_photo}
                sanmai_hiki_method={ldkSanmaiHikichigai_method} setSanmai_hiki_method={setLdkSanmaiHikichigai_method}
                sanmai_hiki_w={ldkSanmaiHikichigai_w} setSanmai_hiki_w={setLdkSanmaiHikichigai_w}
                sanmai_hiki_h={ldkSanmaiHikichigai_h} setSanmai_hiki_h={setLdkSanmaiHikichigai_h}
                sanmai_hiki_hikite={ldkSanmaiHikichigai_hikite} setSanmai_hiki_hikite={setLdkSanmaiHikichigai_hikite}
                sanmai_hiki_w_custom={ldkSanmaiHikichigai_w_custom} setSanmai_hiki_w_custom={setLdkSanmaiHikichigai_w_custom}
                sanmai_hiki_h_custom={ldkSanmaiHikichigai_h_custom} setSanmai_hiki_h_custom={setLdkSanmaiHikichigai_h_custom}
                sanmai_hiki_method_photo={ldkSanmaiHikichigai_method_photo} setSanmai_hiki_method_photo={setLdkSanmaiHikichigai_method_photo}
                sanmai_hiki_hikite_photo={ldkSanmaiHikichigai_hikite_photo} setSanmai_hiki_hikite_photo={setLdkSanmaiHikichigai_hikite_photo}
                sanmai_kata_method={ldkSanmaiKatahiki_method} setSanmai_kata_method={setLdkSanmaiKatahiki_method}
                sanmai_kata_w={ldkSanmaiKatahiki_w} setSanmai_kata_w={setLdkSanmaiKatahiki_w}
                sanmai_kata_h={ldkSanmaiKatahiki_h} setSanmai_kata_h={setLdkSanmaiKatahiki_h}
                sanmai_kata_mikomi={ldkSanmaiKatahiki_mikomi} setSanmai_kata_mikomi={setLdkSanmaiKatahiki_mikomi}
                sanmai_kata_hikite={ldkSanmaiKatahiki_hikite} setSanmai_kata_hikite={setLdkSanmaiKatahiki_hikite}
                sanmai_kata_w_custom={ldkSanmaiKatahiki_w_custom} setSanmai_kata_w_custom={setLdkSanmaiKatahiki_w_custom}
                sanmai_kata_h_custom={ldkSanmaiKatahiki_h_custom} setSanmai_kata_h_custom={setLdkSanmaiKatahiki_h_custom}
                sanmai_kata_method_photo={ldkSanmaiKatahiki_method_photo} setSanmai_kata_method_photo={setLdkSanmaiKatahiki_method_photo}
                sanmai_kata_hikite_photo={ldkSanmaiKatahiki_hikite_photo} setSanmai_kata_hikite_photo={setLdkSanmaiKatahiki_hikite_photo}
                nimai_kata_photo={ldkNimaiKatahiki_photo} setNimai_kata_photo={setLdkNimaiKatahiki_photo}
                nimai_kata_w={ldkNimaiKatahiki_w} setNimai_kata_w={setLdkNimaiKatahiki_w}
                nimai_kata_h={ldkNimaiKatahiki_h} setNimai_kata_h={setLdkNimaiKatahiki_h}
                nimai_kata_w_custom={ldkNimaiKatahiki_w_custom} setNimai_kata_w_custom={setLdkNimaiKatahiki_w_custom}
                nimai_kata_h_custom={ldkNimaiKatahiki_h_custom} setNimai_kata_h_custom={setLdkNimaiKatahiki_h_custom}
                nimai_kata_hikite={ldkNimaiKatahiki_hikite} setNimai_kata_hikite={setLdkNimaiKatahiki_hikite}
                nimai_kata_hikite_photo={ldkNimaiKatahiki_hikite_photo} setNimai_kata_hikite_photo={setLdkNimaiKatahiki_hikite_photo}
              />
            )}
          </div>
        )}
        {/* LDK建具：既存残しの場合は入口段差のみ表示 */}
        {isLdkTategu && selectedOption === "keep" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">入口段差</label>
              <div className="flex flex-wrap gap-2">
                {[{ value: "yes", label: "あり" }, { value: "no", label: "なし" }].map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setLdkTateguDansa(ldkTateguDansa === o.value ? "" : o.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ldkTateguDansa === o.value
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {ldkTateguDansa === "yes" && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {["1〜10", "11〜50", "51〜100", "100以上", "手入力"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setLdkTateguDansaKubun(ldkTateguDansaKubun === v ? "" : v)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        ldkTateguDansaKubun === v
                          ? "bg-primary text-primary-foreground"
                          : "border border-input text-foreground hover:bg-accent"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                  {ldkTateguDansaKubun === "手入力" && (
                    <input
                      type="number"
                      min="0"
                      value={ldkTateguDansaCustomMm ?? ""}
                      onChange={(e) => setLdkTateguDansaCustomMm(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="mm"
                      className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== 洋室 床：床組み/床下地選択 ===== */}
        {showYoshitsuFloorKumi && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">{room?.roomType === "WASHITSU_YOSHITSU" ? "床下地" : "床組み"}</label>
            <div className="flex flex-wrap gap-2">
              {(room?.roomType === "WASHITSU_YOSHITSU" ? ["既存残し", "床左官", "床組"] : ["あり", "なし"]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setYoshitsuFloorKumi(yoshitsuFloorKumi === v ? "" : v)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    yoshitsuFloorKumi === v
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {showWashitsuYoshitsuTatamithickness && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">畳の厚み</label>
            <div className="flex flex-wrap gap-2">
              {["15", "30", "50", "手入力"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setWashitsuYoshitsuTatamithickness(washitsuYoshitsuTatamithickness === v ? "" : v)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    washitsuYoshitsuTatamithickness === v
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            {(washitsuYoshitsuTatamithickness === "手入力" || typeof washitsuYoshitsuTatamithickness === "number") && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={typeof washitsuYoshitsuTatamithickness === "number" ? washitsuYoshitsuTatamithickness : ""}
                  onChange={(e) => setWashitsuYoshitsuTatamithickness(e.target.value ? Number(e.target.value) : "手入力")}
                  placeholder="畳の厚みを入力"
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">mm</span>
              </div>
            )}
          </div>
        )}

        {/* 洋室 床：写真エリア */}
        {isYoshitsuFloor && selectedOption !== "" && selectedOption !== "keep" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">写真</label>
            <div className="border border-dashed border-input rounded-lg p-4 text-center">
              <FloorSpecImage option={selectedOption} alt="写真" />
            </div>
          </div>
        )}

        {/* ===== 洋室 巾木：写真エリア（廊下と同じUI） ===== */}
        {showYoshitsuHabakiWoodPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">木巾木写真</label>
            <div className="border border-dashed border-input rounded-lg p-4 text-center">
              <img src="/images/巾木/mokuhabaki.png" alt="木巾木写真" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}
        {showYoshitsuHabakiSoftPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">ソフト巾木写真</label>
            <div className="border border-dashed border-input rounded-lg p-4 text-center">
              <img src="/images/巾木/sohutohabaki.png" alt="ソフト巾木写真" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {/* ===== 洋室 照明：複数選択UI ===== */}
        {showYoshitsuLightNewOptions && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">組み合わせ選択</label>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setYoshitsuLightRosette(!yoshitsuLightRosette)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    yoshitsuLightRosette
                      ? "bg-primary text-primary-foreground"
                      : "border border-input text-foreground hover:bg-accent"
                  }`}
                >
                  ローゼット交換
                </button>
                <span className="text-xs text-muted-foreground">+</span>
                {["dl_change", "dl_new"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setYoshitsuLightDlType(yoshitsuLightDlType === v ? "" : v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      yoshitsuLightDlType === v
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {v === "dl_change" ? "DL交換" : "DL新規"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">間接照明</label>
              <div className="flex flex-wrap gap-2">
                {["コーブ照明", "コーニス照明"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setYoshitsuLightIndirect(yoshitsuLightIndirect === v ? "" : v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      yoshitsuLightIndirect === v
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              {yoshitsuLightIndirect && (
                <div className="border border-dashed border-input rounded-lg p-4 text-center mt-2">
                  <img src={yoshitsuLightIndirect === "コーニス照明" ? "/images/dl照明/cornice.jpg" : "/images/dl照明/cove.jpg"} alt={`${yoshitsuLightIndirect}写真`} className="max-h-40 mx-auto rounded" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== 洋室 建具 ===== */}
        {isYoshitsuTategu && selectedOption === "change" && (
          <div className="space-y-4">
            {/* 仕様選択を一番上に表示（交換選択後） */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">仕様選択</label>
              <div className="flex flex-wrap gap-2">
                {["片開き", "片引き", "2枚引き違い戸", "2枚片引き", "3枚引き違い戸", "3枚片引き"].map((spec) => (
                  <SpecImageButton
                    key={spec}
                    label={spec}
                    image={TATEGU_SPEC_IMAGES[spec]}
                    active={yoshitsuTateguSpec === spec}
                    onClick={() => setYoshitsuTateguSpec(yoshitsuTateguSpec === spec ? "" : spec)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      yoshitsuTateguSpec === spec
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  />
                ))}
              </div>
            </div>
            {yoshitsuTateguSpec && (
              <TateguDetail
                spec={yoshitsuTateguSpec}
                dansa={yoshitsuTateguDansa} setDansa={setYoshitsuTateguDansa}
                dansaKubun={yoshitsuTateguDansaKubun} setDansaKubun={setYoshitsuTateguDansaKubun}
                dansaCustomMm={yoshitsuTateguDansaCustomMm} setDansaCustomMm={setYoshitsuTateguDansaCustomMm}
                katabiraki_w={yoshitsuKatabiraki_w} setKatabiraki_w={setYoshitsuKatabiraki_w}
                katabiraki_h={yoshitsuKatabiraki_h} setKatabiraki_h={setYoshitsuKatabiraki_h}
                katabiraki_mikomi={yoshitsuKatabiraki_mikomi} setKatabiraki_mikomi={setYoshitsuKatabiraki_mikomi}
                katabiraki_tsurimoto={yoshitsuKatabiraki_tsurimoto} setKatabiraki_tsurimoto={setYoshitsuKatabiraki_tsurimoto}
                katabiraki_todomatari={yoshitsuKatabiraki_todomatari} setKatabiraki_todomatari={setYoshitsuKatabiraki_todomatari}
                katabiraki_w_custom={yoshitsuKatabiraki_w_custom} setKatabiraki_w_custom={setYoshitsuKatabiraki_w_custom}
                katabiraki_h_custom={yoshitsuKatabiraki_h_custom} setKatabiraki_h_custom={setYoshitsuKatabiraki_h_custom}
                katabiraki_photo={yoshitsuKatabiraki_photo} setKatabiraki_photo={setYoshitsuKatabiraki_photo}
                katabiraki_tsurimoto_photo={yoshitsuKatabiraki_tsurimoto_photo} setKatabiraki_tsurimoto_photo={setYoshitsuKatabiraki_tsurimoto_photo}
                katabiraki_todomatari_photo={yoshitsuKatabiraki_todomatari_photo} setKatabiraki_todomatari_photo={setYoshitsuKatabiraki_todomatari_photo}
                katahiki_method={yoshitsuKatahiki_method} setKatahiki_method={setYoshitsuKatahiki_method}
                katahiki_w={yoshitsuKatahiki_w} setKatahiki_w={setYoshitsuKatahiki_w}
                katahiki_h={yoshitsuKatahiki_h} setKatahiki_h={setYoshitsuKatahiki_h}
                katahiki_mikomi={yoshitsuKatahiki_mikomi} setKatahiki_mikomi={setYoshitsuKatahiki_mikomi}
                katahiki_hikite={yoshitsuKatahiki_hikite} setKatahiki_hikite={setYoshitsuKatahiki_hikite}
                katahiki_w_custom={yoshitsuKatahiki_w_custom} setKatahiki_w_custom={setYoshitsuKatahiki_w_custom}
                katahiki_h_custom={yoshitsuKatahiki_h_custom} setKatahiki_h_custom={setYoshitsuKatahiki_h_custom}
                katahiki_method_photo={yoshitsuKatahiki_method_photo} setKatahiki_method_photo={setYoshitsuKatahiki_method_photo}
                katahiki_hikite_photo={yoshitsuKatahiki_hikite_photo} setKatahiki_hikite_photo={setYoshitsuKatahiki_hikite_photo}
                nimai_hiki_method={yoshitsuNimaiHikichigai_method} setNimai_hiki_method={setYoshitsuNimaiHikichigai_method}
                nimai_hiki_w={yoshitsuNimaiHikichigai_w} setNimai_hiki_w={setYoshitsuNimaiHikichigai_w}
                nimai_hiki_h={yoshitsuNimaiHikichigai_h} setNimai_hiki_h={setYoshitsuNimaiHikichigai_h}
                nimai_hiki_mikomi={yoshitsuNimaiHikichigai_mikomi} setNimai_hiki_mikomi={setYoshitsuNimaiHikichigai_mikomi}
                nimai_hiki_hikite={yoshitsuNimaiHikichigai_hikite} setNimai_hiki_hikite={setYoshitsuNimaiHikichigai_hikite}
                nimai_hiki_w_custom={yoshitsuNimaiHikichigai_w_custom} setNimai_hiki_w_custom={setYoshitsuNimaiHikichigai_w_custom}
                nimai_hiki_h_custom={yoshitsuNimaiHikichigai_h_custom} setNimai_hiki_h_custom={setYoshitsuNimaiHikichigai_h_custom}
                nimai_hiki_method_photo={yoshitsuNimaiHikichigai_method_photo} setNimai_hiki_method_photo={setYoshitsuNimaiHikichigai_method_photo}
                nimai_hiki_hikite_photo={yoshitsuNimaiHikichigai_hikite_photo} setNimai_hiki_hikite_photo={setYoshitsuNimaiHikichigai_hikite_photo}
                sanmai_hiki_method={yoshitsuSanmaiHikichigai_method} setSanmai_hiki_method={setYoshitsuSanmaiHikichigai_method}
                sanmai_hiki_w={yoshitsuSanmaiHikichigai_w} setSanmai_hiki_w={setYoshitsuSanmaiHikichigai_w}
                sanmai_hiki_h={yoshitsuSanmaiHikichigai_h} setSanmai_hiki_h={setYoshitsuSanmaiHikichigai_h}
                sanmai_hiki_hikite={yoshitsuSanmaiHikichigai_hikite} setSanmai_hiki_hikite={setYoshitsuSanmaiHikichigai_hikite}
                sanmai_hiki_w_custom={yoshitsuSanmaiHikichigai_w_custom} setSanmai_hiki_w_custom={setYoshitsuSanmaiHikichigai_w_custom}
                sanmai_hiki_h_custom={yoshitsuSanmaiHikichigai_h_custom} setSanmai_hiki_h_custom={setYoshitsuSanmaiHikichigai_h_custom}
                sanmai_hiki_method_photo={yoshitsuSanmaiHikichigai_method_photo} setSanmai_hiki_method_photo={setYoshitsuSanmaiHikichigai_method_photo}
                sanmai_hiki_hikite_photo={yoshitsuSanmaiHikichigai_hikite_photo} setSanmai_hiki_hikite_photo={setYoshitsuSanmaiHikichigai_hikite_photo}
                sanmai_kata_method={yoshitsuSanmaiKatahiki_method} setSanmai_kata_method={setYoshitsuSanmaiKatahiki_method}
                sanmai_kata_w={yoshitsuSanmaiKatahiki_w} setSanmai_kata_w={setYoshitsuSanmaiKatahiki_w}
                sanmai_kata_h={yoshitsuSanmaiKatahiki_h} setSanmai_kata_h={setYoshitsuSanmaiKatahiki_h}
                sanmai_kata_mikomi={yoshitsuSanmaiKatahiki_mikomi} setSanmai_kata_mikomi={setYoshitsuSanmaiKatahiki_mikomi}
                sanmai_kata_hikite={yoshitsuSanmaiKatahiki_hikite} setSanmai_kata_hikite={setYoshitsuSanmaiKatahiki_hikite}
                sanmai_kata_w_custom={yoshitsuSanmaiKatahiki_w_custom} setSanmai_kata_w_custom={setYoshitsuSanmaiKatahiki_w_custom}
                sanmai_kata_h_custom={yoshitsuSanmaiKatahiki_h_custom} setSanmai_kata_h_custom={setYoshitsuSanmaiKatahiki_h_custom}
                sanmai_kata_method_photo={yoshitsuSanmaiKatahiki_method_photo} setSanmai_kata_method_photo={setYoshitsuSanmaiKatahiki_method_photo}
                sanmai_kata_hikite_photo={yoshitsuSanmaiKatahiki_hikite_photo} setSanmai_kata_hikite_photo={setYoshitsuSanmaiKatahiki_hikite_photo}
                nimai_kata_photo={yoshitsuNimaiKatahiki_photo} setNimai_kata_photo={setYoshitsuNimaiKatahiki_photo}
                nimai_kata_w={yoshitsuNimaiKatahiki_w} setNimai_kata_w={setYoshitsuNimaiKatahiki_w}
                nimai_kata_h={yoshitsuNimaiKatahiki_h} setNimai_kata_h={setYoshitsuNimaiKatahiki_h}
                nimai_kata_w_custom={yoshitsuNimaiKatahiki_w_custom} setNimai_kata_w_custom={setYoshitsuNimaiKatahiki_w_custom}
                nimai_kata_h_custom={yoshitsuNimaiKatahiki_h_custom} setNimai_kata_h_custom={setYoshitsuNimaiKatahiki_h_custom}
                nimai_kata_hikite={yoshitsuNimaiKatahiki_hikite} setNimai_kata_hikite={setYoshitsuNimaiKatahiki_hikite}
                nimai_kata_hikite_photo={yoshitsuNimaiKatahiki_hikite_photo} setNimai_kata_hikite_photo={setYoshitsuNimaiKatahiki_hikite_photo}
              />
            )}
          </div>
        )}
        {/* 洋室建具：既存残しの場合は入口段差のみ表示 */}
        {isYoshitsuTategu && selectedOption === "keep" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">入口段差</label>
              <div className="flex flex-wrap gap-2">
                {[{ value: "yes", label: "あり" }, { value: "no", label: "なし" }].map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setYoshitsuTateguDansa(yoshitsuTateguDansa === o.value ? "" : o.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      yoshitsuTateguDansa === o.value
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {yoshitsuTateguDansa === "yes" && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {["1〜10", "11〜50", "51〜100", "100以上", "手入力"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setYoshitsuTateguDansaKubun(yoshitsuTateguDansaKubun === v ? "" : v)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        yoshitsuTateguDansaKubun === v
                          ? "bg-primary text-primary-foreground"
                          : "border border-input text-foreground hover:bg-accent"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                  {yoshitsuTateguDansaKubun === "手入力" && (
                    <input
                      type="number"
                      min="0"
                      value={yoshitsuTateguDansaCustomMm ?? ""}
                      onChange={(e) => setYoshitsuTateguDansaCustomMm(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="mm"
                      className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {showHabakiWoodPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">木巾木写真</label>
            <div className="border border-dashed border-input rounded-lg p-4 text-center">
              <img src="/images/巾木/mokuhabaki.png" alt="木巾木写真" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}
        {showHabakiSoftPhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">ソフト巾木写真</label>
            <div className="border border-dashed border-input rounded-lg p-4 text-center">
              <img src="/images/巾木/sohutohabaki.png" alt="ソフト巾木写真" className="max-h-40 mx-auto rounded" />
            </div>
          </div>
        )}

        {showCrossCalculator && (
          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">総平米数（㎡）</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={crossTotalArea ?? ""}
                  onChange={(e) => setCrossTotalArea(e.target.value === "" ? undefined : Number(e.target.value))}
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">天井高（m）</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="2.5"
                  value={crossCeilingHeight ?? ""}
                  onChange={(e) => setCrossCeilingHeight(e.target.value === "" ? undefined : Number(e.target.value))}
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">施工範囲</label>
              <div className="flex flex-wrap gap-2">
                {CROSS_SCOPES.map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => setCrossScope(scope)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      crossScope === scope
                        ? "bg-primary text-primary-foreground"
                        : "border border-input text-foreground hover:bg-accent"
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">計算対象部屋</label>
              <div className="grid grid-cols-2 gap-2">
                {crossTargetRooms.map((targetRoom) => {
                  const checked = crossSelectedRoomKeys.includes(targetRoom.key);
                  return (
                    <button
                      key={targetRoom.key}
                      type="button"
                      onClick={() =>
                        setCrossSelectedRoomKeys((prev) =>
                          prev.includes(targetRoom.key)
                            ? prev.filter((key) => key !== targetRoom.key)
                            : [...prev, targetRoom.key]
                        )
                      }
                      className={`text-left px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        checked
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input text-foreground hover:bg-accent"
                      }`}
                    >
                      <span className="mr-2">{checked ? "☑" : "☐"}</span>
                      {targetRoom.label}
                    </button>
                  );
                })}
              </div>
              {crossCalculation.hasNoSelectedRooms && (
                <p className="text-sm text-destructive">計算対象部屋がすべてOFFです。クロス貼替する部屋を選択してください。</p>
              )}
            </div>

            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">概算m数</p>
              <p className="text-lg font-bold text-foreground">{crossCalculation.roundedMeters}m</p>
            </div>

            {crossQtyOverridden && (
              <button
                type="button"
                onClick={() => {
                  setQty(crossCalculation.roundedMeters);
                  setCrossQtyOverridden(false);
                  setCrossManualQty(undefined);
                }}
                className="w-full py-2.5 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-accent transition-colors"
              >
                再計算値を反映
              </button>
            )}

            <p className="text-xs text-muted-foreground">現地採寸前の概算数量です</p>
          </div>
        )}

        {false && showRosettePhoto && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">ローゼット写真</label>
            <div className="border border-dashed border-input rounded-lg p-4 text-center space-y-3">
              {rosettePhoto ? (
                <img src={rosettePhoto} alt="ローゼット写真" className="max-h-40 mx-auto rounded" />
              ) : (
                <p className="text-xs text-muted-foreground">ローゼット写真を挿入するエリア</p>
              )}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className={`grid gap-4 ${showConcentSwitchType ? "grid-cols-1" : "grid-cols-2"}`}>
          {!showConcentSwitchType && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">数量</label>
              <input
                type="number"
                min="0"
                step="1"
                value={qty === 0 ? "" : qty}
                onChange={(e) => {
                  const nextQty = parseIntegerQuantity(e.target.value);
                  setQty(nextQty);
                  if (isZentaiCross) {
                    setCrossQtyOverridden(true);
                    setCrossManualQty(nextQty);
                  }
                }}
                onFocus={(e) => { if (qty === 0) e.currentTarget.select(); }}
                onBlur={(e) => { setQty(parseIntegerQuantity(e.target.value)); }}
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">単位</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
        </div>
        </div>
        
        {/* Unit Price */}
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">{isGenkanDoma ? "土間単価" : "単価"}</label>
          <input
            type="number"
            min="0"
            value={unitPrice === 0 ? "" : unitPrice}
            onChange={(e) => setUnitPrice(e.target.value === "" ? 0 : Number(e.target.value))}
            onFocus={(e) => { if (unitPrice === 0) e.target.value = ""; }}
            onBlur={(e) => { if (e.target.value === "") setUnitPrice(0); }}
            className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* 巾木（土間の中に配置） */}
        {isGenkanDoma && (
          <>
            {/* 巾木写真（木巾木） */}
            {showHabakiWoodPhoto && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">木巾木写真</label>
                <div className="border border-input rounded-lg p-4 text-center">
                  <img src="/images/巾木/mokuhabaki.png" alt="木巾木" className="max-h-40 mx-auto rounded" />
                </div>
              </div>
            )}
            {/* 巾木写真（ソフト巾木） */}
            {showHabakiSoftPhoto && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">ソフト巾木写真</label>
                <div className="border border-input rounded-lg p-4 text-center">
                  <img src="/images/巾木/sohutohabaki.png" alt="ソフト巾木" className="max-h-40 mx-auto rounded" />
                </div>
              </div>
            )}
            {/* 巾木単価 */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">巾木単価</label>
              <input
                type="number"
                min="0"
                value={habakiUnitPrice === 0 ? "" : habakiUnitPrice}
                onChange={(e) => setHabakiUnitPrice(e.target.value === "" ? 0 : Number(e.target.value))}
                onFocus={(e) => { if (habakiUnitPrice === 0) e.target.value = ""; }}
                onBlur={(e) => { if (e.target.value === "") setHabakiUnitPrice(0); }}
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </>
        )}

        {/* Subtotal */}
        {!hideStorageInsidePrice && (
        <div className="rounded-lg bg-muted p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">小計（数量 x 単価）</span>
            <span className="text-lg font-bold text-foreground">{"\u00A5"}{lineSubtotal.toLocaleString()}</span>
          </div>
        </div>
        )}

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">備考</label>
          <textarea
            value={itemNote}
            onChange={(e) => setItemNote(e.target.value)}
            placeholder="※備考"
            rows={3}
            className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-accent transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
