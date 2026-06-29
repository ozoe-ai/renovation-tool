"use client";

import React, { useState } from "react";
import { Header } from "../Header";
import { MobileButton } from "../MobileButton";
import { Card } from "@/components/ui/card";
import { useWizard } from "@/lib/WizardContext";
import { AVAILABLE_ROOMS } from "@/lib/config";

export const QuestionScreen: React.FC = () => {
  const { state, setCurrentStep, updateRoomCategory, selectCategory } =
    useWizard();
  const [answers, setAnswers] = useState<Record<string, any>>({});

  if (!state.customer || state.rooms.length === 0) {
    return null;
  }

  const selectedRoom = state.rooms[state.selectedRoomIndex ?? 0];
  const isCategoryNew =
    state.selectedCategoryIndex === undefined ||
    state.selectedCategoryIndex >= selectedRoom.categories.length;

  // For demo purposes, using the first room's categories from config
  const configRoom = AVAILABLE_ROOMS[0]; // Using entrance as example
  const categoryOptions = configRoom?.categories || [];
  const selectedConfigCategory = categoryOptions[0]; // Using first category

  if (!selectedConfigCategory) {
    return null;
  }

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const calculateCategoryPrice = (): number => {
    let totalPrice = 0;
    for (const question of selectedConfigCategory.questions) {
      const answer = answers[question.questionId];
      if (answer && question.options) {
        const option = question.options.find((opt) => opt.value === answer);
        if (option) {
          totalPrice += option.price;
        }
      }
    }
    return totalPrice;
  };

  const handleSave = () => {
    const categoryPrice = calculateCategoryPrice();

    if (isCategoryNew) {
      // Adding new category - would need proper implementation
      // For now, simulating with the config category
      updateRoomCategory(
        state.selectedRoomIndex ?? 0,
        state.selectedCategoryIndex ?? selectedRoom.categories.length,
        answers,
        categoryPrice
      );
    } else {
      // Updating existing category
      updateRoomCategory(
        state.selectedRoomIndex ?? 0,
        state.selectedCategoryIndex ?? 0,
        answers,
        categoryPrice
      );
    }

    selectCategory(null);
    setCurrentStep(4);
  };

  const allAnswered = selectedConfigCategory.questions.every(
    (q) => answers[q.questionId] !== undefined
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Header
          step={5}
          title="質問に回答"
          subtitle={`${selectedConfigCategory.categoryName} - 各質問に答えてください`}
        />

        <Card className="p-6 space-y-6">
          {selectedConfigCategory.questions.map((question, index) => (
            <div key={question.questionId}>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                {index + 1}. {question.label}
                {question.required && <span className="text-red-500">*</span>}
              </label>

              {question.type === "select" && question.options && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        handleAnswerChange(question.questionId, option.value)
                      }
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                        answers[question.questionId] === option.value
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {option.label}
                        </span>
                        <span className="text-blue-600 font-semibold">
                          +¥{option.price.toLocaleString("ja-JP")}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {question.type === "number" && (
                <input
                  type="number"
                  value={answers[question.questionId] || ""}
                  onChange={(e) =>
                    handleAnswerChange(
                      question.questionId,
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  placeholder="数値を入力"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900"
                />
              )}

              {question.type === "text" && (
                <input
                  type="text"
                  value={answers[question.questionId] || ""}
                  onChange={(e) =>
                    handleAnswerChange(question.questionId, e.target.value)
                  }
                  placeholder="テキストを入力"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900"
                />
              )}
            </div>
          ))}

          {/* Price Summary */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">
                このカテゴリの合計:
              </span>
              <span className="text-2xl font-bold text-green-600">
                ¥{calculateCategoryPrice().toLocaleString("ja-JP")}
              </span>
            </div>
          </Card>
        </Card>

        <div className="mt-8 flex gap-3">
          <MobileButton
            onClick={() => setCurrentStep(4)}
            variant="outline"
          >
            戻る
          </MobileButton>
          <MobileButton
            onClick={handleSave}
            disabled={!allAnswered}
            variant="primary"
          >
            保存
          </MobileButton>
        </div>
      </div>
    </div>
  );
};
