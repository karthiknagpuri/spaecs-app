"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  AtSign,
  Check,
  X,
  Loader2,
  ArrowRight,
  Sparkles,
  AlertCircle
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
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
        .select('slug')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        // User already has a profile, redirect to it
        router.push(`/@${profile.slug}`);
      }
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
            title: displayName || username,
            description: bio || `Welcome to ${displayName || username}'s creator page!`,
            social_links: {},
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
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create profile');
      }

      // Redirect to the newly created profile
      router.push(`/@${username.toLowerCase()}`);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return username.length >= 3 && usernameAvailable === true;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-black dark:bg-white rounded-2xl mb-4"
          >
            <Sparkles className="w-8 h-8 text-white dark:text-black" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Spaecs!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let's set up your creator profile in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Step {step} of 2</span>
            <span className="text-xs text-gray-500">{step === 1 ? 'Choose username' : 'Personalize'}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-black dark:bg-white"
              animate={{ width: `${(step / 2) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Form Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8"
        >
          {step === 1 && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Choose your username
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This will be your unique URL: spaecs.com/@{username || 'yourname'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AtSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                      placeholder="johndoe"
                      maxLength={20}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
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
                  {usernameError && (
                    <p className="mt-2 text-sm text-red-600">{usernameError}</p>
                  )}
                  {usernameAvailable === false && !usernameError && (
                    <p className="mt-2 text-sm text-red-600">This username is already taken</p>
                  )}
                  {usernameAvailable === true && (
                    <p className="mt-2 text-sm text-green-600">Great! This username is available</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    3-20 characters, letters, numbers, underscore and dash only
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Personalize your profile
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You can always change these later
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none"
                    placeholder="Tell your audience about yourself..."
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Back
              </button>
            )}

            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                  canProceed()
                    ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleCreateProfile}
                disabled={loading || !canProceed()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                  !loading
                    ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>

          {step === 2 && (
            <button
              onClick={() => handleCreateProfile()}
              className="w-full mt-3 py-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Skip for now
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}