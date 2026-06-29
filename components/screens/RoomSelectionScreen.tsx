"use client";

import React from "react";
import { Header } from "../Header";
import { MobileButton } from "../MobileButton";
import { Card } from "@/components/ui/card";
import { useWizard } from "@/lib/WizardContext";
import { AVAILABLE_ROOMS } from "@/lib/config";

export const RoomSelectionScreen: React.FC = () => {
  const { state, setCurrentStep, addRoom, removeRoom, startRoomQuestions } = useWizard();

  const handleAddRoom = (roomId: string, roomName: string) => {
    addRoom(roomName, roomId);
  };

  const handleRemoveRoom = (roomIndex: number) => {
    removeRoom(roomIndex);
  };

  const handleStartRoomQuestions = (roomIndex: number) => {
    startRoomQuestions(roomIndex);
  };

  const getRoomCount = (roomId: string) => {
    return state.rooms.filter((r) => r.roomId === roomId).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Header
          step={3}
          title="部屋を選択"
          subtitle="リノベーション対象の部屋を選択してください（複数選択可能）"
        />

        {/* Available Rooms Grid */}
        <div className="space-y-3 mb-6">
          {AVAILABLE_ROOMS.map((room) => {
            const count = getRoomCount(room.roomId);
            return (
              <Card
                key={room.roomId}
                className="p-4 border-2 border-gray-200 hover:border-blue-400 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {room.roomName}
                    {count > 0 && (
                      <span className="ml-2 text-sm text-blue-600 font-semibold">
                        ({count}個追加)
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => handleAddRoom(room.roomId, room.roomName)}
                    className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
                  >
                    追加
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Selected Rooms Summary */}
        {state.rooms.length > 0 && (
          <Card className="p-6 mb-6 border-green-200 bg-green-50">
            <h3 className="font-semibold text-gray-900 mb-3">
              追加された部屋 ({state.rooms.length}個)
            </h3>
            <div className="space-y-2">
              {state.rooms.map((room, index) => (
                <div
                  key={`${room.roomId}-${index}`}
                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                  onClick={() => handleStartRoomQuestions(index)}
                >
                  <span className="font-medium text-gray-900">
                    {room.roomName}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRoomQuestions(index);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded font-medium hover:bg-blue-700"
                    >
                      編集
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveRoom(index);
                      }}
                      className="text-red-500 hover:text-red-700 font-medium text-sm px-3 py-1 rounded hover:bg-red-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Info Box */}
        <Card className="p-4 bg-blue-50 border-blue-200 mb-6">
          <p className="text-sm text-gray-700">
            💡 同じ部屋を複数回追加できます（例：洋室①、洋室②）。各部屋ごとに内装・設備を個別に選択できます。
          </p>
        </Card>

        <div className="flex gap-3">
          <MobileButton
            onClick={() => setCurrentStep(2)}
            variant="outline"
          >
            戻る
          </MobileButton>
        </div>
      </div>
    </div>
  );
};
