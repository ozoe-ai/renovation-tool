"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/WizardContext";
import { RoomCountSettings } from "@/lib/types";
import { generateStairLabels } from "@/lib/config";

// 変更: max を省略可能に（undefined の場合は上限なし）
function Counter({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max?: number; // 変更: 省略可能（上限なしの場合は undefined）
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-input flex items-center justify-center text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          -
        </button>
        <span className="w-6 text-center font-semibold text-foreground">{value}</span>
        <button
          onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
          disabled={max !== undefined && value >= max}
          className="w-8 h-8 rounded-full border border-input flex items-center justify-center text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function RoomCountScreen() {
  const { state, setRoomCounts, setStep } = useApp();
  const prev = state.roomCountSettings;

  const [propertyType, setPropertyType] = useState<"マンション" | "戸建">(prev?.propertyType ?? "マンション");
  const [kitchenType, setKitchenType] = useState<"LDK" | "DK" | "K">(prev?.kitchenType ?? "LDK");
  const [numYoshitsu, setNumYoshitsu] = useState(prev?.numYoshitsu ?? 2);
  const [numWashitsu, setNumWashitsu] = useState(prev?.numWashitsu ?? 0);
  const [numToilet, setNumToilet] = useState(prev?.numToilet ?? 1);
  const [numWashroom, setNumWashroom] = useState(prev?.numWashroom ?? 1);
  const [numBath, setNumBath] = useState(prev?.numBath ?? 1);
  const [numHallways, setNumHallways] = useState(prev?.numHallways ?? 1);
  const [numStairs, setNumStairs] = useState(prev?.numStairs ?? 0);
  // 変更: 玄関も可変に（デフォルト1）
  const [numGenkan, setNumGenkan] = useState(prev?.numGenkan ?? 1);
  const [numWashitsuYoshitsu, setNumWashitsuYoshitsu] = useState(prev?.numWashitsuYoshitsu ?? 0);
  const [totalAreaSqm, setTotalAreaSqm] = useState<number | undefined>(prev?.totalAreaSqm);

  const handleNext = () => {
    const settings: RoomCountSettings = {
      propertyType,
      kitchenType,
      numYoshitsu,
      numWashitsu,
      numToilet,
      numWashroom,
      numBath,
      numHallways,
      numStairs,
      numGenkan,
      numWashitsuYoshitsu,
      totalAreaSqm,
    };
    setRoomCounts(settings);
    setStep(3);
  };

  // 変更: 階段区間ラベルを生成
  const stairLabels = generateStairLabels(numStairs);

  return (
    <div className="flex flex-col min-h-[calc(100vh-52px)] p-6">
      <div className="w-full max-w-md mx-auto space-y-6 flex-1">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground text-balance">物件種別と部屋数</h1>
          <p className="text-sm text-muted-foreground">部屋数を設定してください</p>
        </div>

        {/* Property Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">物件種別</label>
          <div className="flex gap-2">
            {(["マンション", "戸建"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setPropertyType(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${propertyType === t
                    ? "bg-primary text-primary-foreground"
                    : "border border-input text-foreground hover:bg-accent"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Kitchen Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">LDK種別</label>
          <div className="flex gap-2">
            {(["LDK", "DK", "K"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setKitchenType(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${kitchenType === t
                    ? "bg-primary text-primary-foreground"
                    : "border border-input text-foreground hover:bg-accent"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">総平米数（㎡）</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={totalAreaSqm ?? ""}
            onChange={(e) => setTotalAreaSqm(e.target.value === "" ? undefined : Number(e.target.value))}
            placeholder="例：66"
            className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Room Counts */}
        <div className="space-y-1 border border-border rounded-lg p-4">
          {/* 変更: 全項目の max を削除（上限なし） */}
          <Counter label="洋室" value={numYoshitsu} min={0} onChange={setNumYoshitsu} />
          <Counter label="和室" value={numWashitsu} min={0} onChange={setNumWashitsu} />
          <Counter label="和室から洋室" value={numWashitsuYoshitsu} min={0} onChange={setNumWashitsuYoshitsu} />
          <Counter label="トイレ" value={numToilet} min={0} onChange={setNumToilet} />
          <Counter label="洗面室" value={numWashroom} min={0} onChange={setNumWashroom} />
          <Counter label="ユニットバス" value={numBath} min={0} onChange={setNumBath} />
          <Counter label="廊下" value={numHallways} min={0} onChange={setNumHallways} />
          {/* 変更: 戸建選択時の階段も上限なし */}
          {propertyType === "戸建" && (
            <div>
              <Counter label="階段" value={numStairs} min={0} onChange={setNumStairs} />
              {/* 変更: 階段数に応じた階段区間表示 */}
              {numStairs > 0 && (
                <div className="pl-2 mt-1 space-y-0.5">
                  {stairLabels.map((label, index) => (
                    <span key={index} className="text-xs text-muted-foreground block">
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* 変更: 玄関も他項目と同じカウンターUIに変更（「常に1」表記を削除） */}
          <Counter label="玄関" value={numGenkan} min={0} onChange={setNumGenkan} />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep(1)}
            className="py-3 px-4 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-accent transition-colors"
          >
            戻る
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
