"use client";

import React from "react";

interface HeaderProps {
  step: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  step,
  totalSteps = 8,
  title,
  subtitle,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="text-sm font-medium bg-blue-500 px-3 py-1 rounded-full">
          ステップ {step + 1}/{totalSteps}
        </div>
      </div>
      {subtitle && <p className="text-blue-100">{subtitle}</p>}
      {/* Progress bar */}
      <div className="mt-4 bg-blue-500 rounded-full h-2 w-full overflow-hidden">
        <div
          className="bg-white h-full transition-all duration-300 ease-out"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
};
