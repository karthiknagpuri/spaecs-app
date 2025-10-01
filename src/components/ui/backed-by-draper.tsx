"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export const BackedByDraper = ({ className }: { className?: string }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    const onMove = (e: MouseEvent) => {
      const el = hostRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full",
        "px-2 py-2 isolate select-none",
        "transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4",
        className
      )}
      style={
        {
          ["--mx" as any]: "50%",
          ["--my" as any]: "50%",
        } as React.CSSProperties
      }
    >
      {/* Subtle moving glow - adjusted for purple/blue theme */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-[radial-gradient(160px_80px_at_var(--mx)_var(--my),rgba(99,102,241,0.3),transparent_70%)]",
            "blur-2xl"
          )}
        />
      </div>

      {/* Glass pill */}
      <div
        className={cn(
          "relative z-10 rounded-full px-4 py-2",
          "backdrop-blur-xl",
          "bg-white/10",
          "ring-1 ring-white/20",
          "shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "h-6 w-6 shrink-0 rounded-md grid place-items-center",
              "bg-gradient-to-br from-indigo-500 to-purple-600",
              "shadow-[0_2px_10px_rgba(99,102,241,0.55)]"
            )}
            aria-hidden="true"
          >
            <DraperLogo className="h-4 w-4 text-white" />
          </span>
          <span className="text-sm md:text-base font-medium tracking-wide text-white">
            Backed by Draper Ecosystem
          </span>
        </div>
      </div>
    </div>
  );
};

// Draper D logo
function DraperLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" {...props}>
      {/* Outer D shape */}
      <path
        d="M25 20h25c19.33 0 35 15.67 35 35s-15.67 35-35 35H25V20z"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      {/* Inner D shape */}
      <path
        d="M35 30h15c13.81 0 25 11.19 25 25s-11.19 25-25 25H35V30z"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      {/* Vertical bar */}
      <rect
        x="25"
        y="20"
        width="10"
        height="70"
        fill="currentColor"
      />
    </svg>
  );
}