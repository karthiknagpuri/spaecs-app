"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export function Container({
  children,
  className,
  maxWidth = "xl"
}: ContainerProps) {
  const maxWidthClass = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    "2xl": "max-w-[1536px]",
    full: "max-w-full"
  }[maxWidth];

  return (
    <div className={cn(
      "w-full mx-auto",
      "px-4 sm:px-6 lg:px-8",
      maxWidthClass,
      className
    )}>
      {children}
    </div>
  );
}