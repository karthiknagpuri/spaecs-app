"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ResponsiveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "responsive";
  fullWidthMobile?: boolean;
  loading?: boolean;
}

export function ResponsiveButton({
  children,
  variant = "primary",
  size = "responsive",
  fullWidthMobile = true,
  loading = false,
  className,
  disabled,
  ...props
}: ResponsiveButtonProps) {
  const variantClass = {
    primary: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg",
    secondary: "bg-white/10 text-white hover:bg-white/20 backdrop-blur",
    outline: "border border-white/20 text-white hover:bg-white/10",
    ghost: "text-white hover:bg-white/10"
  }[variant];

  const sizeClass = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    responsive: "px-4 py-2 text-sm sm:px-5 sm:py-2.5 sm:text-base"
  }[size];

  return (
    <button
      className={cn(
        "relative rounded-full font-medium transition-all duration-200",
        "min-h-[44px] touch-manipulation",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-95",
        variantClass,
        sizeClass,
        fullWidthMobile && "w-full sm:w-auto",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <span className={loading ? "invisible" : ""}>{children}</span>
    </button>
  );
}