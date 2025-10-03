'use client';

import { Users, TrendingUp, FileText, Award } from 'lucide-react';

interface CreatorStatsProps {
  totalFollowers?: number;
  engagementRate?: number;
  monthlyContent?: number;
  totalCollaborations?: number;
}

export default function CreatorStats({
  totalFollowers = 0,
  engagementRate = 0,
  monthlyContent = 0,
  totalCollaborations = 0
}: CreatorStatsProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const stats = [
    {
      icon: Users,
      label: 'Total Followers',
      value: formatNumber(totalFollowers),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      icon: TrendingUp,
      label: 'Engagement Rate',
      value: `${engagementRate.toFixed(1)}%`,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30'
    },
    {
      icon: FileText,
      label: 'Monthly Content',
      value: monthlyContent.toString(),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      icon: Award,
      label: 'Collaborations',
      value: totalCollaborations.toString(),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    }
  ];

  // Only show if at least one stat has a value
  const hasStats = totalFollowers > 0 || engagementRate > 0 || monthlyContent > 0 || totalCollaborations > 0;

  if (!hasStats) return null;

  return (
    <div className="py-8 border-t border-gray-200 dark:border-neutral-800">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="flex flex-col items-center p-4 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div className={`p-3 rounded-full ${stat.bgColor} mb-3`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
