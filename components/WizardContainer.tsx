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

export function WizardContainer() {
  const { state } = useApp();

  const screens = [
    <InitialInfoScreen key="initial-info" />,      // step 0
    <MultiplierScreen key="multiplier" />,         // step 1
    <RoomCountScreen key="room-count" />,          // step 2
    <RoomWorkScreen key="room-work" />,            // step 3
    <WorkDetailScreen key="work-detail" />,        // step 4
    <MemoScreen key="memo" />,                     // step 5
    <FinalConfirmScreen key="final-confirm" />,    // step 6
  ];

  return (
    <div className="min-h-screen bg-background pb-[52px]">
      {screens[state.currentStep] ?? <InitialInfoScreen />}
      <BottomTabs />
    </div>
  );
}
