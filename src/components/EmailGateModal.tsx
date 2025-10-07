"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Check, Lock, ExternalLink, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface EmailGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  linkTitle: string;
  linkUrl: string;
  linkId: string;
  creatorId: string;
  creatorName: string;
}

export function EmailGateModal({
  isOpen,
  onClose,
  onSuccess,
  linkTitle,
  linkUrl,
  linkId,
  creatorId,
  creatorName
}: EmailGateModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Store email lead in database
      const { error: leadError } = await supabase
        .from('email_leads')
        .insert({
          user_id: creatorId,
          email: email.trim().toLowerCase(),
          source: 'custom_link',
          metadata: {
            link_id: linkId,
            link_title: linkTitle,
            link_url: linkUrl
          }
        });

      if (leadError && leadError.code !== '23505') { // Ignore duplicate errors
        throw leadError;
      }

      // Track click with email in link_analytics
      await supabase
        .from('link_analytics')
        .insert({
          user_id: creatorId,
          link_id: linkId,
          email_collected: email.trim().toLowerCase(),
          metadata: {
            source: 'email_gate'
          }
        });

      setIsSuccess(true);

      // Store email in localStorage to bypass gate for future visits
      localStorage.setItem(`email_gate_${linkId}`, email);

      // Auto-proceed after success animation
      setTimeout(() => {
        onSuccess();
        // Open link in new tab
        window.open(linkUrl, '_blank', 'noopener,noreferrer');
      }, 1500);

    } catch (error: any) {
      console.error('Email capture error:', error);
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 relative shadow-2xl border border-gray-200 dark:border-neutral-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>

              {!isSuccess ? (
                <>
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Get Access to This Link
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Join {creatorName}'s community to access <strong>"{linkTitle}"</strong> and get exclusive updates!
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800/50">
                    <div className="flex items-start gap-3 mb-2">
                      <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          What you'll get:
                        </h3>
                        <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                          <li>• Instant access to this link</li>
                          <li>• Exclusive updates from {creatorName}</li>
                          <li>• Early access to new content</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError(null);
                          }}
                          placeholder="your@email.com"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                          disabled={isSubmitting}
                          autoFocus
                        />
                      </div>
                      {error && (
                        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                          <span>⚠️</span> {error}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          Getting Access...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-5 w-5" />
                          Get Access Now
                        </>
                      )}
                    </button>
                  </form>

                  {/* Privacy Note */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                    🔒 We respect your privacy. Unsubscribe anytime.
                  </p>
                </>
              ) : (
                /* Success State */
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome! 🎉
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Opening your link now...
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-purple-600 border-t-transparent"></div>
                    Redirecting...
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
