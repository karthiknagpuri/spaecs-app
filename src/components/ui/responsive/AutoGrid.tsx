"use client";

import { cn } from "@/lib/utils";
import { ReactNode, CSSProperties } from "react";

interface AutoGridProps {
  children: ReactNode;
  minWidth?: string;
  gap?: "xs" | "sm" | "md" | "lg" | "xl" | "responsive";
  className?: string;
}

export function AutoGrid({
  children,
  minWidth = "250px",
  gap = "responsive",
  className
}: AutoGridProps) {
  const gapClass = {
    xs: "gap-2",
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
    responsive: "gap-4 sm:gap-6"
  }[gap];

  const style: CSSProperties = {
    gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`
  };

  return (
    <div
      className={cn(
        "grid",
        gapClass,
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}