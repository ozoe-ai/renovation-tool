"use client";

import React from "react";
import { Header } from "../Header";
import { Breadcrumb } from "../Breadcrumb";
import { MobileButton } from "../MobileButton";
import { Card } from "@/components/ui/card";
import { useWizard } from "@/lib/WizardContext";

export const CategoryListScreen: React.FC = () => {
  const { state, setCurrentStep, selectCategory, selectRoom } = useWizard();

  if (!state.customer || state.rooms.length === 0) {
    return null;
  }

  const selectedRoom = state.rooms[state.selectedRoomIndex ?? 0];
  if (!selectedRoom) {
    return null;
  }

  const handleSelectRoom = (roomIndex: number) => {
    selectRoom(roomIndex);
    selectCategory(null);
  };

  const handleSelectCategory = (categoryIndex: number) => {
    selectCategory(categoryIndex);
    setCurrentStep(5);
  };

  const handleContinueToConfirm = () => {
    setCurrentStep(6);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Header
          step={4}
          title="カテゴリを選択"
          subtitle={`${selectedRoom.roomName}の内装・設備オプションを選択してください`}
        />

        {/* Room Selector */}
        {state.rooms.length > 1 && (
          <div className="mb-6">
            <Breadcrumb
              items={state.rooms.map((room, index) => ({
                label: room.roomName,
                active: index === (state.selectedRoomIndex ?? 0),
                onClick: () => handleSelectRoom(index),
              }))}
            />
          </div>
        )}

        {/* Category List */}
        <div className="space-y-3 mb-6">
          {selectedRoom.categories.map((category, index) => (
            <Card
              key={`${selectedRoom.roomId}-${index}`}
              onClick={() => handleSelectCategory(index)}
              className={`p-4 cursor-pointer border-2 transition-all ${
                category.price > 0
                  ? "border-green-200 bg-green-50 hover:shadow-md"
                  : "border-gray-200 bg-white hover:border-blue-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {category.categoryName}
                  </h3>
                  {category.price > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      ✓ 完了 - 金額: ¥{category.price.toLocaleString("ja-JP")}
                    </p>
                  )}
                  {category.price === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      クリックして選択...
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${category.price > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {category.price > 0 ? '編集' : '未選択'}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Room Summary */}
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            {selectedRoom.roomName} - 進捗
          </h4>
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>選択カテゴリ数:</span>
              <span className="font-semibold">{selectedRoom.categories.length}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>小計金額:</span>
              <span className="font-semibold">
                ¥{selectedRoom.categories.reduce((sum, cat) => sum + cat.price, 0).toLocaleString("ja-JP")}
              </span>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <MobileButton
            onClick={() => setCurrentStep(3)}
            variant="outline"
          >
            戻る
          </MobileButton>
          <MobileButton
            onClick={handleContinueToConfirm}
            disabled={selectedRoom.categories.length === 0}
            variant="primary"
          >
            確認へ進む
          </MobileButton>
        </div>
      </div>
    </div>
  );
};
