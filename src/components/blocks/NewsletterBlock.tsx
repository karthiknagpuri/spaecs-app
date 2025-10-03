"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Check } from "lucide-react";
import { NewsletterConfig } from "@/types/blocks";

interface NewsletterBlockProps {
  config: NewsletterConfig;
  onSubscribe?: (email: string) => Promise<void>;
}

export function NewsletterBlock({ config, onSubscribe }: NewsletterBlockProps) {
  const {
    service,
    embed_code,
    description,
    placeholder = 'Enter your email',
    button_text = 'Subscribe',
    success_message = 'Thanks for subscribing!',
  } = config;

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (onSubscribe) {
        await onSubscribe(email);
      }
      setIsSuccess(true);
      setEmail('');
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      setError('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If embed code is provided, use it
  if (embed_code && service !== 'custom') {
    return (
      <div className="p-6 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl">
        <div dangerouslySetInnerHTML={{ __html: embed_code }} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
          <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Newsletter
          </h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      {isSuccess ? (
        <motion.div
          className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Check className="h-5 w-5" />
            <span className="font-medium">{success_message}</span>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500"
              disabled={isSubmitting}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          >
            {isSubmitting ? 'Subscribing...' : button_text}
          </motion.button>
        </form>
      )}
    </div>
  );
}
