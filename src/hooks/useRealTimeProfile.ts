"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface ProfileData {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string;
  avatar_url?: string;
  cover_image?: string;
  is_verified: boolean;
  followers_count: number;
  monthly_earnings: number;
  social_links: Record<string, any>;
  tier_configs: any[];
  custom_links?: any[];
  theme_config?: any;
  updated_at?: string;
}

interface UseRealTimeProfileResult {
  profile: ProfileData | null;
  isOwner: boolean;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<ProfileData>) => Promise<void>;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

const DEBOUNCE_DELAY = 500; // 500ms debounce for auto-save

export function useRealTimeProfile(username: string): UseRealTimeProfileResult {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<ProfileData>>({});
  const currentUserRef = useRef<string | null>(null);

  // Initialize profile data and real-time subscription
  useEffect(() => {
    let mounted = true;

    const initializeProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        currentUserRef.current = user?.id || null;

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('creator_pages')
          .select('*')
          .eq('slug', username.replace('@', ''))
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (mounted) {
          if (profileData) {
            setProfile(profileData);
            setIsOwner(user?.id === profileData.user_id);
          } else {
            setProfile(null);
            setIsOwner(false);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeProfile();

    return () => {
      mounted = false;
    };
  }, [username]);

  // Set up real-time subscription
  useEffect(() => {
    if (!profile?.id) return;

    // Create real-time channel for this specific profile
    const channel = supabase
      .channel(`profile-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_pages',
          filter: `id=eq.${profile.id}`
        },
        (payload) => {
          console.log('Real-time profile update:', payload);

          if (payload.eventType === 'UPDATE' && payload.new) {
            // Only update if the change wasn't made by current user (to avoid conflicts)
            const newData = payload.new as ProfileData;

            setProfile(prevProfile => {
              if (!prevProfile) return newData;

              // Check if this update is newer than our local version
              const newTimestamp = new Date(newData.updated_at || '').getTime();
              const currentTimestamp = new Date(prevProfile.updated_at || '').getTime();

              if (newTimestamp > currentTimestamp) {
                return newData;
              }

              return prevProfile;
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [profile?.id]);

  // Auto-save with debouncing
  const debouncedSave = useCallback(async () => {
    if (!profile?.id || Object.keys(pendingUpdatesRef.current).length === 0) {
      return;
    }

    setSaveStatus('saving');

    try {
      const updates = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {};

      const { data: updatedProfile, error: updateError } = await supabase
        .from('creator_pages')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProfile(updatedProfile);
      setSaveStatus('saved');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      // Reset save status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);

    } catch (err: any) {
      console.error('Auto-save error:', err);
      setSaveStatus('error');
      setError(err.message);

      // Reset error status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setError(null);
      }, 3000);
    }
  }, [profile?.id]);

  // Update profile with auto-save
  const updateProfile = useCallback(async (updates: Partial<ProfileData>) => {
    if (!profile) return;

    // Optimistically update local state
    setProfile(prev => prev ? { ...prev, ...updates } : null);
    setHasUnsavedChanges(true);

    // Accumulate updates for batched saving
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates
    };

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      debouncedSave();
    }, DEBOUNCE_DELAY);
  }, [profile, debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    profile,
    isOwner,
    loading,
    error,
    updateProfile,
    saveStatus,
    lastSaved,
    hasUnsavedChanges
  };
}