"use client";

import React, { useState } from "react";
import { calculateLoan, formatCurrency } from "@/lib";
import { MobileButton } from "./MobileButton";
import { Card } from "@/components/ui/card";

interface LoanSimulatorProps {
  principal: number;
  onLoanCalculated?: (downPayment: number, monthlyPayment: number) => void;
}

export const LoanSimulator: React.FC<LoanSimulatorProps> = ({
  principal,
  onLoanCalculated,
}) => {
  const [downPayment, setDownPayment] = useState(
    Math.floor(principal * 0.2)
  );
  const [annualRate, setAnnualRate] = useState(3.0);
  const [years, setYears] = useState(20);

  const loan = calculateLoan(principal, downPayment, annualRate, years);

  const handleApply = () => {
    onLoanCalculated?.(downPayment, loan.monthlyPayment);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">ローンシミュレーション</h3>

      <div className="space-y-4">
        {/* Down Payment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            頭金: {formatCurrency(downPayment)}
          </label>
          <input
            type="range"
            min="0"
            max={principal}
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0円</span>
            <span>{formatCurrency(principal)}</span>
          </div>
        </div>

        {/* Annual Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            年利率: {annualRate.toFixed(2)}%
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={annualRate}
            onChange={(e) => setAnnualRate(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>10%</span>
          </div>
        </div>

        {/* Years */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            返済年数: {years}年
          </label>
          <input
            type="range"
            min="5"
            max="35"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5年</span>
            <span>35年</span>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white p-4 rounded-lg mt-6 space-y-2 border-l-4 border-blue-500">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">借入金:</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(principal - downPayment)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">月返済額:</span>
            <span className="text-lg font-bold text-blue-600">
              {formatCurrency(loan.monthlyPayment)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">総返済額:</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(loan.totalPayment)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">総利息:</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(loan.totalInterest)}
            </span>
          </div>
        </div>

        <MobileButton onClick={handleApply} variant="primary" className="mt-4">
          このシミュレーション結果を適用
        </MobileButton>
      </div>
    </Card>
  );
};
