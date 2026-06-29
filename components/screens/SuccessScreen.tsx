"use client";

import React from "react";
import { Header } from "../Header";
import { MobileButton } from "../MobileButton";
import { Card } from "@/components/ui/card";
import { useWizard } from "@/lib/WizardContext";
import { generateQuote } from "@/lib/quote-generator";
import { formatCurrency } from "@/lib";

export const SuccessScreen: React.FC = () => {
  const { state, reset } = useWizard();

  const quote = generateQuote(state);

  const handleNewEstimate = () => {
    reset();
  };

  if (!quote) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Header
          step={7}
          title="見積書生成完了"
          subtitle="ご利用ありがとうございました"
        />

        {/* Success Message */}
        <Card className="p-8 text-center mb-6 bg-white border-2 border-green-500">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            見積書が生成されました
          </h2>
          <p className="text-gray-600">
            JSON形式とCSV形式で出力されています
          </p>
        </Card>

        {/* Summary */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">見積概要</h3>
          <div className="space-y-3">
            <div className="flex justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">見積番号:</span>
              <span className="font-mono font-semibold text-gray-900">
                {quote.meta.estimateNo}
              </span>
            </div>
            <div className="flex justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">顧客名:</span>
              <span className="font-semibold text-gray-900">
                {quote.customer.name}
                {quote.customer.honorific}
              </span>
            </div>
            <div className="flex justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">案件名:</span>
              <span className="font-semibold text-gray-900">
                {quote.customer.projectName}
              </span>
            </div>
            <div className="flex justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600">部屋数:</span>
              <span className="font-semibold text-gray-900">
                {quote.rooms.length}個
              </span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-lg font-semibold text-gray-900">
                合計金額:
              </span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(quote.pricing.total)}
              </span>
            </div>
          </div>
        </Card>

        {/* Details */}
        <Card className="p-6 mb-6 bg-gray-50 border-gray-300">
          <h3 className="font-semibold text-gray-900 mb-4">詳細情報</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">取引区分:</span>
              <span className="font-medium text-gray-900">
                {quote.customer.segment}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">物件種別:</span>
              <span className="font-medium text-gray-900">
                {quote.customer.propertyType}
                {quote.customer.floors ? ` (${quote.customer.floors}階)` : ""}
                {quote.customer.roomType ? ` (${quote.customer.roomType})` : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">選択部屋:</span>
              <span className="font-medium text-gray-900">
                {quote.rooms.map((r) => r.roomName).join(", ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">カテゴリ数:</span>
              <span className="font-medium text-gray-900">
                {quote.rooms.reduce((sum, r) => sum + r.categories.length, 0)}個
              </span>
            </div>
          </div>
        </Card>

        {/* Loan Info */}
        {quote.loan && (
          <Card className="p-6 mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-300">
            <h3 className="font-semibold text-gray-900 mb-3">ローン試算情報</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">月返済額:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(quote.loan.monthlyPayment)}/月
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">返済年数:</span>
                <span className="font-medium text-gray-900">
                  {quote.loan.years}年
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Export Info */}
        <Card className="p-4 bg-blue-50 border-blue-300 mb-6">
          <p className="text-sm text-gray-700">
            📊 見積書はJSON形式とCSV形式で出力されました。
            ExcelやGoogleスプレッドシートにインポートできます。
          </p>
        </Card>

        <div className="flex gap-3">
          <MobileButton onClick={handleNewEstimate} variant="primary">
            新しい見積を作成
          </MobileButton>
        </div>
      </div>
    </div>
  );
};
