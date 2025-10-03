"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { Palette, Eye, Save, CheckCircle, Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ThemeConfig {
  template: 'minimal' | 'luma' | 'dark' | 'gradient' | 'brutalist' | 'glass';
  colors: {
    primary: string;
    accent: string;
  };
}

interface CreatorProfile {
  id: string;
  slug: string;
  title: string;
  description: string;
  theme_config?: ThemeConfig;
}

// Helper function to determine if a color is light or dark
function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

// Helper function to get theme background
function getThemeBackground(template: string): string {
  const backgrounds: Record<string, string> = {
    minimal: '#ffffff',
    luma: '#faf5ff',
    dark: '#111827',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)',
    brutalist: '#fde047',
    glass: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)'
  };
  return backgrounds[template] || backgrounds.minimal;
}

export default function AppearanceSettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>({
    template: 'minimal',
    colors: { primary: '#000000', accent: '#f5f5f5' }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('creator_pages')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(data);
      if (data.theme_config) {
        setCurrentTheme(data.theme_config);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (theme: ThemeConfig) => {
    setCurrentTheme(theme);
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from('creator_pages')
        .update({ theme_config: currentTheme })
        .eq('id', profile.id);

      if (error) {
        console.error('Error saving theme:', error);
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-8"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Appearance Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize how your public profile looks to your supporters
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Theme Selection */}
          <div className="space-y-6">
            {/* Theme Selection Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Profile Theme
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose a theme that matches your brand
                  </p>
                </div>
              </div>

              <ThemeSelector
                currentTheme={currentTheme}
                onThemeChange={handleThemeChange}
              />
            </div>

            {/* Color Customization Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Custom Colors
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Fine-tune your theme colors
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={currentTheme.colors.primary}
                      onChange={(e) => setCurrentTheme({
                        ...currentTheme,
                        colors: { ...currentTheme.colors, primary: e.target.value }
                      })}
                      className="h-10 w-20 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentTheme.colors.primary}
                      onChange={(e) => setCurrentTheme({
                        ...currentTheme,
                        colors: { ...currentTheme.colors, primary: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={currentTheme.colors.accent}
                      onChange={(e) => setCurrentTheme({
                        ...currentTheme,
                        colors: { ...currentTheme.colors, accent: e.target.value }
                      })}
                      className="h-10 w-20 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentTheme.colors.accent}
                      onChange={(e) => setCurrentTheme({
                        ...currentTheme,
                        colors: { ...currentTheme.colors, accent: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="#f5f5f5"
                    />
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  onClick={() => {
                    const defaultColors = {
                      minimal: { primary: '#000000', accent: '#f5f5f5' },
                      luma: { primary: '#8b5cf6', accent: '#f5f3ff' },
                      dark: { primary: '#ffffff', accent: '#1f2937' },
                      gradient: { primary: '#a855f7', accent: '#f97316' },
                      brutalist: { primary: '#000000', accent: '#fde047' },
                      glass: { primary: '#6366f1', accent: '#e0e7ff' }
                    };
                    setCurrentTheme({
                      ...currentTheme,
                      colors: defaultColors[currentTheme.template]
                    });
                  }}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset to theme defaults
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Live Preview */}
          <div className="space-y-6">
            {/* Live Preview Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Live Preview
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      See how your theme looks
                    </p>
                  </div>
                </div>
                {profile?.slug && (
                  <a
                    href={`/${profile.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                  >
                    Open full page →
                  </a>
                )}
              </div>

              {/* Theme Preview */}
              <div
                className="rounded-xl overflow-hidden border-2 transition-all duration-300"
                style={{
                  borderColor: currentTheme.colors.primary,
                  backgroundColor: getThemeBackground(currentTheme.template)
                }}
              >
                <div className="p-6 space-y-4">
                  {/* Mock Profile Header */}
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-full"
                      style={{ backgroundColor: currentTheme.colors.primary }}
                    />
                    <div className="flex-1">
                      <div
                        className="h-4 w-32 rounded mb-2"
                        style={{ backgroundColor: currentTheme.colors.primary }}
                      />
                      <div
                        className="h-3 w-24 rounded"
                        style={{
                          backgroundColor: currentTheme.colors.accent,
                          opacity: 0.6
                        }}
                      />
                    </div>
                  </div>

                  {/* Mock Button */}
                  <button
                    className="w-full py-3 rounded-lg font-semibold transition-all"
                    style={{
                      backgroundColor: currentTheme.colors.primary,
                      color: isLightColor(currentTheme.colors.primary) ? '#000' : '#fff'
                    }}
                  >
                    Support Button
                  </button>

                  {/* Mock Card */}
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: currentTheme.colors.accent }}
                  >
                    <div
                      className="h-3 w-full rounded mb-2"
                      style={{
                        backgroundColor: currentTheme.colors.primary,
                        opacity: 0.3
                      }}
                    />
                    <div
                      className="h-3 w-2/3 rounded"
                      style={{
                        backgroundColor: currentTheme.colors.primary,
                        opacity: 0.2
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button - Full Width */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AnimatePresence>
                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-2 text-green-600 dark:text-green-400"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Theme saved successfully!</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-semibold transition-colors shadow-sm"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800 p-4">
          <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
            💡 About Themes
          </h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Your theme will be applied to your public profile page, including your bio, membership tiers, and supporter list. Supporters will see your profile with the theme you select here.
          </p>
        </div>
      </div>
    </div>
  );
}
