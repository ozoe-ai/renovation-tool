"use client";

import React, { useState } from "react";
import { LogIn, LogOut, Mail, User } from "lucide-react";
import { useApp } from "@/lib/WizardContext";

export function AuthControls() {
  const {
    authError,
    authReady,
    authUser,
    loginWithEmail,
    loginWithGoogle,
    logout,
    registerWithEmail,
    memberActive, syncError, fromCache, pendingIds, retrySync,
  } = useApp();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const displayName = authUser?.displayName || authUser?.email;
  const isSignedIn = authUser && !authUser.isAnonymous;

  const handleAuthAction = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
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

          {isSignedIn ? (
            <button
              type="button"
              onClick={() => handleAuthAction(logout)}
              disabled={busy}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded border border-input px-3 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              ログアウト
            </button>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => handleAuthAction(loginWithGoogle)}
                disabled={busy || !authReady}
                className="inline-flex h-8 items-center gap-1.5 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Googleログイン
              </button>
              <button
                type="button"
                onClick={() => setShowEmailForm((value) => !value)}
                className="inline-flex h-8 items-center justify-center rounded border border-input px-2.5 text-foreground hover:bg-accent"
                aria-label="メールログイン"
                title="メールログイン"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {!isSignedIn && showEmailForm && (
          <div className="grid gap-2 rounded border border-border bg-background p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="メールアドレス"
              className="h-9 rounded border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="パスワード"
              className="h-9 rounded border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => handleAuthAction(() => loginWithEmail(email, password))}
              disabled={busy || !email || !password}
              className="h-9 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={() => handleAuthAction(() => registerWithEmail(email, password))}
              disabled={busy || !email || password.length < 6}
              className="h-9 rounded border border-input px-3 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-60"
            >
              新規登録
            </button>
          </div>
        )}

        {authError && <p className="text-xs font-medium text-destructive">{authError}</p>}
        {isSignedIn && memberActive && <p role="status" className="text-xs text-muted-foreground">
          {pendingIds.length ? `端末保存済み・未同期 ${pendingIds.length}件（接続時に同期）` : fromCache ? "端末内のデータを表示中・共有サーバーへの接続待ち" : "共有データを取得済み"}
        </p>}
        {syncError && <div role="alert" className="text-xs text-destructive space-x-2"><span>{syncError}</span>
          <button type="button" onClick={retrySync} className="underline">再試行</button></div>}
      </div>
    </div>
  );
}
