"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Bell,
  Star,
  TrendingUp,
  Users,
  Crown,
  Gift,
  Calendar,
  Settings,
  ChevronRight,
  Sparkles,
  Trophy,
  Zap
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FanProfile } from "@/components/fan/FanProfile";
import { ExclusiveContentFeed } from "@/components/fan/ExclusiveContentFeed";
import { FanNotifications } from "@/components/fan/FanNotifications";
import Link from "next/link";

export default function FanDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'profile'>('feed');
  const [showNotifications, setShowNotifications] = useState(false);
  const [fanStats, setFanStats] = useState({
    total_spent: 2500,
    creators_supported: 4,
    months_active: 6,
    posts_unlocked: 45,
    fan_level: 'Champion',
    badges: [
      {
        id: '1',
        name: 'Early Supporter',
        icon: '⭐',
        description: 'Joined within the first month',
        earned_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        rarity: 'rare' as const
      },
      {
        id: '2',
        name: 'Super Fan',
        icon: '🏆',
        description: 'Supported 5+ creators',
        earned_at: new Date(Date.now() - 86400000 * 15).toISOString(),
        rarity: 'epic' as const
      },
      {
        id: '3',
        name: 'Content Lover',
        icon: '❤️',
        description: 'Unlocked 50+ posts',
        earned_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        rarity: 'rare' as const
      },
      {
        id: '4',
        name: 'Generous Supporter',
        icon: '💎',
        description: 'Contributed ₹2000+',
        earned_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        rarity: 'legendary' as const
      }
    ]
  });

  const supabase = createClient();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
                Spaecs
              </Link>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-sm font-semibold">
                <Star className="h-4 w-4" />
                <span>{fanStats.fan_level} Fan</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <Link
                href="/dashboard/my-memberships"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors text-sm font-medium"
              >
                <Users className="h-4 w-4" />
                My Memberships
              </Link>
              <Link
                href="/dashboard/settings"
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, Fan! 👋
              </h1>
              <p className="text-white/90">
                You're supporting {fanStats.creators_supported} amazing creators
              </p>
            </div>
            <Link
              href="/discover"
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              <Users className="h-5 w-5" />
              Discover More
            </Link>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Support</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ₹{fanStats.total_spent.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              All time
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Creators</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {fanStats.creators_supported}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Active memberships
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {fanStats.posts_unlocked}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Unlocked
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Badges</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {fanStats.badges.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Earned
            </p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-neutral-800 mb-8">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('feed')}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === 'feed'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Exclusive Content
              {activeTab === 'feed' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === 'profile'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              My Profile
              {activeTab === 'profile' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"></div>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'feed' && user && (
          <ExclusiveContentFeed userId={user.id} />
        )}

        {activeTab === 'profile' && (
          <FanProfile stats={fanStats} />
        )}
      </div>

      {/* Notifications Panel */}
      <FanNotifications
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Mobile Quick Actions */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 p-4 z-30">
        <Link
          href="/discover"
          className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 text-white rounded-full font-semibold"
        >
          <Users className="h-5 w-5" />
          Discover Creators
        </Link>
      </div>
    </div>
  );
}
