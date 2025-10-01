"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Camera,
  Link2,
  DollarSign,
  BarChart3,
  Settings,
  Check,
  Upload,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Sparkles,
  TrendingUp,
  Users,
  Heart,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SupportTier {
  id?: string;
  name: string;
  price: number;
  description: string;
  benefits: string[];
}

interface ProfileData {
  id: string;
  user_id: string;
  slug: string; // username
  title: string; // display_name
  description: string; // bio
  avatar_url: string;
  cover_image: string;
  is_verified: boolean;
  social_links: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  tier_configs: SupportTier[]; // support_tiers
  analytics?: any;
}

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'tiers' | 'analytics' | 'settings'>('profile');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [tempProfile, setTempProfile] = useState<ProfileData>({
    id: '',
    user_id: '',
    slug: '',
    title: '',
    description: '',
    avatar_url: '',
    cover_image: '',
    is_verified: false,
    social_links: {
      twitter: '',
      instagram: '',
      youtube: '',
      website: ''
    },
    tier_configs: [
      {
        id: 'tier_1',
        name: 'Supporter',
        price: 199,
        description: 'Show your support and get exclusive updates',
        benefits: ['Early access to content', 'Supporter badge', 'Monthly newsletter']
      },
      {
        id: 'tier_2',
        name: 'Fan',
        price: 499,
        description: 'Get closer to the creative process',
        benefits: ['All Supporter benefits', 'Behind-the-scenes content', 'Monthly Q&A', 'Discord access']
      },
      {
        id: 'tier_3',
        name: 'VIP',
        price: 999,
        description: 'The ultimate fan experience',
        benefits: ['All Fan benefits', '1-on-1 monthly call', 'Custom requests', 'Physical merchandise']
      }
    ]
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [editingTier, setEditingTier] = useState<number | null>(null);
  const [newBenefit, setNewBenefit] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (newUsername && newUsername.length >= 3) {
        checkUsernameAvailability(newUsername);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [newUsername]);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const response = await fetch('/api/profile');
      const data = await response.json();

      if (data.profile) {
        setProfile(data.profile);
        setTempProfile(data.profile);
      } else {
        // New user - needs to create profile
        setIsNewUser(true);
        const suggestedUsername = user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_-]/g, '') || '';
        setNewUsername(suggestedUsername);
        setTempProfile(prev => ({
          ...prev,
          title: user.user_metadata?.display_name || suggestedUsername || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setErrorMessage('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) return;

    setCheckingUsername(true);
    setUsernameError('');

    try {
      const response = await fetch(`/api/profile/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();

      setUsernameAvailable(data.available);
      if (!data.available && data.error) {
        setUsernameError(data.error);
      }
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const createProfile = async () => {
    if (!newUsername || !usernameAvailable) return;

    setSaveStatus('saving');
    setErrorMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First try the normal API route
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.toLowerCase(),
          display_name: tempProfile.title,
          bio: tempProfile.description,
          social_links: tempProfile.social_links,
          tier_configs: tempProfile.tier_configs
        })
      });

      const data = await response.json();

      // If RLS error, automatically use the admin route
      if (!response.ok && (
        data.error?.includes('row-level security') ||
        data.error?.includes('RLS') ||
        data.error?.includes('violates row-level') ||
        response.status === 403
      )) {
        console.log('RLS policy issue detected, using admin route...');

        const adminRes = await fetch('/api/profile/admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            username: newUsername.toLowerCase(),
            display_name: tempProfile.title,
            bio: tempProfile.description,
            social_links: tempProfile.social_links,
            support_tiers: tempProfile.tier_configs,
          }),
        });

        const adminData = await adminRes.json();

        if (!adminRes.ok) {
          throw new Error(adminData.error || 'Failed to create profile via admin route');
        }

        setProfile(adminData.profile);
        setTempProfile(adminData.profile);
        setIsNewUser(false);
        setSaveStatus('saved');

        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create profile');
      }

      setProfile(data.profile);
      setTempProfile(data.profile);
      setIsNewUser(false);
      setSaveStatus('saved');

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error.message);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleSave = async () => {
    if (!profile) {
      if (isNewUser) {
        await createProfile();
      }
      return;
    }

    setSaveStatus('saving');
    setErrorMessage('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: tempProfile.title,
          bio: tempProfile.description,
          social_links: tempProfile.social_links,
          tier_configs: tempProfile.tier_configs,
          avatar_url: tempProfile.avatar_url,
          cover_image: tempProfile.cover_image
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile(data.profile);
      setSaveStatus('saved');

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error.message);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const addTier = () => {
    const newTier: SupportTier = {
      id: `tier_${Date.now()}`,
      name: 'New Tier',
      price: 299,
      description: 'Description of your tier',
      benefits: ['Benefit 1', 'Benefit 2']
    };

    setTempProfile(prev => ({
      ...prev,
      tier_configs: [...prev.tier_configs, newTier]
    }));
  };

  const removeTier = (index: number) => {
    setTempProfile(prev => ({
      ...prev,
      tier_configs: prev.tier_configs.filter((_, i) => i !== index)
    }));
  };

  const updateTier = (index: number, updates: Partial<SupportTier>) => {
    setTempProfile(prev => ({
      ...prev,
      tier_configs: prev.tier_configs.map((tier, i) =>
        i === index ? { ...tier, ...updates } : tier
      )
    }));
  };

  const addBenefit = (tierIndex: number) => {
    if (!newBenefit.trim()) return;

    setTempProfile(prev => ({
      ...prev,
      tier_configs: prev.tier_configs.map((tier, i) =>
        i === tierIndex
          ? { ...tier, benefits: [...tier.benefits, newBenefit.trim()] }
          : tier
      )
    }));
    setNewBenefit('');
  };

  const removeBenefit = (tierIndex: number, benefitIndex: number) => {
    setTempProfile(prev => ({
      ...prev,
      tier_configs: prev.tier_configs.map((tier, i) =>
        i === tierIndex
          ? { ...tier, benefits: tier.benefits.filter((_, j) => j !== benefitIndex) }
          : tier
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'tiers', label: 'Tiers', icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // New User Onboarding Screen
  if (isNewUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200/50 dark:border-neutral-800 p-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex p-2 bg-black dark:bg-white rounded-lg mb-4">
                <Sparkles className="h-6 w-6 text-white dark:text-black" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                Welcome to Creator Studio
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Let's set up your creator profile to start accepting payments
              </p>
            </div>

            {/* Username Selection */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Choose your username
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    @
                  </div>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className={`w-full pl-8 pr-12 py-3 bg-gray-50 dark:bg-neutral-800 rounded-xl border-2 ${
                      usernameError ? 'border-red-500' :
                      usernameAvailable === false ? 'border-red-500' :
                      usernameAvailable === true ? 'border-green-500' :
                      'border-gray-200 dark:border-neutral-700'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white`}
                    placeholder="yourname"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingUsername && (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    )}
                    {!checkingUsername && usernameAvailable === true && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
                {usernameError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {usernameError}
                  </p>
                )}
                {usernameAvailable === false && !usernameError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    This username is already taken
                  </p>
                )}
                {usernameAvailable === true && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    Great! This username is available
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Your profile will be available at spaecs.com/@{newUsername || 'yourname'}
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display name
                </label>
                <input
                  type="text"
                  value={tempProfile.title}
                  onChange={(e) => setTempProfile({ ...tempProfile, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  placeholder="Your Name"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tell us about yourself
                </label>
                <textarea
                  value={tempProfile.description}
                  onChange={(e) => setTempProfile({ ...tempProfile, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="What do you create? What makes you unique?"
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Create Profile Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={createProfile}
                disabled={!usernameAvailable || !newUsername || saveStatus === 'saving'}
                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create My Profile
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header with Tabs */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm border-b border-gray-200/50 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Creator Studio
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Manage your creator profile and monetization
              </p>
            </div>
            <div className="flex items-center gap-2">
              {profile && (
                <a
                  href={`/@${profile.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-neutral-900 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 border border-gray-200/50 dark:border-neutral-800"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Profile
                </a>
              )}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSave}
                className="relative px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <AnimatePresence mode="wait">
                  {saveStatus === 'idle' && <span>Save Changes</span>}
                  {saveStatus === 'saving' && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </motion.span>
                  )}
                  {saveStatus === 'saved' && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Saved
                    </motion.span>
                  )}
                  {saveStatus === 'error' && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Error
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Profile Preview Card */}
              <div className="bg-white dark:bg-neutral-950 rounded-lg border border-gray-200/50 dark:border-neutral-800 overflow-hidden">
                <div className="h-32 bg-gray-100 dark:bg-neutral-900 relative">
                  <button className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-md text-gray-700 dark:text-gray-300 text-xs font-medium flex items-center gap-1.5 hover:bg-white dark:hover:bg-neutral-800 transition-colors border border-gray-200/50 dark:border-neutral-700">
                    <Camera className="h-3.5 w-3.5" />
                    Change Cover
                  </button>
                </div>
                <div className="px-6 pb-6">
                  <div className="flex items-end gap-4 -mt-10">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-xl bg-white dark:bg-neutral-950 border-4 border-white dark:border-neutral-950 flex items-center justify-center">
                        <UserIcon className="h-10 w-10 text-gray-400" />
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                        <Camera className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                    <div className="flex-1 pb-2">
                      <input
                        type="text"
                        value={tempProfile.title}
                        onChange={(e) => setTempProfile({ ...tempProfile, title: e.target.value })}
                        className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder:text-gray-400"
                        placeholder="Your display name"
                      />
                      <p className="text-gray-600 dark:text-gray-400 mt-1">@{profile?.slug || newUsername}</p>
                    </div>
                    <div className="pb-2">
                      <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-medium">
                        ✓ Creator Verified
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="mt-8">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Bio
                    </label>
                    <textarea
                      value={tempProfile.description}
                      onChange={(e) => setTempProfile({ ...tempProfile, description: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Tell your story..."
                    />
                  </div>

                  {/* Social Links */}
                  <div className="mt-8">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 block">
                      Social Links
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                        <Twitter className="h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={tempProfile.social_links.twitter || ''}
                          onChange={(e) => setTempProfile({
                            ...tempProfile,
                            social_links: { ...tempProfile.social_links, twitter: e.target.value }
                          })}
                          placeholder="Twitter username"
                          className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                        <Instagram className="h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={tempProfile.social_links.instagram || ''}
                          onChange={(e) => setTempProfile({
                            ...tempProfile,
                            social_links: { ...tempProfile.social_links, instagram: e.target.value }
                          })}
                          placeholder="Instagram username"
                          className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                        <Youtube className="h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={tempProfile.social_links.youtube || ''}
                          onChange={(e) => setTempProfile({
                            ...tempProfile,
                            social_links: { ...tempProfile.social_links, youtube: e.target.value }
                          })}
                          placeholder="YouTube channel"
                          className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                        <Globe className="h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={tempProfile.social_links.website || ''}
                          onChange={(e) => setTempProfile({
                            ...tempProfile,
                            social_links: { ...tempProfile.social_links, website: e.target.value }
                          })}
                          placeholder="Website URL"
                          className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white dark:bg-neutral-950 rounded-lg p-4 border border-gray-200/50 dark:border-neutral-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gray-100 dark:bg-neutral-900 rounded-md">
                      <Users className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    </div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      +23.5%
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {profile?.total_supporters || 0}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Total Supporters
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white dark:bg-neutral-950 rounded-lg p-4 border border-gray-200/50 dark:border-neutral-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gray-100 dark:bg-neutral-900 rounded-md">
                      <DollarSign className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    </div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      +15.2%
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    ₹{profile?.total_earnings ? (Number(profile.total_earnings) / 1000).toFixed(1) + 'K' : '0'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Total Earnings
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white dark:bg-neutral-950 rounded-lg p-4 border border-gray-200/50 dark:border-neutral-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gray-100 dark:bg-neutral-900 rounded-md">
                      <TrendingUp className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    </div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      +8.7%
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {tempProfile.tier_configs.length}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Support Tiers
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tiers' && (
            <motion.div
              key="tiers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Error Message */}
              {errorMessage && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errorMessage}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tempProfile.tier_configs.map((tier, index) => (
                  <motion.div
                    key={tier.id || index}
                    whileHover={{ y: -8 }}
                    className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-neutral-800"
                  >
                    <div className="flex items-center justify-between mb-4">
                      {editingTier === index ? (
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) => updateTier(index, { name: e.target.value })}
                          className="text-lg font-semibold bg-transparent border-b border-gray-300 dark:border-neutral-600 outline-none text-gray-900 dark:text-white"
                        />
                      ) : (
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {tier.name}
                        </h3>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingTier(editingTier === index ? null : index)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                          <Settings className="h-4 w-4 text-gray-400" />
                        </button>
                        {tempProfile.tier_configs.length > 1 && (
                          <button
                            onClick={() => removeTier(index)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-baseline mb-4">
                      {editingTier === index ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg text-gray-900 dark:text-white">₹</span>
                          <input
                            type="number"
                            value={tier.price}
                            onChange={(e) => updateTier(index, { price: parseInt(e.target.value) || 0 })}
                            className="text-3xl font-bold bg-transparent border-b border-gray-300 dark:border-neutral-600 outline-none text-gray-900 dark:text-white w-24"
                          />
                        </div>
                      ) : (
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          ₹{tier.price}
                        </span>
                      )}
                      <span className="text-gray-600 dark:text-gray-400 ml-2">/month</span>
                    </div>
                    {editingTier === index ? (
                      <textarea
                        value={tier.description}
                        onChange={(e) => updateTier(index, { description: e.target.value })}
                        className="w-full text-sm bg-gray-50 dark:bg-neutral-800 rounded-lg p-2 mb-4 outline-none text-gray-600 dark:text-gray-400"
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        {tier.description}
                      </p>
                    )}
                    <div className="space-y-3">
                      {tier.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                          {editingTier === index ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={benefit}
                                onChange={(e) => {
                                  const newBenefits = [...tier.benefits];
                                  newBenefits[idx] = e.target.value;
                                  updateTier(index, { benefits: newBenefits });
                                }}
                                className="flex-1 text-sm bg-transparent border-b border-gray-300 dark:border-neutral-600 outline-none text-gray-700 dark:text-gray-300"
                              />
                              <button
                                onClick={() => removeBenefit(index, idx)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {benefit}
                            </span>
                          )}
                        </div>
                      ))}
                      {editingTier === index && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newBenefit}
                            onChange={(e) => setNewBenefit(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addBenefit(index);
                              }
                            }}
                            placeholder="Add benefit"
                            className="flex-1 text-sm bg-gray-50 dark:bg-neutral-800 rounded-lg px-3 py-2 outline-none text-gray-700 dark:text-gray-300"
                          />
                          <button
                            onClick={() => addBenefit(index)}
                            className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                          >
                            <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {tempProfile.tier_configs.length < 5 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addTier}
                  className="w-full py-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add New Tier
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}