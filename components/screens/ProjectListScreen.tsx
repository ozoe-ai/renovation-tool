"use client";

import React from "react";
import { useApp } from "@/lib/WizardContext";
import type { StaffDepartment } from "@/lib/types";

const statusLabel = {
  draft: "下書き",
  completed: "見積完了",
} as const;

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProjectListScreen() {
  const { hasUnsavedChanges, loadProject, projects, startNewProject, staff, pendingIds, discardPending } = useApp();
  const [search, setSearch] = React.useState("");
  const [department, setDepartment] = React.useState<StaffDepartment | "all">("all");
  const [person, setPerson] = React.useState<string | null>(null);
  const filteredProjects = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter(project => {
      const assigned = project.state.assigneeIds ?? [];
      return (!query || project.name.toLowerCase().includes(query)) &&
        (!person || assigned.includes(person)) &&
        (department === "all" || assigned.some(id => staff.some(s => s.id === id && s.department === department)));
    });
  }, [projects, search, department, person, staff]);

  const handleLoadProject = (projectId: string) => {
    if (hasUnsavedChanges && !window.confirm("現在の編集内容が保存されていません。この案件を開きますか？")) {
      return;
    }
    loadProject(projectId);
  };

  const handleNewProject = () => {
    if (hasUnsavedChanges && !window.confirm("現在の編集内容が保存されていません。新規作成しますか？")) {
      return;
    }
    startNewProject();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">案件一覧</h1>
            <p className="text-sm text-muted-foreground mt-1">保存済み案件を選択して再編集できます。</p>
          </div>
          <button
            type="button"
            onClick={handleNewProject}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            新規作成
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2" aria-label="部署で絞り込み">
            {([['all', '全件'], ['construction', '施工管理'], ['sales', '営業部']] as const).map(([id, label]) =>
              <button key={id} type="button" aria-pressed={department === id} onClick={() => { setDepartment(id); setPerson(null); }}
                className={`rounded-lg border px-4 py-2 text-sm ${department === id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>{label}</button>)}
          </div>
          <div className="flex flex-wrap gap-2" aria-label="担当者で絞り込み">
            <button type="button" aria-pressed={!person} onClick={() => setPerson(null)} className={`rounded border px-3 py-1.5 text-sm ${!person ? 'bg-muted font-semibold' : ''}`}>担当者全員</button>
            {staff.filter(s => (s.active || projects.some(p => p.state.assigneeIds?.includes(s.id))) && (department === 'all' || s.department === department)).map(s =>
              <button type="button" key={s.id} aria-pressed={person === s.id} onClick={() => setPerson(person === s.id ? null : s.id)}
                className={`rounded border px-3 py-1.5 text-sm ${person === s.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>{s.name}{!s.active ? '（無効）' : ''}</button>)}
          </div>
          <p className="text-xs text-muted-foreground">{filteredProjects.length}件表示・複数担当の案件は各担当者から確認できます。担当未設定の案件は「全件」に表示されます。</p>
        </div>
        {projects.length > 0 && (
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="案件名で検索"
            className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}

        {projects.length === 0 ? (
          <div className="rounded-lg border border-border p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">保存済み案件はありません。</p>
            <button
              type="button"
              onClick={handleNewProject}
              className="px-4 py-2 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-accent transition-colors"
            >
              新規作成
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProjects.map((project) => (
              <div key={project.id} className="rounded-lg border border-border">
              <button
                key={project.id}
                type="button"
                onClick={() => handleLoadProject(project.id)}
                className="w-full rounded-lg border border-border p-4 text-left hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">更新日時: {formatDateTime(project.updatedAt)}</p>
                    <p className="text-xs text-muted-foreground mt-1">担当: {(project.state.assigneeIds ?? []).map(id => staff.find(s => s.id === id)?.name ?? "登録外の担当者").join("・") || "未設定"}</p>
                    {pendingIds.includes(project.id) && <p className="text-xs font-medium mt-1">端末保存済み・未同期</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {statusLabel[project.status]}
                  </span>
                </div>
              </button>
              {pendingIds.includes(project.id) && <button type="button" className="px-4 pb-3 text-xs underline text-muted-foreground" onClick={() => {
                if (window.confirm("この案件の端末内の未同期保存を破棄して、取得済みの共有版へ戻します。編集内容は失われます。よろしいですか？")) discardPending(project.id);
              }}>未同期保存を破棄して共有版へ戻す</button>}
              </div>
            ))}
            {filteredProjects.length === 0 && (
              <div className="rounded-lg border border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">該当する案件はありません。</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
