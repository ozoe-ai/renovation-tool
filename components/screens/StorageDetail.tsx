"use client";

import React from "react";

// ============================================================
// 収納詳細コンポーネント（折れ戸 / 両開き）
// LDK・洋室共通で使用
// ============================================================

interface StorageDetailProps {
  spec: string; // 折れ戸 / 両開き
  // --- 共通 ---
  handle: string; setHandle: (v: string) => void; // あり / なし
  w: string; setW: (v: string) => void;
  w_custom: number | undefined; setW_custom: (v: number | undefined) => void;
  h: string; setH: (v: string) => void;
  h_custom: number | undefined; setH_custom: (v: number | undefined) => void;
  photo: string; setPhoto: (v: string) => void;
  // --- 折れ戸専用 ---
  fixedFrame?: string; setFixedFrame?: (v: string) => void;
  fixedFramePhoto?: string; setFixedFramePhoto?: (v: string) => void;
  nonShitaAllowedWidths?: string[];
}

// ボタン共通クラスユーティリティ
function btn(active: boolean, disabled = false) {
  if (disabled)
    return "px-4 py-2 rounded-lg text-sm font-medium border border-input text-muted-foreground/40 cursor-not-allowed bg-muted/30";
  return `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
    active
      ? "bg-primary text-primary-foreground"
      : "border border-input text-foreground hover:bg-accent"
  }`;
}

export function StorageDetail({
  spec,
  handle, setHandle,
  w, setW,
  w_custom, setW_custom,
  h, setH,
  h_custom, setH_custom,
  photo, setPhoto,
  fixedFrame, setFixedFrame,
  fixedFramePhoto, setFixedFramePhoto,
  nonShitaAllowedWidths,
}: StorageDetailProps) {

  // ---------- 折れ戸 ----------
  if (spec === "折れ戸") {
    const wOptions = ["735", "825", "1190", "1320", "1645", "1708", "1820", "2541", "オーダー"];
    const hOptions = ["2035", "2350", "オーダー"];
    const frameOptions = ["四方枠", "三方枠", "ノン下3方枠レール"];

    const nonShitaDisabled = nonShitaAllowedWidths
      ? w !== "" && w !== "オーダー" && !nonShitaAllowedWidths.includes(w)
      : w !== "オーダー" && w !== "";

    return (
      <div className="space-y-4">
        {/* 取っ手 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">取っ手</label>
          <div className="flex flex-wrap gap-2">
            {["あり", "なし"].map((v) => (
              <button key={v} type="button" onClick={() => setHandle(handle === v ? "" : v)} className={btn(handle === v)}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* W */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">W（幅）</label>
          <div className="flex flex-wrap gap-2">
            {wOptions.map((v) => (
              <button key={v} type="button" onClick={() => { setW(w === v ? "" : v); if (v !== "オーダー") setW_custom(undefined); }} className={btn(w === v)}>
                {v}
              </button>
            ))}
          </div>
          {w === "オーダー" && (
            <input
              type="number" min="0" value={w_custom ?? ""} placeholder="実寸 mm"
              onChange={(e) => setW_custom(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </div>

        {/* 固定枠 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">固定枠</label>
          <div className="flex flex-wrap gap-2">
            {frameOptions.map((v) => {
              const isDisabled = v === "ノン下3方枠レール" && nonShitaDisabled;
              return (
                <button
                  key={v}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setFixedFrame && setFixedFrame(fixedFrame === v ? "" : v)}
                  className={btn(fixedFrame === v, isDisabled)}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>

        {/* H */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">H（高さ）</label>
          <div className="flex flex-wrap gap-2">
            {hOptions.map((v) => (
              <button key={v} type="button" onClick={() => { setH(h === v ? "" : v); if (v !== "オーダー") setH_custom(undefined); }} className={btn(h === v)}>
                {v}
              </button>
            ))}
          </div>
          {h === "オーダー" && (
            <input
              type="number" min="0" value={h_custom ?? ""} placeholder="実寸 mm"
              onChange={(e) => setH_custom(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </div>

      </div>
    );
  }

  // ---------- 両開き ----------
  if (spec === "両開き") {
    const wOptions = ["735", "825", "1190", "オーダー"];
    const hOptionsNormal = ["800", "1200", "1800", "2035", "2350", "オーダー"];

    return (
      <div className="space-y-4">
        {/* 取っ手 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">取っ手</label>
          <div className="flex flex-wrap gap-2">
            {["あり", "なし"].map((v) => (
              <button key={v} type="button" onClick={() => setHandle(handle === v ? "" : v)} className={btn(handle === v)}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* W */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">W（幅）</label>
          <div className="flex flex-wrap gap-2">
            {wOptions.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setW(w === v ? "" : v);
                  if (v !== "オーダー") setW_custom(undefined);
                  // W変更時、選択不可Hをリセット
                  if (v === "1190" && h !== "" && !["2035", "2350", "オーダー"].includes(h)) {
                    setH("");
                  }
                }}
                className={btn(w === v)}
              >
                {v}
              </button>
            ))}
          </div>
          {w === "オーダー" && (
            <input
              type="number" min="0" value={w_custom ?? ""} placeholder="実寸 mm"
              onChange={(e) => setW_custom(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </div>

        {/* H */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">H（高さ）</label>
          {w === "1190" && (
            <p className="text-xs text-muted-foreground">W=1190 のとき H800 / 1200 / 1800 は選択不可</p>
          )}
          <div className="flex flex-wrap gap-2">
            {hOptionsNormal.map((v) => {
              const isDisabled = w === "1190" && !["2035", "2350", "オーダー"].includes(v);
              return (
                <button
                  key={v}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => { if (!isDisabled) { setH(h === v ? "" : v); if (v !== "オーダー") setH_custom(undefined); } }}
                  className={btn(h === v, isDisabled)}
                >
                  {v}
                </button>
              );
            })}
          </div>
          {h === "オーダー" && (
            <input
              type="number" min="0" value={h_custom ?? ""} placeholder="実寸 mm"
              onChange={(e) => setH_custom(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </div>

      </div>
    );
  }

  return null;
}
