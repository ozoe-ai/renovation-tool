"use client";

import React from "react";
import { useApp } from "@/lib/WizardContext";

export function MemoScreen() {
  const { state, setMemo, setStep } = useApp();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-52px)] p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground text-balance">メモ・備考</h1>
          <p className="text-sm text-muted-foreground">備考欄に自由にメモを記入できます</p>
        </div>

        <textarea
          value={state.memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={8}
          placeholder="備考・メモを入力..."
          className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />

        <div className="flex gap-3">
          <button
            onClick={() => setStep(3)}
            className="flex-1 py-3 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-accent transition-colors"
          >
            戻る
          </button>
          <button
            onClick={() => setStep(6)}
            className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            最終確認へ
          </button>
        </div>
      </div>
    </div>
  );
}
