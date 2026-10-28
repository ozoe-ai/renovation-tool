"use client";

import React from "react";
import { useApp } from "@/lib/WizardContext";
import { InitialInfoScreen } from "./screens/InitialInfoScreen";
import { MultiplierScreen } from "./screens/MultiplierScreen";
import { RoomCountScreen } from "./screens/RoomCountScreen";
import { RoomWorkScreen } from "./screens/RoomWorkScreen";
import { WorkDetailScreen } from "./screens/WorkDetailScreen";
import { MemoScreen } from "./screens/MemoScreen";
import { FinalConfirmScreen } from "./screens/FinalConfirmScreen";
import { BottomTabs } from "./BottomTabs";
import { ProjectActionsBar } from "./ProjectActionsBar";
import { ProjectListScreen } from "./screens/ProjectListScreen";
import { PROJECT_LIST_STEP } from "@/lib/store";
import { AuthControls } from "./AuthControls";

export function WizardContainer() {
  const { state, authReady, authUser, memberActive, retrySync } = useApp();

  const screens = [
    <InitialInfoScreen key="initial-info" />,      // step 0
    <MultiplierScreen key="multiplier" />,         // step 1
    <RoomCountScreen key="room-count" />,          // step 2
    <RoomWorkScreen key="room-work" />,            // step 3
    <WorkDetailScreen key="work-detail" />,        // step 4
    <MemoScreen key="memo" />,                     // step 5
    <FinalConfirmScreen key="final-confirm" />,    // step 6
    <ProjectListScreen key="project-list" />,      // step 7
  ];

  return (
    <div className="min-h-screen bg-background pb-[52px]">
      <AuthControls />
      {(!authReady || !authUser || !memberActive) ? <div className="mx-auto max-w-md p-6 space-y-3">
        <p>{!authReady ? "ログイン状態を確認中です。" : !authUser ? "初回は社内アカウントでログインしてください。この端末にログイン状態を保持します。" : "社内メンバーの登録を確認しています。未登録の場合は管理者へお問い合わせください。"}</p>
        <p className="text-sm text-muted-foreground">会社管理の端末で使用してください。取得済み案件と編集内容をこのブラウザに保存します。</p>
        {authUser && <><p className="text-xs break-all">登録用UID: {authUser.uid}</p><button type="button" onClick={retrySync} className="rounded border px-3 py-2">再確認</button></>}
      </div> : <>
      <ProjectActionsBar />
      {screens[state.currentStep] ?? <InitialInfoScreen />}
      {state.currentStep !== PROJECT_LIST_STEP && <BottomTabs />}
      </>}
    </div>
  );
}
