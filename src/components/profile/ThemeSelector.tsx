"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Check } from "lucide-react";

interface ThemeConfig {
  template: 'minimal' | 'luma' | 'dark' | 'gradient' | 'brutalist' | 'glass';
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
    description: 'Clean Apple-style design',
    preview: {
      background: 'bg-white',
      primary: 'bg-black',
      accent: 'bg-gray-100'
    },
    colors: { primary: '#000000', accent: '#f5f5f5' }
  },
  {
    name: 'Luma',
    template: 'luma' as const,
    description: 'Modern with soft purple accents',
    preview: {
      background: 'bg-purple-50',
      primary: 'bg-purple-600',
      accent: 'bg-purple-100'
    },
    colors: { primary: '#8b5cf6', accent: '#f5f3ff' }
  },
  {
    name: 'Dark',
    template: 'dark' as const,
    description: 'Dark mode with white accents',
    preview: {
      background: 'bg-gray-900',
      primary: 'bg-white',
      accent: 'bg-gray-700'
    },
    colors: { primary: '#ffffff', accent: '#374151' }
  },
  {
    name: 'Gradient',
    template: 'gradient' as const,
    description: 'Vibrant colorful gradients',
    preview: {
      background: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500',
      primary: 'bg-gradient-to-r from-purple-600 to-pink-600',
      accent: 'bg-gradient-to-r from-pink-500 to-orange-500'
    },
    colors: { primary: '#8b5cf6', accent: '#ec4899' }
  },
  {
    name: 'Brutalist',
    template: 'brutalist' as const,
    description: 'Bold typography and stark contrast',
    preview: {
      background: 'bg-yellow-300',
      primary: 'bg-black',
      accent: 'bg-white'
    },
    colors: { primary: '#000000', accent: '#ffffff' }
  },
  {
    name: 'Glass',
    template: 'glass' as const,
    description: 'Glassmorphism with blur effects',
    preview: {
      background: 'bg-gradient-to-br from-blue-100 to-purple-100',
      primary: 'bg-white/40',
      accent: 'bg-white/20'
    },
    colors: { primary: '#6366f1', accent: '#a78bfa' }
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
          className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50"
        >
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
              Choose Theme
            </p>
            <div className="space-y-1">
              {themeOptions.map((option) => (
                <button
                  key={option.template}
                  onClick={() => handleThemeSelect(option)}
                  className={`
                    w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all
                    ${currentTheme.template === option.template ? 'bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-600' : ''}
                  `}
                >
                  {/* Theme Preview */}
                  <div className={`w-10 h-10 flex-shrink-0 rounded-lg ${option.preview.background} border border-gray-200 dark:border-gray-600 relative overflow-hidden shadow-sm`}>
                    <div className={`absolute top-0 left-0 right-1/2 bottom-1/2 ${option.preview.primary} opacity-50`}></div>
                    <div className={`absolute bottom-0 right-0 left-1/2 top-1/2 ${option.preview.accent}`}></div>
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {option.name}
                      </span>
                      {currentTheme.template === option.template && (
                        <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                      {option.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
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