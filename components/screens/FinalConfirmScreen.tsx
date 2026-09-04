"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/WizardContext";
import { formatItemSelectionSummary, normalizeRoomLabel } from "@/lib/item-display";

export function FinalConfirmScreen() {
  const {
    state,
    getSumCost,
    getSumSell,
    getSumSellTax,
    setStep,
    setProjectName,
    setMultiplier,
    saveProject,
  } = useApp();

  const [errors, setErrors] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLInputElement>(null);

  const cost = getSumCost();
  const sell = getSumSell();
  const tax = getSumSellTax();

  // Local editable fields for inline fix
  const [localProject, setLocalProject] = useState(state.projectName);
  const [localMultiplier, setLocalMultiplier] = useState(state.multiplier?.toString() ?? "");

  const validate = (): boolean => {
    const errs: string[] = [];
    setErrors(errs);
    return errs.length === 0;
  };

  // Auto-scroll to errors
  useEffect(() => {
    if (errors.length > 0 && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      // Focus first empty field
      if (errors.includes("projectName") && projectRef.current) {
        projectRef.current.focus();
      }
    }
  }, [errors]);

  const handleConfirm = async () => {
    // Save inline edits
    setProjectName(localProject);
    const m = parseFloat(localMultiplier);
    setMultiplier(!isNaN(m) && m > 0 ? m : null);

    if (!validate()) return;
    setExportError(null);
    setExporting(true);

    try {
      const exportState = {
        ...state,
        projectName: localProject.trim(),
        customerName: "",
        multiplier: !isNaN(m) && m > 0 ? m : null,
      };
      const response = await fetch("/api/export-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportState),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setExportError("見積書の作成に失敗しました。時間をおいて再度お試しください。");
        return;
      }

      setSpreadsheetUrl(result?.spreadsheetUrl);
      saveProject("completed", exportState);
      setConfirmed(true);
    } catch {
      setExportError("見積書の作成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setExporting(false);
    }
  };

  // Group items by room
  const grouped = state.selectedWorkItems.reduce<Record<string, typeof state.selectedWorkItems>>(
    (acc, item) => {
      const roomLabel = normalizeRoomLabel(item.roomLabel);
      if (!acc[roomLabel]) acc[roomLabel] = [];
      acc[roomLabel].push(item);
      return acc;
    },
    {}
  );

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-52px)] p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl text-primary font-bold">OK</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">見積書を作成しました</h1>
          <p className="text-sm text-muted-foreground">Google Driveに見積書を保存しました。</p>
          {spreadsheetUrl && (
            <button
              onClick={() => window.open(spreadsheetUrl, "_blank", "noopener,noreferrer")}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              作成されたスプレッドシートを開く
            </button>
          )}
          <button
            onClick={() => { setConfirmed(false); setStep(3); }}
            className="w-full py-3 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-accent transition-colors"
          >
            工事一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-52px)] p-6">
      <div className="w-full max-w-lg mx-auto space-y-6 flex-1">
        <h1 className="text-2xl font-bold text-foreground text-center text-balance">最終確認</h1>

        {/* Error banner */}
        {errors.length > 0 && (
          <div ref={errorRef} className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
            <p className="text-sm font-semibold text-destructive">
              案件名が入力されていません
            </p>
          </div>
        )}

        {exportError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
            <p className="text-sm font-semibold text-destructive">{exportError}</p>
          </div>
        )}

        {/* Editable required fields */}
        <div className="space-y-3 border border-border rounded-lg p-4">
          <h2 className="text-sm font-bold text-foreground">案件情報</h2>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">案件名</label>
            <input
              ref={projectRef}
              type="text"
              value={localProject}
              onChange={(e) => setLocalProject(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.includes("projectName") ? "border-destructive" : "border-input"
              }`}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">掛け率</label>
            <input
              type="number"
              step="0.01"
              value={localMultiplier}
              onChange={(e) => setLocalMultiplier(e.target.value)}
              placeholder="1.30"
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring border-input"
            />
          </div>
        </div>

        {/* Work item summary */}
        <div className="space-y-3 border border-border rounded-lg p-4">
          <h2 className="text-sm font-bold text-foreground">工事内容</h2>
          {Object.entries(grouped).map(([roomLabel, items]) => {
            // Number display map
            const numberMap: { [key: number]: string } = {
              1: "①", 2: "②", 3: "③", 4: "④", 5: "⑤",
              6: "⑥", 7: "⑦", 8: "⑧", 9: "⑨", 10: "⑩",
            };

            return (
              <div key={roomLabel}>
                <p className="text-xs font-semibold text-muted-foreground mt-2">{roomLabel}</p>
                {items.map((item) => {
                  // Count instances with same title for display numbering
                  const sameTitle = items.filter((i) => i.title === item.title);
                  const titleIdx = sameTitle.findIndex((i) => (i.instanceId || i.workItemId) === (item.instanceId || item.workItemId));
                  const displayNumber = sameTitle.length > 1 ? (numberMap[titleIdx + 1] || `(${titleIdx + 1})`) : "";
                  const displayTitle = `${item.title}${displayNumber}`;
                  const selectionSummary = formatItemSelectionSummary(item);

                  return (
                    <div key={item.instanceId || item.workItemId} className="flex justify-between gap-3 text-sm py-1">
                      <span className="text-foreground whitespace-pre-line">
                        {displayTitle}
                        {selectionSummary && `\n${selectionSummary}`}
                      </span>
                      <span className="text-foreground font-medium">{"\u00A5"}{item.lineSubtotal.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {state.selectedWorkItems.length === 0 && (
            <p className="text-sm text-muted-foreground">工事項目が選択されていません。</p>
          )}
        </div>

        {/* Totals */}
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">原価合計</span>
            <span className="font-bold text-foreground">{"\u00A5"}{cost.toLocaleString()}</span>
          </div>
          {sell != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">見積合計（税抜）</span>
              <span className="font-bold text-foreground">{"\u00A5"}{sell.toLocaleString()}</span>
            </div>
          )}
          {tax != null && (
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="text-muted-foreground">税込合計</span>
              <span className="font-extrabold text-foreground text-base">{"\u00A5"}{tax.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Memo */}
        {state.memo && (
          <div className="border border-border rounded-lg p-4">
            <h2 className="text-sm font-bold text-foreground mb-1">備考</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{state.memo}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setStep(3)}
            className="flex-1 py-3 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-accent transition-colors"
          >
            戻る
          </button>
          <button
            onClick={handleConfirm}
            disabled={exporting}
            className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? "見積書を作成中..." : "見積確定"}
          </button>
        </div>
      </div>
    </div>
  );
}
