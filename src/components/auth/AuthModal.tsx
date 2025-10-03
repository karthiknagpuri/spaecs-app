"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Keyboard support - Escape to close & Focus trap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    const handleTabKey = (e: KeyboardEvent) => {
      if (!isOpen || e.key !== 'Tab') return;

      const focusableElements = document.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const modalElements = Array.from(focusableElements).filter(
        el => document.querySelector('[role="dialog"]')?.contains(el)
      );

      if (modalElements.length === 0) return;

      const firstElement = modalElements[0] as HTMLElement;
      const lastElement = modalElements[modalElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTabKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      // Auto-focus the close button on open
      setTimeout(() => {
        const closeButton = document.querySelector('[aria-label="Close authentication modal"]') as HTMLElement;
        closeButton?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, loading]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-all duration-200 z-10 min-h-[44px] min-w-[44px] flex items-center justify-center group"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
        </button>

        {/* Background decoration */}
        <div className="absolute inset-0 bg-gray-50"></div>

        {/* Content */}
        <div className="relative p-8 sm:p-12">
          {/* Heading */}
          <div className="text-center mb-8">
            <h2 id="modal-title" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Welcome to Spaecs
            </h2>
            <p id="modal-description" className="text-gray-600 text-base sm:text-lg">
              Build your community, monetize your passion
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-in slide-in-from-top duration-200">
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 min-h-[64px] flex items-center justify-center gap-4 px-6 py-4"
          >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-3 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
                  <span className="text-gray-700 font-semibold">Connecting...</span>
                </div>
              ) : (
                <>
                  <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-gray-900 font-semibold text-lg">Continue with Google</span>
                </>
              )}
          </button>

          {/* Footer text */}
          <p className="text-center text-gray-500 text-xs sm:text-sm mt-8 leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
              Terms of Service
            </a>
            {" "}and{" "}
            <a href="/privacy" className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}