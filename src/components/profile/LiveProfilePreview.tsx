"use client";

import Image from "next/image";
import {
  Heart,
  CheckCircle,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  ExternalLink,
  Users,
  Crown,
  Check,
  Tag,
  BarChart3,
  Star,
  Pin
} from "lucide-react";
import { motion } from "framer-motion";

interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  category?: string;
  is_featured?: boolean;
  is_pinned?: boolean;
  button_color?: string;
  show_click_count?: boolean;
  click_count?: number;
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
  custom_links?: CustomLink[];
  tier_configs: Array<{
    id?: string;
    name: string;
    price: number;
    description: string;
    benefits: string[];
  }>;
  total_supporters?: number;
}

interface LiveProfilePreviewProps {
  profile: ProfileData;
  activeTab: 'memberships' | 'explore';
  onTabChange: (tab: 'memberships' | 'explore') => void;
}

export default function LiveProfilePreview({ profile, activeTab, onTabChange }: LiveProfilePreviewProps) {
  return (
    <div className="bg-white dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 dark:bg-neutral-900 px-4 py-3 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Live Preview</h3>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-red-500"></div>
          <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {/* Cover Image */}
        <div className="relative h-40 bg-gray-200 dark:bg-neutral-800 overflow-hidden">
          {profile.cover_image ? (
            <Image
              src={profile.cover_image}
              alt="Cover"
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-900" />
          )}
        </div>

        {/* Profile Content */}
        <div className="px-4 pb-6">
          {/* Avatar & Support Button */}
          <div className="relative -mt-12 mb-3 flex justify-between items-end gap-3">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-white dark:bg-neutral-950 border-4 border-white dark:border-neutral-950 shadow-xl flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.title}
                    width={96}
                    height={96}
                    className="rounded-full object-cover h-full w-full"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-400 dark:text-gray-600">
                      {profile.title?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'CC'}
                    </span>
                  </div>
                )}
              </div>
              {profile.is_verified && (
                <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1 shadow-lg">
                  <CheckCircle className="h-4 w-4 text-white" fill="currentColor" />
                </div>
              )}
            </div>

            <button className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-semibold text-xs flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Support</span>
            </button>
          </div>

          {/* Creator Info */}
          <div className="mb-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {profile.title || 'Your Name'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{profile.slug || 'username'}
            </p>
          </div>

          {/* Stats */}
          {profile.total_supporters !== undefined && profile.total_supporters > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mb-3">
              <Users className="h-3.5 w-3.5" />
              <span className="font-semibold text-gray-900 dark:text-white">{profile.total_supporters}</span>
              <span>{profile.total_supporters === 1 ? 'Supporter' : 'Supporters'}</span>
            </div>
          )}

          {/* Bio */}
          <p className="text-sm text-gray-900 dark:text-white mb-4 leading-relaxed">
            {profile.description || 'Your bio will appear here...'}
          </p>

          {/* Social Links */}
          {Object.values(profile.social_links).some(link => link) && (
            <div className="flex gap-2 mb-6">
              {profile.social_links.twitter && (
                <a className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                  <Twitter className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                </a>
              )}
              {profile.social_links.instagram && (
                <a className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                  <Instagram className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                </a>
              )}
              {profile.social_links.youtube && (
                <a className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                  <Youtube className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                </a>
              )}
              {profile.social_links.website && (
                <a className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                  <Globe className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                </a>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-neutral-800 mb-4">
            <div className="flex gap-6">
              <button
                onClick={() => onTabChange('memberships')}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'memberships'
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Memberships
                {activeTab === 'memberships' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"></div>
                )}
              </button>
              <button
                onClick={() => onTabChange('explore')}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'explore'
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Explore
                {activeTab === 'explore' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"></div>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'memberships' && (
            <div className="space-y-3">
              {profile.tier_configs && profile.tier_configs.length > 0 ? (
                profile.tier_configs.map((tier, index) => (
                  <div
                    key={tier.id || index}
                    className={`p-4 rounded-xl border-2 ${
                      index === 1
                        ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-neutral-800'
                        : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {tier.name}
                      </span>
                      {index === 2 && <Crown className="h-4 w-4 text-yellow-500" />}
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        ₹{tier.price}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">/month</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {tier.description}
                    </p>
                    {tier.benefits && tier.benefits.length > 0 && (
                      <ul className="space-y-1">
                        {tier.benefits.slice(0, 2).map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-8">
                  No membership tiers yet
                </p>
              )}
            </div>
          )}

          {activeTab === 'explore' && (
            <div className="space-y-3">
              {profile.custom_links && profile.custom_links.length > 0 ? (
                profile.custom_links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between p-4 rounded-xl transition-all group ${
                      link.is_featured
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90'
                        : 'bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700'
                    }`}
                    style={link.button_color ? { backgroundColor: link.button_color } : undefined}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {link.icon && (
                        <span className="text-xl flex-shrink-0">{link.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium truncate ${
                            link.is_featured
                              ? 'text-white dark:text-gray-900'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {link.title}
                          </span>
                          {link.category && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
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
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {link.show_click_count && link.click_count !== undefined && (
                        <span className={`text-xs ${
                          link.is_featured
                            ? 'text-white/70 dark:text-gray-900/70'
                            : 'text-gray-400'
                        }`}>
                          {link.click_count.toLocaleString()} clicks
                        </span>
                      )}
                      <ExternalLink className={`h-4 w-4 transition-colors ${
                        link.is_featured
                          ? 'text-white dark:text-gray-900 group-hover:opacity-80'
                          : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200'
                      }`} />
                    </div>
                  </a>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-12">
                  No links yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
