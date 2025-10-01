"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Check, Gift } from "lucide-react";

interface LeadCaptureProps {
  creatorName: string;
  leadMagnet?: {
    title: string;
    description: string;
    type: 'freebie' | 'newsletter' | 'exclusive';
  };
  onEmailCapture: (email: string) => void;
  className?: string;
}

export function LeadCapture({ creatorName, leadMagnet, onEmailCapture, className = "" }: LeadCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultLeadMagnet = {
    title: "Get exclusive updates",
    description: `Join ${creatorName}'s community and get early access to new content, behind-the-scenes updates, and exclusive offers.`,
    type: 'newsletter' as const
  };

  const magnet = leadMagnet || defaultLeadMagnet;

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
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1500));

      onEmailCapture(email);
      setIsSuccess(true);

      // Auto close after success
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setEmail("");
      }, 2000);
    } catch (error: any) {
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = () => {
    switch (magnet.type) {
      case 'freebie': return Gift;
      case 'exclusive': return Gift;
      default: return Mail;
    }
  };

  const Icon = getIcon();

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className={`w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors ${className}`}
      >
        <Icon className="h-4 w-4" />
        {magnet.type === 'freebie' ? 'Get Free Content' : 'Join Community'}
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setIsOpen(false)}
            >
              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                {!isSuccess ? (
                  <>
                    {/* Header */}
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {magnet.title}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {magnet.description}
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError(null);
                          }}
                          placeholder="Enter your email address"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          disabled={isSubmitting}
                        />
                        {error && (
                          <p className="text-red-500 text-xs mt-2">{error}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Joining...
                          </>
                        ) : (
                          <>
                            <Icon className="h-4 w-4" />
                            {magnet.type === 'freebie' ? 'Get Free Access' : 'Join Now'}
                          </>
                        )}
                      </button>
                    </form>

                    {/* Privacy Note */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                      We respect your privacy. Unsubscribe at any time.
                    </p>
                  </>
                ) : (
                  /* Success State */
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Welcome aboard! 🎉
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Check your email for your welcome message and exclusive content.
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}