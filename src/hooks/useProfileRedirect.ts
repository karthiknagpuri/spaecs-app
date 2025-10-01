"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface UseProfileRedirectResult {
  isLoading: boolean;
  shouldRedirect: boolean;
  redirectTo: string | null;
  hasProfile: boolean;
  profileSlug: string | null;
}

export function useProfileRedirect(): UseProfileRedirectResult {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [profileSlug, setProfileSlug] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      try {
        setIsLoading(true);

        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          // Not authenticated - redirect to home
          setRedirectTo('/');
          setShouldRedirect(true);
          setHasProfile(false);
          return;
        }

        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from('creator_pages')
          .select('slug, id')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking profile:', profileError);
          return;
        }

        if (profile) {
          // User has profile - should redirect to their profile page
          setHasProfile(true);
          setProfileSlug(profile.slug);
          setRedirectTo(`/@${profile.slug}`);
          setShouldRedirect(true);
        } else {
          // User doesn't have profile - show onboarding
          setHasProfile(false);
          setProfileSlug(null);
          setShouldRedirect(false);
        }

      } catch (error) {
        console.error('Profile redirect check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkProfileAndRedirect();
  }, []);

  // Auto-redirect if needed
  useEffect(() => {
    if (shouldRedirect && redirectTo && !isLoading) {
      router.push(redirectTo);
    }
  }, [shouldRedirect, redirectTo, isLoading, router]);

  return {
    isLoading,
    shouldRedirect,
    redirectTo,
    hasProfile,
    profileSlug
  };
}

// Hook for checking if current user owns a profile
export function useProfileOwnership(profileSlug: string) {
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    const checkOwnership = async () => {
      try {
        setIsLoading(true);

        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        if (!currentUser) {
          setIsOwner(false);
          return;
        }

        // Check if user owns this profile
        const { data: profile } = await supabase
          .from('creator_pages')
          .select('user_id')
          .eq('slug', profileSlug.replace('@', ''))
          .single();

        setIsOwner(profile?.user_id === currentUser.id);

      } catch (error) {
        console.error('Ownership check error:', error);
        setIsOwner(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOwnership();
  }, [profileSlug]);

  return { isOwner, isLoading, user };
}