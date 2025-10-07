"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  Crown,
  Zap,
  Heart,
  Gift,
  Sparkles,
  Target,
  TrendingUp,
  Calendar,
  Award
} from "lucide-react";

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned_at: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface FanStats {
  total_spent: number;
  creators_supported: number;
  months_active: number;
  posts_unlocked: number;
  fan_level: string;
  badges: Badge[];
}

interface FanProfileProps {
  stats: FanStats;
}

export function FanProfile({ stats }: FanProfileProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-500 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-500';
      case 'epic': return 'border-purple-500';
      case 'rare': return 'border-blue-500';
      default: return 'border-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Fan Level Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 p-8 text-white shadow-2xl"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>

        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1">{stats.fan_level} Fan</h2>
              <p className="text-white/80">Member since {stats.months_active} months ago</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-5 w-5 text-pink-300" />
                <p className="text-white/70 text-sm">Total Support</p>
              </div>
              <p className="text-2xl font-bold">₹{stats.total_spent.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-5 w-5 text-yellow-300" />
                <p className="text-white/70 text-sm">Creators</p>
              </div>
              <p className="text-2xl font-bold">{stats.creators_supported}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Gift className="h-5 w-5 text-blue-300" />
                <p className="text-white/70 text-sm">Posts Unlocked</p>
              </div>
              <p className="text-2xl font-bold">{stats.posts_unlocked}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-5 w-5 text-purple-300" />
                <p className="text-white/70 text-sm">Badges</p>
              </div>
              <p className="text-2xl font-bold">{stats.badges.length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Badges Collection */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Badge Collection
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.badges.length} of 20 earned
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.badges.map((badge) => (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.05 }}
              className={`relative p-4 rounded-xl border-2 ${getRarityBorder(badge.rarity)} bg-gradient-to-br ${getRarityColor(badge.rarity)} cursor-pointer group`}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{badge.icon}</div>
                <h4 className="font-bold text-white mb-1 text-sm">
                  {badge.name}
                </h4>
                <p className="text-xs text-white/80 mb-2 line-clamp-2">
                  {badge.description}
                </p>
                <div className="flex items-center justify-center gap-1 text-xs text-white/70">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(badge.earned_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Rarity indicator */}
              <div className="absolute top-2 right-2">
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wide ${
                  badge.rarity === 'legendary' ? 'bg-yellow-600' :
                  badge.rarity === 'epic' ? 'bg-purple-600' :
                  badge.rarity === 'rare' ? 'bg-blue-600' : 'bg-gray-600'
                }`}>
                  {badge.rarity}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Locked badges */}
          {[...Array(20 - stats.badges.length)].map((_, i) => (
            <div
              key={`locked-${i}`}
              className="relative p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800"
            >
              <div className="text-center">
                <div className="text-4xl mb-2 opacity-30">🔒</div>
                <h4 className="font-bold text-gray-400 dark:text-gray-600 mb-1 text-sm">
                  Locked
                </h4>
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  Keep supporting to unlock!
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress to Next Level */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Progress to {stats.fan_level === 'Legend' ? 'Ultimate Legend' : getNextLevel(stats.fan_level)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Keep supporting to level up!
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Support Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Support
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                ₹{stats.total_spent.toLocaleString()} / ₹{getNextLevelRequirement(stats.fan_level).toLocaleString()}
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stats.total_spent / getNextLevelRequirement(stats.fan_level)) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
              />
            </div>
          </div>

          {/* Creators Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Creators Supported
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {stats.creators_supported} / {getNextCreatorRequirement(stats.fan_level)}
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stats.creators_supported / getNextCreatorRequirement(stats.fan_level)) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-gradient-to-r from-green-600 to-emerald-600 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getNextLevel(currentLevel: string): string {
  const levels = ['Supporter', 'Contributor', 'Champion', 'Hero', 'Legend'];
  const index = levels.indexOf(currentLevel);
  return index < levels.length - 1 ? levels[index + 1] : 'Ultimate Legend';
}

function getNextLevelRequirement(currentLevel: string): number {
  const requirements: Record<string, number> = {
    'Supporter': 1000,
    'Contributor': 2000,
    'Champion': 5000,
    'Hero': 10000,
    'Legend': 20000
  };
  return requirements[currentLevel] || 50000;
}

function getNextCreatorRequirement(currentLevel: string): number {
  const requirements: Record<string, number> = {
    'Supporter': 3,
    'Contributor': 5,
    'Champion': 10,
    'Hero': 15,
    'Legend': 20
  };
  return requirements[currentLevel] || 30;
}
