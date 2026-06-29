"use client";

import React from "react";
import { useApp } from "@/lib/WizardContext";

export function InitialInfoScreen() {
  const { state, setProjectName, setCustomerName, setStep } = useApp();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-52px)] p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground text-balance">見積作成</h1>
          <p className="text-sm text-muted-foreground">案件情報を入力してください（スキップ可）</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">案件名</label>
            <input
              type="text"
              value={state.projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="例：山田邸リフォーム"
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">顧客名</label>
            <input
              type="text"
              value={state.customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="例：山田太郎"
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep(1)}
            className="flex-1 py-3 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-accent transition-colors"
          >
            スキップ
          </button>
          <button
            onClick={() => setStep(1)}
            className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
