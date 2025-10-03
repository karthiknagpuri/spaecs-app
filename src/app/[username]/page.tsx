"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import {
  Heart,
  CheckCircle,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Loader2,
  Check,
  Users,
  Crown,
  ExternalLink,
  TrendingUp,
  Calendar,
  Target,
  Sparkles,
  ArrowRight,
  Lock,
  Star,
  Search,
  X,
  Handshake
} from "lucide-react";
import { SupportModal } from "@/components/payment/SupportModal";
import PostsTab from "@/components/profile/PostsTab";
import CollabModal from "@/components/profile/CollabModal";
import BrandLogos from "@/components/profile/BrandLogos";
import CreatorStats from "@/components/profile/CreatorStats";
import PublicBlockRenderer from "@/components/profile/PublicBlockRenderer";
import { ThemeWrapper } from "@/components/profile/ThemeWrapper";
import { CustomTab, CustomBlock } from "@/types/blocks";
import Image from "next/image";

interface ThemeConfig {
  template: 'minimal' | 'luma' | 'dark' | 'gradient' | 'brutalist' | 'glass';
  colors: {
    primary: string;
    accent: string;
  };
}

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
}

interface CreatorProfile {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string;
  avatar_url?: string;
  cover_image?: string;
  is_verified: boolean;
  social_links: {
    twitter?: string;
    twitter_followers?: number;
    instagram?: string;
    instagram_followers?: number;
    youtube?: string;
    youtube_subscribers?: number;
    website?: string;
  };
  custom_links?: CustomLink[];
  tier_configs: {
    id: string;
    name: string;
    price: number;
    description: string;
    benefits: string[];
  }[];
  total_supporters?: number;
  theme_config?: ThemeConfig;
}

interface Post {
  id: string;
  creator_id: string;
  title: string;
  content: string;
  excerpt?: string;
  post_type: string;
  media_url?: string;
  thumbnail_url?: string;
  visibility: string;
  required_tier_id?: string;
  is_published: boolean;
  published_at?: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  category?: string;
  tags?: string[];
  is_featured: boolean;
  read_time_minutes?: number;
  created_at: string;
  updated_at: string;
  membership_tiers?: {
    id: string;
    name: string;
    price: number;
  };
}

export default function CreatorProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'memberships' | 'posts' | 'explore'>('memberships');
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [brandLogos, setBrandLogos] = useState<any[]>([]);
  const [creatorStats, setCreatorStats] = useState<any>(null);
  const [customTabs, setCustomTabs] = useState<CustomTab[]>([]);
  const [customBlocks, setCustomBlocks] = useState<Record<string, CustomBlock[]>>({});

  // Sticky CTA on scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchCustomBlocks();
  }, [username]);

  useEffect(() => {
    if (activeTab === 'posts' && profile) {
      fetchPosts();
    }
  }, [activeTab, profile]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const cleanUsername = username.replace('@', '');
      const response = await fetch(`/api/profile/${cleanUsername}`);
      const data = await response.json();

      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!profile?.user_id) return;

    setPostsLoading(true);
    try {
      const params = new URLSearchParams({
        creator_id: profile.user_id,
        is_published: 'true',
        sort_by: 'recent',
        limit: '10'
      });

      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch posts');

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchCustomBlocks = async () => {
    try {
      const cleanUsername = username.replace('@', '');
      const response = await fetch(`/api/blocks/public/${cleanUsername}`);
      if (!response.ok) return;

      const data = await response.json();
      setCustomTabs(data.tabs || []);
      setCustomBlocks(data.blocks || {});
    } catch (error) {
      console.error('Error fetching custom blocks:', error);
    }
  };

  // Filter custom links based on search query
  const filteredLinks = profile?.custom_links?.filter(link => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      link.title.toLowerCase().includes(query) ||
      link.description?.toLowerCase().includes(query) ||
      link.category?.toLowerCase().includes(query) ||
      link.url.toLowerCase().includes(query)
    );
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900 dark:text-white" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Profile not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            This creator profile doesn't exist
          </p>
        </div>
      </div>
    );
  }

  // Get theme or use default
  const theme = profile.theme_config || {
    template: 'minimal',
    colors: { primary: '#000000', accent: '#f5f5f5' }
  };

  return (
    <ThemeWrapper theme={theme}>
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        {/* Twitter-style Profile Layout */}
        <div className="max-w-3xl mx-auto">
          {/* Cover Image */}
          <div className="relative h-52 sm:h-64 bg-gray-200 dark:bg-neutral-800 overflow-hidden sm:rounded-b-3xl">
            {profile.cover_image ? (
              <Image
                src={profile.cover_image}
                alt={`${profile.title} cover image`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="h-full w-full bg-gray-100 dark:bg-neutral-800" />
            )}
          </div>

          {/* Profile Content */}
          <div className="px-4 sm:px-6 pb-8">
            {/* Avatar & Support Button */}
            <div className="relative -mt-16 sm:-mt-20 mb-4 flex justify-between items-end gap-4">
              <div className="relative">
                <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-white dark:bg-neutral-950 border-4 sm:border-6 border-white dark:border-neutral-950 shadow-xl flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.title}
                      width={144}
                      height={144}
                      className="rounded-full object-cover h-full w-full"
                      priority
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-400 dark:text-gray-600">
                        {profile.title.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
                {profile.is_verified && (
                  <div className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-1.5 shadow-lg">
                    <CheckCircle className="h-5 w-5 text-white" fill="currentColor" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Collab Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCollabModal(true)}
                  className="px-3 sm:px-4 py-2.5 bg-purple-600 dark:bg-purple-500 text-white rounded-full font-semibold hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center gap-1.5 shadow-lg text-xs sm:text-base"
                  aria-label="Collaborate"
                >
                  <span className="text-sm">🤝</span>
                  <span>Collab</span>
                </motion.button>

                {/* Support Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSupportModal(true)}
                  className="px-3 sm:px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-1.5 shadow-lg text-xs sm:text-base"
                  aria-label="Become a supporter"
                >
                  <Heart className="h-4 w-4 fill-current" />
                  <span>Support</span>
                </motion.button>
              </div>
            </div>

            {/* Creator Info */}
            <div className="mb-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {profile.title}
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                @{profile.slug}
              </p>
            </div>

            {/* Stats */}
            {profile.total_supporters !== undefined && profile.total_supporters > 0 && (
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4" />
                  <span className="font-semibold text-gray-900 dark:text-white">{profile.total_supporters}</span>
                  <span>{profile.total_supporters === 1 ? 'Supporter' : 'Supporters'}</span>
                </div>
              </div>
            )}

            {/* Bio */}
            <p className="text-sm sm:text-base text-gray-900 dark:text-white mb-5 leading-relaxed">
              {profile.description}
            </p>

            {/* Creator Stats */}
            {creatorStats && (
              <CreatorStats
                totalFollowers={creatorStats.total_followers}
                engagementRate={creatorStats.avg_engagement_rate}
                monthlyContent={creatorStats.monthly_content_avg}
                totalCollaborations={creatorStats.total_collaborations}
              />
            )}

            {/* Brand Logos */}
            {brandLogos && brandLogos.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                  Brands partnered with
                </p>
                <BrandLogos logos={brandLogos} />
              </div>
            )}

            {/* Social Links */}
            {Object.keys(profile.social_links).some(key => profile.social_links[key as keyof typeof profile.social_links]) && (
              <div className="flex flex-wrap gap-3 mb-8">
                {profile.social_links.twitter && (
                  <a
                    href={`https://twitter.com/${profile.social_links.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                    aria-label={`Follow ${profile.title} on Twitter`}
                  >
                    <Twitter className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    {profile.social_links.twitter_followers && profile.social_links.twitter_followers > 0 && (
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {profile.social_links.twitter_followers >= 1000000
                          ? `${(profile.social_links.twitter_followers / 1000000).toFixed(1)}M`
                          : profile.social_links.twitter_followers >= 1000
                          ? `${(profile.social_links.twitter_followers / 1000).toFixed(1)}K`
                          : profile.social_links.twitter_followers}
                      </span>
                    )}
                  </a>
                )}
                {profile.social_links.instagram && (
                  <a
                    href={`https://instagram.com/${profile.social_links.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                    aria-label={`Follow ${profile.title} on Instagram`}
                  >
                    <Instagram className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    {profile.social_links.instagram_followers && profile.social_links.instagram_followers > 0 && (
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {profile.social_links.instagram_followers >= 1000000
                          ? `${(profile.social_links.instagram_followers / 1000000).toFixed(1)}M`
                          : profile.social_links.instagram_followers >= 1000
                          ? `${(profile.social_links.instagram_followers / 1000).toFixed(1)}K`
                          : profile.social_links.instagram_followers}
                      </span>
                    )}
                  </a>
                )}
                {profile.social_links.youtube && (
                  <a
                    href={`https://youtube.com/@${profile.social_links.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                    aria-label={`Subscribe to ${profile.title} on YouTube`}
                  >
                    <Youtube className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    {profile.social_links.youtube_subscribers && profile.social_links.youtube_subscribers > 0 && (
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {profile.social_links.youtube_subscribers >= 1000000
                          ? `${(profile.social_links.youtube_subscribers / 1000000).toFixed(1)}M`
                          : profile.social_links.youtube_subscribers >= 1000
                          ? `${(profile.social_links.youtube_subscribers / 1000).toFixed(1)}K`
                          : profile.social_links.youtube_subscribers}
                      </span>
                    )}
                  </a>
                )}
                {profile.social_links.website && (
                  <a
                    href={profile.social_links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-gray-100 dark:bg-neutral-800 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                    aria-label={`Visit ${profile.title}'s website`}
                  >
                    <Globe className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                  </a>
                )}
              </div>
            )}


            {/* Social Proof - Recent Supporters */}
            {profile.total_supporters !== undefined && profile.total_supporters > 0 && (
              <div className="mb-6 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {profile.total_supporters} {profile.total_supporters === 1 ? 'person is' : 'people are'} supporting
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[...Array(Math.min(profile.total_supporters, 5))].map((_, i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full bg-purple-600 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-white text-xs font-semibold"
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
            <div className="border-b border-gray-200 dark:border-neutral-800 mb-6">
              <div className="flex gap-6 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('memberships')}
                  className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
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
                  onClick={() => setActiveTab('posts')}
                  className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === 'posts'
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Posts
                  {activeTab === 'posts' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('explore')}
                  className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
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
                {/* Custom Tabs */}
                {customTabs.map((tab) => {
                  const Icon = tab.icon ? (Icons as any)[tab.icon] : null;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === tab.id
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      {tab.title}
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'memberships' && (
              <div className="space-y-4">
                {/* Tier Comparison Hint */}
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-medium text-purple-900 dark:text-purple-100">
                      Choose the tier that's right for you
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>

                {profile.tier_configs.length > 0 ? (
                  profile.tier_configs.map((tier, index) => (
                    <motion.button
                      key={tier.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedTier(tier.id);
                        setShowSupportModal(true);
                      }}
                      className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                        index === 1
                          ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-neutral-800'
                          : 'border-gray-200 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {tier.name}
                            </span>
                            {index === 2 && <Crown className="h-5 w-5 text-yellow-500" />}
                            {index === 1 && (
                              <span className="px-2 py-0.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-xs font-semibold">
                                Popular
                              </span>
                            )}
                          </div>
                          {/* Member count */}
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {Math.floor(Math.random() * 20) + (index * 10)} members
                            </span>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            ₹{tier.price}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">/mo</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {tier.description}
                      </p>
                    </motion.button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No membership tiers available yet
                  </p>
                )}
              </div>
            )}

            {activeTab === 'posts' && (
              <PostsTab
                posts={posts}
                loading={postsLoading}
                profile={profile}
                onUnlock={(tierId) => {
                  setSelectedTier(tierId);
                  setShowSupportModal(true);
                }}
              />
            )}

            {activeTab === 'explore' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search links by title, description, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Results Count */}
                {searchQuery && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {filteredLinks.length} {filteredLinks.length === 1 ? 'result' : 'results'} found
                  </p>
                )}

                {/* Custom Links Grid */}
                <div className="space-y-3">
                  {filteredLinks.length > 0 ? (
                    filteredLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          // Track click
                          fetch(`/api/custom-links/${link.id}/click`, {
                            method: 'POST'
                          }).catch(err => console.error('Failed to track click:', err));
                        }}
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
                  ) : searchQuery ? (
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        No links found
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Try searching with different keywords
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ExternalLink className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        No links yet
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Custom links will appear here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Custom Tabs Content */}
            {customTabs.map((tab) => {
              if (activeTab !== tab.id) return null;

              const tabBlocks = customBlocks[tab.id] || [];

              return (
                <div key={tab.id} className="space-y-4">
                  {tabBlocks.length > 0 ? (
                    tabBlocks.map((block) => (
                      <PublicBlockRenderer key={block.id} block={block} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        No content yet
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Content will appear here soon
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky CTA - Mobile & Desktop */}
      {showStickyCTA && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-lg border-t border-gray-200 dark:border-neutral-800 shadow-2xl"
        >
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {profile.avatar_url && (
                <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={profile.avatar_url}
                    alt={profile.title}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Support {profile.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Join {profile.total_supporters || 0} supporters
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSupportModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg text-sm sm:text-base"
            >
              <Heart className="h-4 w-4 fill-current" />
              <span>Become a Supporter</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Mobile-Optimized Quick Support Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowSupportModal(true)}
        className="sm:hidden fixed bottom-6 right-6 z-40 h-14 w-14 bg-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-purple-700 transition-all"
        aria-label="Quick support"
      >
        <Heart className="h-6 w-6 fill-current" />
      </motion.button>

      {/* Support Modal */}
      {showSupportModal && (
        <SupportModal
          creator={{
            username: profile.slug,
            display_name: profile.title,
            bio: profile.description,
            avatar_url: profile.avatar_url || '',
            support_tiers: profile.tier_configs
          }}
          selectedTierId={selectedTier}
          onClose={() => {
            setShowSupportModal(false);
            setSelectedTier(null);
          }}
        />
      )}

      {/* Collaboration Modal */}
      {showCollabModal && (
        <CollabModal
          isOpen={showCollabModal}
          onClose={() => setShowCollabModal(false)}
          creatorName={profile.title}
          creatorId={profile.user_id}
        />
      )}
    </ThemeWrapper>
  );
}
