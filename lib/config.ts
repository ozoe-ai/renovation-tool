import { RoomTypeDef, WorkItemDef, RoomCountSettings, RoomInstance } from "./types";

const keepChange = [
  { value: "keep", label: "既存残し" },
  { value: "change", label: "交換" },
];

const floorOptions = [
  { value: "keep", label: "既存残し" },
  { value: "flooring", label: "フローリング貼替" },
  { value: "ft", label: "フロアタイル上貼" },
  { value: "cf", label: "CF上貼" },
];

const habakiOptions = [
  { value: "keep", label: "既存残し" },
  { value: "wood", label: "木巾木" },
  { value: "soft", label: "ソフト巾木" },
];

const lightOptions = [
  { value: "keep", label: "既存残し" },
  { value: "rosette", label: "ローゼット交換" },
  { value: "dl_change", label: "DL交換" },
  { value: "dl_new", label: "DL新規" },
];

const storageInsideOptions = [
  { value: "kadodana", label: "可動棚" },
  { value: "makuradana", label: "枕棚" },
  { value: "makuradana_hp", label: "枕棚+HP" },
  { value: "chudan", label: "中段" },
];

const ZENTAI_ITEMS: WorkItemDef[] = [
  { id: "zentai_cross", roomType: "ZENTAI", title: "クロス貼替", options: [{ value: "yes", label: "貼替有" }, { value: "no", label: "貼替無" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "zentai_concent", roomType: "ZENTAI", title: "コンセント・スイッチプレート", options: keepChange, defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "zentai_kyutouki", roomType: "ZENTAI", title: "給湯器", options: keepChange, defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "zentai_gas", roomType: "ZENTAI", title: "ガスコンセント", options: [...keepChange, { value: "remove", label: "撤去" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "zentai_hanbantai", roomType: "ZENTAI", title: "分電盤", options: keepChange, defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
];

const GENKAN_ITEMS: WorkItemDef[] = [
  { id: "genkan_door", roomType: "GENKAN", title: "玄関扉", options: [{ value: "keep", label: "既存残し" }, { value: "sheet", label: "シート" }, { value: "paint", label: "塗装" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "genkan_frame", roomType: "GENKAN", title: "玄関枠", options: [{ value: "keep", label: "既存残し" }, { value: "sheet", label: "シート" }, { value: "paint", label: "塗装" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "genkan_guard", roomType: "GENKAN", title: "ドアガード", options: keepChange, defaultUnit: "箇所", defaultQty: 1, defaultUnitPrice: 6000 },
  { id: "genkan_closer", roomType: "GENKAN", title: "ドアクローザー", options: keepChange, defaultUnit: "箇所", defaultQty: 1, defaultUnitPrice: 8000 },
  { id: "genkan_stopper", roomType: "GENKAN", title: "ドアストッパー", options: keepChange, defaultUnit: "箇所", defaultQty: 1, defaultUnitPrice: 3000 },
  { id: "genkan_doma", roomType: "GENKAN", title: "土間", options: [{ value: "keep", label: "既存残し" }, { value: "tile", label: "タイル貼替" }, { value: "ft", label: "フロアタイル上貼" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 5000 },
  { id: "genkan_storage", roomType: "GENKAN", title: "玄関収納", options: keepChange, defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 30000 },
  { id: "genkan_light", roomType: "GENKAN", title: "玄関照明", options: [{ value: "keep", label: "既存残し" }, { value: "dl_change", label: "DL交換" }, { value: "bracket_change", label: "ブラケットライト交換" }, { value: "dl_bracket_change", label: "DL交換+ブラケットライト交換" }], defaultUnit: "箇所", defaultQty: 1, defaultUnitPrice: 5000 },
  { id: "genkan_kamachi", roomType: "GENKAN", title: "框", options: [{ value: "keep", label: "既存残し" }, { value: "lkamachi", label: "L型框" }, { value: "usuita", label: "ウスイータ" }, { value: "tile", label: "タイル" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 800 },
  { id: "genkan_habaki", roomType: "GENKAN", title: "巾木", options: habakiOptions, defaultUnit: "m", defaultQty: 5, defaultUnitPrice: 800 },
];

const ROUKA_ITEMS: WorkItemDef[] = [
  { id: "rouka_floor", roomType: "ROUKA", title: "床", options: floorOptions, defaultUnit: "㎡", defaultQty: 8, defaultUnitPrice: 4000 },
  { id: "rouka_habaki", roomType: "ROUKA", title: "巾木", options: habakiOptions, defaultUnit: "m", defaultQty: 8, defaultUnitPrice: 800 },
  { id: "rouka_light", roomType: "ROUKA", title: "照明", options: [{ value: "keep", label: "既存残し" }, { value: "dl_change", label: "DL交換" }, { value: "bracket_change", label: "ブラケットライト交換" }, { value: "dl_bracket_change", label: "DL交換+ブラケットライト交換" }], defaultUnit: "箇所", defaultQty: 1, defaultUnitPrice: 5000 },
  { id: "rouka_storage", roomType: "ROUKA", title: "収納", options: [{ value: "keep", label: "既存残し" }, { value: "oredo", label: "折れ戸" }, { value: "ryobiraki", label: "両開き" }], defaultUnit: "台", defaultQty: 1, defaultUnitPrice: 30000 },
  { id: "rouka_storage_inside", roomType: "ROUKA", title: "収納内部", options: storageInsideOptions, defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 10000 },
];

const YOSHITSU_ITEMS: WorkItemDef[] = [
  { id: "yoshitsu_floor", roomType: "YOSHITSU", title: "床", options: floorOptions, defaultUnit: "㎡", defaultQty: 10, defaultUnitPrice: 4000 },
  { id: "yoshitsu_madowaku", roomType: "YOSHITSU", title: "窓枠", options: [{ value: "keep", label: "既存残し" }, { value: "paint", label: "塗装" }, { value: "sheet", label: "シート" }, { value: "change", label: "交換" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 5000 },
  { id: "yoshitsu_habaki", roomType: "YOSHITSU", title: "巾木", options: habakiOptions, defaultUnit: "m", defaultQty: 12, defaultUnitPrice: 800 },
  { id: "yoshitsu_tategu", roomType: "YOSHITSU", title: "建具", options: keepChange, defaultUnit: "枚", defaultQty: 1, defaultUnitPrice: 25000 },
  { id: "yoshitsu_light", roomType: "YOSHITSU", title: "照明", options: lightOptions, defaultUnit: "箇所", defaultQty: 1, defaultUnitPrice: 5000 },
  { id: "yoshitsu_storage", roomType: "YOSHITSU", title: "収納", options: keepChange, defaultUnit: "台", defaultQty: 1, defaultUnitPrice: 30000 },
  { id: "yoshitsu_storage_inside", roomType: "YOSHITSU", title: "収納内部", options: storageInsideOptions, defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 10000 },
  { id: "yoshitsu_curtainrail", roomType: "YOSHITSU", title: "カーテンレール", options: keepChange, defaultUnit: "本", defaultQty: 1, defaultUnitPrice: 3000 },
  { id: "yoshitsu_amido", roomType: "YOSHITSU", title: "網戸", options: keepChange, defaultUnit: "枚", defaultQty: 1, defaultUnitPrice: 5000 },
  { id: "yoshitsu_cooler", roomType: "YOSHITSU", title: "クーラースリーブ", options: keepChange, defaultUnit: "箇所", defaultQty: 1, defaultUnitPrice: 10000 },
];

const WASHITSU_ITEMS: WorkItemDef[] = [
  { id: "washitsu_tatami", roomType: "WASHITSU", title: "畳", options: [{ value: "keep", label: "既存残し" }, { value: "omote", label: "表替え" }, { value: "shincho", label: "新調" }], defaultUnit: "枚", defaultQty: 6, defaultUnitPrice: 8000 },
  { id: "washitsu_fusuma", roomType: "WASHITSU", title: "襖", options: [{ value: "keep", label: "既存残し" }, { value: "harikae_fusuma", label: "襖貼替" }, { value: "harikae_cross", label: "クロス貼替" }], defaultUnit: "枚", defaultQty: 4, defaultUnitPrice: 6000 },
  { id: "washitsu_shoji", roomType: "WASHITSU", title: "障子", options: [{ value: "keep", label: "既存残し" }, { value: "harikae", label: "障子貼替" }], defaultUnit: "枚", defaultQty: 2, defaultUnitPrice: 5000 },
  { id: "washitsu_nageshi", roomType: "WASHITSU", title: "長押", options: [{ value: "keep", label: "既存残し" }, { value: "change", label: "交換" }, { value: "kaitai", label: "解体" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 10000 },
  { id: "washitsu_switch", roomType: "WASHITSU", title: "照明スイッチ", options: [{ value: "yes", label: "既存：あり" }, { value: "no", label: "既存：なし" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "washitsu_ceiling", roomType: "WASHITSU", title: "天井", options: [{ value: "keep", label: "既存残し" }, { value: "cross", label: "クロス貼替" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "washitsu_mawabuchi", roomType: "WASHITSU", title: "廻り縁", options: [{ value: "keep", label: "既存残し" }, { value: "tetsuraku", label: "撤去" }, { value: "koukan", label: "交換" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 5000 },
  { id: "washitsu_light", roomType: "WASHITSU", title: "照明", options: lightOptions, defaultUnit: "箇所", defaultQty: 1, defaultUnitPrice: 5000 },
];

const LD_ITEMS: WorkItemDef[] = [
  { id: "ld_floor", roomType: "LD", title: "床", options: floorOptions, defaultUnit: "㎡", defaultQty: 15, defaultUnitPrice: 4000 },
  { id: "ld_habaki", roomType: "LD", title: "巾木", options: habakiOptions, defaultUnit: "m", defaultQty: 15, defaultUnitPrice: 800 },
  { id: "ld_tategu", roomType: "LD", title: "建具", options: keepChange, defaultUnit: "枚", defaultQty: 1, defaultUnitPrice: 25000 },
  { id: "ld_light", roomType: "LD", title: "照明", options: lightOptions, defaultUnit: "箇所", defaultQty: 1, defaultUnitPrice: 5000 },
  { id: "ld_storage", roomType: "LD", title: "収納", options: keepChange, defaultUnit: "台", defaultQty: 1, defaultUnitPrice: 30000 },
  { id: "ld_storage_inside", roomType: "LD", title: "収納内部", options: storageInsideOptions, defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 10000 },
  { id: "ld_madowaku", roomType: "LD", title: "窓枠", options: [{ value: "keep", label: "既存残し" }, { value: "paint", label: "塗装" }, { value: "sheet", label: "シート" }, { value: "change", label: "交換" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 5000 },
  { id: "ld_curtainrail", roomType: "LD", title: "カーテンレール", options: keepChange, defaultUnit: "本", defaultQty: 1, defaultUnitPrice: 3000 },
  { id: "ld_amido", roomType: "LD", title: "網戸", options: keepChange, defaultUnit: "枚", defaultQty: 1, defaultUnitPrice: 5000 },
  { id: "ld_cooler", roomType: "LD", title: "クーラースリーブ", options: keepChange, defaultUnit: "箇所", defaultQty: 1, defaultUnitPrice: 10000 },
];

const KAIDAN_ITEMS: WorkItemDef[] = [
  { id: "kaidan_body", roomType: "KAIDAN", title: "階段", options: [{ value: "keep", label: "既存残し" }, { value: "uwabari", label: "上貼（踏面フロアタイル・段鼻＋蹴込シート）" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "kaidan_sideboard", roomType: "KAIDAN", title: "側板", options: [{ value: "keep", label: "既存残し" }, { value: "sheet", label: "シート" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "kaidan_nonslip", roomType: "KAIDAN", title: "ノンスリップ", options: [{ value: "yes", label: "取付あり" }, { value: "no", label: "なし" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "kaidan_tesuri", roomType: "KAIDAN", title: "手摺", options: keepChange, defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "kaidan_kasagi", roomType: "KAIDAN", title: "笠木", options: [{ value: "keep", label: "既存残し" }, { value: "change", label: "交換" }, { value: "sheet", label: "シート" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "kaidan_habaki", roomType: "KAIDAN", title: "巾木", options: habakiOptions, defaultUnit: "m", defaultQty: 8, defaultUnitPrice: 800 },
  { id: "kaidan_light", roomType: "KAIDAN", title: "照明", options: lightOptions, defaultUnit: "箇所", defaultQty: 1, defaultUnitPrice: 5000 },
];

const WASHITSU_YOSHITSU_ITEMS: WorkItemDef[] = [
  ...YOSHITSU_ITEMS.map((item) => ({ ...item, roomType: "WASHITSU_YOSHITSU" })),
];

const KITCHEN_ITEMS: WorkItemDef[] = [
  { id: "kitchen_body", roomType: "KITCHEN", title: "キッチン本体", options: [{ value: "keep", label: "既存残し" }, { value: "change", label: "交換" }, { value: "meister", label: "マイスターコーティング" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 350000 },
  { id: "kitchen_light", roomType: "KITCHEN", title: "照明", options: lightOptions, defaultUnit: "箇所", defaultQty: 1, defaultUnitPrice: 5000 },
  { id: "kitchen_storage", roomType: "KITCHEN", title: "収納", options: keepChange, defaultUnit: "台", defaultQty: 1, defaultUnitPrice: 30000 },
  { id: "kitchen_storage_inside", roomType: "KITCHEN", title: "収納内部", options: storageInsideOptions, defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 10000 },
];

const UB_ITEMS: WorkItemDef[] = [
  { id: "ub_body", roomType: "UB", title: "UB本体", options: [{ value: "keep", label: "既存残し" }, { value: "change", label: "交換" }, { value: "meister", label: "マイスターコーティング" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 500000 },
  { id: "ub_kizonsetsubi", roomType: "UB", title: "換気扇", options: [{ value: "keep", label: "既存残し" }, { value: "change", label: "交換" }, { value: "meister", label: "マイスターコーティング" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "ub_hotwater", roomType: "UB", title: "給湯方法", options: [{ value: "select", label: "選択" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
];

const SENMEN_ITEMS: WorkItemDef[] = [
  { id: "senmen_body", roomType: "SENMEN", title: "洗面本体", options: [{ value: "keep", label: "既存残し" }, { value: "change", label: "交換" }, { value: "meister", label: "マイスターコーティング" }], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 80000 },
  { id: "senmen_height", roomType: "SENMEN", title: "洗面取付高さ", options: [], defaultUnit: "mm", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "senmen_floor", roomType: "SENMEN", title: "床", options: floorOptions, defaultUnit: "㎡", defaultQty: 3, defaultUnitPrice: 4000 },
  { id: "senmen_habaki", roomType: "SENMEN", title: "巾木", options: habakiOptions, defaultUnit: "m", defaultQty: 6, defaultUnitPrice: 800 },
  { id: "senmen_iriguchi", roomType: "SENMEN", title: "建具", options: keepChange, defaultUnit: "枚", defaultQty: 1, defaultUnitPrice: 25000 },
  { id: "senmen_light", roomType: "SENMEN", title: "照明", options: lightOptions, defaultUnit: "箇所", defaultQty: 1, defaultUnitPrice: 5000 },
  { id: "senmen_washing_pan", roomType: "SENMEN", title: "洗濯パン", options: keepChange, defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "senmen_washing_faucet", roomType: "SENMEN", title: "洗濯水栓", options: keepChange, defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
];

const TOILET_ITEMS: WorkItemDef[] = [
  { id: "toilet_body", roomType: "TOILET", title: "トイレ本体", options: keepChange, defaultUnit: "台", defaultQty: 1, defaultUnitPrice: 60000 },
  { id: "toilet_floor", roomType: "TOILET", title: "床", options: floorOptions, defaultUnit: "㎡", defaultQty: 2, defaultUnitPrice: 4000 },
  { id: "toilet_habaki", roomType: "TOILET", title: "巾木", options: habakiOptions, defaultUnit: "m", defaultQty: 4, defaultUnitPrice: 800 },
  { id: "toilet_iriguchi", roomType: "TOILET", title: "建具", options: keepChange, defaultUnit: "枚", defaultQty: 1, defaultUnitPrice: 25000 },
  { id: "toilet_light", roomType: "TOILET", title: "照明", options: lightOptions, defaultUnit: "箇所", defaultQty: 1, defaultUnitPrice: 5000 },
  { id: "toilet_storage", roomType: "TOILET", title: "収納内部", options: [], defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "toilet_paper_holder", roomType: "TOILET", title: "紙巻き器", options: keepChange, defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
  { id: "toilet_towel_ring", roomType: "TOILET", title: "タオルリング", options: keepChange, defaultUnit: "式", defaultQty: 1, defaultUnitPrice: 0 },
];

export const ROOM_TYPES: RoomTypeDef[] = [
  { roomType: "ZENTAI", label: "全体項目（必須で入れる）", workItems: ZENTAI_ITEMS },
  { roomType: "GENKAN", label: "玄関", workItems: GENKAN_ITEMS },
  { roomType: "ROUKA", label: "廊下", workItems: ROUKA_ITEMS },
  { roomType: "YOSHITSU", label: "洋室", workItems: YOSHITSU_ITEMS },
  { roomType: "WASHITSU", label: "和室", workItems: WASHITSU_ITEMS },
  { roomType: "WASHITSU_YOSHITSU", label: "和室から洋室", workItems: WASHITSU_YOSHITSU_ITEMS },
  { roomType: "LD", label: "リビングダイニング", workItems: LD_ITEMS },
  { roomType: "KAIDAN", label: "階段", workItems: KAIDAN_ITEMS },
  { roomType: "KITCHEN", label: "キッチン", workItems: KITCHEN_ITEMS },
  { roomType: "UB", label: "ユニットバス", workItems: UB_ITEMS },
  { roomType: "SENMEN", label: "洗面室", workItems: SENMEN_ITEMS },
  { roomType: "TOILET", label: "トイレ", workItems: TOILET_ITEMS },
];

export const getRoomTypeDef = (roomType: string): RoomTypeDef | undefined =>
  ROOM_TYPES.find((room) => room.roomType === roomType);

export const getWorkItemsForRoom = (roomKey: string, roomType: string): WorkItemDef[] => {
  const def = getRoomTypeDef(roomType);
  if (!def) return [];
  return def.workItems
    .filter((item) => ["LD", "YOSHITSU", "WASHITSU_YOSHITSU"].includes(roomType) || (!item.id.includes("curtainrail") && !item.id.includes("madowaku")))
    .map((item) => ({ ...item, id: `${roomKey}_${item.id}` }));
};

export function generateStairLabels(numStairs: number): string[] {
  return Array.from({ length: numStairs }, (_, index) => `${index + 1}階-${index + 2}階`);
}

export function generateRooms(settings: RoomCountSettings): RoomInstance[] {
  const rooms: RoomInstance[] = [];
  rooms.push({ roomKey: "ZENTAI", roomType: "ZENTAI", label: "全体項目（必須で入れる）" });

  for (let i = 1; i <= settings.numGenkan; i++) {
    rooms.push({ roomKey: settings.numGenkan === 1 ? "GENKAN" : `GENKAN_${i}`, roomType: "GENKAN", label: settings.numGenkan === 1 ? "玄関" : `玄関${i}` });
  }
  for (let i = 1; i <= settings.numHallways; i++) {
    rooms.push({ roomKey: settings.numHallways === 1 ? "ROUKA" : `ROUKA_${i}`, roomType: "ROUKA", label: settings.numHallways === 1 ? "廊下" : `廊下${i}` });
  }

  if (settings.kitchenType === "LDK") {
    rooms.push({ roomKey: "LD", roomType: "LD", label: "LDK" });
    rooms.push({ roomKey: "KITCHEN", roomType: "KITCHEN", label: "キッチン" });
  } else if (settings.kitchenType === "DK") {
    rooms.push({ roomKey: "LD", roomType: "LD", label: "DK" });
    rooms.push({ roomKey: "KITCHEN", roomType: "KITCHEN", label: "キッチン" });
  } else {
    rooms.push({ roomKey: "KITCHEN", roomType: "KITCHEN", label: "キッチン" });
  }

  for (let i = 1; i <= settings.numYoshitsu; i++) {
    rooms.push({ roomKey: `YOSHITSU_${i}`, roomType: "YOSHITSU", label: settings.numYoshitsu === 1 ? "洋室" : `洋室${i}` });
  }
  for (let i = 1; i <= settings.numWashitsu; i++) {
    rooms.push({ roomKey: `WASHITSU_${i}`, roomType: "WASHITSU", label: settings.numWashitsu === 1 ? "和室" : `和室${i}` });
  }
  const numWY = settings.numWashitsuYoshitsu ?? 0;
  for (let i = 1; i <= numWY; i++) {
    rooms.push({ roomKey: numWY === 1 ? "WASHITSU_YOSHITSU" : `WASHITSU_YOSHITSU_${i}`, roomType: "WASHITSU_YOSHITSU", label: numWY === 1 ? "和室から洋室" : `和室から洋室${i}` });
  }
  for (let i = 1; i <= settings.numBath; i++) {
    rooms.push({ roomKey: `UB_${i}`, roomType: "UB", label: settings.numBath === 1 ? "ユニットバス" : `ユニットバス${i}` });
  }
  for (let i = 1; i <= settings.numWashroom; i++) {
    rooms.push({ roomKey: `SENMEN_${i}`, roomType: "SENMEN", label: settings.numWashroom === 1 ? "洗面室" : `洗面室${i}` });
  }
  for (let i = 1; i <= settings.numToilet; i++) {
    rooms.push({ roomKey: `TOILET_${i}`, roomType: "TOILET", label: settings.numToilet === 1 ? "トイレ" : `トイレ${i}` });
  }
  for (let i = 1; i <= settings.numStairs; i++) {
    rooms.push({ roomKey: settings.numStairs === 1 ? "KAIDAN" : `KAIDAN_${i}`, roomType: "KAIDAN", label: settings.numStairs === 1 ? "階段" : `階段${i}` });
  }
  return rooms;
}
