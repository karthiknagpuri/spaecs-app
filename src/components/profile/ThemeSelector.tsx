"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Check } from "lucide-react";

interface ThemeConfig {
  template: 'minimal' | 'gradient' | 'dark' | 'colorful';
  colors: {
    primary: string;
    accent: string;
  };
}

interface ThemeSelectorProps {
  currentTheme: ThemeConfig;
  onThemeChange: (theme: ThemeConfig) => void;
  className?: string;
}

const themeOptions = [
  {
    name: 'Minimal',
    template: 'minimal' as const,
    preview: {
      background: 'bg-white',
      primary: 'bg-black',
      accent: 'bg-gray-100'
    },
    colors: { primary: '#000000', accent: '#f5f5f5' }
  },
  {
    name: 'Gradient',
    template: 'gradient' as const,
    preview: {
      background: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500',
      primary: 'bg-gradient-to-r from-purple-600 to-pink-600',
      accent: 'bg-gradient-to-r from-pink-500 to-orange-500'
    },
    colors: { primary: '#8b5cf6', accent: '#ec4899' }
  },
  {
    name: 'Dark',
    template: 'dark' as const,
    preview: {
      background: 'bg-gray-900',
      primary: 'bg-white',
      accent: 'bg-gray-700'
    },
    colors: { primary: '#ffffff', accent: '#374151' }
  },
  {
    name: 'Colorful',
    template: 'colorful' as const,
    preview: {
      background: 'bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500',
      primary: 'bg-gradient-to-r from-red-500 via-yellow-500 to-purple-500',
      accent: 'bg-gradient-to-r from-cyan-500 to-blue-500'
    },
    colors: { primary: '#ef4444', accent: '#06b6d4' }
  }
];

export function ThemeSelector({ currentTheme, onThemeChange, className = "" }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeSelect = (option: typeof themeOptions[0]) => {
    onThemeChange({
      template: option.template,
      colors: option.colors
    });
    setIsOpen(false);
  };

  const currentThemeOption = themeOptions.find(option => option.template === currentTheme.template);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Palette className="h-4 w-4" />
        Theme: {currentThemeOption?.name || 'Minimal'}
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
        >
          <div className="p-2">
            {themeOptions.map((option) => (
              <button
                key={option.template}
                onClick={() => handleThemeSelect(option)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                  ${currentTheme.template === option.template ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
              >
                {/* Theme Preview */}
                <div className={`w-6 h-6 rounded ${option.preview.background} border border-gray-200 dark:border-gray-600 relative overflow-hidden`}>
                  <div className={`absolute inset-0 ${option.preview.primary} opacity-20`}></div>
                  <div className={`absolute bottom-0 right-0 w-2 h-2 ${option.preview.accent}`}></div>
                </div>

                <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">
                  {option.name}
                </span>

                {currentTheme.template === option.template && (
                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}