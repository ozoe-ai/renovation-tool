"use client";

import React from "react";

type ShelfRow = {
  category: string;
  size: string;
  dimensions: string;
  price: number;
};

type HpRow = {
  category: string;
  length: string;
  price: number;
};

export interface StorageInsideState {
  selections: string[];
  kadodanaSteps: number | undefined;
  kadodanaW: string;
  kadodanaW_custom: number | undefined;
  kadodanaD: string;
  kadodanaD_custom: number | undefined;
  kadodanaMethod: string;
  kadodanaRailH: string;
  kadodanaRailColor: string;
  makuradanaW: string;
  hpW: number | undefined;
  makuradanaHpW: string;
  chudanNote: string;
  makuradanaCategory?: string;
  makuradanaSize?: string;
  makuradanaDimensions?: string;
  makuradanaPrice?: number;
  hpCategory?: string;
  hpLength?: string;
  hpPrice?: number;
  makuradanaHpShelfCategory?: string;
  makuradanaHpShelfSize?: string;
  makuradanaHpShelfDimensions?: string;
  makuradanaHpShelfPrice?: number;
  makuradanaHpHpCategory?: string;
  makuradanaHpHpLength?: string;
  makuradanaHpHpPrice?: number;
  chudanCategory?: string;
  chudanSize?: string;
  chudanDimensions?: string;
  chudanPrice?: number;
  kadodanaPhoto?: string;
  makuradanaPhoto?: string;
  hpPhoto?: string;
  makuradanaHpPhoto?: string;
  chudanPhoto?: string;
}

export interface StorageInsideSectionProps {
  state: StorageInsideState;
  onChange: (next: Partial<StorageInsideState>) => void;
  onUnitPriceChange?: (price: number) => void;
  hideSpecSelector?: boolean;
}

const SPEC_OPTIONS = [
  { value: "kadodana", label: "可動棚" },
  { value: "makuradana", label: "枕棚" },
  { value: "makuradana_hp", label: "枕棚+HP" },
  { value: "chudan", label: "中段" },
];

const KADODANA_W_RANGES = ["300〜400", "401〜500", "501〜600", "601〜700", "701〜800", "801〜900", "手入力"];
const KADODANA_D_OPTIONS = ["100", "200", "300", "350", "450", "500", "550", "600", "手入力"];
const KADODANA_STEPS = [1, 2, 3, 4, 5];
const RAIL_H_OPTIONS = ["600", "900", "1200", "1800"];
const RAIL_COLOR_OPTIONS = ["ホワイト", "シルバー", "ブラック"];

const MAKURADANA_ROWS: ShelfRow[] = [
  { category: "通常", size: "0.5間", dimensions: "900×400×50", price: 17050 },
  { category: "通常", size: "0.75間", dimensions: "1350×400×50", price: 24860 },
  { category: "通常", size: "1.0間", dimensions: "1810×400×50", price: 27720 },
  { category: "通常", size: "1.5間", dimensions: "2700×400×50", price: 46530 },
  { category: "メーターモジュール", size: "1M", dimensions: "960×435×50", price: 21560 },
  { category: "メーターモジュール", size: "1.5M", dimensions: "1430×435×50", price: 29150 },
  { category: "メーターモジュール", size: "2M", dimensions: "1930×435×50", price: 36190 },
];

const CHUDAN_ROWS: ShelfRow[] = [
  { category: "通常", size: "0.5間", dimensions: "900×850×70", price: 27280 },
  { category: "通常", size: "0.75間", dimensions: "1350×850×70", price: 31790 },
  { category: "通常", size: "1.0間", dimensions: "1810×850×70", price: 33220 },
  { category: "通常", size: "1.5間", dimensions: "2700×850×70", price: 71170 },
  { category: "メーターモジュール", size: "1M", dimensions: "960×930×70", price: 31350 },
  { category: "メーターモジュール", size: "1.5M", dimensions: "1430×930×70", price: 42680 },
  { category: "メーターモジュール", size: "2M", dimensions: "1930×930×70", price: 47080 },
];

const HP_LEFT_ROWS: HpRow[] = [
  { category: "0.5間（1M）用", length: "L=830", price: 5390 },
  { category: "0.75間（1.5M）用", length: "L=1280", price: 7590 },
  { category: "1間用", length: "L=1740", price: 8470 },
];

const HP_RIGHT_ROWS: HpRow[] = [
  { category: "2M用", length: "L=1860", price: 9020 },
  { category: "1.5間用", length: "L=2630", price: 13200 },
];

const MAKURADANA_HP_LINKS: { shelf: ShelfRow; hp: ShelfRow }[] = [
  { shelf: MAKURADANA_ROWS[0], hp: { category: "", size: "", dimensions: "830×250×49", price: 0 } },
  { shelf: MAKURADANA_ROWS[1], hp: { category: "", size: "", dimensions: "1280×250×49", price: 0 } },
  { shelf: MAKURADANA_ROWS[2], hp: { category: "", size: "", dimensions: "1740×250×49", price: 0 } },
  { shelf: MAKURADANA_ROWS[3], hp: { category: "", size: "", dimensions: "2630×250×49", price: 0 } },
];

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "border border-input text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function priceText(price: number) {
  return `${price.toLocaleString()}円`;
}

function PhotoSlot({
  label,
  value,
  onChange,
  image,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  image?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground block">{label}</label>
      <div className="block border border-dashed border-input rounded-lg p-4 text-center">
        {value ? (
          <img src={value} alt={label} className="mx-auto max-h-32 rounded object-contain" />
        ) : image ? (
          <img src={image} alt={label} className="mx-auto max-h-32 rounded object-contain" />
        ) : (
          <p className="text-xs text-muted-foreground">写真を挿入するエリア</p>
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs text-muted-foreground underline underline-offset-2"
        >
          写真を削除
        </button>
      )}
    </div>
  );
}

function selectedShelf(row: ShelfRow, category?: string, size?: string) {
  return row.category === category && row.size === size;
}

function selectedHp(row: HpRow, category?: string, length?: string) {
  return row.category === category && row.length === length;
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-lg border border-input [&_th:last-child]:hidden [&_td:last-child]:hidden">{children}</div>;
}

function rowClass(active: boolean) {
  return `cursor-pointer select-none transition-colors ${active ? "bg-primary/15 outline outline-2 outline-primary outline-offset-[-2px]" : "hover:bg-accent"}`;
}

function selectOnKey(event: React.KeyboardEvent<HTMLTableRowElement>, onSelect: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onSelect();
  }
}

function ShelfTable({
  rows,
  selectedCategory,
  selectedSize,
  onSelect,
}: {
  rows: ShelfRow[];
  selectedCategory?: string;
  selectedSize?: string;
  onSelect: (row: ShelfRow) => void;
}) {
  return (
    <TableWrap>
      <table className="min-w-[440px] w-full text-sm border-collapse [&_th:nth-child(1)]:hidden [&_td:nth-child(1)]:hidden [&_th:nth-child(2)]:hidden [&_td:nth-child(2)]:hidden">
        <thead className="bg-muted">
          <tr>
            <th className="border-b border-input px-3 py-2 text-left font-medium">区分</th>
            <th className="border-b border-input px-3 py-2 text-left font-medium">サイズ</th>
            <th className="border-b border-input px-3 py-2 text-left font-medium">幅×奥行×高さ</th>
            <th className="border-b border-input px-3 py-2 text-right font-medium">価格</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const active = selectedShelf(row, selectedCategory, selectedSize);
            const handleSelect = () => onSelect(row);
            const cellSelect = (event: React.MouseEvent<HTMLTableCellElement>) => {
              event.stopPropagation();
              handleSelect();
            };
            return (
              <tr
                key={`${row.category}-${row.size}`}
                className={rowClass(active)}
                onClick={handleSelect}
                onKeyDown={(event) => selectOnKey(event, handleSelect)}
                role="button"
                tabIndex={0}
                aria-pressed={active}
              >
                <td onClick={cellSelect} className="border-b border-input px-3 py-2 whitespace-nowrap">{row.category}</td>
                <td onClick={cellSelect} className="border-b border-input px-3 py-2 whitespace-nowrap">{row.size}</td>
                <td onClick={cellSelect} className="border-b border-input px-3 py-2 whitespace-nowrap">{row.dimensions}</td>
                <td onClick={cellSelect} className="hidden border-b border-input px-3 py-2 text-right whitespace-nowrap font-semibold text-primary">
                  {priceText(row.price)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableWrap>
  );
}

function DimensionTable({ rows }: { rows: ShelfRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-input">
      <table className="min-w-[440px] w-full text-sm border-collapse">
        <thead className="bg-muted">
          <tr>
            <th className="border-b border-input px-3 py-2 text-left font-medium">幅×奥行×高さ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.dimensions}-${index}`}>
              <td className="border-b border-input px-3 py-2 whitespace-nowrap">{row.dimensions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HpTable({
  rows,
  selectedCategory,
  selectedLength,
  onSelect,
}: {
  rows: HpRow[];
  selectedCategory?: string;
  selectedLength?: string;
  onSelect: (row: HpRow) => void;
}) {
  return (
    <TableWrap>
      <table className="min-w-[300px] w-full text-sm border-collapse">
        <thead className="bg-muted">
          <tr>
            <th className="border-b border-input px-3 py-2 text-left font-medium">区分</th>
            <th className="border-b border-input px-3 py-2 text-left font-medium">サイズ（長さ）</th>
            <th className="border-b border-input px-3 py-2 text-right font-medium">価格</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const active = selectedHp(row, selectedCategory, selectedLength);
            const handleSelect = () => onSelect(row);
            const cellSelect = (event: React.MouseEvent<HTMLTableCellElement>) => {
              event.stopPropagation();
              handleSelect();
            };
            return (
              <tr
                key={`${row.category}-${row.length}`}
                className={rowClass(active)}
                onClick={handleSelect}
                onKeyDown={(event) => selectOnKey(event, handleSelect)}
                role="button"
                tabIndex={0}
                aria-pressed={active}
              >
                <td onClick={cellSelect} className="border-b border-input px-3 py-2 whitespace-nowrap">{row.category}</td>
                <td onClick={cellSelect} className="border-b border-input px-3 py-2 whitespace-nowrap">{row.length}</td>
                <td onClick={cellSelect} className="hidden border-b border-input px-3 py-2 text-right whitespace-nowrap font-semibold text-primary">
                  {priceText(row.price)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableWrap>
  );
}

export function StorageInsideSection({ state, onChange, onUnitPriceChange, hideSpecSelector = false }: StorageInsideSectionProps) {
  const selections = state.selections.filter((selection) => selection !== "hp");
  React.useEffect(() => {
    let total = 0;
    if (selections.includes("kadodana")) total += 10000;
    if (selections.includes("makuradana")) total += state.makuradanaPrice ?? 0;
    if (selections.includes("hp")) total += state.hpPrice ?? 0;
    if (selections.includes("makuradana_hp")) {
      total += (state.makuradanaHpShelfPrice ?? 0) + (state.makuradanaHpHpPrice ?? 0);
    }
    if (selections.includes("chudan")) total += state.chudanPrice ?? 0;
    onUnitPriceChange?.(total);
  }, [
    selections,
    state.makuradanaPrice,
    state.hpPrice,
    state.makuradanaHpShelfPrice,
    state.makuradanaHpHpPrice,
    state.chudanPrice,
    onUnitPriceChange,
  ]);

  function toggleSpec(value: string) {
    if (value === "chudan") {
      onChange({
        selections: selections.includes("chudan")
          ? selections.filter((s) => s !== "chudan")
          : [...selections, "chudan"],
      });
      return;
    }

    const chudanIfPresent = selections.includes("chudan") ? ["chudan"] : [];
    onChange({ selections: selections.includes(value) ? chudanIfPresent : [...chudanIfPresent, value] });
  }

  function applyPrice(price: number) {
    onUnitPriceChange?.(price);
  }

  const showKadodana = selections.includes("kadodana");
  const showMakuradana = selections.includes("makuradana");
  const showHp = selections.includes("hp");
  const showMakuradanaHp = selections.includes("makuradana_hp");
  const showChudan = selections.includes("chudan");
  const showRail = state.kadodanaMethod === "横レール";
  const hpRows = [...HP_LEFT_ROWS, ...HP_RIGHT_ROWS];
  const makuradanaHpShelfRows = MAKURADANA_HP_LINKS.map((link) => link.shelf);
  const makuradanaHpSelectedLink = MAKURADANA_HP_LINKS.find(
    (link) => link.shelf.category === state.makuradanaHpShelfCategory && link.shelf.size === state.makuradanaHpShelfSize
  );
  const makuradanaHpRows = makuradanaHpSelectedLink ? [makuradanaHpSelectedLink.hp] : MAKURADANA_HP_LINKS.map((link) => link.hp);

  return (
    <div className="space-y-4">
      {!hideSpecSelector && (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground block">仕様選択</label>
        <p className="text-xs text-muted-foreground">「中段」は他の仕様と併用可能です</p>
        <div className="flex flex-wrap gap-2">
          {SPEC_OPTIONS.map((opt) => (
            <ToggleButton key={opt.value} active={selections.includes(opt.value)} onClick={() => toggleSpec(opt.value)}>
              {opt.label}
            </ToggleButton>
          ))}
        </div>
      </div>
      )}

      {showKadodana && (
        <div className="space-y-4 border border-input rounded-lg p-4">
          <p className="text-sm font-semibold text-foreground">可動棚</p>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">段数</label>
            <div className="flex flex-wrap gap-2">
              {KADODANA_STEPS.map((s) => (
                <ToggleButton
                  key={s}
                  active={state.kadodanaSteps === s}
                  onClick={() => onChange({ kadodanaSteps: state.kadodanaSteps === s ? undefined : s })}
                >
                  {s}
                </ToggleButton>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">W</label>
            <div className="flex flex-wrap gap-2">
              {KADODANA_W_RANGES.map((w) => (
                <ToggleButton key={w} active={state.kadodanaW === w} onClick={() => onChange({ kadodanaW: state.kadodanaW === w ? "" : w })}>
                  {w}
                </ToggleButton>
              ))}
            </div>
            {state.kadodanaW === "手入力" && (
              <input
                type="number"
                min="0"
                value={state.kadodanaW_custom ?? ""}
                onChange={(e) => onChange({ kadodanaW_custom: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="実寸（mm）を入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">D</label>
            <div className="flex flex-wrap gap-2">
              {KADODANA_D_OPTIONS.map((d) => (
                <ToggleButton key={d} active={state.kadodanaD === d} onClick={() => onChange({ kadodanaD: state.kadodanaD === d ? "" : d })}>
                  {d}
                </ToggleButton>
              ))}
            </div>
            {state.kadodanaD === "手入力" && (
              <input
                type="number"
                min="0"
                value={state.kadodanaD_custom ?? ""}
                onChange={(e) => onChange({ kadodanaD_custom: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="実寸（mm）を入力"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">取付方法</label>
            <div className="flex flex-wrap gap-2">
              {["背面固定", "横レール"].map((m) => (
                <ToggleButton key={m} active={state.kadodanaMethod === m} onClick={() => onChange({ kadodanaMethod: state.kadodanaMethod === m ? "" : m })}>
                  {m}
                </ToggleButton>
              ))}
            </div>
          </div>

          {showRail && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">レール高さ</label>
                <div className="flex flex-wrap gap-2">
                  {RAIL_H_OPTIONS.map((h) => (
                    <ToggleButton key={h} active={state.kadodanaRailH === h} onClick={() => onChange({ kadodanaRailH: state.kadodanaRailH === h ? "" : h })}>
                      {h}
                    </ToggleButton>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">レール色</label>
                <div className="flex flex-wrap gap-2">
                  {RAIL_COLOR_OPTIONS.map((c) => (
                    <ToggleButton key={c} active={state.kadodanaRailColor === c} onClick={() => onChange({ kadodanaRailColor: state.kadodanaRailColor === c ? "" : c })}>
                      {c}
                    </ToggleButton>
                  ))}
                </div>
              </div>
            </>
          )}
          <PhotoSlot
            label="可動棚写真"
            value={state.kadodanaPhoto}
            onChange={(photo) => onChange({ kadodanaPhoto: photo })}
          />
        </div>
      )}

      {showMakuradana && (
        <div className="space-y-4 border border-input rounded-lg p-4">
          <p className="text-sm font-semibold text-foreground">枕棚</p>
          <ShelfTable
            rows={MAKURADANA_ROWS}
            selectedCategory={state.makuradanaCategory}
            selectedSize={state.makuradanaSize}
            onSelect={(row) => {
              onChange({
                makuradanaW: row.size,
                makuradanaCategory: row.category,
                makuradanaSize: row.size,
                makuradanaDimensions: row.dimensions,
                makuradanaPrice: row.price,
              });
              applyPrice(row.price);
            }}
          />
          <PhotoSlot
            label="枕棚写真"
            value={state.makuradanaPhoto}
            onChange={(photo) => onChange({ makuradanaPhoto: photo })}
            image="/images/廊下/廊下収納内部/makuradana-hp.png"
          />
        </div>
      )}

      {showHp && (
        <div className="space-y-4 border border-input rounded-lg p-4">
          <p className="text-sm font-semibold text-foreground">HP</p>
          <div className="grid gap-4 md:grid-cols-2">
            <HpTable
              rows={HP_LEFT_ROWS}
              selectedCategory={state.hpCategory}
              selectedLength={state.hpLength}
              onSelect={(row) => {
                onChange({ hpCategory: row.category, hpLength: row.length, hpPrice: row.price, hpW: undefined });
                applyPrice(row.price);
              }}
            />
            <HpTable
              rows={HP_RIGHT_ROWS}
              selectedCategory={state.hpCategory}
              selectedLength={state.hpLength}
              onSelect={(row) => {
                onChange({ hpCategory: row.category, hpLength: row.length, hpPrice: row.price, hpW: undefined });
                applyPrice(row.price);
              }}
            />
          </div>
        </div>
      )}

      {showMakuradanaHp && (
        <div className="space-y-4 border border-input rounded-lg p-4">
          <p className="text-sm font-semibold text-foreground">枕棚+HP</p>
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">枕棚</p>
            <ShelfTable
              rows={makuradanaHpShelfRows}
              selectedCategory={state.makuradanaHpShelfCategory}
              selectedSize={state.makuradanaHpShelfSize}
              onSelect={(row) => {
                const total = row.price;
                onChange({
                  makuradanaHpW: row.size,
                  makuradanaHpShelfCategory: row.category,
                  makuradanaHpShelfSize: row.size,
                  makuradanaHpShelfDimensions: row.dimensions,
                  makuradanaHpShelfPrice: row.price,
                  makuradanaHpHpCategory: row.category,
                  makuradanaHpHpLength: row.size,
                  makuradanaHpHpPrice: 0,
                });
                applyPrice(total);
              }}
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">HP</p>
            <DimensionTable rows={makuradanaHpRows} />
          </div>
          <PhotoSlot
            label="枕棚+HP写真"
            value={state.makuradanaHpPhoto}
            onChange={(photo) => onChange({ makuradanaHpPhoto: photo })}
            image="/images/廊下/廊下収納内部/makuradana-hp.png"
          />
        </div>
      )}

      {showChudan && (
        <div className="space-y-4 border border-input rounded-lg p-4">
          <p className="text-sm font-semibold text-foreground">中段</p>
          <ShelfTable
            rows={CHUDAN_ROWS}
            selectedCategory={state.chudanCategory}
            selectedSize={state.chudanSize}
            onSelect={(row) => {
              onChange({
                chudanNote: row.size,
                chudanCategory: row.category,
                chudanSize: row.size,
                chudanDimensions: row.dimensions,
                chudanPrice: row.price,
              });
              applyPrice(row.price);
            }}
          />
          <PhotoSlot
            label="中段写真"
            value={state.chudanPhoto}
            onChange={(photo) => onChange({ chudanPhoto: photo })}
            image="/images/廊下/廊下収納内部/chudan.png"
          />
        </div>
      )}
    </div>
  );
}
