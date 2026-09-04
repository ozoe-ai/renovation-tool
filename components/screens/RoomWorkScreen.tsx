"use client";

import React from "react";
import { useApp } from "@/lib/WizardContext";
import { getWorkItemsForRoom } from "@/lib/config";
import { SelectedWorkItem } from "@/lib/types";
import { formatItemSelectionSummary, normalizeRoomLabel } from "@/lib/item-display";
import { ChevronRight } from "lucide-react";

const instanceSuffix = (index: number) => {
  const circled = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
  return circled[index - 1] ?? `(${index})`;
};

export function RoomWorkScreen() {
  const { state, selectRoom, setStep, setEditingWorkItem, getItemsForRoom, addWorkItem, removeWorkItem, updateWorkItem, resetCurrentEstimate } = useApp();
  const { generatedRooms, selectedRoomKey } = state;
  const selectedRoom = generatedRooms.find((r) => r.roomKey === selectedRoomKey);

  // Get work items for the selected room from master
  const workItems = selectedRoom ? getWorkItemsForRoom(selectedRoom.roomKey, selectedRoom.roomType) : [];
  const selectedItems = selectedRoom ? getItemsForRoom(selectedRoom.roomKey) : [];

  // Get all instances for a master item id
  // Matches both new items (baseWorkItemId === itemId) and legacy items (workItemId === itemId, no instanceId)
  const getInstancesForItem = (itemId: string): SelectedWorkItem[] => {
    return selectedItems.filter((i) => {
      if (i.baseWorkItemId) return i.baseWorkItemId === itemId;
      return i.workItemId === itemId;
    });
  };

  // Open existing item for editing
  const handleSelectWorkItem = (item: SelectedWorkItem) => {
    setEditingWorkItem(item);
    setStep(4);
  };

  const buildWorkItem = (itemId: string, instanceNumber: number, count: number): SelectedWorkItem | null => {
    const def = workItems.find((w) => w.id === itemId);
    if (!def || !selectedRoom) return null;
    const instanceId = `${itemId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      workItemId: itemId,
      roomKey: selectedRoom.roomKey,
      roomLabel: normalizeRoomLabel(selectedRoom.label),
      title: def.title,
      selectedOption: def.options[0]?.value ?? "",
      selectedOptionLabel: def.options[0]?.label ?? "",
      qty: def.defaultQty,
      unit: def.defaultUnit,
      unitPrice: def.defaultUnitPrice,
      lineSubtotal: def.defaultQty * def.defaultUnitPrice,
      instanceId,
      instanceNumber,
      baseWorkItemId: itemId,
      count,
    };
  };

  // First-time selection: create new item with instanceId and go to detail screen
  const handleCreateNewItem = (itemId: string) => {
    const newItem = buildWorkItem(itemId, 1, 1);
    if (!newItem) return;
    setEditingWorkItem(newItem);
    setStep(4);
  };

  const handleAddInstance = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const instances = getInstancesForItem(itemId);
    const newItem = buildWorkItem(itemId, instances.length + 1, 1);
    if (!newItem) return;

    instances.forEach((instance, index) =>
      updateWorkItem({ ...instance, instanceNumber: index + 1, count: instance.count ?? 1 })
    );
    addWorkItem(newItem);
  };

  const handleRemoveInstance = (
    e: React.MouseEvent,
    itemId: string,
    instance: SelectedWorkItem | null
  ) => {
    e.stopPropagation();
    if (!instance) return;

    const instances = getInstancesForItem(itemId);
    const removeId = instance.instanceId || instance.workItemId;

    instances
      .filter((item) => (item.instanceId || item.workItemId) !== removeId)
      .forEach((item, index) =>
        updateWorkItem({ ...item, instanceNumber: index + 1, count: item.count ?? 1 })
    );
    removeWorkItem(removeId);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-52px)]">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <h1 className="text-lg font-bold text-foreground">
            {selectedRoom ? normalizeRoomLabel(selectedRoom.label) : "部屋を選択"}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (window.confirm("現在入力している内容をすべてリセットしますか？")) {
                  resetCurrentEstimate();
                }
              }}
              className="text-xs px-3 py-1.5 rounded border border-input text-foreground hover:bg-accent transition-colors"
            >
              リセット
            </button>
            <button
              onClick={() => setStep(2)}
              className="text-xs px-3 py-1.5 rounded border border-input text-foreground hover:bg-accent transition-colors"
            >
              部屋数変更
            </button>
            <button
              onClick={() => setStep(5)}
              className="text-xs px-3 py-1.5 rounded border border-input text-foreground hover:bg-accent transition-colors"
            >
              備考
            </button>
            <button
              onClick={() => setStep(6)}
              className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              最終確認
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row max-w-3xl mx-auto w-full">
        {/* Room list */}
        <div className="md:w-48 md:border-r border-border bg-card md:bg-transparent overflow-x-auto md:overflow-x-visible">
          <div className="flex md:flex-col gap-1 p-2 md:p-3">
            {generatedRooms.map((room) => {
              const roomSelectedCount = getItemsForRoom(room.roomKey).length;
              const isActive = selectedRoomKey === room.roomKey;
              return (
                <button
                  key={room.roomKey}
                  onClick={() => selectRoom(room.roomKey)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <span className="flex-1 text-left">{normalizeRoomLabel(room.label)}</span>
                  {roomSelectedCount > 0 && (
                    <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                      isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {roomSelectedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Work items for selected room */}
        <div className="flex-1 p-4">
          {!selectedRoom ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              左の部屋を選択してください
            </div>
          ) : (
            <div className="space-y-2">
              {workItems.flatMap((masterItem) => {
                const instances = getInstancesForItem(masterItem.id);
                const count = instances.length;
                const rows = instances.length > 0 ? instances : [null];
                const hideRowPrice = masterItem.id.includes("storage_inside");

                return rows.map((instance, index) => {
                  const displayTitle = instance
                    ? `${masterItem.title}${instanceSuffix(instance.instanceNumber ?? index + 1)}`
                    : masterItem.title;
                  const rowCount = instance ? 1 : 0;
                  const selectionSummary = instance ? formatItemSelectionSummary(instance) : "";

                  return (
                  <div
                    key={instance?.instanceId || `${masterItem.id}-empty`}
                    onClick={() => instance ? handleSelectWorkItem(instance) : handleCreateNewItem(masterItem.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                      count > 0
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:border-primary/30 hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{displayTitle}</span>
                      {instance && (
                        <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">
                          {selectionSummary}
                          {!hideRowPrice && <> / {"\u00A5"}{instance.lineSubtotal.toLocaleString()}</>}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <button
                        onClick={(e) => handleRemoveInstance(e, masterItem.id, instance)}
                        disabled={!instance}
                        className="w-8 h-8 rounded-full border border-input flex items-center justify-center text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="削除"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-semibold text-foreground">{rowCount}</span>
                      <button
                        onClick={(e) => handleAddInstance(e, masterItem.id)}
                        className="w-8 h-8 rounded-full border border-input flex items-center justify-center text-foreground hover:bg-accent transition-colors"
                        aria-label="追加"
                      >
                        +
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-0.5" />
                    </div>
                  </div>
                  );
                });
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

