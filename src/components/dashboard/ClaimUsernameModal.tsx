"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Loader2, Link2 } from "lucide-react";

interface ClaimUsernameModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function ClaimUsernameModal({ isOpen, onComplete }: ClaimUsernameModalProps) {
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkUsername = async (name: string) => {
      setCheckingUsername(true);
      setError("");

      try {
        const response = await fetch(`/api/profile/check-username?username=${encodeURIComponent(name)}`);
        const data = await response.json();

        if (response.ok) {
          setUsernameAvailable(data.available);
          if (data.error) {
            setError(data.error);
          }
        } else {
          setError(data.error || 'Error checking username');
          setUsernameAvailable(false);
        }
      } catch (error) {
        setError('Error checking username');
        setUsernameAvailable(false);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timer = setTimeout(() => {
      if (username.length >= 3) {
        checkUsername(username);
      } else {
        setUsernameAvailable(null);
        setError("");
        setCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);


  const handleClaim = async () => {
    if (!username || !usernameAvailable) return;

    setLoading(true);
    setError("");

    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();

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
        throw new Error(data.error || 'Failed to claim username');
      }

      // Set localStorage flag BEFORE calling onComplete
      if (user) {
        localStorage.setItem(`username_claimed_${user.id}`, 'true');
      }

      onComplete();
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const canSubmit = username.length >= 3 && usernameAvailable === true && !loading;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      role="presentation"
    >
      <div
        className="relative w-full sm:max-w-sm bg-gradient-to-br from-purple-600 to-purple-700 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-username-title"
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Link2 className="h-4 w-4 text-purple-200" />
            <h2 id="claim-username-title" className="text-base font-semibold text-white">
              Claim Your Space
            </h2>
          </div>
          <p className="text-xs text-purple-200">
            One link for all your Internet needs
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white px-5 py-5">
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              spaecs.com/
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-600 transition-colors font-medium"
                placeholder="yourname"
                maxLength={20}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSubmit) {
                    handleClaim();
                  }
                }}
              />
              <button
                onClick={handleClaim}
                disabled={!canSubmit}
                className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                  canSubmit
                    ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/30'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="min-h-[20px] flex items-center justify-center">
            {checkingUsername && (
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 text-gray-400 animate-spin" />
                <p className="text-xs text-gray-500">Checking...</p>
              </div>
            )}
            {!checkingUsername && usernameAvailable === true && (
              <p className="text-xs text-green-600 font-medium">Available</p>
            )}
            {!checkingUsername && usernameAvailable === false && (
              <p className="text-xs text-red-600 font-medium">Taken</p>
            )}
            {!checkingUsername && !usernameAvailable && username.length > 0 && username.length < 3 && (
              <p className="text-xs text-gray-500">Min 3 chars</p>
            )}
            {error && (
              <p className="text-xs text-red-600 font-medium">{error}</p>
            )}
          </div>
        </div>

        {/* Safe area for mobile */}
        <div className="h-safe-bottom bg-white sm:hidden" />
      </div>
    </div>
  );
}
