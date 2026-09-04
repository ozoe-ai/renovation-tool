"use client";

import React, { useEffect, useMemo } from "react";

export type KitchenBodyState = {
  relocation: string;
  existing: string;
  shape: string;
  depth: string;
  width: string;
  heating: string;
  drawer: string;
  endPanel: string;
  lSize: string;
  wallCabinet: string;
  wallCabinetHeight: string;
  dishwasherExisting: string;
  dishwasherAfter: string;
  worktop: string;
  sink: string;
  selectedMaker: string;
  makerPhotos: Record<string, string>;
};

type Props = {
  state: KitchenBodyState;
  onChange: (next: Partial<KitchenBodyState>) => void;
  onUnitPriceChange: (price: number) => void;
};

const KITCHEN_IH_ADDS: Record<string, number | null> = {
  Panasonic: 45000,
  LIXIL: 45000,
  クリナップ: 45000,
  タカラスタンダード: 37000,
  ハウステック: null,
};

const CHEAP_SORT_FIXED_VALUES: Partial<KitchenBodyState> = {
  drawer: "開き",
  endPanel: "無",
  wallCabinet: "有",
  wallCabinetHeight: "H600",
  dishwasherExisting: "無",
  dishwasherAfter: "無",
  worktop: "ステンレス",
  sink: "ステンレス",
};

const KITCHEN_PRODUCTS = [
  { maker: "Panasonic", name: "ラクシーナ", spec: "標準仕様", base: 690000 },
  { maker: "LIXIL", name: "シエラS", spec: "標準仕様", base: 640000 },
  { maker: "ハウステック", name: "カナリエ", spec: "標準仕様", base: 620000 },
  { maker: "クリナップ", name: "ラクエラ", spec: "標準仕様", base: 610000 },
];

const L_SHAPE_SIZE_OPTIONS = [
  "1800×1650",
  "1950×1650",
  "2100×1650",
  "2250×1650",
  "2400×1650",
  "2550×1650",
  "2700×1650",
];

type KitchenProductCandidate = {
  maker: string;
  name: string;
  size: string;
  spec: string;
  price: number;
  image?: string;
  ihPending: boolean;
};

function ButtonGroup({
  label,
  options,
  value,
  onChange,
  disabledOptions = [],
  disabled = false,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabledOptions?: string[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isDisabled = disabled || disabledOptions.includes(option);
          return (
            <button
              key={option}
              type="button"
              disabled={isDisabled}
              onClick={() => onChange(value === option ? "" : option)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                value === option
                  ? "bg-primary text-primary-foreground"
                  : "border border-input text-foreground hover:bg-accent"
              } ${isDisabled ? "opacity-40 cursor-not-allowed hover:bg-transparent" : ""}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function optionPrice(state: KitchenBodyState) {
  let price = 0;
  if (state.relocation === "有") price += 90000;
  if (state.existing === "マイスターコーティング") price += 120000;
  if (state.shape === "L型") price += 160000;
  if (state.shape === "フラット対面") price += 240000;
  if (state.depth === "D650") price += 20000;
  if (state.shape !== "L型" && state.width) price += Math.max(0, (Number(state.width.replace("W", "")) - 1800) / 150) * 12000;
  if (state.drawer === "スライド") price += 70000;
  if (state.endPanel === "有") price += 30000;
  if (state.wallCabinet === "有") price += 70000;
  if (state.wallCabinetHeight === "H600") price += 10000;
  if (state.wallCabinetHeight === "H700") price += 20000;
  if (state.dishwasherExisting === "有") price += 30000;
  if (state.dishwasherAfter === "有") price += 110000;
  if (state.worktop === "人工大理石") price += 80000;
  if (state.sink === "人工大理石") price += 50000;
  return price;
}

export function KitchenBodySection({ state, onChange, onUnitPriceChange }: Props) {
  const flat = state.shape === "フラット対面";
  const showExchangeDetails = state.existing === "交換";
  const isCustomLSize = state.shape === "L型" && state.lSize !== "" && !L_SHAPE_SIZE_OPTIONS.includes(state.lSize);
  const [sortOrder, setSortOrder] = React.useState<"standard" | "cheap">("standard");
  const cheapSort = sortOrder === "cheap";
  const pricingState = cheapSort ? { ...state, ...CHEAP_SORT_FIXED_VALUES } : state;
  const candidates = useMemo(() => {
    const option = optionPrice(pricingState);
    const selectedSize = pricingState.shape === "L型" && pricingState.lSize === "その他" ? "" : pricingState.shape === "L型" ? pricingState.lSize : pricingState.width;
    if (!selectedSize) return [];
    const products: KitchenProductCandidate[] = KITCHEN_PRODUCTS.map((product) => {
      const ihAdd = pricingState.heating === "IH" ? KITCHEN_IH_ADDS[product.maker] : 0;
      return {
        maker: product.maker,
        name: product.name,
        size: selectedSize,
        spec: `${pricingState.shape || "I型"} ${product.spec}`,
        price: product.base + option + (typeof ihAdd === "number" ? ihAdd : 0),
        image: pricingState.makerPhotos[product.maker],
        ihPending: ihAdd === null,
      };
    });
    return sortOrder === "cheap" ? [...products].sort((a, b) => a.price - b.price) : products;
  }, [pricingState, sortOrder]);

  useEffect(() => {
    if (!candidates.length) return;
    const selected = candidates.find((candidate) => candidate.maker === state.selectedMaker) ?? candidates[0];
    if (!selected.ihPending) onUnitPriceChange(selected.price);
  }, [candidates, state.selectedMaker, onUnitPriceChange]);

  useEffect(() => {
    if (!flat) return;
    onChange({ wallCabinet: "", wallCabinetHeight: "", drawer: "スライド", endPanel: "" });
  }, [flat]);

  useEffect(() => {
    if (!cheapSort) return;
    onChange(CHEAP_SORT_FIXED_VALUES);
  }, [cheapSort, state.shape]);

  return (
    <div className="space-y-4">
      <ButtonGroup label="移設" options={["有", "無"]} value={state.relocation} onChange={(relocation) => onChange({ relocation })} />
      <ButtonGroup label="既存仕様" options={["既存残し", "交換", "マイスターコーティング"]} value={state.existing} onChange={(existing) => onChange({ existing })} />

      {showExchangeDetails && (
        <>
          <ButtonGroup label="キッチン形状" options={["I型", "L型", "フラット対面"]} value={state.shape} onChange={(shape) => onChange({ shape })} />

          {state.shape === "L型" && (
            <div className="space-y-2">
              <ButtonGroup
                label="サイズ"
                options={[...L_SHAPE_SIZE_OPTIONS, "その他"]}
                value={isCustomLSize ? "その他" : state.lSize}
                onChange={(lSize) => onChange({ lSize })}
              />
              {(state.lSize === "その他" || isCustomLSize) && (
                <input
                  value={isCustomLSize ? state.lSize : ""}
                  onChange={(event) => onChange({ lSize: event.target.value })}
                  placeholder="例：2100×1800"
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>
          )}

          {(state.shape === "I型" || state.shape === "L型" || flat) && (
            <>
              {!flat && <ButtonGroup label="奥行" options={["D650", "D600"]} value={state.depth} onChange={(depth) => onChange({ depth })} />}
              {!flat && state.shape !== "L型" && <ButtonGroup label="幅" options={["W1800", "W1950", "W2100", "W2250", "W2400", "W2550"]} value={state.width} onChange={(width) => onChange({ width })} />}
              <ButtonGroup label="加熱機器" options={["ガスコンロ", "IH"]} value={state.heating} onChange={(heating) => onChange({ heating })} disabled={cheapSort} />
              <ButtonGroup label="引き出し仕様" options={["開き", "スライド"]} value={pricingState.drawer} onChange={(drawer) => onChange({ drawer })} disabledOptions={flat ? ["開き"] : []} disabled={cheapSort} />
              {!flat && <ButtonGroup label="エンドパネル" options={["有", "無"]} value={pricingState.endPanel} onChange={(endPanel) => onChange({ endPanel })} disabled={cheapSort} />}
            </>
          )}

          {!flat && (
            <>
              <ButtonGroup label="吊戸" options={["有", "無"]} value={pricingState.wallCabinet} onChange={(wallCabinet) => onChange({ wallCabinet })} disabled={cheapSort} />
              {pricingState.wallCabinet === "有" && (
                <ButtonGroup label="吊戸高さ" options={["H500", "H600", "H700"]} value={pricingState.wallCabinetHeight} onChange={(wallCabinetHeight) => onChange({ wallCabinetHeight })} disabled={cheapSort} />
              )}
            </>
          )}

          <ButtonGroup label="食洗機 既存仕様" options={["有", "無"]} value={pricingState.dishwasherExisting} onChange={(dishwasherExisting) => onChange({ dishwasherExisting })} disabled={cheapSort} />
          <ButtonGroup label="食洗機 交換後仕様" options={["有", "無"]} value={pricingState.dishwasherAfter} onChange={(dishwasherAfter) => onChange({ dishwasherAfter })} disabled={cheapSort} />
          <ButtonGroup label="ワークトップ仕様" options={["ステンレス", "人工大理石"]} value={pricingState.worktop} onChange={(worktop) => onChange({ worktop })} disabled={cheapSort} />
          <ButtonGroup label="シンク仕様" options={["ステンレス", "人工大理石"]} value={pricingState.sink} onChange={(sink) => onChange({ sink })} disabled={cheapSort} />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">メーカー別キッチン</p>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as "standard" | "cheap")}
                className="border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              >
                <option value="standard">標準順</option>
                <option value="cheap">安い順</option>
              </select>
            </div>
            <div className="text-xs text-muted-foreground">
              IH加算額：Panasonic +45,000円 / LIXIL +45,000円 / クリナップ +45,000円 / タカラスタンダード +37,000円 / ハウステック 未定
            </div>
            <div className="grid gap-3">
              {candidates.map((candidate) => (
                <div
                  key={`${candidate.maker}-${candidate.size}`}
                  onClick={() => {
                    onChange({ selectedMaker: candidate.maker });
                    if (!candidate.ihPending) onUnitPriceChange(candidate.price);
                  }}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                    state.selectedMaker === candidate.maker ? "border-primary bg-primary/5" : "border-input hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{candidate.maker}</p>
                      <p className="text-xs text-muted-foreground">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground">{candidate.size}</p>
                      <p className="text-xs text-muted-foreground">{candidate.spec}</p>
                      {state.heating === "IH" && candidate.ihPending && <p className="text-xs text-muted-foreground mt-1">IH加算：未定</p>}
                    </div>
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                      {state.heating === "IH" && candidate.ihPending ? "未定" : `¥${candidate.price.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="mt-3 block border border-dashed border-input rounded-lg p-4 text-center" onClick={(event) => event.stopPropagation()}>
                    {candidate.image ? (
                      <img src={candidate.image} alt={`${candidate.maker} ${candidate.name}`} className="mx-auto max-h-32 w-full rounded object-contain" />
                    ) : (
                      <p className="text-xs text-muted-foreground">オプション反映画像を挿入するエリア</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
