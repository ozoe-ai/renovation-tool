"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/WizardContext";

export function MultiplierScreen() {
  const { state, setMultiplier, setStep } = useApp();
  const [value, setValue] = useState(state.multiplier?.toString() ?? "");

  const handleNext = () => {
    if (value.trim()) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && parsed > 0) setMultiplier(parsed);
    }
    setStep(2);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-52px)] p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground text-balance">利益率（掛け率）</h1>
          <p className="text-sm text-muted-foreground">掛け率を入力してください（スキップ可）</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            掛け率（例：1.30）= 原価 x 1.30
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="1.30"
            className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {value && parseFloat(value) > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              原価 100,000 の場合 → 見積 {"\u00A5"}{Math.round(100000 * parseFloat(value)).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep(0)}
            className="py-3 px-4 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-accent transition-colors"
          >
            戻る
          </button>
          <button
            onClick={() => setStep(2)}
            className="flex-1 py-3 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-accent transition-colors"
          >
            スキップ
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
