"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface FlexStackProps {
  children: ReactNode;
  direction?: "row" | "col" | "responsive";
  gap?: "xs" | "sm" | "md" | "lg" | "xl" | "responsive";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
  className?: string;
}

export function FlexStack({
  children,
  direction = "responsive",
  gap = "responsive",
  align = "stretch",
  justify = "start",
  wrap = false,
  className
}: FlexStackProps) {
  const directionClass = {
    row: "flex-row",
    col: "flex-col",
    responsive: "flex-col sm:flex-row"
  }[direction];

  const gapClass = {
    xs: "gap-2",
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
    responsive: "gap-4 sm:gap-6"
  }[gap];

  const alignClass = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch"
  }[align];

  const justifyClass = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly"
  }[justify];

  return (
    <div className={cn(
      "flex",
      directionClass,
      gapClass,
      alignClass,
      justifyClass,
      wrap && "flex-wrap",
      className
    )}>
      {children}
    </div>
  );
}