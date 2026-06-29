"use client";

import React from "react";
import { Header } from "../Header";
import { MobileButton } from "../MobileButton";
import { Card } from "@/components/ui/card";
import { useWizard } from "@/lib/WizardContext";

export const TradeTypeScreen: React.FC = () => {
  const { state, setCurrentStep, updateCustomer } = useWizard();
  const [selectedType, setSelectedType] = React.useState<"TOC" | "TOB" | null>(
    state.customer?.segment || null
  );

  const handleContinue = () => {
    if (!selectedType) return;

    updateCustomer({
      name: state.customer?.name || "",
      honorific: state.customer?.honorific || "様",
      projectName: state.customer?.projectName || "",
      segment: selectedType,
      propertyType: state.customer?.propertyType || "戸建",
      floors: state.customer?.floors,
      roomType: state.customer?.roomType,
    });

    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Header
          step={0}
          title="見積システムへようこそ"
          subtitle="取引区分をお選びください"
        />

        <div className="space-y-4">
          {/* TOC Card */}
          <Card
            onClick={() => setSelectedType("TOC")}
            className={`p-6 cursor-pointer transition-all border-2 ${
              selectedType === "TOC"
                ? "border-blue-600 bg-blue-50 shadow-lg"
                : "border-gray-200 hover:border-blue-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedType === "TOC"
                    ? "border-blue-600 bg-blue-600"
                    : "border-gray-300"
                }`}
              >
                {selectedType === "TOC" && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900">TOC 掛け率80%</h3>
            </div>
          </Card>

          {/* TOB Card */}
          <Card
            onClick={() => setSelectedType("TOB")}
            className={`p-6 cursor-pointer transition-all border-2 ${
              selectedType === "TOB"
                ? "border-blue-600 bg-blue-50 shadow-lg"
                : "border-gray-200 hover:border-blue-400 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedType === "TOB"
                    ? "border-blue-600 bg-blue-600"
                    : "border-gray-300"
                }`}
              >
                {selectedType === "TOB" && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900">TOB 掛け率100%</h3>
            </div>
          </Card>
        </div>

        <div className="mt-8 flex gap-3">
          <MobileButton
            onClick={handleContinue}
            disabled={!selectedType}
            variant="primary"
          >
            続行する
          </MobileButton>
        </div>
      </div>
    </div>
  );
};
