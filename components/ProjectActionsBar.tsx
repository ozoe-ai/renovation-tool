"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/WizardContext";
import { PROJECT_LIST_STEP } from "@/lib/store";
import { AssigneeButtons } from "./AssigneeButtons";

export function ProjectActionsBar() {
  const {
    hasUnsavedChanges,
    resetCurrentEstimate,
    saveProject,
    setStep,
    startNewProject,
    state,
  } = useApp();
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAssignees, setShowAssignees] = useState(false);

  if (state.currentStep === PROJECT_LIST_STEP) return null;
  const saveStatus = state.activeProjectStatus === "completed" ? "completed" : "draft";
  const saveLabel = state.activeProjectStatus === "completed" ? "上書き保存" : "下書き保存";

  const handleDraftSave = async () => {
    setSaving(true);
    try {
      await saveProject(saveStatus);
      window.alert("端末に保存しました。共有先への同期状況は画面上部に表示されます。");
    } catch (error) { window.alert(error instanceof Error ? error.message : "保存に失敗しました。"); }
    finally { setSaving(false); }
  };

  const handleNewProject = () => {
    if (hasUnsavedChanges) {
      setShowNewConfirm(true);
      return;
    }
    startNewProject();
  };

  const handleReset = () => {
    if (window.confirm("現在入力している内容をすべてリセットしますか？")) {
      resetCurrentEstimate();
    }
  };

  return (
    <>
      <div className="bg-card border-b border-border px-4 py-2">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setStep(PROJECT_LIST_STEP)}
            className="text-xs px-3 py-1.5 rounded border border-input text-foreground hover:bg-accent transition-colors"
          >
            案件一覧
          </button>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setShowAssignees(v => !v)} aria-expanded={showAssignees}
              className="text-xs px-3 py-1.5 rounded border border-input hover:bg-accent">担当者（{state.assigneeIds?.length ?? 0}）</button>
            <button
              type="button"
              onClick={handleNewProject}
              className="text-xs px-3 py-1.5 rounded border border-input text-foreground hover:bg-accent transition-colors"
            >
              新規作成
            </button>
            <button
              type="button"
              onClick={handleDraftSave}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded border border-input text-foreground hover:bg-accent transition-colors"
            >
              {saveLabel}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs px-3 py-1.5 rounded border border-input text-foreground hover:bg-accent transition-colors"
            >
              リセット
            </button>
          </div>
        </div>
        {showAssignees && <div className="max-w-3xl mx-auto py-3"><AssigneeButtons /></div>}
      </div>

      {showNewConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-lg bg-card border border-border p-4 shadow-lg space-y-4">
            <p className="text-sm font-medium text-foreground">
              現在の編集内容が保存されていません。新規作成しますか？
            </p>
            <div className="space-y-2">
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await saveProject("draft");
                    startNewProject();
                    setShowNewConfirm(false);
                  } catch (error) { window.alert(error instanceof Error ? error.message : "保存に失敗しました。"); }
                  finally { setSaving(false); }
                }}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                下書き保存して新規作成
              </button>
              <button
                type="button"
                onClick={() => {
                  startNewProject();
                  setShowNewConfirm(false);
                }}
                className="w-full py-2 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-accent transition-colors"
              >
                保存せず新規作成
              </button>
              <button
                type="button"
                onClick={() => setShowNewConfirm(false)}
                className="w-full py-2 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-accent transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
