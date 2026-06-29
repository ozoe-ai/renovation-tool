"use client";

import React from "react";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 mb-4 text-sm flex-wrap">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <button
            onClick={item.onClick}
            disabled={!item.onClick}
            className={`font-medium transition-colors ${
              item.active
                ? "text-blue-600 cursor-default"
                : item.onClick
                  ? "text-gray-600 hover:text-blue-600 cursor-pointer"
                  : "text-gray-400 cursor-not-allowed"
            }`}
          >
            {item.label}
          </button>
          {index < items.length - 1 && (
            <span className="text-gray-400">/</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
