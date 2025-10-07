"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Heart,
  Gift,
  MessageCircle,
  Crown,
  Sparkles,
  TrendingUp,
  Calendar,
  X,
  Check,
  ExternalLink,
  Settings
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Notification {
  id: string;
  type: 'new_post' | 'new_benefit' | 'tier_update' | 'creator_message' | 'achievement' | 'renewal';
  title: string;
  message: string;
  creator?: {
    name: string;
    username: string;
    avatar_url?: string;
  };
  timestamp: string;
  is_read: boolean;
  action_url?: string;
  icon_url?: string;
}

interface FanNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FanNotifications({ isOpen, onClose }: FanNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    // Simulated data - replace with actual API call
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'new_post',
        title: 'New Exclusive Post',
        message: 'Jane Doe shared a new post: "Behind the Scenes"',
        creator: {
          name: 'Jane Doe',
          username: 'janedoe',
          avatar_url: undefined
        },
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        is_read: false,
        action_url: '/janedoe/posts/123'
      },
      {
        id: '2',
        type: 'achievement',
        title: 'New Badge Earned!',
        message: 'You earned the "Early Supporter" badge 🏆',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        is_read: false
      },
      {
        id: '3',
        type: 'new_benefit',
        title: 'New Benefit Available',
        message: 'Your Champion tier now includes exclusive Q&A sessions',
        creator: {
          name: 'John Smith',
          username: 'johnsmith',
          avatar_url: undefined
        },
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        is_read: true
      }
    ];
    setNotifications(mockNotifications);
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      )
    );
  };

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, is_read: true }))
    );
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_post': return Sparkles;
      case 'new_benefit': return Gift;
      case 'tier_update': return Crown;
      case 'creator_message': return MessageCircle;
      case 'achievement': return TrendingUp;
      case 'renewal': return Calendar;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_post': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'new_benefit': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'tier_update': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      case 'creator_message': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'achievement': return 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400';
      default: return 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400';
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white dark:bg-neutral-900 shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Bell className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Notifications
                    </h2>
                    {unreadCount > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {unreadCount} unread
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Filter & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'unread'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium"
                >
                  Mark all read
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-neutral-800">
                  {filteredNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const colorClass = getNotificationColor(notification.type);

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors ${
                          !notification.is_read ? 'bg-purple-50/30 dark:bg-purple-950/10' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className={`flex-shrink-0 p-2 rounded-xl ${colorClass}`}>
                            <Icon className="h-5 w-5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <div className="flex-shrink-0 h-2 w-2 bg-purple-600 rounded-full"></div>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {notification.message}
                            </p>

                            {/* Creator Info */}
                            {notification.creator && (
                              <div className="flex items-center gap-2 mb-2">
                                {notification.creator.avatar_url ? (
                                  <div className="h-6 w-6 rounded-full overflow-hidden">
                                    <Image
                                      src={notification.creator.avatar_url}
                                      alt={notification.creator.name}
                                      width={24}
                                      height={24}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
                                    <span className="text-white text-[10px] font-bold">
                                      {notification.creator.name.slice(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {notification.creator.name}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTimestamp(notification.timestamp)}
                              </span>

                              <div className="flex items-center gap-2">
                                {notification.action_url && (
                                  <Link
                                    href={notification.action_url}
                                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium flex items-center gap-1"
                                  >
                                    View
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>
                                )}
                                {!notification.is_read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <Bell className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No notifications
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You're all caught up!
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
              <Link
                href="/dashboard/settings/notifications"
                className="flex items-center justify-center gap-2 w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Notification Settings
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper function
function formatTimestamp(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = now - time;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
