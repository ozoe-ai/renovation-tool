"use client";

import React, { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/WizardContext";

export interface EmailLoginControls { inputs: React.ReactNode; button: React.ReactNode; feedback: React.ReactNode; }

export function EmailLoginForm({ children }: { children: (controls: EmailLoginControls) => React.ReactNode }) {
  const { authReady, authError, loginWithEmail } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [takingLong, setTakingLong] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    if (!busy) { setTakingLong(false); return; }
    const timer = window.setTimeout(() => setTakingLong(true), 20000);
    return () => window.clearTimeout(timer);
  }, [busy]);
  const submit = async (action: () => Promise<void>) => {
    if (pending.current || !authReady || !email || !password) return;
    pending.current = true;
    setBusy(true);
    try { await action(); }
    finally { pending.current = false; setBusy(false); }
  };
  const inputs = (
    <div className="grid gap-2 rounded border border-border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_60px_72px]">
      <input type="email" aria-label="メールアドレス" autoComplete="username" value={email}
        onChange={event => setEmail(event.target.value)} placeholder="メールアドレス" required
        className="h-9 min-w-0 rounded border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <input type="password" aria-label="パスワード" autoComplete="current-password" value={password}
        onChange={event => setPassword(event.target.value)} placeholder="パスワード" required
        className="h-9 min-w-0 rounded border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
  const button = <div className="pt-3">
    <button type="submit" disabled={busy || !authReady || !email || !password}
      className="inline-flex h-[60px] w-[280px] max-w-full items-center justify-center rounded bg-black px-5 text-base font-semibold text-white">
      {busy ? "認証中…" : "ログイン"}
    </button>
  </div>;
  const feedback = <>
    {takingLong && <p role="status" className="mt-2 text-xs text-destructive">認証または保存領域の応答を待っています。通信状態を確認してください。改善しない場合は他のタブを閉じ、この画面を再読み込みしてください。処理の重複を防ぐため、応答が返るまで再送信できません。</p>}
    {authReady && authError && <p role="alert" className="mt-2 text-xs font-medium text-destructive">{authError}</p>}
  </>;
  return <form id="email-login-form" aria-busy={busy} onSubmit={event => {
    event.preventDefault();
    void submit(() => loginWithEmail(email, password));
  }}>{children({ inputs, button, feedback })}</form>;
}
