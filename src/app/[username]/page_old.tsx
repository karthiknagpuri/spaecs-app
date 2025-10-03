"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Coffee,
  DollarSign,
  Users,
  CheckCircle,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Share2,
  Gift,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  TrendingUp,
  Edit3,
  Save,
  X,
  Loader2,
  Eye,
  Settings,
  AtSign,
  AlertCircle
} from "lucide-react";
import { SupportModal } from "@/components/payment/SupportModal";
import { ImageUpload } from "@/components/profile/ImageUpload";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { LeadCapture } from "@/components/profile/LeadCapture";
import { useRealTimeProfile } from "@/hooks/useRealTimeProfile";
import { useProfileOwnership } from "@/hooks/useProfileRedirect";
import Image from "next/image";

interface CreatorProfile {
  id: string;
  slug: string;
  title: string;
  description: string;
  avatar_url?: string;
  cover_image?: string;
  is_verified: boolean;
  followers_count: number;
  monthly_earnings: number;
  social_links: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
    tiktok?: string;
    linkedin?: string;
    discord?: string;
    telegram?: string;
  };
  tier_configs: {
    id: string;
    name: string;
    price: number;
    description: string;
    benefits: string[];
  }[];
  custom_links?: {
    id: string;
    title: string;
    url: string;
    icon?: string;
    category: string;
  }[];
  theme_config?: {
    template: 'minimal' | 'gradient' | 'dark' | 'colorful';
    colors: {
      primary: string;
      accent: string;
    };
  };
}

export default function CreatorProfilePage() {
  const params = useParams();
  const username = params.username as string;

  // Real-time hooks
  const {
    profile,
    isOwner,
    loading,
    error,
    updateProfile,
    saveStatus,
    lastSaved,
    hasUnsavedChanges
  } = useRealTimeProfile(username);

  // UI state
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showAllSocials, setShowAllSocials] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState("");
  const [changingUsername, setChangingUsername] = useState(false);

  // Fallback profile data if no real profile exists
  const fallbackProfile = {
    id: "fallback",
    slug: username.replace('@', ''),
    title: "Creator Profile",
    description: "Welcome to my creator profile! Connect with me and support my work.",
    avatar_url: "",
    cover_image: "",
    is_verified: false,
    followers_count: 0,
    monthly_earnings: 0,
    social_links: {},
    tier_configs: [
      {
        id: "1",
        name: "Coffee Supporter",
        price: 99,
        description: "Buy me a coffee and support my work",
        benefits: ["Supporter badge", "Monthly newsletter", "Early access to content"]
      },
      {
        id: "2",
        name: "Creative Fan",
        price: 499,
        description: "Get exclusive behind-the-scenes content",
        benefits: ["All Coffee benefits", "Exclusive tutorials", "Monthly Q&A sessions", "Discord access"]
      }
    ],
    custom_links: [],
    theme_config: {
      template: 'minimal' as const,
      colors: {
        primary: '#000000',
        accent: '#0066FF'
      }
    }
  };

  // Use real profile data or fallback
  const displayProfile = profile || fallbackProfile;

  // Auto-save handlers
  const handleFieldUpdate = async (field: string, value: any) => {
    if (!isOwner || !profile) return;

    try {
      await updateProfile({ [field]: value });
      setEditingField(null);
    } catch (err: any) {
      setUploadError(err.message);
    }
  };

  const handleImageUpload = async (url: string) => {
    if (!isOwner || !profile) return;

    try {
      await updateProfile({ avatar_url: url });
      setUploadError(null);
    } catch (err: any) {
      setUploadError(err.message);
    }
  };

  const handleThemeChange = async (newTheme: any) => {
    if (!isOwner || !profile) return;

    try {
      await updateProfile({ theme_config: newTheme });
    } catch (err: any) {
      setUploadError(err.message);
    }
  };

  // Email capture handler
  const handleEmailCapture = async (email: string) => {
    // TODO: Implement email capture to your email service
    console.log('Email captured:', email);
  };

  const quickSupportAmounts = [
    { icon: Coffee, label: "Coffee", amount: 80 },
    { icon: Heart, label: "Support", amount: 200 },
    { icon: Gift, label: "Gift", amount: 500 },
    { icon: Star, label: "Super", amount: 1000 }
  ];

  const handleQuickSupport = (amount: number) => {
    setSelectedTier(null);
    setShowSupportModal(true);
  };

  // Username change handlers
  const checkUsernameAvailability = async (name: string) => {
    setCheckingUsername(true);
    setUsernameError("");

    try {
      const response = await fetch(`/api/profile/check-username?username=${encodeURIComponent(name)}`);
      const data = await response.json();

      if (response.ok) {
        setUsernameAvailable(data.available);
      } else {
        setUsernameError(data.error);
        setUsernameAvailable(false);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError("Failed to check username availability");
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = async () => {
    if (!newUsername || !usernameAvailable) return;

    setChangingUsername(true);
    setUsernameError("");

    try {
      const response = await fetch('/api/profile/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUsername: newUsername.toLowerCase() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // Redirect to new username URL
      window.location.href = data.newUrl;
    } catch (error: any) {
      setUsernameError(error.message);
      setChangingUsername(false);
    }
  };

  useEffect(() => {
    if (newUsername.length >= 3) {
      const timer = setTimeout(() => {
        checkUsernameAvailability(newUsername);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
      setUsernameError("");
    }
  }, [newUsername]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleImageError = (error: string) => {
    setUploadError(error);
  };

  // Theme system
  const getThemeClasses = () => {
    const theme = displayProfile.theme_config?.template || 'minimal';
    const colors = displayProfile.theme_config?.colors || { primary: '#000000', accent: '#0066FF' };

    switch (theme) {
      case 'gradient':
        return {
          background: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500',
          container: 'bg-white/90 dark:bg-black/90 backdrop-blur-sm',
          primary: 'bg-gradient-to-r from-purple-600 to-pink-600',
          accent: 'bg-gradient-to-r from-pink-500 to-orange-500'
        };
      case 'dark':
        return {
          background: 'bg-gray-900',
          container: 'bg-gray-800',
          primary: 'bg-white text-black',
          accent: 'bg-gray-700'
        };
      case 'colorful':
        return {
          background: 'bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500',
          container: 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm',
          primary: 'bg-rainbow bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500',
          accent: 'bg-gradient-to-r from-cyan-500 to-blue-500'
        };
      default: // minimal
        return {
          background: 'bg-white dark:bg-black',
          container: 'bg-white dark:bg-black',
          primary: 'bg-black dark:bg-white text-white dark:text-black',
          accent: 'bg-gray-100 dark:bg-gray-900'
        };
    }
  };

  const themeClasses = getThemeClasses();

  const primarySocials = ['instagram', 'youtube'];
  const otherSocials = Object.entries(displayProfile.social_links).filter(
    ([platform]) => !primarySocials.includes(platform) && displayProfile.social_links[platform as keyof typeof displayProfile.social_links]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-24 w-24 bg-gray-200 dark:bg-gray-800 rounded-full mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile-First Phone View Container */}
      <div className={`min-h-screen ${themeClasses.background}`}>
        {/* Phone Frame - Max width for mobile optimization */}
        <div className={`max-w-sm mx-auto ${themeClasses.container} min-h-screen`}>

          {/* Profile Header */}
          <div className="relative px-6 pt-12 pb-6">
            {/* Theme Selector and Edit Controls for Owner */}
            {isOwner && (
              <div className="absolute top-4 left-4 flex gap-2">
                <ThemeSelector
                  currentTheme={displayProfile.theme_config || { template: 'minimal', colors: { primary: '#000000', accent: '#0066FF' } }}
                  onThemeChange={handleThemeChange}
                />
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isEditMode
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {isEditMode ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                  {isEditMode ? 'Preview' : 'Edit'}
                </button>
                {isEditMode && (
                  <button
                    onClick={() => setShowUsernameModal(true)}
                    className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Save Status and Share Button */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {/* Auto-save Status */}
              {isOwner && (
                <AnimatePresence>
                  {saveStatus !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        saveStatus === 'saving' ? 'bg-blue-100 text-blue-700' :
                        saveStatus === 'saved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}
                    >
                      {saveStatus === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
                      {saveStatus === 'saved' && <CheckCircle className="h-3 w-3" />}
                      {saveStatus === 'error' && <X className="h-3 w-3" />}
                      {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Error'}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {/* Share Button */}
              <button className="p-2 bg-gray-100 dark:bg-gray-900 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                <Share2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Profile Picture */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                {isOwner && isEditMode ? (
                  <ImageUpload
                    currentImageUrl={displayProfile.avatar_url}
                    onUploadComplete={handleImageUpload}
                    onError={handleImageError}
                  />
                ) : (
                  <div className="h-24 w-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                    {displayProfile.avatar_url ? (
                      <Image
                        src={displayProfile.avatar_url}
                        alt={displayProfile.title}
                        width={96}
                        height={96}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-gray-400 dark:text-gray-600">
                        {displayProfile.title.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                )}
                {displayProfile.is_verified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                    <CheckCircle className="h-4 w-4 text-white" fill="currentColor" />
                  </div>
                )}
              </div>
            </div>

            {/* Upload Error Display */}
            {uploadError && (
              <div className="text-center mb-2">
                <p className="text-xs text-red-500">{uploadError}</p>
              </div>
            )}

            {/* Name and Stats */}
            <div className="text-center mb-4">
              {/* Editable Title */}
              {isOwner && isEditMode && editingField === 'title' ? (
                <input
                  type="text"
                  defaultValue={displayProfile.title}
                  onBlur={(e) => handleFieldUpdate('title', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleFieldUpdate('title', e.currentTarget.value)}
                  className="text-xl font-semibold text-gray-900 dark:text-white mb-1 bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none text-center w-full max-w-xs"
                  autoFocus
                />
              ) : (
                <h1
                  className={`text-xl font-semibold text-gray-900 dark:text-white mb-1 ${
                    isOwner && isEditMode ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1' : ''
                  }`}
                  onClick={() => isOwner && isEditMode && setEditingField('title')}
                >
                  {displayProfile.title}
                  {isOwner && isEditMode && (
                    <Edit3 className="inline h-3 w-3 ml-1 opacity-50" />
                  )}
                </h1>
              )}

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                @{displayProfile.slug}
              </p>

              {/* Stats Row */}
              <div className="flex justify-center gap-6 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatNumber(displayProfile.followers_count)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">followers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    ₹{formatNumber(displayProfile.monthly_earnings)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">earned</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    +15%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">growth</div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {isOwner && isEditMode && editingField === 'description' ? (
              <textarea
                defaultValue={displayProfile.description}
                onBlur={(e) => handleFieldUpdate('description', e.target.value)}
                className="w-full text-sm text-gray-700 dark:text-gray-300 text-center mb-6 leading-relaxed bg-transparent border border-gray-300 dark:border-gray-600 rounded px-3 py-2 outline-none resize-none"
                rows={3}
                autoFocus
              />
            ) : (
              <p
                className={`text-sm text-gray-700 dark:text-gray-300 text-center mb-6 leading-relaxed ${
                  isOwner && isEditMode ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1' : ''
                }`}
                onClick={() => isOwner && isEditMode && setEditingField('description')}
              >
                {displayProfile.description}
                {isOwner && isEditMode && (
                  <Edit3 className="inline h-3 w-3 ml-1 opacity-50" />
                )}
              </p>
            )}

            {/* Primary Support Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSupportModal(true)}
              className={`w-full py-3 ${themeClasses.primary} rounded-xl font-medium mb-3 flex items-center justify-center gap-2`}
            >
              <Heart className="h-4 w-4" />
              Support Me
            </motion.button>

            {/* Lead Capture */}
            <LeadCapture
              creatorName={displayProfile.title}
              leadMagnet={{
                title: "Join my community",
                description: `Get exclusive behind-the-scenes content, early access to new projects, and special supporter perks from ${displayProfile.title}.`,
                type: 'exclusive'
              }}
              onEmailCapture={handleEmailCapture}
              className="mb-4"
            />
          </div>

          {/* Primary Social Links */}
          {(displayProfile.social_links.instagram || displayProfile.social_links.youtube) && (
            <div className="px-6 mb-6">
              <div className="flex gap-3">
                {displayProfile.social_links.instagram && (
                  <a
                    href={`https://instagram.com/@${displayProfile.social_links.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium"
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </a>
                )}
                {displayProfile.social_links.youtube && (
                  <a
                    href={`https://youtube.com/@${displayProfile.social_links.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl font-medium"
                  >
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Quick Support Amounts */}
          <div className="px-6 mb-6">
            <div className="grid grid-cols-4 gap-2">
              {quickSupportAmounts.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickSupport(item.amount)}
                    className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
                  >
                    <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{item.amount}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Custom Links */}
          {displayProfile.custom_links && displayProfile.custom_links.length > 0 && (
            <div className="px-6 mb-6">
              <div className="space-y-3">
                {displayProfile.custom_links.map((link) => (
                  <motion.a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                      {link.title}
                    </span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </motion.a>
                ))}
              </div>
            </div>
          )}

          {/* More Social Links */}
          {otherSocials.length > 0 && (
            <div className="px-6 mb-6">
              <button
                onClick={() => setShowAllSocials(!showAllSocials)}
                className="flex items-center justify-center gap-2 w-full py-2 text-sm text-gray-500 dark:text-gray-400"
              >
                More links
                {showAllSocials ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showAllSocials && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-4 gap-2 mt-3"
                >
                  {otherSocials.map(([platform, username]) => {
                    const getIcon = (platform: string) => {
                      switch (platform) {
                        case 'twitter': return Twitter;
                        case 'website': return Globe;
                        default: return Globe;
                      }
                    };

                    const Icon = getIcon(platform);
                    const url = platform === 'website'
                      ? `https://${username}`
                      : `https://${platform}.com/${username}`;

                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                          {platform}
                        </span>
                      </a>
                    );
                  })}
                </motion.div>
              )}
            </div>
          )}

          {/* Membership Tiers Compact */}
          <div className="px-6 pb-12">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Support Tiers
            </h3>
            <div className="space-y-2">
              {displayProfile.tier_configs.slice(0, 2).map((tier) => (
                <motion.button
                  key={tier.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedTier(tier.id);
                    setShowSupportModal(true);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
                >
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {tier.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {tier.description}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{tier.price}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      /month
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <SupportModal
          creator={displayProfile}
          selectedTierId={selectedTier}
          onClose={() => {
            setShowSupportModal(false);
            setSelectedTier(null);
          }}
        />
      )}

      {/* Username Change Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Profile Settings
              </h2>
              <button
                onClick={() => {
                  setShowUsernameModal(false);
                  setNewUsername("");
                  setUsernameError("");
                  setUsernameAvailable(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Change Username Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Change Username
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  You can only change your username once every 30 days. Your current URL is: spaecs.com/@{displayProfile.slug}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <AtSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                        placeholder={displayProfile.slug}
                        maxLength={20}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {checkingUsername && (
                          <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                        )}
                        {!checkingUsername && usernameAvailable === true && (
                          <Check className="h-5 w-5 text-green-500" />
                        )}
                        {!checkingUsername && usernameAvailable === false && (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    {usernameError && (
                      <div className="mt-2 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600">{usernameError}</p>
                      </div>
                    )}
                    {usernameAvailable === true && (
                      <p className="mt-2 text-sm text-green-600">This username is available!</p>
                    )}
                  </div>

                  <button
                    onClick={handleUsernameChange}
                    disabled={!newUsername || !usernameAvailable || changingUsername}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
                      newUsername && usernameAvailable && !changingUsername
                        ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {changingUsername ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Changing Username...
                      </>
                    ) : (
                      'Change Username'
                    )}
                  </button>
                </div>
              </div>

              {/* Additional Settings Can Go Here */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  More settings coming soon...
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}