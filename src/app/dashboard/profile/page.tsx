"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Camera,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Check,
  Settings as SettingsIcon,
  Link as LinkIcon,
  Calendar,
  Clock,
  Tag,
  Palette,
  Eye,
  Pin,
  Star,
  BarChart3,
  X,
  Info,
  CheckCircle2,
  CreditCard,
  Layout,
  Copy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import IPhonePreview from "@/components/profile/iPhonePreview";
import BlocksEditor from "@/components/profile/BlocksEditor";
import { CustomTab, CustomBlock } from "@/types/blocks";
import { getSocialPlatformMetadata } from "@/lib/social-links";

interface SupportTier {
  id?: string;
  name: string;
  price: number;
  description: string;
  benefits: string[];
}

interface CustomLink {
  id: string;
  creator_id?: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  category?: string;
  tags?: string[];
  display_order?: number;
  start_date?: string | null;
  expire_date?: string | null;
  is_active?: boolean;
  click_count?: number;
  last_clicked_at?: string | null;
  is_featured?: boolean;
  button_color?: string;
  open_in_new_tab?: boolean;
  is_pinned?: boolean;
  show_click_count?: boolean;
  thumbnail_url?: string;
  platform?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProfileData {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string;
  avatar_url: string;
  cover_image: string;
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
  tier_configs: SupportTier[];
  analytics?: any;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
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
    custom_links: [],
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
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<string>('home');
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [currentLink, setCurrentLink] = useState<CustomLink | null>(null);
  const [savingLink, setSavingLink] = useState(false);
  const [linkModalTab, setLinkModalTab] = useState<'basic' | 'scheduling' | 'advanced'>('basic');
  const [showUsernameWarning, setShowUsernameWarning] = useState(false);
  const [pendingUsername, setPendingUsername] = useState('');

  // Main tabs state
  const [activeMainTab, setActiveMainTab] = useState<'profile' | 'plans' | 'blocks' | 'linktree'>('profile');

  // Blocks state
  const [tabs, setTabs] = useState<CustomTab[]>([]);
  const [blocks, setBlocks] = useState<Record<string, CustomBlock[]>>({});

  // Posts state
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Auto-save timeout
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Calculate profile completion
  const profileCompletion = useMemo(() => {
    let completed = 0;
    const total = 7;

    if (tempProfile.avatar_url) completed++;
    if (tempProfile.title && tempProfile.title.length > 0) completed++;
    if (tempProfile.description && tempProfile.description.length > 10) completed++;
    if (tempProfile.slug && tempProfile.slug.length >= 3) completed++;
    if (tempProfile.social_links.twitter || tempProfile.social_links.instagram ||
        tempProfile.social_links.youtube || tempProfile.social_links.website) completed++;
    if (customLinks.length > 0) completed++;
    if (tempProfile.tier_configs.length > 0) completed++;

    return { completed, total, percentage: Math.round((completed / total) * 100) };
  }, [tempProfile, customLinks]);

  const fetchProfile = useCallback(async () => {
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
        const suggestedUsername = user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_-]/g, '') || '';
        setTempProfile(prev => ({
          ...prev,
          slug: suggestedUsername,
          title: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Creator'
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setErrorMessage('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  const fetchCustomLinks = useCallback(async () => {
    try {
      const response = await fetch('/api/custom-links');
      const data = await response.json();

      if (data.links) {
        setCustomLinks(data.links);
      }
    } catch (error) {
      console.error('Error fetching custom links:', error);
    }
  }, []);

  const fetchTabs = useCallback(async () => {
    const res = await fetch("/api/blocks/tabs");
    if (res.ok) {
      const data = await res.json();
      setTabs(data.tabs || []);

      for (const tab of data.tabs || []) {
        fetchBlocks(tab.id);
      }
    }
  }, []);

  const fetchBlocks = useCallback(async (tabId: string) => {
    const res = await fetch(`/api/blocks/${tabId}`);
    if (res.ok) {
      const data = await res.json();
      setBlocks((prev) => ({ ...prev, [tabId]: data.blocks || [] }));
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setLoadingPosts(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const res = await fetch(`/api/posts?creator_id=${user.id}&is_published=true&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
    fetchCustomLinks();
    fetchTabs();
    fetchPosts();
  }, [fetchProfile, fetchCustomLinks, fetchTabs, fetchPosts]);

  // Auto-save functionality
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      handleSave(true);
    }, 2000);

    setAutoSaveTimeout(timeout);
  }, [autoSaveTimeout]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  const openLinkModal = (link?: CustomLink) => {
    if (link) {
      setCurrentLink(link);
    } else {
      setCurrentLink({
        id: '',
        title: '',
        url: '',
        description: '',
        icon: '',
        category: 'other',
        tags: [],
        is_active: true,
        is_featured: false,
        is_pinned: false,
        show_click_count: false,
        open_in_new_tab: true,
        display_order: customLinks.length
      });
    }
    setLinkModalTab('basic');
    setShowLinkModal(true);
  };

  const closeLinkModal = () => {
    setShowLinkModal(false);
    setCurrentLink(null);
    setLinkModalTab('basic');
  };

  const saveLink = async () => {
    if (!currentLink) return;

    setSavingLink(true);
    try {
      const method = currentLink.id ? 'PUT' : 'POST';
      const url = currentLink.id
        ? `/api/custom-links/${currentLink.id}`
        : '/api/custom-links';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentLink)
      });

      if (!response.ok) {
        throw new Error('Failed to save link');
      }

      await fetchCustomLinks();
      closeLinkModal();
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setSavingLink(false);
    }
  };

  const deleteLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
      const response = await fetch(`/api/custom-links/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete link');
      }

      await fetchCustomLinks();
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  const handleSave = async (isAutoSave = false) => {
    if (!isAutoSave) {
      setSaveStatus('saving');
    }
    setErrorMessage('');

    try {
      let response;

      if (profile) {
        response = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: tempProfile.slug,
            display_name: tempProfile.title,
            bio: tempProfile.description,
            social_links: tempProfile.social_links,
            tier_configs: tempProfile.tier_configs,
            avatar_url: tempProfile.avatar_url,
            cover_image: tempProfile.cover_image,
            custom_links: tempProfile.custom_links
          })
        });
      } else {
        const { data: { user } } = await supabase.auth.getUser();

        response = await fetch('/api/profile/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user?.id,
            username: tempProfile.slug,
            display_name: tempProfile.title,
            bio: tempProfile.description,
            social_links: tempProfile.social_links,
            support_tiers: tempProfile.tier_configs,
            custom_links: tempProfile.custom_links
          })
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save profile');
      }

      const data = await response.json();
      setProfile(data.profile);
      setTempProfile(data.profile);

      if (!isAutoSave) {
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      }

      await fetchProfile();
    } catch (error: any) {
      setErrorMessage(error.message);
      if (!isAutoSave) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
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
    triggerAutoSave();
  };

  const removeTier = (index: number) => {
    setTempProfile(prev => ({
      ...prev,
      tier_configs: prev.tier_configs.filter((_, i) => i !== index)
    }));
    triggerAutoSave();
  };

  const updateTier = (index: number, updates: Partial<SupportTier>) => {
    setTempProfile(prev => ({
      ...prev,
      tier_configs: prev.tier_configs.map((tier, i) =>
        i === index ? { ...tier, ...updates } : tier
      )
    }));
    triggerAutoSave();
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
    triggerAutoSave();
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
    triggerAutoSave();
  };

  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setUsernameError('');
      return;
    }

    if (profile && username.toLowerCase() === profile.slug.toLowerCase()) {
      setUsernameAvailable(true);
      setUsernameError('');
      return;
    }

    setCheckingUsername(true);
    setUsernameError('');

    try {
      const response = await fetch(`/api/profile/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();

      if (data.error) {
        setUsernameError(data.error);
        setUsernameAvailable(false);
      } else {
        setUsernameAvailable(data.available);
        if (!data.available) {
          setUsernameError('Username is already taken');
        }
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('Failed to check username availability');
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  }, [profile]);

  const handleUsernameChange = useCallback((username: string) => {
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, '');

    if (profile && profile.slug && profile.slug !== cleanUsername) {
      setPendingUsername(cleanUsername);
      setShowUsernameWarning(true);
    } else {
      setTempProfile(prev => ({ ...prev, slug: cleanUsername }));

      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(cleanUsername);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [profile, checkUsernameAvailability]);

  const confirmUsernameChange = () => {
    setTempProfile(prev => ({ ...prev, slug: pendingUsername }));
    setShowUsernameWarning(false);
    setPendingUsername('');
    checkUsernameAvailability(pendingUsername);
    triggerAutoSave();
  };

  const copyProfileUrl = () => {
    if (!profile) return;

    const url = `${window.location.origin}/${profile.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const uploadImage = async (file: File, type: 'avatar' | 'cover') => {
    try {
      const isAvatar = type === 'avatar';
      isAvatar ? setUploadingAvatar(true) : setUploadingCover(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      if (isAvatar) {
        setTempProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      } else {
        setTempProfile(prev => ({ ...prev, cover_image: publicUrl }));
      }

      triggerAutoSave();
      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setErrorMessage(error.message || 'Failed to upload image');
    } finally {
      setUploadingAvatar(false);
      setUploadingCover(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB');
      return;
    }

    uploadImage(file, type);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900 dark:text-white" />
      </div>
    );
  }

  const mainTabs = [
    { id: 'profile', label: 'Profile Details', icon: UserIcon },
    { id: 'plans', label: 'Membership Plans', icon: CreditCard },
    { id: 'blocks', label: 'Custom Blocks', icon: Layout },
    { id: 'linktree', label: 'LinkTree', icon: LinkIcon },
  ];

  return (
    <div className="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                {tempProfile.avatar_url ? (
                  <img src={tempProfile.avatar_url} alt={tempProfile.title} className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                  {tempProfile.title || 'Creator Profile'}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  @{tempProfile.slug || 'username'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {profileCompletion.percentage}% complete
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSave(false)}
                disabled={saveStatus === 'saving'}
                className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
                aria-label="Save profile changes"
              >
                <AnimatePresence mode="wait">
                  {saveStatus === 'idle' && <span>Save</span>}
                  {saveStatus === 'saving' && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving
                    </motion.span>
                  )}
                  {saveStatus === 'saved' && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Check className="h-3 w-3" />
                      Saved
                    </motion.span>
                  )}
                  {saveStatus === 'error' && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <AlertCircle className="h-3 w-3" />
                      Error
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Editor with Tabs */}
        <div className="flex flex-col overflow-hidden border-r border-neutral-200 dark:border-neutral-800" style={{ width: 'calc(100% - 360px)' }}>
          {/* Main Tabs */}
          <div className="flex gap-1 p-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex-shrink-0">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMainTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none ${
                    activeMainTab === tab.id
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Profile Details Tab */}
            {activeMainTab === 'profile' && (
              <div className="space-y-3 w-fit">
                {/* Cover Image */}
                <div className="w-96">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Cover Image
                  </label>
                  <div className="relative h-32 w-full rounded-lg bg-gray-100 dark:bg-neutral-800 overflow-hidden group cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">
                    <input
                      type="file"
                      id="cover-upload"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'cover')}
                      className="hidden"
                    />
                    <label
                      htmlFor="cover-upload"
                      className="absolute inset-0 cursor-pointer"
                    >
                      {tempProfile.cover_image ? (
                        <>
                          <img src={tempProfile.cover_image} alt="Cover" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            {uploadingCover ? (
                              <div className="flex flex-col items-center gap-2 text-white">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="text-xs font-medium">Uploading...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-white">
                                <Camera className="h-6 w-6" />
                                <span className="text-xs font-medium">Change Cover</span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center">
                          {uploadingCover ? (
                            <>
                              <Loader2 className="h-6 w-6 text-gray-400 animate-spin mb-2" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="h-6 w-6 text-gray-400 mb-2" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">Upload Cover Image</span>
                            </>
                          )}
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Profile Picture & Display Name */}
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Profile Picture
                    </label>
                    <div className="relative h-16 w-16 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden group cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'avatar')}
                        className="hidden"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="absolute inset-0 cursor-pointer"
                      >
                        {tempProfile.avatar_url ? (
                          <>
                            <img src={tempProfile.avatar_url} alt={tempProfile.title} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              {uploadingAvatar ? (
                                <Loader2 className="h-5 w-5 text-white animate-spin" />
                              ) : (
                                <Camera className="h-5 w-5 text-white" />
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            {uploadingAvatar ? (
                              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                            ) : (
                              <Camera className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={tempProfile.title}
                      onChange={(e) => {
                        setTempProfile({ ...tempProfile, title: e.target.value });
                        triggerAutoSave();
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm text-gray-900 dark:text-white transition-all"
                      placeholder="Your name"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="w-96">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      spaecs.com/
                    </div>
                    <input
                      type="text"
                      value={tempProfile.slug}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className={`w-full pl-28 pr-20 py-2 bg-white dark:bg-neutral-900 rounded-lg border focus:outline-none focus:ring-2 text-sm text-gray-900 dark:text-white transition-all ${
                        usernameError
                          ? 'border-red-500 focus:ring-red-500'
                          : usernameAvailable
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-gray-200 dark:border-neutral-800 focus:ring-purple-500 dark:focus:ring-purple-400'
                      }`}
                      placeholder="username"
                      maxLength={20}
                      aria-label="Username"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {tempProfile.slug && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/${tempProfile.slug}`);
                            setCopiedUrl(true);
                            setTimeout(() => setCopiedUrl(false), 2000);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                          title="Copy URL"
                        >
                          {copiedUrl ? (
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          )}
                        </button>
                      )}
                      {checkingUsername && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      )}
                      {!checkingUsername && usernameAvailable && tempProfile.slug.length >= 3 && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      {!checkingUsername && usernameAvailable === false && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  {usernameError && (
                    <p className="text-xs text-red-500 mt-1.5">{usernameError}</p>
                  )}
                </div>

                {/* Bio */}
                <div className="w-96">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Bio
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {tempProfile.description.length}/200
                    </span>
                  </div>
                  <textarea
                    value={tempProfile.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 200) {
                        setTempProfile({ ...tempProfile, description: e.target.value });
                        triggerAutoSave();
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm text-gray-900 dark:text-white resize-none transition-all"
                    rows={3}
                    placeholder="Tell your supporters about yourself..."
                    maxLength={200}
                  />
                </div>

                {/* Social Links */}
                <div className="w-96">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Social Links & Follower Counts
                  </label>
                  <div className="space-y-2">
                    {/* Twitter */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 focus-within:ring-2 focus-within:ring-purple-500 dark:focus-within:ring-purple-400 transition-all">
                        <Twitter className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={tempProfile.social_links.twitter || ''}
                          onChange={(e) => {
                            setTempProfile({
                              ...tempProfile,
                              social_links: { ...tempProfile.social_links, twitter: e.target.value }
                            });
                            triggerAutoSave();
                          }}
                          placeholder="Twitter username"
                          className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                      </div>
                      {tempProfile.social_links.twitter && (
                        <input
                          type="number"
                          value={tempProfile.social_links.twitter_followers || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                            setTempProfile({
                              ...tempProfile,
                              social_links: { ...tempProfile.social_links, twitter_followers: value }
                            });
                            triggerAutoSave();
                          }}
                          placeholder="Followers count (e.g., 1500)"
                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 outline-none text-xs text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                      )}
                    </div>

                    {/* Instagram */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 focus-within:ring-2 focus-within:ring-purple-500 dark:focus-within:ring-purple-400 transition-all">
                        <Instagram className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={tempProfile.social_links.instagram || ''}
                          onChange={(e) => {
                            setTempProfile({
                              ...tempProfile,
                              social_links: { ...tempProfile.social_links, instagram: e.target.value }
                            });
                            triggerAutoSave();
                          }}
                          placeholder="Instagram username"
                          className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                      </div>
                      {tempProfile.social_links.instagram && (
                        <input
                          type="number"
                          value={tempProfile.social_links.instagram_followers || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                            setTempProfile({
                              ...tempProfile,
                              social_links: { ...tempProfile.social_links, instagram_followers: value }
                            });
                            triggerAutoSave();
                          }}
                          placeholder="Followers count (e.g., 5000)"
                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 outline-none text-xs text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                      )}
                    </div>

                    {/* YouTube */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 focus-within:ring-2 focus-within:ring-purple-500 dark:focus-within:ring-purple-400 transition-all">
                        <Youtube className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={tempProfile.social_links.youtube || ''}
                          onChange={(e) => {
                            setTempProfile({
                              ...tempProfile,
                              social_links: { ...tempProfile.social_links, youtube: e.target.value }
                            });
                            triggerAutoSave();
                          }}
                          placeholder="YouTube channel"
                          className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                      </div>
                      {tempProfile.social_links.youtube && (
                        <input
                          type="number"
                          value={tempProfile.social_links.youtube_subscribers || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                            setTempProfile({
                              ...tempProfile,
                              social_links: { ...tempProfile.social_links, youtube_subscribers: value }
                            });
                            triggerAutoSave();
                          }}
                          placeholder="Subscribers count (e.g., 10000)"
                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 outline-none text-xs text-gray-900 dark:text-white placeholder:text-gray-400"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 focus-within:ring-2 focus-within:ring-purple-500 dark:focus-within:ring-purple-400 transition-all">
                      <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={tempProfile.social_links.website || ''}
                        onChange={(e) => {
                          setTempProfile({
                            ...tempProfile,
                            social_links: { ...tempProfile.social_links, website: e.target.value }
                          });
                          triggerAutoSave();
                        }}
                        placeholder="Website"
                        className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Membership Plans Tab */}
            {activeMainTab === 'plans' && (
              <div className="space-y-3 w-fit">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Membership Tiers
                  </h3>
                  {tempProfile.tier_configs.length < 5 && (
                    <button
                      onClick={addTier}
                      className="p-1.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {tempProfile.tier_configs.map((tier, index) => (
                  <div
                    key={tier.id || index}
                    className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-4 border border-gray-200 dark:border-neutral-800"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) => updateTier(index, { name: e.target.value })}
                          className="text-sm font-semibold bg-transparent border-b border-gray-300 dark:border-neutral-600 outline-none text-gray-900 dark:text-white w-full focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                        />
                        <div className="flex items-baseline mt-1">
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-xs text-gray-900 dark:text-white">₹</span>
                            <input
                              type="number"
                              value={tier.price}
                              onChange={(e) => updateTier(index, { price: parseInt(e.target.value) || 0 })}
                              className="text-base font-bold bg-transparent border-b border-gray-300 dark:border-neutral-600 outline-none text-gray-900 dark:text-white w-20 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">/mo</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {tempProfile.tier_configs.length > 1 && (
                          <button
                            onClick={() => removeTier(index)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={tier.description}
                      onChange={(e) => updateTier(index, { description: e.target.value })}
                      className="w-full text-xs bg-white dark:bg-neutral-800 rounded p-2 mb-3 outline-none text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-neutral-700 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all"
                      rows={2}
                    />
                    <div className="space-y-1.5">
                      {tier.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <div className="h-3.5 w-3.5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-2 w-2 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 flex gap-1">
                            <input
                              type="text"
                              value={benefit}
                              onChange={(e) => {
                                const newBenefits = [...tier.benefits];
                                newBenefits[idx] = e.target.value;
                                updateTier(index, { benefits: newBenefits });
                              }}
                              className="flex-1 text-xs bg-transparent border-b border-gray-300 dark:border-neutral-600 outline-none text-gray-700 dark:text-gray-300 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                            />
                            <button
                              onClick={() => removeBenefit(index, idx)}
                              className="text-red-500 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:outline-none rounded"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-1 mt-2">
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
                          className="flex-1 text-xs bg-white dark:bg-neutral-800 rounded px-2 py-1.5 outline-none text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all"
                        />
                        <button
                          onClick={() => addBenefit(index)}
                          className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                          <Plus className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Blocks Tab */}
            {activeMainTab === 'blocks' && (
              <div className="w-fit">
                <BlocksEditor
                  tabs={tabs}
                  blocks={blocks}
                  onTabsChange={fetchTabs}
                  onBlocksChange={() => {
                    tabs.forEach(tab => fetchBlocks(tab.id));
                  }}
                />
              </div>
            )}

            {/* LinkTree Tab */}
            {activeMainTab === 'linktree' && (
              <div className="space-y-3 w-fit">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Custom Links
                  </h3>
                  <button
                    onClick={() => openLinkModal()}
                    className="px-2 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <Plus className="h-3 w-3" />
                    Add Link
                  </button>
                </div>

                {customLinks && customLinks.length > 0 ? (
                  <div className="space-y-2">
                    {customLinks.map((link) => (
                      <div
                        key={link.id}
                        className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {link.icon && (
                                <span className="text-sm">{link.icon}</span>
                              )}
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {link.title}
                              </span>
                              {link.is_featured && (
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                              )}
                              {link.is_pinned && (
                                <Pin className="h-3 w-3 text-gray-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {link.url}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => openLinkModal(link)}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
                            >
                              <SettingsIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteLink(link.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 py-8 text-center">
                    Add custom links to share with your supporters
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - iPhone Preview */}
        <div className="w-[360px] bg-white dark:bg-neutral-900 pl-2 pr-2 py-3 overflow-y-auto flex-shrink-0">
          <IPhonePreview
            profile={{
              ...tempProfile,
              custom_links: customLinks
            }}
            tabs={tabs}
            blocks={blocks}
            posts={posts}
            activeTab={activePreviewTab}
            onTabChange={setActivePreviewTab}
            onTabVisibilityToggle={async (tabId, isVisible) => {
              try {
                await fetch(`/api/blocks/tabs/${tabId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ is_visible: isVisible })
                });
                await fetchTabs();
              } catch (error) {
                console.error('Error toggling tab visibility:', error);
              }
            }}
          />
        </div>
      </div>

      {/* Username Warning Modal */}
      <AnimatePresence>
        {showUsernameWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUsernameWarning(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-neutral-800"
              role="dialog"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    Change Username?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Changing your username will break your existing profile URL.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowUsernameWarning(false);
                    setPendingUsername('');
                  }}
                  className="flex-1 px-4 py-2 bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUsernameChange}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Change Anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Link Modal with Tabs */}
      <AnimatePresence>
        {showLinkModal && currentLink && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeLinkModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-neutral-800"
              role="dialog"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentLink.id ? 'Edit Link' : 'Add New Link'}
                  </h2>
                  <button
                    onClick={closeLinkModal}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-neutral-800">
                  {(['basic', 'scheduling', 'advanced'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setLinkModalTab(tab)}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        linkModalTab === tab
                          ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {linkModalTab === 'basic' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={currentLink.title}
                          onChange={(e) => setCurrentLink({ ...currentLink, title: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 dark:text-white"
                          placeholder="My Awesome Link"
                          maxLength={100}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          URL *
                        </label>
                        <input
                          type="url"
                          value={currentLink.url}
                          onChange={(e) => setCurrentLink({ ...currentLink, url: e.target.value })}
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 dark:text-white"
                          placeholder="https://example.com"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Icon/Emoji
                          </label>
                          <input
                            type="text"
                            value={currentLink.icon || ''}
                            onChange={(e) => setCurrentLink({ ...currentLink, icon: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 dark:text-white"
                            placeholder="🎯"
                            maxLength={2}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Category
                          </label>
                          <select
                            value={currentLink.category || 'other'}
                            onChange={(e) => setCurrentLink({ ...currentLink, category: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 dark:text-white"
                          >
                            <option value="social">Social</option>
                            <option value="shop">Shop</option>
                            <option value="content">Content</option>
                            <option value="event">Event</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {linkModalTab === 'scheduling' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Start Date
                        </label>
                        <input
                          type="datetime-local"
                          value={currentLink.start_date ? new Date(currentLink.start_date).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setCurrentLink({ ...currentLink, start_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Expire Date
                        </label>
                        <input
                          type="datetime-local"
                          value={currentLink.expire_date ? new Date(currentLink.expire_date).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setCurrentLink({ ...currentLink, expire_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                    </>
                  )}

                  {linkModalTab === 'advanced' && (
                    <>
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentLink.is_active}
                            onChange={(e) => setCurrentLink({ ...currentLink, is_active: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Active
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentLink.is_featured}
                            onChange={(e) => setCurrentLink({ ...currentLink, is_featured: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Featured
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentLink.is_pinned}
                            onChange={(e) => setCurrentLink({ ...currentLink, is_pinned: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Pinned
                          </span>
                        </label>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2 pt-6 border-t border-gray-200 dark:border-neutral-800">
                    <button
                      onClick={closeLinkModal}
                      className="flex-1 px-4 py-2 bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveLink}
                      disabled={savingLink || !currentLink.title || !currentLink.url}
                      className="flex-1 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {savingLink ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          {currentLink.id ? 'Update' : 'Create'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
