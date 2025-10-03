"use client";

import React, { ReactNode } from "react";

interface ThemeConfig {
  template: 'minimal' | 'luma' | 'dark' | 'gradient' | 'brutalist' | 'glass';
  colors: {
    primary: string;
    accent: string;
  };
}

interface ThemeWrapperProps {
  theme: ThemeConfig;
  children: ReactNode;
}

export function ThemeWrapper({ theme, children }: ThemeWrapperProps) {
  const getThemeClasses = () => {
    switch (theme.template) {
      case 'minimal':
        return 'bg-white text-gray-900';

      case 'luma':
        return 'bg-purple-50 text-gray-900';

      case 'dark':
        return 'bg-gray-900 text-white';

      case 'gradient':
        return 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white';

      case 'brutalist':
        return 'bg-yellow-300 text-black';

      case 'glass':
        return 'bg-gradient-to-br from-blue-100 to-purple-100 text-gray-900';

      default:
        return 'bg-white text-gray-900';
    }
  };

  const getCSSVariables = () => {
    return {
      '--theme-primary': theme.colors.primary,
      '--theme-accent': theme.colors.accent,
    } as React.CSSProperties;
  };

  return (
    <div
      className={`min-h-screen transition-all duration-500 ease-in-out ${getThemeClasses()}`}
      style={getCSSVariables()}
    >
      {children}
    </div>
  );
}

// Theme-aware card component
export function ThemedCard({
  theme,
  children,
  className = ""
}: {
  theme: ThemeConfig;
  children: ReactNode;
  className?: string
}) {
  const getCardClasses = () => {
    switch (theme.template) {
      case 'minimal':
        return 'bg-white border border-gray-200 shadow-sm';

      case 'luma':
        return 'bg-white border border-purple-200 shadow-sm';

      case 'dark':
        return 'bg-gray-800 border border-gray-700';

      case 'gradient':
        return 'bg-white/10 backdrop-blur-sm border border-white/20';

      case 'brutalist':
        return 'bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]';

      case 'glass':
        return 'bg-white/40 backdrop-blur-md border border-white/60 shadow-lg';

      default:
        return 'bg-white border border-gray-200 shadow-sm';
    }
  };

  return (
    <div className={`${getCardClasses()} ${className}`}>
      {children}
    </div>
  );
}

// Theme-aware button component
export function ThemedButton({
  theme,
  children,
  variant = 'primary',
  className = "",
  ...props
}: {
  theme: ThemeConfig;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
  [key: string]: any;
}) {
  const getButtonClasses = () => {
    const base = 'px-6 py-3 rounded-lg font-semibold transition-all';

    if (variant === 'secondary') {
      switch (theme.template) {
        case 'minimal':
          return `${base} bg-gray-100 text-gray-900 hover:bg-gray-200`;
        case 'luma':
          return `${base} bg-purple-100 text-purple-700 hover:bg-purple-200`;
        case 'dark':
          return `${base} bg-gray-700 text-white hover:bg-gray-600`;
        case 'gradient':
          return `${base} bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm`;
        case 'brutalist':
          return `${base} bg-white border-2 border-black text-black hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none`;
        case 'glass':
          return `${base} bg-white/30 backdrop-blur-md text-gray-900 hover:bg-white/40`;
        default:
          return `${base} bg-gray-100 text-gray-900 hover:bg-gray-200`;
      }
    }

    // Primary variant
    switch (theme.template) {
      case 'minimal':
        return `${base} bg-black text-white hover:bg-gray-800`;

      case 'luma':
        return `${base} bg-purple-600 text-white hover:bg-purple-700`;

      case 'dark':
        return `${base} bg-white text-black hover:bg-gray-100`;

      case 'gradient':
        return `${base} bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700`;

      case 'brutalist':
        return `${base} bg-black border-2 border-black text-white hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none`;

      case 'glass':
        return `${base} bg-indigo-600 backdrop-blur-md text-white hover:bg-indigo-700`;

      default:
        return `${base} bg-black text-white hover:bg-gray-800`;
    }
  };

  return (
    <button className={`${getButtonClasses()} ${className}`} {...props}>
      {children}
    </button>
  );
}

// Theme-aware text component
export function ThemedText({
  theme,
  variant = 'body',
  children,
  className = ""
}: {
  theme: ThemeConfig;
  variant?: 'heading' | 'body' | 'muted';
  children: ReactNode;
  className?: string
}) {
  const getTextClasses = () => {
    if (variant === 'muted') {
      switch (theme.template) {
        case 'minimal':
        case 'luma':
        case 'glass':
          return 'text-gray-600';
        case 'dark':
          return 'text-gray-400';
        case 'gradient':
          return 'text-white/80';
        case 'brutalist':
          return 'text-black/70';
        default:
          return 'text-gray-600';
      }
    }

    if (variant === 'heading') {
      switch (theme.template) {
        case 'minimal':
        case 'luma':
        case 'glass':
          return 'text-gray-900 font-bold';
        case 'dark':
          return 'text-white font-bold';
        case 'gradient':
          return 'text-white font-bold';
        case 'brutalist':
          return 'text-black font-black uppercase';
        default:
          return 'text-gray-900 font-bold';
      }
    }

    // body variant
    switch (theme.template) {
      case 'minimal':
      case 'luma':
      case 'glass':
        return 'text-gray-900';
      case 'dark':
        return 'text-white';
      case 'gradient':
        return 'text-white';
      case 'brutalist':
        return 'text-black';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <span className={`${getTextClasses()} ${className}`}>
      {children}
    </span>
  );
}
