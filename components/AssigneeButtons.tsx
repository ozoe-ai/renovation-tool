"use client";

import { useApp } from "@/lib/WizardContext";
export const departmentLabels = { construction: "施工管理", sales: "営業部" } as const;

export function AssigneeButtons() {
  const { state, staff, setAssigneeIds } = useApp();
  const selected = state.assigneeIds ?? [];
  return <fieldset className="space-y-3">
    <legend className="text-sm font-medium mb-2">担当者（複数選択可）</legend>
    {(["construction", "sales", "other"] as const).map(department => {
      const members = staff.filter(s => (s.active || selected.includes(s.id)) &&
        (department === "other" ? !s.department : s.department === department));
      if (!members.length) return null;
      return <div key={department} className="space-y-2">
        <p className="text-xs text-muted-foreground">{department === "other" ? "部署未設定" : departmentLabels[department]}</p>
        <div className="flex flex-wrap gap-2">{members.map(member => <button key={member.id} type="button"
          aria-pressed={selected.includes(member.id)}
          disabled={!member.active && !selected.includes(member.id)}
          onClick={() => setAssigneeIds(selected.includes(member.id) ? selected.filter(id => id !== member.id) : [...selected, member.id])}
          className={`rounded-lg border px-3 py-2 text-sm ${selected.includes(member.id) ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-accent"}`}>
          {selected.includes(member.id) ? "✓ " : ""}{member.name}{!member.active ? "（無効）" : ""}
        </button>)}</div>
      </div>;
    })}
    {selected.filter(id => !staff.some(s => s.id === id)).map(id => <button key={id} type="button" aria-pressed="true"
      onClick={() => setAssigneeIds(selected.filter(value => value !== id))} className="rounded border px-3 py-2 text-sm">登録外の担当者（選択解除）</button>)}
    {!staff.some(s => s.active) && <p className="text-xs text-muted-foreground">担当者が未登録です。管理者がstaff_membersに追加してください。</p>}
  </fieldset>;
}
