"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Camera,
  Loader2,
  Check,
  AlertCircle,
  SettingsIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import iPhonePreview from "@/components/profile/iPhonePreview";
import BlocksEditor from "@/components/profile/BlocksEditor";
import { CustomTab, CustomBlock } from "@/types/blocks";

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
}

export default function ProfilePageNew() {
  const router = useRouter();
  const supabase = createClient();

  // Profile state
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
    social_links: {},
    tier_configs: [],
  });

  // Blocks state
  const [tabs, setTabs] = useState<CustomTab[]>([]);
  const [blocks, setBlocks] = useState<Record<string, CustomBlock[]>>({});
  const [activeTab, setActiveTab] = useState('home');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchTabs();
  }, []);

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
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTabs = async () => {
    const res = await fetch("/api/blocks/tabs");
    if (res.ok) {
      const data = await res.json();
      setTabs(data.tabs || []);

      // Load blocks for each tab
      for (const tab of data.tabs || []) {
        fetchBlocks(tab.id);
      }
    }
  };

  const fetchBlocks = async (tabId: string) => {
    const res = await fetch(`/api/blocks/${tabId}`);
    if (res.ok) {
      const data = await res.json();
      setBlocks((prev) => ({ ...prev, [tabId]: data.blocks || [] }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (type === 'avatar') setUploadingAvatar(true);
      else setUploadingCover(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);

      setTempProfile({
        ...tempProfile,
        [type === 'avatar' ? 'avatar_url' : 'cover_image']: data.publicUrl,
      });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingCover(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaveStatus('saving');

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempProfile),
      });

      if (!response.ok) throw new Error('Failed to save');

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Customize your profile and manage blocks
            </p>
          </div>

          <motion.button
            onClick={saveProfile}
            disabled={saveStatus === 'saving'}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <AnimatePresence mode="wait">
              {saveStatus === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
              {saveStatus === 'saved' && <Check className="h-4 w-4" />}
              {saveStatus === 'error' && <AlertCircle className="h-4 w-4" />}
            </AnimatePresence>
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Editor */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h2>

              <div className="space-y-4">
                {/* Avatar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center">
                      {tempProfile.avatar_url ? (
                        <img src={tempProfile.avatar_url} alt={tempProfile.title} className="h-full w-full object-cover" />
                      ) : (
                        <UserIcon className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'avatar')}
                        className="hidden"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                      >
                        {uploadingAvatar ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4" />
                            Upload Photo
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={tempProfile.title}
                    onChange={(e) => setTempProfile({ ...tempProfile, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                    placeholder="Your Name"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={tempProfile.description}
                    onChange={(e) => setTempProfile({ ...tempProfile, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white resize-none"
                    placeholder="Tell people about yourself..."
                  />
                </div>
              </div>
            </div>

            {/* Blocks Editor */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
              <BlocksEditor
                tabs={tabs}
                blocks={blocks}
                onTabsChange={fetchTabs}
                onBlocksChange={() => {
                  tabs.forEach(tab => fetchBlocks(tab.id));
                }}
              />
            </div>
          </div>

          {/* Right Side - iPhone Preview */}
          <div className="lg:sticky lg:top-8 self-start">
            <iPhonePreview
              profile={tempProfile}
              tabs={tabs}
              blocks={blocks}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
