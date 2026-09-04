// ========== Work Item Master Data Types ==========

/** A selectable option for a work item (e.g. "シート", "塗装") */
export interface WorkOption {
  value: string;
  label: string;
}

/** Master definition for a single work item (e.g. 玄関扉, 床) */
export interface WorkItemDef {
  id: string;
  roomType: string; // e.g. "GENKAN", "ROUKA"
  title: string;
  options: WorkOption[];
  defaultUnit: string;
  defaultQty: number;
  defaultUnitPrice: number;
}

/** Room type definition (master) */
export interface RoomTypeDef {
  roomType: string; // e.g. "GENKAN"
  label: string; // e.g. "玄関"
  workItems: WorkItemDef[];
}

// ========== App State Types ==========

/** A selected/configured work item in user state */
export interface SelectedWorkItem {
  workItemId: string; // references WorkItemDef.id
  roomKey: string; // unique key like "GENKAN" or "YOSHITSU_1"
  roomLabel: string; // display name like "玄関" or "洋室1"
  title: string;
  selectedOption: string; // value from WorkOption
  selectedOptionLabel: string;
  qty: number;
  unit: string;
  unitPrice: number;
  lineSubtotal: number; // qty * unitPrice
  note?: string;
  selections?: Array<{ label: string; value: string }>;
  crossTotalArea?: number;
  crossCeilingHeight?: number;
  crossScope?: string;
  crossTargetRooms?: string;
  crossEstimatedSqm?: number;
  crossEstimatedMeters?: number;
  crossManualQty?: number;
  crossQtyOverridden?: boolean;
  // 複数インスタンス管理用フィールド
  instanceId?: string; // 一意なID（各インスタンスを識別）
  instanceNumber?: number; // 表示用番号（1, 2, 3...）
  baseWorkItemId?: string; // 元の工事項目ID（複製元を参照）
  count?: number; // 同一項目の選択数（0は未選択、1以上は選択済み）
  // 玄関収納用の追加フィールド
  storageWidth?: string; // W800, W1200, W1600
  storageDepth?: string; // D400, D350
  storageShape?: string; // コの字, 二の字, 下台のみ, トール
  storageMirror?: string; // 鏡有, 鏡無（コの字/トールの場合のみ）
  // 玄関収納形状別カスタム画像
  storageShapeKonojiImage?: string; // コの字カスタム画像
  storageShapeNinojiImage?: string; // 二の字カスタム画像
  storageShapeShitadaiImage?: string; // 下台のみカスタム画像
  storageShapeTallImage?: string; // トールカスタム画像
  // 玄関関連の写真用フィールド
  genkanDoorPhoto?: string; // 玄関扉写真
  genkanFramePhoto?: string; // 玄関枠写真
  genkanGuardPhoto?: string; // ドアガード写真
  genkanStopperPhoto?: string; // ドアストッパー写真
  genkanDomaPhoto?: string; // 土間写真
  storageMirrorKonojiPhoto?: string; // 玄関収納コの字鏡有写真
  storageMirrorTallPhoto?: string; // 玄関収納トール鏡有写真
  genkanLightDlPhoto?: string; // 玄関照明DL写真
  genkanLightBracketPhoto?: string; // 玄関照明ブラケットライト写真
  genkanLightColorDenkyu?: string; // 玄関照明電球色写真
  genkanLightColorChuhaku?: string; // 玄関照明昼白色写真
  genkanLightColorOnhaku?: string; // 玄関照明温白色写真
  genkanLightBodyBlack?: string; // 玄関照明本体ブラック写真
  genkanLightBodyWhite?: string; // 玄関照明本体ホワイト写真
  kamachiLPhoto?: string; // 框L型框写真
  kamachiUsuPhoto?: string; // 框ウスイータ写真
  kamachiTilePhoto?: string; // 框タイル写真
  kamachiSize?: string;
  habakiWoodPhoto?: string; // 巾木木巾木写真
  habakiSoftPhoto?: string; // 巾木ソフト巾木写真
  // 玄関照明用の追加フィールド（拡張）
  lightCount?: number; // 灯数 1-5
  lightColor?: string; // 電球色, 昼白色, 温白色
  lightDiameter?: number; // Φ（直径）: 60, 75, 100, 125, 150
  lightBodyColor?: string; // 本体色: ブラック, ホワイト
  // 廊下床用の追加フィールド
  roukaFloorCfPhoto?: string; // CF貼替写真
  roukaFloorFloortilePhoto?: string; // フロアタイル貼替写真
  roukaFloorFlooringPhoto?: string; // フローリング貼替写真
  // 廊下巾木用の追加フィールド
  roukaHabakiWoodPhoto?: string; // 木巾木写真
  roukaHabakiSoftPhoto?: string; // ソフト巾木写真
  // 廊下収納用の追加フィールド
  roukaStorageType?: string; // 折れ戸, 両開き
  roukaStorageOredoPhoto?: string; // 折れ戸写真
  roukaStorageRyobirakiPhoto?: string; // 両開き写真
  roukaStorageFrame?: string; // 四方枠, 直付け下レール三方枠, ノン下レール三方枠
  roukaStorageFramePhoto?: string;
  roukaStorageOredoW?: string; // 折れ戸W
  roukaStorageOredoH?: string; // 折れ戸H
  roukaStorageRyobirakiW?: string; // 両開きW
  roukaStorageRyobirakiH?: string; // 両開きH
  // 廊下収納内部用の追加フィールド
  roukaStorageInsideKadodanaPhoto?: string; // 可動棚写真
  roukaStorageInsideMakuradanaPhoto?: string; // 枕棚写真
  roukaStorageInsideHpPhoto?: string; // HP写真
  roukaStorageInsideChuudanPhoto?: string; // 中段写真
  roukaStorageInsideKadodanaFixMethod?: string; // 固定方法: 背面固定, 側面固定
  roukaStorageInsideKadodanaColor?: string; // 棚柱の色: ホワイト, シルバー
  roukaStorageInsideKadodanaW?: number; // 可動棚W（手入力）
  roukaStorageInsideKadodanaD?: string; // 可動棚D（選択式＋手入力）
  roukaStorageInsideKadodanaSteps?: number; // 可動棚段数（1-5）
  roukaStorageInsideMakuradanaW?: string; // 枕棚W
  roukaStorageInsideChuudanW?: string; // 中段W
  // 旧廊下収納フィールド（互換性維持）
  roukaStorageWidth?: string; // W800, W1200, W1600
  roukaStorageDepth?: string; // D400, D350
  roukaStorageSpec?: string; // 折れ戸, 片開き, 観音開き
  // 廊下収納内部用の追加フィールド
  storageInsideSteps?: number; // 段数（可動棚）
  storageInsideDepth?: number; // D（奥行、可動棚）
  storageInsideWidth?: number; // W（幅、枕棚）
  // キッチン本体用の追加フィールド
  kitchenBodyWidth?: number; // 寸法W（既存残しの場合は既存寸法W、交換の場合は寸法W）
  // 吊戸用の追加フィールド
  tsuritoHeight?: number; // 既存寸法H
  // 食洗機用の追加フィールド
  dishwasherExistK?: string; // 既存K: 有 / 無
  // ワークトップ用の追加フィールド
  worktopDrawerType?: string; // 開き / スライド
  // 洋室入口建具用の追加フィールド
  kitchenRelocation?: string;
  kitchenExisting?: string;
  kitchenShape?: string;
  kitchenDepth?: string;
  kitchenWidth?: string;
  kitchenHeating?: string;
  kitchenDrawer?: string;
  kitchenEndPanel?: string;
  kitchenLSize?: string;
  kitchenWallCabinet?: string;
  kitchenWallCabinetHeight?: string;
  kitchenDishwasherExisting?: string;
  kitchenDishwasherAfter?: string;
  kitchenWorktop?: string;
  kitchenSink?: string;
  kitchenSelectedMaker?: string;
  kitchenMakerPhotos?: Record<string, string>;
  yoshitsuIriguchiW?: string; // W: 800, 1200, 1600
  yoshitsuIriguchiD?: string; // D: 400, 350
  yoshitsuIriguchiSpec?: string; // 既存仕様 or 交換後仕様: 片開き, 片引き, 2枚引き違い, 2枚引き込み, 3枚引き違い
  // 洋室入口段差用の追加フィールド
  yoshitsuDansaMm?: number; // 段差mm
  // 洋室収納用の追加フィールド
  yoshitsuStorageW?: string; // W: 800, 1200, 1600
  yoshitsuStorageD?: string; // D: 400, 350
  yoshitsuStorageSpec?: string; // 仕様: 折れ戸, 片開き, 観音開き
  yoshitsuStorageKadodana?: string; // 可動棚: 背面固定, 側面固定（交換の場合のみ）
  yoshitsuStorageTanabashira?: string; // 棚柱: ホワイト, シルバー（交換の場合のみ）
  // 洋室収納内部用の追加フィールド
  yoshitsuStorageInsideSteps?: number; // 段数（可動棚）
  yoshitsuStorageInsideD?: number; // D（可動棚）
  yoshitsuStorageInsideW?: number; // W（枕棚）
  // 洋室網戸用の追加フィールド
  yoshitsuAmidoColor?: string; // 色: 黒, シルバー
  // 全体項目：給湯器用の追加フィールド
  kyutoukiHinban?: string; // 品番
  // 和室用の追加フィールド
  washitsuYoushitsuTatamiMm?: number; // 畳厚み（和室→洋室する場合）
  washitsuShojiRailFinish?: string; // 障子レールベニヤ時の仕上げ: 塗装/シート
  washitsuCeilingType?: string; // 天井交換時の種類: 既存クロス/ラミ天
  washitsuLightDl?: number; // 照明交換時のDL灯数
  washitsuLightColor?: string; // 照明交換時の色: 電球色/昼白色
  washitsuOshiireW?: number; // 押入収納交換時のW
  washitsuOshiireH?: number; // 押入収納交換時のH
  washitsuOshiireMikomi?: number; // 押入収納交換時の見込み
  // UB用の追加フィールド
  ubBodySize?: string; // UB本体サイズ（交換時）: 1116/1216/1416/1616
  ubBodySizeCustom?: string;
  ubSelectedProduct?: string;
  ubMakerPhotos?: Record<string, string>;
  ubBodyKeepType?: string; // UB本体既存時の換気タイプ: 換気扇/浴乾/無
  ubBodyEnergyType?: string; // ガス/電気
  ubVentSpec?: string;
  ubExistingHotwater?: string;
  ubAfterHotwater?: string;
  ubDryerEnergyType?: string; // 浴室乾燥機のガス/電気
  // 洗面室用の追加フィールド
  senmenBodyW?: number; // 洗面本体交換時のW
  senmenBodySize?: string;
  senmenSelectedProduct?: string;
  senmenMakerPhotos?: Record<string, string>;
  senmenWashingPanSize?: string;
  senmenWashingPanSizeCustom?: string;
  senmenHeightMm?: number; // 洗面取付位置高さ（mm）
  // トイレ用の追加フィールド
  toiletBodyW?: number; // トイレ本体交換時のW
  toiletBodyPhoto?: string;
  toiletDrainage?: string;
  toiletFloorDrainMm?: string;
  toiletFloorDrainCustomMm?: number;
  toiletWallDrainMm?: string;
  toiletHaisuiWallMm?: number; // 排水壁選択時の床から排水芯（mm）
  toiletHaisuiFloorMm?: number; // 排水床選択時の背面壁から排水芯（mm）
  // LDK 収納内部（StorageInsideState に対応）
  ldkStorageInsideSelections?: string; // カンマ区切り "kadodana,chudan" 等
  ldkStorageInsideKadodanaSteps?: number;
  ldkStorageInsideKadodanaW?: string;
  ldkStorageInsideKadodanaW_custom?: number;
  ldkStorageInsideKadodanaD?: string;
  ldkStorageInsideKadodanaD_custom?: number;
  ldkStorageInsideKadodanaMethod?: string;
  ldkStorageInsideKadodanaRailH?: string;
  ldkStorageInsideKadodanaRailColor?: string;
  ldkStorageInsideMakuradanaW?: string;
  ldkStorageInsideHpW?: number;
  ldkStorageInsideMakuradanaHpW?: string;
  ldkStorageInsideChudanNote?: string;
  ldkStorageInsideMakuradanaCategory?: string;
  ldkStorageInsideMakuradanaSize?: string;
  ldkStorageInsideMakuradanaDimensions?: string;
  ldkStorageInsideMakuradanaPrice?: number;
  ldkStorageInsideHpCategory?: string;
  ldkStorageInsideHpLength?: string;
  ldkStorageInsideHpPrice?: number;
  ldkStorageInsideMakuradanaHpShelfCategory?: string;
  ldkStorageInsideMakuradanaHpShelfSize?: string;
  ldkStorageInsideMakuradanaHpShelfDimensions?: string;
  ldkStorageInsideMakuradanaHpShelfPrice?: number;
  ldkStorageInsideMakuradanaHpHpCategory?: string;
  ldkStorageInsideMakuradanaHpHpLength?: string;
  ldkStorageInsideMakuradanaHpHpPrice?: number;
  ldkStorageInsideChudanCategory?: string;
  ldkStorageInsideChudanSize?: string;
  ldkStorageInsideChudanDimensions?: string;
  ldkStorageInsideChudanPrice?: number;
  ldkStorageInsideKadodanaPhoto?: string;
  ldkStorageInsideMakuradanaPhoto?: string;
  ldkStorageInsideHpPhoto?: string;
  ldkStorageInsideMakuradanaHpPhoto?: string;
  ldkStorageInsideChudanPhoto?: string;
  // 洋室 収納内部
  yoshitsuStorageInsideSelections?: string;
  yoshitsuStorageInsideKadodanaSteps?: number;
  yoshitsuStorageInsideKadodanaW?: string;
  yoshitsuStorageInsideKadodanaW_custom?: number;
  yoshitsuStorageInsideKadodanaD?: string;
  yoshitsuStorageInsideKadodanaD_custom?: number;
  yoshitsuStorageInsideKadodanaMethod?: string;
  yoshitsuStorageInsideKadodanaRailH?: string;
  yoshitsuStorageInsideKadodanaRailColor?: string;
  yoshitsuStorageInsideMakuradanaW?: string;
  yoshitsuStorageInsideHpW?: number;
  yoshitsuStorageInsideMakuradanaHpW?: string;
  yoshitsuStorageInsideChudanNote?: string;
  yoshitsuStorageInsideMakuradanaCategory?: string;
  yoshitsuStorageInsideMakuradanaSize?: string;
  yoshitsuStorageInsideMakuradanaDimensions?: string;
  yoshitsuStorageInsideMakuradanaPrice?: number;
  yoshitsuStorageInsideHpCategory?: string;
  yoshitsuStorageInsideHpLength?: string;
  yoshitsuStorageInsideHpPrice?: number;
  yoshitsuStorageInsideMakuradanaHpShelfCategory?: string;
  yoshitsuStorageInsideMakuradanaHpShelfSize?: string;
  yoshitsuStorageInsideMakuradanaHpShelfDimensions?: string;
  yoshitsuStorageInsideMakuradanaHpShelfPrice?: number;
  yoshitsuStorageInsideMakuradanaHpHpCategory?: string;
  yoshitsuStorageInsideMakuradanaHpHpLength?: string;
  yoshitsuStorageInsideMakuradanaHpHpPrice?: number;
  yoshitsuStorageInsideChudanCategory?: string;
  yoshitsuStorageInsideChudanSize?: string;
  yoshitsuStorageInsideChudanDimensions?: string;
  yoshitsuStorageInsideChudanPrice?: number;
  yoshitsuStorageInsideKadodanaPhoto?: string;
  yoshitsuStorageInsideMakuradanaPhoto?: string;
  yoshitsuStorageInsideHpPhoto?: string;
  yoshitsuStorageInsideMakuradanaHpPhoto?: string;
  yoshitsuStorageInsideChudanPhoto?: string;
  // LDK 収納
  ldkStorageSpec?: string; // 折れ戸 / 両開き
  ldkStorageHandle?: string; // あり / なし
  ldkStorageW?: string;
  ldkStorageW_custom?: number;
  ldkStorageH?: string;
  ldkStorageH_custom?: number;
  ldkStoragePhoto?: string;
  ldkStorageFixedFrame?: string; // 四方枠 / 直付け3方枠レール / ノン下3方枠レール
  ldkStorageFixedFramePhoto?: string;
  // 洋室 収納
  yoshitsuStorageSpec?: string;
  yoshitsuStorageHandle?: string;
  yoshitsuStorageW?: string;
  yoshitsuStorageW_custom?: number;
  yoshitsuStorageH?: string;
  yoshitsuStorageH_custom?: number;
  yoshitsuStoragePhoto?: string;
  yoshitsuStorageFixedFrame?: string;
  yoshitsuStorageFixedFramePhoto?: string;
  // LDK・洋室 床用フィールド
  ldkFloorKumi?: string; // 床組: あり / なし
  ldkFloorPhoto?: string; // 床仕様写真
  yoshitsuFloorKumi?: string; // 床組（洋室）
  washitsuYoshitsuTatamithickness?: string | number; // 和室から洋室の床選択時の畳の厚み
  yoshitsuFloorPhoto?: string; // 床仕様写真（洋室）
  // LDK・洋室 巾木写真
  ldkHabakiWoodPhoto?: string;
  ldkHabakiSoftPhoto?: string;
  yoshitsuHabakiWoodPhoto?: string;
  yoshitsuHabakiSoftPhoto?: string;
  // LDK・洋室 照明
  ldkLightRosette?: boolean; // ローゼット選択
  ldkLightRosettePhoto?: string;
  ldkLightDlType?: string; // dl_change / dl_new / none
  ldkLightDlPhoto?: string;
  ldkLightIndirect?: string; // コーブ照明 / コーニス照明 / none
  ldkLightIndirectPhoto?: string; // 間接照明写真
  yoshitsuLightRosette?: boolean;
  yoshitsuLightRosettePhoto?: string;
  yoshitsuLightDlType?: string;
  yoshitsuLightDlPhoto?: string;
  yoshitsuLightIndirect?: string;
  yoshitsuLightIndirectPhoto?: string;
  // LDK・洋室 建具
  ldkTateguDansa?: string; // あり / なし
  ldkTateguDansaKubun?: string; // 1〜10 / 11〜50 / 51〜100 / 100以上 / 手入力
  ldkTateguDansaCustomMm?: number;
  ldkTateguSpec?: string; // 片開き / 片引き / 2枚引き違い戸 / etc.
  ldkTateguPhoto?: string;
  // 片開き
  ldkKatabiraki_w?: string;
  ldkKatabiraki_h?: string;
  ldkKatabiraki_mikomi?: string;
  ldkKatabiraki_tsurimoto?: string;
  ldkKatabiraki_todomatari?: string;
  ldkKatabiraki_w_custom?: number;
  ldkKatabiraki_h_custom?: number;
  ldkKatabiraki_photo?: string;
  ldkKatabiraki_tsurimoto_photo?: string;
  ldkKatabiraki_todomatari_photo?: string;
  // 片引き
  ldkKatahiki_method?: string; // 上吊 / Y戸車引き戸
  ldkKatahiki_w?: string;
  ldkKatahiki_h?: string;
  ldkKatahiki_mikomi?: string;
  ldkKatahiki_hikite?: string;
  ldkKatahiki_w_custom?: number;
  ldkKatahiki_h_custom?: number;
  ldkKatahiki_method_photo?: string;
  ldkKatahiki_hikite_photo?: string;
  // 2枚引き違い戸
  ldkNimaiHikichigai_method?: string;
  ldkNimaiHikichigai_w?: string;
  ldkNimaiHikichigai_h?: string;
  ldkNimaiHikichigai_mikomi?: string;
  ldkNimaiHikichigai_hikite?: string;
  ldkNimaiHikichigai_w_custom?: number;
  ldkNimaiHikichigai_h_custom?: number;
  ldkNimaiHikichigai_method_photo?: string;
  ldkNimaiHikichigai_hikite_photo?: string;
  // 3枚引き違い戸
  ldkSanmaiHikichigai_method?: string;
  ldkSanmaiHikichigai_w?: string;
  ldkSanmaiHikichigai_h?: string;
  ldkSanmaiHikichigai_hikite?: string;
  ldkSanmaiHikichigai_w_custom?: number;
  ldkSanmaiHikichigai_h_custom?: number;
  ldkSanmaiHikichigai_method_photo?: string;
  ldkSanmaiHikichigai_hikite_photo?: string;
  // 3枚片引き
  ldkSanmaiKatahiki_method?: string;
  ldkSanmaiKatahiki_w?: string;
  ldkSanmaiKatahiki_h?: string;
  ldkSanmaiKatahiki_mikomi?: string;
  ldkSanmaiKatahiki_hikite?: string;
  ldkSanmaiKatahiki_w_custom?: number;
  ldkSanmaiKatahiki_h_custom?: number;
  ldkSanmaiKatahiki_method_photo?: string;
  ldkSanmaiKatahiki_hikite_photo?: string;
  // 2枚片引き
  ldkNimaiKatahiki_photo?: string;
  ldkNimaiKatahiki_w?: string;
  ldkNimaiKatahiki_h?: string;
  ldkNimaiKatahiki_w_custom?: number;
  ldkNimaiKatahiki_h_custom?: number;
  ldkNimaiKatahiki_hikite?: string;
  ldkNimaiKatahiki_hikite_photo?: string;
  // アウトセット片引き
  ldkOutsetKatahikiKagi?: string;
  ldkOutsetKatahikiHikite?: string;
  ldkOutsetKatahikiRailWidth?: string;
  ldkOutsetKatahikiCh?: string;
  // 洋室も同様（yoshitsuTategu_* プレフィックス）
  yoshitsuTateguDansa?: string;
  yoshitsuTateguDansaKubun?: string;
  yoshitsuTateguDansaCustomMm?: number;
  yoshitsuTateguSpec?: string;
  yoshitsuTateguPhoto?: string;
  yoshitsuKatabiraki_w?: string; yoshitsuKatabiraki_h?: string; yoshitsuKatabiraki_mikomi?: string; yoshitsuKatabiraki_tsurimoto?: string; yoshitsuKatabiraki_todomatari?: string; yoshitsuKatabiraki_w_custom?: number; yoshitsuKatabiraki_h_custom?: number; yoshitsuKatabiraki_photo?: string; yoshitsuKatabiraki_tsurimoto_photo?: string; yoshitsuKatabiraki_todomatari_photo?: string;
  yoshitsuKatahiki_method?: string; yoshitsuKatahiki_w?: string; yoshitsuKatahiki_h?: string; yoshitsuKatahiki_mikomi?: string; yoshitsuKatahiki_hikite?: string; yoshitsuKatahiki_w_custom?: number; yoshitsuKatahiki_h_custom?: number; yoshitsuKatahiki_method_photo?: string; yoshitsuKatahiki_hikite_photo?: string;
  yoshitsuNimaiHikichigai_method?: string; yoshitsuNimaiHikichigai_w?: string; yoshitsuNimaiHikichigai_h?: string; yoshitsuNimaiHikichigai_mikomi?: string; yoshitsuNimaiHikichigai_hikite?: string; yoshitsuNimaiHikichigai_w_custom?: number; yoshitsuNimaiHikichigai_h_custom?: number; yoshitsuNimaiHikichigai_method_photo?: string; yoshitsuNimaiHikichigai_hikite_photo?: string;
  yoshitsuSanmaiHikichigai_method?: string; yoshitsuSanmaiHikichigai_w?: string; yoshitsuSanmaiHikichigai_h?: string; yoshitsuSanmaiHikichigai_hikite?: string; yoshitsuSanmaiHikichigai_w_custom?: number; yoshitsuSanmaiHikichigai_h_custom?: number; yoshitsuSanmaiHikichigai_method_photo?: string; yoshitsuSanmaiHikichigai_hikite_photo?: string;
  yoshitsuSanmaiKatahiki_method?: string; yoshitsuSanmaiKatahiki_w?: string; yoshitsuSanmaiKatahiki_h?: string; yoshitsuSanmaiKatahiki_mikomi?: string; yoshitsuSanmaiKatahiki_hikite?: string; yoshitsuSanmaiKatahiki_w_custom?: number; yoshitsuSanmaiKatahiki_h_custom?: number; yoshitsuSanmaiKatahiki_method_photo?: string; yoshitsuSanmaiKatahiki_hikite_photo?: string;
  yoshitsuNimaiKatahiki_photo?: string;
  yoshitsuNimaiKatahiki_w?: string;
  yoshitsuNimaiKatahiki_h?: string;
  yoshitsuNimaiKatahiki_w_custom?: number;
  yoshitsuNimaiKatahiki_h_custom?: number;
  yoshitsuNimaiKatahiki_hikite?: string;
  yoshitsuNimaiKatahiki_hikite_photo?: string;
  yoshitsuOutsetKatahikiKagi?: string;
  yoshitsuOutsetKatahikiHikite?: string;
  yoshitsuOutsetKatahikiRailWidth?: string;
  yoshitsuOutsetKatahikiCh?: string;
  // LD用の追加フィールド（洋室と同一ロジック流用）
  ldIriguchiW?: string;
  ldIriguchiD?: string;
  ldIriguchiSpec?: string;
  ldDansaMm?: number;
  // LD収納用の追加フィールド（修正版）
  ldStorageKeepW?: number; // 既存残し時のW
  ldStorageKeepH?: number; // 既存残し時のH
  ldStorageKeepD?: number; // 既存残し時のD
  ldStorageKeepSpec?: string; // 既存仕様: 折れ戸/片開き/観音開き
  ldStorageChangeW?: number; // 交換時のW
  ldStorageChangeH?: number; // 交換時のH
  ldStorageChangeD?: number; // 交換時のD
  ldStorageChangeSpec?: string; // 交換後仕様: 折れ戸/片開き/観音開き
  // 旧フィールド（互換性維持）
  ldStorageW?: string;
  ldStorageD?: string;
  ldStorageSpec?: string;
  ldStorageKadodana?: string;
  ldStorageTanabashira?: string;
  ldStorageInsideSteps?: number;
  ldStorageInsideD?: number;
  ldStorageInsideW?: number;
  ldAmidoColor?: string;
  // UB既存項目用の追加フィールド
  ubKizonsetsubiEnergyType?: string; // ガス/電気（換気扇または浴乾選択時）
  // 洗面室用の追加フィールド（洋室と同一ロジック流用）
  senmenIriguchiW?: string;
  senmenIriguchiD?: string;
  senmenIriguchiSpec?: string;
  senmenDansaMm?: number;
  // トイレ用の追加フィールド（洋室と同一ロジック流用）
  toiletIriguchiW?: string;
  toiletIriguchiD?: string;
  toiletIriguchiSpec?: string;
  toiletDansaMm?: number;
  toiletStorageSelections?: string;
  toiletStorageKadodanaPhoto?: string;
  toiletStorageUpperPhoto?: string;
  toiletStorageCornerPhoto?: string;
  toiletStorageMiddlePhoto?: string;
  toiletPaperHolderType?: string;
  toiletPaperHolderSinglePhotos?: string[];
  toiletPaperHolderDoublePhoto?: string;
  toiletTowelRingPhotos?: string[];
  // 和室用フィールド
  washitsuTatami?: string; // 表替え/新調選択時のサイズ
  washitsuTatamiBeri?: string; // 表替え/新調選択時の縁
  washitsuFusumaSize?: string; // 大/小
  washitsuFusumaCount?: string; // 1-10
  washitsuShojiSize?: string; // 大/小
  washitsuShojiCount?: string; // 1-10
  washitsuMawabuchiDetail?: string; // 交換選択時の詳細（交換/塗装/クロス巻）
  washitsuLightNoSwitchOption?: string; // スイッチなし選択時の詳細（新設/なし）
  // 和室から洋室用フィールド
  washitsuYoshitsuMadowakuDetail?: string; // 窓枠選択時の詳細
  // 階段用フィールド
  kaidanSpec?: string; // 既存残し/上貼
  kaidanSideboardSpec?: string; // 既存残し/シート
  kaidanNonslip?: string; // 取付あり/なし
  kaidanTeshiro?: string; // 既存残し/交換
  kaidanKasagi?: string; // 既存残し/交換/シート
  kaidanHabaki?: string; // 既存残し/交換
  kaidanLight?: string; // 照明選択
  kaidanLightRosette?: boolean;
  kaidanLightRosettePhoto?: string;
  kaidanLightDlType?: string;
  kaidanLightDlPhoto?: string;
  kaidanLightIndirect?: string;
  kaidanLightIndirectPhoto?: string;
  kaidanPhoto?: string; // 階段仕様写真
  // コンセント・スイッチプレート用フィールド
  concentSwitchType?: string; // スクエア / ラウンド / アドバンス
  concentSwitchQuantities?: Record<string, number>; // 種類ごとの数量
  concentSwitchPhotos?: string[]; // 複数の画像
  // 分電盤用フィールド
  hanbantaiIseten?: string; // 移設: 有 / 無
  hanbantaiAmpere?: string; // アンペア数: 30A / 40A / 50A / 60A / 70A
  hanbantaiCircuits?: string | number; // 回路数: 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 22 / 手入力
}

export interface SelectedWorkItem {
  habakiUnitPrice?: number;
  intercomAutoLock?: string;
  intercomDetail?: string;
  ldkTateguKagi?: string;
  ldkTateguFloorMikiri?: string;
  ldkTateguFloorMikiriType?: string;
  ldkTateguFloorMikiriSize?: string;
  ldkTateguFloorMikiriImage?: string;
  yoshitsuTateguKagi?: string;
  yoshitsuTateguFloorMikiri?: string;
  yoshitsuTateguFloorMikiriType?: string;
  yoshitsuTateguFloorMikiriSize?: string;
  yoshitsuTateguFloorMikiriImage?: string;
}

/** Room count settings from Step 2 */
export interface RoomCountSettings {
  propertyType: "マンション" | "戸建";
  kitchenType: "LDK" | "DK" | "K";
  numYoshitsu: number; // 上限なし
  numWashitsu: number; // 上限なし
  numToilet: number; // 上限なし
  numWashroom: number; // 上限なし
  numBath: number; // 上限なし
  numHallways: number; // 上限なし
  numStairs: number; // 上限なし (戸建のみ)
  numGenkan: number; // 上限なし（変更: 固定値ではなく可変）
  numWashitsuYoshitsu?: number; // 和室から洋室の数（0=なし）
  totalAreaSqm?: number; // 総平米数
}

/** Generated room instance from settings */
export interface RoomInstance {
  roomKey: string; // unique key, e.g. "YOSHITSU_1"
  roomType: string; // master type, e.g. "YOSHITSU"
  label: string; // display label, e.g. "洋室1"
}

/** Loan simulation */
export interface LoanCalc {
  principal: number;
  annualRate: number;
  years: number;
  monthlyPayment: number;
  totalPayment: number;
}

/** Bottom tab type */
export type BottomTab = "content" | "loan" | "total";

export type ProjectStatus = "draft" | "completed";

/** Full app state */
export interface AppState {
  activeProjectId: string | null;
  activeProjectStatus: ProjectStatus | null;
  currentStep: number;
  // Step 0: Initial info
  projectName: string;
  customerName: string;
  // Step 1: Multiplier
  multiplier: number | null; // e.g. 1.30
  // Step 2: Property + room counts
  roomCountSettings: RoomCountSettings | null;
  generatedRooms: RoomInstance[];
  // Step 3: Room selection + work items (main screen)
  selectedRoomKey: string | null;
  selectedWorkItems: SelectedWorkItem[];
  // Step 4: Work detail editing (single item)
  editingWorkItem: SelectedWorkItem | null;
  // Step 5: Memo
  memo: string;
  // Step 6: Final confirmation
  // Bottom tabs
  activeBottomTab: BottomTab | null;
  // Loan
  loan: LoanCalc | null;
}

export interface SavedEstimateProject {
  id: string;
  name: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  state: AppState;
}
