"use client";

import React, { useEffect, useRef, useState } from "react";
import { LogOut, User } from "lucide-react";
import { useApp } from "@/lib/WizardContext";

export function AuthControls({ loginInputs }: { loginInputs?: React.ReactNode }) {
  const {
    authError,
    authReady,
    authUser,
    logout,
    memberActive, syncError, fromCache, pendingIds, retrySync,
  } = useApp();
  const [busy, setBusy] = useState(false);
  const actionPending = useRef(false);
  const [takingLong, setTakingLong] = useState(false);
  useEffect(() => {
    if (!busy) { setTakingLong(false); return; }
    const timer = window.setTimeout(() => setTakingLong(true), 20000);
    return () => window.clearTimeout(timer);
  }, [busy]);

  const displayName = authUser?.displayName || authUser?.email;
  const isSignedIn = authUser && !authUser.isAnonymous;

  const handleAuthAction = async (action: () => Promise<void>) => {
    if (actionPending.current) return;
    actionPending.current = true;
    setBusy(true);
    try {
      await action();
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="bg-card border-b border-border px-4 py-2">
      <div className="max-w-3xl mx-auto space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {!authReady
                ? "ログイン状態を確認中"
                : isSignedIn
                  ? `${displayName || "社内アカウント"}：${memberActive ? "社内共有" : "メンバー確認中"}`
                  : "初回ログインが必要です（次回から保持）"}
            </span>
          </div>

          {isSignedIn && (
            <button
              type="button"
              onClick={() => handleAuthAction(logout)}
              disabled={busy}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded border border-input px-3 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              ログアウト
            </button>
          )}
        </div>

        {!isSignedIn && loginInputs}
        {takingLong && <p role="status" className="text-xs text-destructive">認証または保存領域の応答を待っています。通信状態を確認してください。改善しない場合は他のタブを閉じ、この画面を再読み込みしてください。処理の重複を防ぐため、応答が返るまで再送信できません。</p>}
        {authError && (!authReady || isSignedIn) && <p role="alert" className="text-xs font-medium text-destructive">{authError}</p>}
        {!authReady && authError && <button type="button" onClick={() => window.location.reload()} className="min-h-12 rounded border border-input px-3 text-sm">再読み込みして再試行</button>}
        {isSignedIn && memberActive && <p role="status" className="text-xs text-muted-foreground">
          {pendingIds.length ? `端末保存済み・未同期 ${pendingIds.length}件（接続時に同期）` : fromCache ? "端末内のデータを表示中・共有サーバーへの接続待ち" : "共有データを取得済み"}
        </p>}
        {syncError && <div role="alert" className="text-xs text-destructive space-x-2"><span>{syncError}</span>
          <button type="button" onClick={retrySync} className="underline">再試行</button></div>}
      </div>
    </div>
  );
}
