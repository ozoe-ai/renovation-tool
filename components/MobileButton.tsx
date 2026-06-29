"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

export const MobileButton = React.forwardRef<
  HTMLButtonElement,
  MobileButtonProps
>(
  (
    {
      variant = "primary",
      size = "lg",
      isLoading = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "font-semibold rounded-lg transition-all duration-200 w-full focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variantClasses = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      secondary:
        "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
      outline:
        "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
    };

    const sizeClasses = {
      sm: "px-4 py-2 text-sm",
      md: "px-5 py-3 text-base",
      lg: "px-6 py-4 text-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          disabled || isLoading ? "opacity-60 cursor-not-allowed" : "",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            処理中...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

MobileButton.displayName = "MobileButton";
