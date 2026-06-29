"use client";

import React, { useState } from "react";
import { Header } from "../Header";
import { MobileButton } from "../MobileButton";
import { Card } from "@/components/ui/card";
import { LoanSimulator } from "../LoanSimulator";
import { useWizard } from "@/lib/WizardContext";
import { formatCurrency } from "@/lib";
import { generateQuote, exportQuoteAsJSON, exportQuoteAsCSV } from "@/lib/quote-generator";

export const ConfirmationScreen: React.FC = () => {
  const { state, setCurrentStep, updatePricing, setLoan, reset } = useWizard();
  const [showLoan, setShowLoan] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(state.pricing.discountAmount);

  if (!state.customer || state.rooms.length === 0) {
    return null;
  }

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = Number(e.target.value) || 0;
    setDiscountAmount(amount);
    updatePricing(state.pricing.rateType, amount);
  };

  const handleLoanApply = (downPayment: number, monthlyPayment: number) => {
    setLoan({
      principal: state.pricing.total,
      downPayment,
      annualRate: 3.0,
      years: 20,
      monthlyPayment,
      totalPayment: 0,
      totalInterest: 0,
    });
    setShowLoan(false);
  };

  const handleGeneratePDF = () => {
    const quote = generateQuote(state);
    if (!quote) return;

    // For demo, export as JSON and CSV
    const jsonData = exportQuoteAsJSON(quote);
    const csvData = exportQuoteAsCSV(quote);

    // Create JSON download
    const jsonBlob = new Blob([jsonData], { type: "application/json" });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement("a");
    jsonLink.href = jsonUrl;
    jsonLink.download = `quote-${quote.meta.estimateNo}.json`;
    jsonLink.click();
    URL.revokeObjectURL(jsonUrl);

    // Create CSV download
    const csvBlob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const csvUrl = URL.createObjectURL(csvBlob);
    const csvLink = document.createElement("a");
    csvLink.href = csvUrl;
    csvLink.download = `quote-${quote.meta.estimateNo}.csv`;
    csvLink.click();
    URL.revokeObjectURL(csvUrl);

    // Move to success screen
    setCurrentStep(7);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Header
          step={6}
          title="見積確認"
          subtitle="内容を確認して見積書を生成します"
        />

        {/* Customer Info */}
        <Card className="p-6 mb-6 border-l-4 border-blue-600">
          <h3 className="font-semibold text-gray-900 mb-3">顧客情報</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">顧客名:</span>
              <p className="font-medium text-gray-900">
                {state.customer.name}
                {state.customer.honorific}
              </p>
            </div>
            <div>
              <span className="text-gray-600">案件名:</span>
              <p className="font-medium text-gray-900">
                {state.customer.projectName}
              </p>
            </div>
            <div>
              <span className="text-gray-600">取引区分:</span>
              <p className="font-medium text-gray-900">{state.customer.segment}</p>
            </div>
            <div>
              <span className="text-gray-600">物件種別:</span>
              <p className="font-medium text-gray-900">
                {state.customer.propertyType}
                {state.customer.floors ? ` (${state.customer.floors}階)` : ""}
                {state.customer.roomType ? ` (${state.customer.roomType})` : ""}
              </p>
            </div>
          </div>
        </Card>

        {/* Rooms and Categories */}
        <Card className="p-6 mb-6 border-l-4 border-purple-600">
          <h3 className="font-semibold text-gray-900 mb-4">内訳</h3>
          <div className="space-y-4">
            {state.rooms.map((room, roomIndex) => (
              <div key={room.roomId} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {room.roomName}
                </h4>
                <div className="space-y-2">
                  {room.categories.map((category) => (
                    <div
                      key={category.categoryId}
                      className="flex justify-between text-sm text-gray-600"
                    >
                      <span>{category.categoryName}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(category.price)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-gray-900">
                  <span>{room.roomName} 小計:</span>
                  <span>
                    {formatCurrency(
                      room.categories.reduce((sum, cat) => sum + cat.price, 0)
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pricing Summary */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-300">
          <h3 className="font-semibold text-gray-900 mb-4">金額計算</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>取引区分 ({state.pricing.rateType}):</span>
              <span className="font-medium">
                掛け率 {Math.round(state.pricing.rateValue * 100)}%
              </span>
            </div>

            <div className="flex justify-between text-gray-700">
              <span>税抜小計:</span>
              <span className="font-medium">
                {formatCurrency(state.pricing.subtotal)}
              </span>
            </div>

            <div className="flex justify-between text-gray-700">
              <label>値引き:</label>
              <input
                type="number"
                value={discountAmount}
                onChange={handleDiscountChange}
                className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-gray-900"
              />
            </div>

            <div className="flex justify-between text-gray-700">
              <span>消費税 ({Math.round(state.pricing.taxRate * 100)}%):</span>
              <span className="font-medium">
                {formatCurrency(state.pricing.tax)}
              </span>
            </div>

            <div className="border-t-2 border-amber-300 pt-3 flex justify-between">
              <span className="text-lg font-bold text-gray-900">合計:</span>
              <span className="text-2xl font-bold text-amber-600">
                {formatCurrency(state.pricing.total)}
              </span>
            </div>
          </div>
        </Card>

        {/* Loan Simulator Toggle */}
        {!showLoan && (
          <MobileButton
            onClick={() => setShowLoan(true)}
            variant="outline"
            size="md"
            className="mb-6"
          >
            ローン試算を表示
          </MobileButton>
        )}

        {/* Loan Simulator */}
        {showLoan && (
          <div className="mb-6">
            <LoanSimulator
              principal={state.pricing.total}
              onLoanCalculated={handleLoanApply}
            />
          </div>
        )}

        {/* Loan Summary */}
        {state.loan && (
          <Card className="p-6 mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-300">
            <h3 className="font-semibold text-gray-900 mb-3">ローン試算結果</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">月返済額:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(state.loan.monthlyPayment)}/月
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">返済総額:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(state.loan.totalPayment)}
                </span>
              </div>
            </div>
          </Card>
        )}

        <div className="flex gap-3">
          <MobileButton onClick={() => setCurrentStep(4)} variant="outline">
            戻る
          </MobileButton>
          <MobileButton onClick={handleGeneratePDF} variant="primary">
            見積書を生成
          </MobileButton>
        </div>
      </div>
    </div>
  );
};
