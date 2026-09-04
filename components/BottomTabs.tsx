"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/WizardContext";
import { calcLoan } from "@/lib/store";
import { formatItemSelectionSummary, normalizeRoomLabel } from "@/lib/item-display";
import { X } from "lucide-react";

// ========== Content Panel ==========
function ContentPanel({ onClose }: { onClose: () => void }) {
  const { state, removeWorkItem, setStep, selectRoom, copyRoomWorkItems } = useApp();
  const [copySourceRoomKey, setCopySourceRoomKey] = useState<string | null>(null);
  const [copyTargetRoomKey, setCopyTargetRoomKey] = useState("");
  const [pendingCopy, setPendingCopy] = useState<{ sourceRoomKey: string; targetRoomKey: string } | null>(null);
  const roomEntries = state.selectedWorkItems.reduce<
    { roomKey: string; roomLabel: string; items: typeof state.selectedWorkItems }[]
  >((acc, item) => {
    const roomKey = item.roomKey;
    const roomLabel = normalizeRoomLabel(item.roomLabel);
    const room = acc.find((entry) => entry.roomKey === roomKey);
    if (room) {
      room.items.push(item);
    } else {
      acc.push({ roomKey, roomLabel, items: [item] });
    }
    return acc;
  }, []);

  const getRoomLabel = (roomKey: string) => {
    const generatedRoom = state.generatedRooms.find((room) => room.roomKey === roomKey);
    const selectedRoom = roomEntries.find((room) => room.roomKey === roomKey);
    return normalizeRoomLabel(generatedRoom?.label ?? selectedRoom?.roomLabel ?? roomKey);
  };

  const handleRoomNavClick = (roomKey: string) => {
    selectRoom(roomKey);
    onClose();
    setStep(3);
  };

  const resetCopyUi = () => {
    setCopySourceRoomKey(null);
    setCopyTargetRoomKey("");
    setPendingCopy(null);
  };

  const handleOpenCopy = (roomKey: string) => {
    setPendingCopy(null);
    setCopySourceRoomKey((current) => (current === roomKey ? null : roomKey));
    setCopyTargetRoomKey("");
  };

  const handleCopy = (sourceRoomKey: string) => {
    if (!copyTargetRoomKey) return;
    const hasTargetItems = state.selectedWorkItems.some((item) => item.roomKey === copyTargetRoomKey);
    if (hasTargetItems) {
      setPendingCopy({ sourceRoomKey, targetRoomKey: copyTargetRoomKey });
      return;
    }
    copyRoomWorkItems(sourceRoomKey, copyTargetRoomKey);
    resetCopyUi();
  };

  const handleConfirmCopy = () => {
    if (!pendingCopy) return;
    copyRoomWorkItems(pendingCopy.sourceRoomKey, pendingCopy.targetRoomKey);
    resetCopyUi();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground text-lg">選択済み内容</h3>
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground" aria-label="閉じる">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => { onClose(); setStep(3); selectRoom(null); }}
          className="flex-1 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80"
        >
          トップに戻る
        </button>
        <button
          onClick={() => { onClose(); setStep(3); }}
          className="flex-1 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80"
        >
          工事項目に戻る
        </button>
      </div>
      {roomEntries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {roomEntries.map(({ roomKey, roomLabel }) => (
            <button
              key={roomKey}
              type="button"
              onClick={() => handleRoomNavClick(roomKey)}
              className="px-3 py-1.5 rounded-lg border border-input text-xs font-medium text-foreground hover:bg-accent transition-colors"
            >
              {roomLabel}
            </button>
          ))}
        </div>
      )}
      {state.selectedWorkItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">選択された工事項目はありません。</p>
      ) : (
        roomEntries.map(({ roomKey, roomLabel, items }) => {
          // Number display map
          const numberMap: { [key: number]: string } = {
            1: "①", 2: "②", 3: "③", 4: "④", 5: "⑤",
            6: "⑥", 7: "⑦", 8: "⑧", 9: "⑨", 10: "⑩",
          };
          const copyTargetRooms = state.generatedRooms.filter((room) => room.roomKey !== roomKey);

          return (
            <div key={roomKey}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-semibold text-sm text-foreground">{roomLabel}</p>
                <button
                  type="button"
                  onClick={() => handleOpenCopy(roomKey)}
                  disabled={copyTargetRooms.length === 0}
                  className="px-2.5 py-1 rounded-lg border border-input text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  この部屋の内容をコピー
                </button>
              </div>
              {copySourceRoomKey === roomKey && (
                <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
                  <select
                    value={copyTargetRoomKey}
                    onChange={(e) => {
                      setCopyTargetRoomKey(e.target.value);
                      setPendingCopy(null);
                    }}
                    className="min-w-36 rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground"
                  >
                    <option value="">コピー先を選択</option>
                    {copyTargetRooms.map((room) => (
                      <option key={room.roomKey} value={room.roomKey}>
                        {normalizeRoomLabel(room.label)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleCopy(roomKey)}
                    disabled={!copyTargetRoomKey}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    コピー
                  </button>
                  {pendingCopy?.sourceRoomKey === roomKey && (
                    <div className="flex w-full flex-wrap items-center gap-2 text-xs text-foreground">
                      <span>{getRoomLabel(pendingCopy.targetRoomKey)}にはすでに選択内容があります。上書きしますか？</span>
                      <button
                        type="button"
                        onClick={() => setPendingCopy(null)}
                        className="px-3 py-1.5 rounded-lg border border-input text-xs font-medium text-foreground hover:bg-accent transition-colors"
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmCopy}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                      >
                        上書きする
                      </button>
                    </div>
                  )}
                </div>
              )}
              {items.map((item, idx) => {
                // Count instances with same title for display numbering
                const sameTitle = items.filter((i) => i.title === item.title);
                const titleIdx = sameTitle.findIndex((i) => (i.instanceId || i.workItemId) === (item.instanceId || item.workItemId));
                const displayNumber = sameTitle.length > 1 ? (numberMap[titleIdx + 1] || `(${titleIdx + 1})`) : "";
                const displayTitle = `${item.title}${displayNumber}`;
                const deleteId = item.instanceId || item.workItemId;
                const selectionSummary = formatItemSelectionSummary(item);

                return (
                  <div key={item.instanceId || item.workItemId} className="flex items-center justify-between py-1.5 border-b border-border">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground">{displayTitle}</span>
                      <span className="text-xs text-muted-foreground ml-2 whitespace-pre-line">
                        {selectionSummary}
                        {selectionSummary && " / "}
                        {"\u00A5"}{item.lineSubtotal.toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => removeWorkItem(deleteId)}
                      className="ml-2 p-1 text-destructive hover:bg-destructive/10 rounded"
                      aria-label="削除"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}

// ========== Loan Panel ==========
function LoanPanel({ onClose }: { onClose: () => void }) {
  const { state, setLoan, getSumSellTax, getSumCost } = useApp();
  const defaultPrincipal = getSumSellTax() ?? getSumCost();
  const [principal, setPrincipal] = useState(state.loan?.principal ?? defaultPrincipal);
  const [rate, setRate] = useState(state.loan?.annualRate ?? 2.0);
  const [years, setYears] = useState(state.loan?.years ?? 35);

  const result = calcLoan(principal, rate, years);

  const handleCalc = () => {
    setLoan(result);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground text-lg">ローン試算</h3>
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground" aria-label="閉じる">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">借入額</label>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">金利（年 %）</label>
          <input
            type="number"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">期間（年）</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          />
        </div>
        <button
          onClick={handleCalc}
          className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
        >
          試算する
        </button>
        {result.monthlyPayment > 0 && (
          <div className="rounded-lg bg-muted p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">月々返済額</span>
              <span className="font-bold text-foreground">{"\u00A5"}{result.monthlyPayment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">総返済額</span>
              <span className="font-bold text-foreground">{"\u00A5"}{result.totalPayment.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== Total Panel ==========
function TotalPanel({ onClose }: { onClose: () => void }) {
  const { getSumCost, getSumSell, getSumSellTax, state } = useApp();
  const cost = getSumCost();
  const sell = getSumSell();
  const tax = getSumSellTax();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground text-lg">現在金額</h3>
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground" aria-label="閉じる">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="rounded-lg bg-muted p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">原価合計</span>
          <span className="font-bold text-foreground">{"\u00A5"}{cost.toLocaleString()}</span>
        </div>
        {state.multiplier != null && state.multiplier > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">掛け率</span>
              <span className="text-foreground">x {state.multiplier}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">掛け率反映後（税抜）</span>
              <span className="font-bold text-foreground">{sell != null ? `\u00A5${sell.toLocaleString()}` : "-"}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="text-muted-foreground">税込合計（10%）</span>
              <span className="font-extrabold text-foreground text-base">{tax != null ? `\u00A5${tax.toLocaleString()}` : "-"}</span>
            </div>
          </>
        )}
        {(state.multiplier == null || state.multiplier <= 0) && (
          <p className="text-xs text-muted-foreground">掛け率が未入力のため、見積合計は算出されません。</p>
        )}
      </div>
    </div>
  );
}

// ========== Bottom Tabs ==========
export function BottomTabs() {
  const { state, setActiveBottomTab } = useApp();
  const active = state.activeBottomTab;
  const { getSumCost } = useApp();

  const tabs: { key: typeof active; label: string }[] = [
    { key: "content", label: "内容" },
    { key: "loan", label: "ローン試算" },
    { key: "total", label: `\u00A5${getSumCost().toLocaleString()}` },
  ];

  const onClose = () => setActiveBottomTab(null);

  return (
    <>
      {/* Overlay panel */}
      {active && (
        <div className="fixed inset-x-0 bottom-[52px] z-40 max-h-[60vh] overflow-y-auto bg-card border-t border-border shadow-lg p-4 rounded-t-2xl">
          {active === "content" && <ContentPanel onClose={onClose} />}
          {active === "loan" && <LoanPanel onClose={onClose} />}
          {active === "total" && <TotalPanel onClose={onClose} />}
        </div>
      )}

      {/* Fixed tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-[52px] border-t border-border bg-card" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setActiveBottomTab(tab.key)}
            className={`flex-1 flex items-center justify-center text-sm font-medium transition-colors ${
              active === tab.key
                ? "text-primary bg-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </>
  );
}
