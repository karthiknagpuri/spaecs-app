"use client";

import Image from "next/image";
import {
  Heart,
  CheckCircle,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Users,
  Wifi,
  Battery,
  Signal,
  Check,
  Target,
  Star,
  ArrowRight,
  Lock,
  Calendar,
  Crown,
  ExternalLink,
  Copy,
  RefreshCw,
  Search,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion } from "framer-motion";
import { CustomTab, CustomBlock } from "@/types/blocks";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { useState } from "react";
import { getOptimizedLinkHref, getSocialPlatformMetadata } from "@/lib/social-links";

interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  category?: string;
  is_featured?: boolean;
  button_color?: string;
  show_click_count?: boolean;
  click_count?: number;
  display_order?: number;
  thumbnail_url?: string;
  platform?: string;
}

interface ProfileData {
  slug: string;
  title: string;
  description: string;
  avatar_url: string;
  cover_image: string;
  is_verified: boolean;
  social_links: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  tier_configs: Array<{
    id?: string;
    name: string;
    price: number;
    description: string;
    benefits: string[];
  }>;
  total_supporters?: number;
  custom_links?: CustomLink[];
}

interface iPhonePreviewProps {
  profile: ProfileData;
  tabs?: CustomTab[];
  blocks?: Record<string, CustomBlock[]>;
  posts?: any[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onTabVisibilityToggle?: (tabId: string, isVisible: boolean) => void;
}

export default function iPhonePreview({
  profile,
  tabs = [],
  blocks = {},
  posts = [],
  activeTab,
  onTabChange,
  onTabVisibilityToggle,
}: iPhonePreviewProps) {
  const [viewTab, setViewTab] = useState<'memberships' | 'posts' | 'explore'>('memberships');
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffInMs = now.getTime() - posted.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1d ago';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return `${Math.floor(diffInDays / 30)}mo ago`;
  };

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false
  });

  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://spaecs.com'}/${profile.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVisit = () => {
    window.open(profileUrl, '_blank');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Reset to initial state
    setViewTab('memberships');
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  // Filter custom links based on search query
  const filteredLinks = profile.custom_links?.filter(link => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      link.title.toLowerCase().includes(query) ||
      link.description?.toLowerCase().includes(query) ||
      link.category?.toLowerCase().includes(query) ||
      link.url.toLowerCase().includes(query)
    );
  }) || [];

  const allTabs = [
    { id: 'home', title: 'Home', slug: 'home' },
    ...tabs,
  ];

  const currentBlocks = blocks[activeTab] || [];

  return (
    <div className="flex items-center justify-start">
      {/* iPhone 14 Pro Max Frame - 15% smaller than original */}
      <div className="relative w-full max-w-[338px]">
        {/* iPhone Notch & Frame */}
        <div className="relative w-full bg-black rounded-[2.5rem] p-2 shadow-2xl ring-1 ring-black/5">
          {/* Screen */}
          <div className="bg-white dark:bg-neutral-950 rounded-[2rem] overflow-hidden relative">
            {/* Status Bar with Dynamic Island */}
            <div className="absolute top-0 left-0 right-0 z-50">
              {/* Dynamic Island */}
              <div className="h-7 bg-black flex items-center justify-center">
                <div className="w-24 h-6 bg-black rounded-full"></div>
              </div>
              <div className="absolute top-0 left-0 right-0 px-5 pt-1 flex items-center justify-between text-white">
                <span className="text-[11px] font-semibold">{currentTime}</span>
                <div className="flex items-center gap-1">
                  <Signal className="h-2.5 w-2.5" />
                  <Wifi className="h-2.5 w-2.5" />
                  <Battery className="h-2.5 w-2.5" />
                </div>
              </div>
            </div>

            {/* Content - iPhone 14 Pro Max height (15% smaller: 750 * 0.85 = 637px) */}
            <div className="overflow-y-auto bg-white dark:bg-neutral-950" style={{ height: '637px' }}>
              {/* Safari Search Bar - Positioned below notch */}
              <div className="pt-12 pb-2 px-3 bg-white dark:bg-neutral-950 sticky top-0 z-40">
                <div className="flex items-center gap-2">
                  {/* URL Bar */}
                  <div className="flex-1 bg-gray-100 dark:bg-neutral-800 rounded-xl px-3 py-2 flex items-center gap-2">
                    <button
                      onClick={handleRefresh}
                      className="p-0.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 text-gray-500 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">🔒</span>
                        <span className="text-xs text-gray-900 dark:text-white font-medium truncate">
                          spaecs.com/{profile.slug}
                        </span>
                      </div>
                    </div>

                    {/* Action Icons */}
                    <button
                      onClick={handleCopy}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                      title={copied ? "Copied!" : "Copy Link"}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                      )}
                    </button>

                    <button
                      onClick={handleVisit}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                      title="Visit Profile"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pb-4">
                {/* Cover Image */}
                <div className="relative h-32 bg-gray-200 dark:bg-neutral-800 rounded-b-2xl overflow-hidden">
                  {profile.cover_image ? (
                    <Image
                      src={profile.cover_image}
                      alt="Cover"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-100 dark:bg-neutral-800" />
                  )}
                </div>

                {/* Profile Content */}
                <div className="px-4 pb-4">
                  {/* Avatar & Support Button */}
                  <div className="relative -mt-12 mb-3 flex justify-between items-end gap-3">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full bg-white dark:bg-neutral-950 border-4 border-white dark:border-neutral-950 shadow-xl overflow-hidden">
                        {profile.avatar_url ? (
                          <Image
                            src={profile.avatar_url}
                            alt={profile.title}
                            width={96}
                            height={96}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-2xl font-bold text-gray-400 dark:text-gray-600">
                            {profile.title.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                      </div>
                      {profile.is_verified && (
                        <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1 shadow-lg">
                          <CheckCircle className="h-4 w-4 text-white" fill="currentColor" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => alert('Support button clicked! In a real app, this would open payment options.')}
                        className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-semibold text-[10px] flex items-center justify-center gap-1 shadow-lg hover:opacity-90 transition-opacity cursor-pointer active:scale-95 whitespace-nowrap"
                      >
                        <Heart className="h-3 w-3 fill-current" />
                        <span>Support</span>
                      </button>
                      <button
                        onClick={() => alert('Collab button clicked! In a real app, this would open collaboration options.')}
                        className="px-3 py-1.5 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 rounded-full font-semibold text-[10px] flex items-center justify-center gap-1 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer active:scale-95 whitespace-nowrap"
                      >
                        <span>🤝</span>
                        <span>Collab</span>
                      </button>
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="mb-2">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      {profile.title}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{profile.slug}
                    </p>
                  </div>

                  {/* Stats */}
                  {profile.total_supporters !== undefined && profile.total_supporters > 0 && (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-semibold text-gray-900 dark:text-white">{profile.total_supporters}</span>
                        <span>{profile.total_supporters === 1 ? 'Supporter' : 'Supporters'}</span>
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  <p className="text-sm text-gray-900 dark:text-white mb-4 leading-relaxed">
                    {profile.description}
                  </p>

                  {/* Social Links */}
                  {Object.keys(profile.social_links).some(key => profile.social_links[key as keyof typeof profile.social_links]) && (
                    <div className="flex gap-2 mb-5">
                      {profile.social_links.twitter && (
                        <button
                          onClick={() => window.open(`https://twitter.com/${profile.social_links.twitter}`, '_blank')}
                          className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer active:scale-95"
                        >
                          <Twitter className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                        </button>
                      )}
                      {profile.social_links.instagram && (
                        <button
                          onClick={() => window.open(`https://instagram.com/${profile.social_links.instagram}`, '_blank')}
                          className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer active:scale-95"
                        >
                          <Instagram className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                        </button>
                      )}
                      {profile.social_links.youtube && (
                        <button
                          onClick={() => window.open(`https://youtube.com/${profile.social_links.youtube}`, '_blank')}
                          className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer active:scale-95"
                        >
                          <Youtube className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                        </button>
                      )}
                      {profile.social_links.website && (
                        <button
                          onClick={() => window.open(profile.social_links.website, '_blank')}
                          className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer active:scale-95"
                        >
                          <Globe className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Supporter Goal */}
                  {profile.total_supporters !== undefined && (
                    <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">
                            Community Goal
                          </span>
                        </div>
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          {Math.min(Math.round((profile.total_supporters / 100) * 100), 100)}%
                        </span>
                      </div>
                      <div className="mb-1.5">
                        <div className="h-1.5 bg-white dark:bg-neutral-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((profile.total_supporters / 100) * 100, 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-purple-600"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-gray-900 dark:text-white">{profile.total_supporters}</span> out of <span className="font-semibold">100</span> supporters
                      </p>
                    </div>
                  )}

                  {/* Value Proposition */}
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700">
                    <div className="flex items-start gap-2 mb-3">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-950 rounded-lg">
                        <Heart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                          What You'll Get
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Join the community and unlock exclusive benefits
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-start gap-1.5">
                        <Check className="h-3 w-3 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">Exclusive content</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Check className="h-3 w-3 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">Early access</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Check className="h-3 w-3 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">Community perks</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Check className="h-3 w-3 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">Direct support</span>
                      </div>
                    </div>
                  </div>

                  {/* Social Proof */}
                  {profile.total_supporters !== undefined && profile.total_supporters > 0 && (
                    <div className="mb-4 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">
                            {profile.total_supporters} {profile.total_supporters === 1 ? 'person is' : 'people are'} supporting
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                          {[...Array(Math.min(profile.total_supporters, 5))].map((_, i) => (
                            <div
                              key={i}
                              className="h-6 w-6 rounded-full bg-purple-600 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-white text-xs font-semibold"
                            >
                              {String.fromCharCode(65 + i)}
                            </div>
                          ))}
                        </div>
                        {profile.total_supporters > 5 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{profile.total_supporters - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tabs */}
                  <div className="border-b border-gray-200 dark:border-neutral-800 mb-4">
                    <div className="flex gap-4 overflow-x-auto">
                      <button
                        onClick={() => setViewTab('memberships')}
                        className={`pb-2 text-sm font-medium transition-colors relative flex-shrink-0 ${
                          viewTab === 'memberships'
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        Memberships
                        {viewTab === 'memberships' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"></div>
                        )}
                      </button>
                      <button
                        onClick={() => setViewTab('posts')}
                        className={`pb-2 text-sm font-medium transition-colors relative flex-shrink-0 ${
                          viewTab === 'posts'
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        Posts
                        {viewTab === 'posts' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"></div>
                        )}
                      </button>
                      <button
                        onClick={() => setViewTab('explore')}
                        className={`pb-2 text-sm font-medium transition-colors relative flex-shrink-0 ${
                          viewTab === 'explore'
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        Explore
                        {viewTab === 'explore' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"></div>
                        )}
                      </button>

                      {/* Custom Tabs with Visibility Toggle */}
                      {tabs.map((tab) => (
                        <div key={tab.id} className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => onTabChange(tab.id)}
                            className={`pb-2 text-sm font-medium transition-colors relative ${
                              activeTab === tab.id
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400'
                            } ${!tab.is_visible ? 'opacity-50' : ''}`}
                          >
                            {tab.emoji && <span className="mr-1">{tab.emoji}</span>}
                            {tab.label}
                            {activeTab === tab.id && (
                              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"></div>
                            )}
                          </button>
                          {onTabVisibilityToggle && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTabVisibilityToggle(tab.id, !tab.is_visible);
                              }}
                              className="p-0.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                              title={tab.is_visible ? 'Hide tab' : 'Show tab'}
                            >
                              {tab.is_visible ? (
                                <Eye className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                              ) : (
                                <EyeOff className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  {viewTab === 'memberships' && (
                    <div className="space-y-3">
                      {/* Tier Comparison Hint */}
                      <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-medium text-purple-900 dark:text-purple-100">
                            Choose the tier that's right for you
                          </span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      </div>

                      {profile.tier_configs.length > 0 ? (
                        profile.tier_configs.map((tier, index) => (
                          <button
                            key={tier.id}
                            onClick={() => alert(`Selected ${tier.name} tier - ₹${tier.price}/mo\n\nIn a real app, this would open the checkout page.`)}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg active:scale-98 cursor-pointer ${
                              index === 1
                                ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-neutral-800'
                                : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-600'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-base font-bold text-gray-900 dark:text-white">
                                    {tier.name}
                                  </span>
                                  {index === 2 && <Crown className="h-4 w-4 text-yellow-500" />}
                                  {index === 1 && (
                                    <span className="px-1.5 py-0.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-xs font-semibold">
                                      Popular
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {Math.floor(Math.random() * 20) + (index * 10)} members
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-baseline gap-0.5">
                                <span className="text-xl font-bold text-gray-900 dark:text-white">
                                  ₹{tier.price}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">/mo</span>
                              </div>
                            </div>

                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              {tier.description}
                            </p>

                            {tier.benefits && tier.benefits.length > 0 && (
                              <ul className="space-y-1">
                                {tier.benefits.map((benefit, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                                    <Check className="h-3 w-3 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                                    <span>{benefit}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-6">
                          No membership tiers available yet
                        </p>
                      )}
                    </div>
                  )}

                  {viewTab === 'posts' && (
                    <div className="space-y-3">
                      {/* Content Preview Teasers */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          Recent Updates
                        </h3>

                        {posts.length > 0 ? (
                          posts.map((post) => (
                            <a
                              key={post.id}
                              href={post.visibility === 'public' && post.media_url ? post.media_url : `/${profile.slug}/posts/${post.id}`}
                              target={post.visibility === 'public' && post.media_url ? '_blank' : '_self'}
                              rel={post.visibility === 'public' && post.media_url ? 'noopener noreferrer' : undefined}
                              className="block group rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-purple-300 dark:hover:border-purple-700 transition-all hover:shadow-md"
                            >
                              <div className="p-3">
                                {/* Header */}
                                <div className="flex items-start gap-2 mb-2">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                    {profile.title.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                      {post.title}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatTimeAgo(post.published_at || post.created_at)}
                                      </span>
                                      {post.visibility !== 'public' && (
                                        <>
                                          <span className="text-xs text-gray-400">•</span>
                                          {post.visibility === 'tier' && <Crown className="h-2.5 w-2.5 text-purple-600" />}
                                          {post.visibility === 'members' && <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />}
                                          <span className="text-xs font-medium text-purple-600">
                                            {post.visibility === 'tier' ? 'Premium' : 'Supporters'}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {post.visibility !== 'public' && (
                                    <Lock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                  )}
                                </div>

                                {/* Thumbnail */}
                                {post.thumbnail_url && (
                                  <div className="relative mb-2 rounded-lg overflow-hidden aspect-video bg-gray-100 dark:bg-neutral-800">
                                    <img
                                      src={post.thumbnail_url}
                                      alt={post.title}
                                      className="w-full h-full object-cover"
                                    />
                                    {post.post_type === 'video' && (
                                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                        <div className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                                          <div className="w-0 h-0 border-l-[8px] border-l-purple-600 border-y-[6px] border-y-transparent ml-1"></div>
                                        </div>
                                      </div>
                                    )}
                                    {post.media_duration && (
                                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-xs font-medium text-white">
                                        {Math.floor(post.media_duration / 60)}:{String(post.media_duration % 60).padStart(2, '0')}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Preview */}
                                <div className="relative mb-2">
                                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                                    {post.excerpt || post.content.substring(0, 100) + '...'}
                                  </p>
                                  {post.visibility !== 'public' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-neutral-900"></div>
                                  )}
                                </div>

                                {/* Tags & Stats */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex gap-1.5">
                                    {post.category && (
                                      <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded text-xs capitalize">
                                        {post.category}
                                      </span>
                                    )}
                                    {post.read_time_minutes && (
                                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 rounded text-xs">
                                        {post.read_time_minutes} min
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-2 text-xs text-gray-500">
                                    {post.like_count > 0 && (
                                      <span className="flex items-center gap-0.5">
                                        <Heart className="h-3 w-3" />
                                        {post.like_count}
                                      </span>
                                    )}
                                    {post.view_count > 0 && (
                                      <span className="flex items-center gap-0.5">
                                        <Eye className="h-3 w-3" />
                                        {post.view_count}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* CTA */}
                                <div className="w-full py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg text-xs font-medium text-center group-hover:bg-purple-100 dark:group-hover:bg-purple-950 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                                  {post.visibility === 'public' ? 'Open Link →' : (
                                    <span className="flex items-center justify-center gap-1.5">
                                      <Lock className="h-3 w-3" />
                                      Unlock to View
                                    </span>
                                  )}
                                </div>
                              </div>
                            </a>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                              <Calendar className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-xs font-medium text-gray-900 dark:text-white mb-0.5">
                              No posts yet
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Your published posts will appear here
                            </p>
                          </div>
                        )}

                      </div>
                    </div>
                  )}

                  {viewTab === 'explore' && (
                    <div className="space-y-3">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search links..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-9 py-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-gray-400" />
                          </button>
                        )}
                      </div>

                      {/* Results Count */}
                      {searchQuery && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {filteredLinks.length} {filteredLinks.length === 1 ? 'result' : 'results'}
                        </p>
                      )}

                      {/* Custom Links */}
                      <div className="space-y-2">
                        {filteredLinks.length > 0 ? (
                          filteredLinks.map((link) => {
                            // Get optimized link href with deep linking support
                            const optimizedHref = getOptimizedLinkHref(link.url);
                            const platformMetadata = getSocialPlatformMetadata(link.url);

                            return (
                              <button
                                key={link.id}
                                onClick={() => window.open(optimizedHref, link.open_in_new_tab ? '_blank' : '_self')}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-90 active:scale-98 cursor-pointer ${
                                  link.is_featured
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                    : 'bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700'
                                }`}
                                style={link.button_color ? { backgroundColor: link.button_color } : undefined}
                              >
                                {/* Thumbnail */}
                                {link.thumbnail_url && (
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                    <img
                                      src={link.thumbnail_url}
                                      alt={link.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}

                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {!link.thumbnail_url && (link.icon || platformMetadata?.icon) && (
                                    <span className="text-base flex-shrink-0">{link.icon || platformMetadata?.icon}</span>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-xs font-medium truncate ${
                                        link.is_featured
                                          ? 'text-white dark:text-gray-900'
                                          : 'text-gray-900 dark:text-white'
                                      }`}>
                                        {link.title}
                                      </span>
                                      {link.category && (
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                          link.is_featured
                                            ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900'
                                            : 'bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-gray-400'
                                        }`}>
                                          {link.category}
                                        </span>
                                      )}
                                    </div>
                                    {link.description && (
                                      <p className={`text-xs mt-0.5 truncate ${
                                        link.is_featured
                                          ? 'text-white/80 dark:text-gray-900/80'
                                          : 'text-gray-500 dark:text-gray-400'
                                      }`}>
                                        {link.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {link.show_click_count && link.click_count !== undefined && (
                                    <span className={`text-xs ${
                                      link.is_featured
                                        ? 'text-white/70 dark:text-gray-900/70'
                                        : 'text-gray-400'
                                    }`}>
                                      {link.click_count.toLocaleString()}
                                    </span>
                                  )}
                                  <ExternalLink className={`h-3.5 w-3.5 ${
                                    link.is_featured
                                      ? 'text-white dark:text-gray-900'
                                      : 'text-gray-400'
                                  }`} />
                                </div>
                              </button>
                            );
                          })
                        ) : searchQuery ? (
                            <div className="text-center py-8">
                              <Search className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                              <p className="text-xs font-medium text-gray-900 dark:text-white mb-0.5">
                                No links found
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Try different keywords
                              </p>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <ExternalLink className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                              <p className="text-xs font-medium text-gray-900 dark:text-white mb-0.5">
                                No links yet
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Links will appear here
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Custom Tab Content */}
                  {tabs.map((tab) => (
                    activeTab === tab.id && (
                      <div key={tab.id} className="space-y-3">
                        {blocks[tab.id]?.length > 0 ? (
                          blocks[tab.id].map((block) => (
                            <div key={block.id} className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-3">
                              <BlockRenderer block={block} />
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                              {tab.emoji ? (
                                <span className="text-2xl">{tab.emoji}</span>
                              ) : (
                                <div className="h-6 w-6 bg-gray-300 dark:bg-neutral-700 rounded" />
                              )}
                            </div>
                            <p className="text-xs font-medium text-gray-900 dark:text-white mb-0.5">
                              No content yet
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Add blocks to this tab to display content
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-1.5 bg-black dark:bg-white rounded-full opacity-50"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
