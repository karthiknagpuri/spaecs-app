"use client";

import { motion } from "framer-motion";
import { Target, Users } from "lucide-react";
import { ReachGoalConfig } from "@/types/blocks";

interface ReachGoalBlockProps {
  config: ReachGoalConfig;
}

export function ReachGoalBlock({ config }: ReachGoalBlockProps) {
  const { goal, current, description, show_progress_bar = true, show_percentage = true } = config;

  const percentage = Math.min((current / goal) * 100, 100);
  const remaining = Math.max(goal - current, 0);

  return (
    <div className="p-6 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
          <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Supporter Goal
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {current}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Current
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {goal}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Goal
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {remaining}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Remaining
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {show_progress_bar && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>Progress</span>
            </div>
            {show_percentage && (
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                {percentage.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="h-3 bg-white dark:bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Supporters needed */}
      {remaining > 0 && (
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          {remaining} more {remaining === 1 ? 'supporter' : 'supporters'} needed to reach the goal
        </p>
      )}

      {remaining === 0 && (
        <div className="text-center">
          <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
            🎉 Goal reached! Thank you for your support!
          </p>
        </div>
      )}
    </div>
  );
}
