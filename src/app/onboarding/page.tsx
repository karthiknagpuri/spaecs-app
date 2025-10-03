"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  Sparkles
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthAndProfile();
  }, []);

  const checkAuthAndProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      setUser(user);

      // Check if user already has a profile
      const { data: profile } = await supabase
        .from('creator_pages')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        // User already has a profile, redirect to dashboard
        router.push('/dashboard');
        return;
      }

      // Auto-create profile from user data
      await createProfile(user);
    } catch (error) {
      console.error('Error checking auth:', error);
      setError('Failed to initialize profile. Please try again.');
      setLoading(false);
    }
  };

  const createProfile = async (user: any) => {
    try {
      // Generate username from email
      const username = user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_-]/g, '') || `user${Date.now()}`;

      // Get user metadata
      const displayName = user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Creator';

      const response = await fetch('/api/profile/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          create_if_missing: true,
          updates: {
            title: displayName,
            description: `Welcome to my creator page!`,
            social_links: {},
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create profile');
      }

      // Successfully created, redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-black dark:bg-white rounded-2xl mb-6">
          <Sparkles className="w-8 h-8 text-white dark:text-black" />
        </div>
        {loading ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Setting up your profile...
            </h1>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-600 dark:text-gray-400" />
          </>
        ) : error ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
