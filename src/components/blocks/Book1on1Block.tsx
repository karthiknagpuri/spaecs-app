"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, CreditCard } from "lucide-react";
import { Book1on1Config } from "@/types/blocks";

interface Book1on1BlockProps {
  config: Book1on1Config;
  onBook?: () => void;
}

export function Book1on1Block({ config, onBook }: Book1on1BlockProps) {
  const { duration, price, currency = 'INR', description, calendly_url } = config;

  const handleBookClick = () => {
    if (calendly_url) {
      window.open(calendly_url, '_blank', 'noopener,noreferrer');
    } else if (onBook) {
      onBook();
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
          <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Book a 1:1 Session
          </h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Session Details */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Duration</span>
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {duration} min
          </div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Price</span>
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {price === 0 ? 'Free' : `₹${price}`}
          </div>
        </div>
      </div>

      {/* Book Button */}
      <motion.button
        onClick={handleBookClick}
        className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Book Session
      </motion.button>
    </div>
  );
}
