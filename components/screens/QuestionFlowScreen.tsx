"use client";

import React, { useMemo } from "react";
import { Header } from "../Header";
import { MobileButton } from "../MobileButton";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWizard } from "@/lib/WizardContext";
import { QuestionStep, OptionPrice } from "@/lib/types";

export const QuestionFlowScreen: React.FC = () => {
  const {
    state,
    setCurrentStep,
    answerQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
  } = useWizard();

  const currentQuestion = useMemo(() => {
    if (!state.currentQuestion) return null;

    const sequence = state.currentQuestion.questionSequence;
    const index = state.currentQuestion.questionIndex;

    if (index < 0 || index >= sequence.length) return null;

    return sequence[index];
  }, [state.currentQuestion]);

  const currentRoom = useMemo(() => {
    if (state.currentQuestion === undefined) return null;
    return state.rooms[state.currentQuestion.roomIndex];
  }, [state.currentQuestion, state.rooms]);

  const handleSelectOption = (value: string) => {
    if (!currentQuestion) return;

    answerQuestion(currentQuestion.questionId, value);
    goToNextQuestion();
  };

  const handleNumberInput = (value: string) => {
    if (!currentQuestion) return;

    const numValue = value === "" ? null : parseInt(value, 10);
    answerQuestion(currentQuestion.questionId, numValue);
  };

  const handleConfirmNumber = () => {
    goToNextQuestion();
  };

  const handleBack = () => {
    if (!state.currentQuestion || state.currentQuestion.questionIndex === 0) {
      setCurrentStep(3); // Back to room selection
    } else {
      goToPreviousQuestion();
    }
  };

  if (!currentQuestion || !currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">質問を読み込み中...</p>
        </div>
      </div>
    );
  }

  const totalQuestions = state.currentQuestion?.questionSequence.length || 0;
  const currentIndex = state.currentQuestion?.questionIndex || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Header
          step={4}
          title={currentRoom.roomName}
          subtitle={`${currentQuestion.label} (${currentIndex + 1}/${totalQuestions})`}
        />

        {/* Question Card */}
        <Card className="p-6 mb-6 border-2 border-blue-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            {currentQuestion.label}
          </h2>

          {/* Select Options */}
          {currentQuestion.type === "select" && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option: OptionPrice) => (
                <button
                  key={option.value}
                  onClick={() => handleSelectOption(option.value)}
                  className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all font-medium text-gray-900"
                >
                  {option.label}
                  {option.price > 0 && (
                    <span className="float-right text-blue-600">
                      ¥{option.price.toLocaleString("ja-JP")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Radio Options (same as select for now) */}
          {currentQuestion.type === "radio" && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option: OptionPrice) => (
                <label
                  key={option.value}
                  className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all"
                >
                  <input
                    type="radio"
                    name={currentQuestion.questionId}
                    value={option.value}
                    onChange={(e) => handleSelectOption(e.target.value)}
                    className="w-4 h-4 text-blue-600 cursor-pointer"
                  />
                  <span className="ml-3 font-medium text-gray-900">
                    {option.label}
                  </span>
                  {option.price > 0 && (
                    <span className="ml-auto text-blue-600">
                      ¥{option.price.toLocaleString("ja-JP")}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}

          {/* Number Input */}
          {currentQuestion.type === "number" && (
            <div className="space-y-4">
              <input
                type="number"
                min="0"
                placeholder="数値を入力してください"
                onChange={(e) => handleNumberInput(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
              />
              <MobileButton
                onClick={handleConfirmNumber}
                variant="primary"
                size="md"
              >
                確認
              </MobileButton>
            </div>
          )}

          {/* Text Input */}
          {currentQuestion.type === "text" && (
            <div className="space-y-4">
              <textarea
                placeholder="テキストを入力してください"
                rows={4}
                onChange={(e) => handleNumberInput(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none font-sans"
              />
              <MobileButton
                onClick={handleConfirmNumber}
                variant="primary"
                size="md"
              >
                確認
              </MobileButton>
            </div>
          )}
        </Card>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            {currentIndex + 1} / {totalQuestions}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <MobileButton onClick={handleBack} variant="outline">
            {currentIndex === 0 ? "部屋選択へ" : "戻る"}
          </MobileButton>
        </div>
      </div>
    </div>
  );
};
