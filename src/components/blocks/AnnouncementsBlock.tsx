"use client";

import { motion } from "framer-motion";
import { Megaphone, Pin } from "lucide-react";
import { AnnouncementsConfig } from "@/types/blocks";

interface AnnouncementsBlockProps {
  config: AnnouncementsConfig;
}

export function AnnouncementsBlock({ config }: AnnouncementsBlockProps) {
  const { announcements, max_display = 5 } = config;

  if (announcements.length === 0) {
    return null;
  }

  // Sort: pinned first, then by date
  const sortedAnnouncements = [...announcements]
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, max_display);

  return (
    <div className="space-y-3">
      {sortedAnnouncements.map((announcement, index) => (
        <motion.div
          key={announcement.id || index}
          className="p-4 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg flex-shrink-0">
              {announcement.pinned ? (
                <Pin className="h-4 w-4 text-purple-600 dark:text-purple-400 fill-current" />
              ) : (
                <Megaphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {announcement.title}
                </h4>
                <time className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {new Date(announcement.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {announcement.content}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
