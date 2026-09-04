"use client";

import React from "react";
import { useApp } from "@/lib/WizardContext";

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
  const { hasUnsavedChanges, loadProject, projects, startNewProject } = useApp();
  const [search, setSearch] = React.useState("");
  const filteredProjects = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) => project.name.toLowerCase().includes(query));
  }, [projects, search]);

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
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {statusLabel[project.status]}
                  </span>
                </div>
              </button>
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
