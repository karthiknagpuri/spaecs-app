"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AtSign,
  Check,
  X,
  Loader2,
  Sparkles,
  AlertCircle
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState("");
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

      // Auto-populate from user data if no profile exists
      const suggestedUsername = user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_-]/g, '') || '';
      setUsername(suggestedUsername);
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.length >= 3) {
        checkUsernameAvailability(username);
      } else {
        setUsernameAvailable(null);
        setUsernameError("");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

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

  const handleCreateProfile = async () => {
    if (!username || !usernameAvailable) {
      setError("Please choose a valid username");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/profile/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.toLowerCase(),
          create_if_missing: true,
          updates: {
            title: username,
            description: `Welcome to my creator page!`,
            social_links: {},
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create profile');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const canSubmit = username.length >= 3 && usernameAvailable === true && !loading;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black dark:bg-white rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-white dark:text-black" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Your Username
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your unique link: spaecs.com/@{username || 'username'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          <div className="space-y-6">
            {/* Username Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <AtSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  className="block w-full pl-12 pr-12 py-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-lg"
                  placeholder="yourname"
                  maxLength={20}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canSubmit) {
                      handleCreateProfile();
                    }
                  }}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
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

              {/* Validation Messages */}
              {usernameError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{usernameError}</p>
              )}
              {usernameAvailable === false && !usernameError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">This username is taken</p>
              )}
              {usernameAvailable === true && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">Available!</p>
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                3-20 characters, letters, numbers, _ and - only
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleCreateProfile}
              disabled={!canSubmit}
              className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                canSubmit
                  ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 shadow-sm hover:shadow-md'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Continue
                  <Check className="h-5 w-5" />
                </>
              )}
            </button>

            {/* Help Text */}
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              You can customize your profile anytime in settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
