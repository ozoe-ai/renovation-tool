"use client";

import React, { useState } from "react";
import { Header } from "../Header";
import { MobileButton } from "../MobileButton";
import { Card } from "@/components/ui/card";
import { useWizard } from "@/lib/WizardContext";

export const CustomerInfoScreen: React.FC = () => {
  const { state, setCurrentStep, updateCustomer } = useWizard();
  const [name, setName] = useState(state.customer?.name || "");
  const [honorific, setHonorific] = useState<"様" | "御中">(
    state.customer?.honorific || "様"
  );
  const [projectName, setProjectName] = useState(
    state.customer?.projectName || ""
  );

  const isValid = name.trim() !== "" && projectName.trim() !== "";

  const handleContinue = () => {
    if (!isValid || !state.customer) return;

    updateCustomer({
      ...state.customer,
      name: name.trim(),
      honorific,
      projectName: projectName.trim(),
    });

    setCurrentStep(3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Header
          step={2}
          title="顧客・案件情報"
          subtitle="見積書に記載される情報を入力してください"
        />

        <Card className="p-6 space-y-6">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              顧客名<span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 山田 太郎"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900"
              />
              <select
                value={honorific}
                onChange={(e) => setHonorific(e.target.value as "様" | "御中")}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white text-gray-900 font-medium"
              >
                <option value="様">様</option>
                <option value="御中">御中</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              敬称を選択してください（様 = 個人、御中 = 法人・部署）
            </p>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              案件名<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="例: 東京ビル リノベーション工事"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-2">
              見積書の件名に使用されます
            </p>
          </div>

          {/* Summary */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">確認事項</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">取引区分:</span>
                <span className="font-medium text-gray-900">
                  {state.customer?.segment}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">物件種別:</span>
                <span className="font-medium text-gray-900">
                  {state.customer?.propertyType}
                  {state.customer?.floors
                    ? ` (${state.customer.floors}階建て)`
                    : ""}
                  {state.customer?.roomType ? ` (${state.customer.roomType})` : ""}
                </span>
              </div>
            </div>
          </Card>
        </Card>

        <div className="mt-8 flex gap-3">
          <MobileButton
            onClick={() => setCurrentStep(1)}
            variant="outline"
          >
            戻る
          </MobileButton>
          <MobileButton
            onClick={handleContinue}
            disabled={!isValid}
            variant="primary"
          >
            続行する
          </MobileButton>
        </div>
      </div>
    </div>
  );
};
