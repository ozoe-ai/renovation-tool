"use client";

import React, { useState } from "react";
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

export const PropertyTypeScreen: React.FC = () => {
  const { state, setCurrentStep, updateCustomer } = useWizard();
  const [propertyType, setPropertyType] = useState<"戸建" | "マンション" | null>(
    state.customer?.propertyType || null
  );
  const [subSelection, setSubSelection] = useState<string | null>(
    state.customer?.floors?.toString() || state.customer?.roomType || null
  );
  const [roomCount, setRoomCount] = useState<string>("1");
  const [roomType, setRoomType] = useState<string>("LDK");

  const subOptions =
    propertyType === "戸建" ? ["2階建て", "3階建て"] : [];

  const roomCounts = ["1", "2", "3", "4", "5"];
  const roomTypes = ["K", "DK", "LDK"];

  const getApartmentRoomType = (): string => {
    return `${roomCount}${roomType}`;
  };

  const handleContinue = () => {
    if (!propertyType) return;

    let finalSubSelection = subSelection;
    if (propertyType === "マンション") {
      finalSubSelection = getApartmentRoomType();
    } else if (!finalSubSelection) {
      return; // For detached house, subSelection must be set
    }

    updateCustomer({
      name: state.customer?.name || "",
      honorific: state.customer?.honorific || "様",
      projectName: state.customer?.projectName || "",
      segment: state.customer?.segment || "TOC",
      propertyType,
      floors: propertyType === "戸建" ? parseInt(subSelection!) : undefined,
      roomType: propertyType === "マンション" ? finalSubSelection : undefined,
    });

    setCurrentStep(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Header
          step={1}
          title="物件種別を選択"
          subtitle="リノベーション対象の物件タイプを教えてください"
        />

        <div className="space-y-4">
          {/* Property Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            {["戸建", "マンション"].map((type) => (
              <Card
                key={type}
                onClick={() => {
                  setPropertyType(type as "戸建" | "マンション");
                  setSubSelection(null);
                }}
                className={`p-6 cursor-pointer transition-all border-2 text-center ${
                  propertyType === type
                    ? "border-blue-600 bg-blue-50 shadow-lg"
                    : "border-gray-200 hover:border-blue-400"
                }`}
              >
                <div className="text-3xl mb-2">
                  {type === "戸建" ? "🏠" : "🏢"}
                </div>
                <h3 className="font-bold text-gray-900">{type}</h3>
              </Card>
            ))}
          </div>

          {/* Sub Selection */}
          {propertyType === "戸建" && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                階数を選択
              </h3>
              <div className="space-y-2">
                {subOptions.map((option) => (
                  <Card
                    key={option}
                    onClick={() => setSubSelection(option)}
                    className={`p-4 cursor-pointer transition-all border-2 ${
                      subSelection === option
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          subSelection === option
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {subSelection === option && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">
                        {option}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {propertyType === "マンション" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  部屋数を選択
                </label>
                <Select value={roomCount} onValueChange={setRoomCount}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="部屋数" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomCounts.map((count) => (
                      <SelectItem key={count} value={count}>
                        {count}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  間取りタイプを選択
                </label>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="間取り" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card className="p-4 bg-blue-50 border-2 border-blue-200">
                <p className="text-center font-bold text-blue-900 text-lg">
                  {getApartmentRoomType()}
                </p>
              </Card>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <MobileButton
            onClick={() => setCurrentStep(0)}
            variant="outline"
          >
            戻る
          </MobileButton>
          <MobileButton
            onClick={handleContinue}
            disabled={
              !propertyType ||
              (propertyType === "戸建" && !subSelection)
            }
            variant="primary"
          >
            続行する
          </MobileButton>
        </div>
      </div>
    </div>
  );
};
