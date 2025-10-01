"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Calendar,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  ArrowUp,
  ArrowDown,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";

interface AnalyticsData {
  totalRevenue: number;
  revenueGrowth: number;
  totalMembers: number;
  memberGrowth: number;
  totalViews: number;
  viewsGrowth: number;
  engagementRate: number;
  engagementGrowth: number;
  revenueByMonth: { month: string; revenue: number }[];
  membersByMonth: { month: string; members: number }[];
  topCommunities: { name: string; members: number; revenue: number }[];
  giftRevenue: { gift: string; revenue: number }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 125000,
    revenueGrowth: 23.5,
    totalMembers: 3450,
    memberGrowth: 15.2,
    totalViews: 89500,
    viewsGrowth: 42.1,
    engagementRate: 68.4,
    engagementGrowth: 5.8,
    revenueByMonth: [
      { month: 'Jan', revenue: 8500 },
      { month: 'Feb', revenue: 10200 },
      { month: 'Mar', revenue: 9800 },
      { month: 'Apr', revenue: 11500 },
      { month: 'May', revenue: 13200 },
      { month: 'Jun', revenue: 14800 },
      { month: 'Jul', revenue: 16500 },
      { month: 'Aug', revenue: 18000 },
      { month: 'Sep', revenue: 22500 }
    ],
    membersByMonth: [
      { month: 'Jan', members: 250 },
      { month: 'Feb', members: 320 },
      { month: 'Mar', members: 380 },
      { month: 'Apr', members: 450 },
      { month: 'May', members: 520 },
      { month: 'Jun', members: 610 },
      { month: 'Jul', members: 720 },
      { month: 'Aug', members: 850 },
      { month: 'Sep', members: 1000 }
    ],
    topCommunities: [
      { name: 'Tech Creators', members: 850, revenue: 42000 },
      { name: 'Gaming Squad', members: 620, revenue: 31000 },
      { name: 'Art & Design', members: 480, revenue: 24000 },
      { name: 'Music Makers', members: 350, revenue: 17500 },
      { name: 'Fitness Warriors', members: 290, revenue: 14500 }
    ],
    giftRevenue: [
      { gift: 'Diamond', revenue: 25000 },
      { gift: 'Trophy', revenue: 18000 },
      { gift: 'Lightning', revenue: 12000 },
      { gift: 'Coffee', revenue: 8000 },
      { gift: 'Star', revenue: 5000 },
      { gift: 'Heart', revenue: 3000 }
    ]
  });

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // In production, fetch real data from database
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${color} bg-opacity-10`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-sm ${
          change >= 0 ? 'text-green-500' : 'text-red-500'
        }`}>
          {change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {title}
      </p>
    </div>
  );

  const maxRevenue = Math.max(...analytics.revenueByMonth.map(m => m.revenue));
  const maxMembers = Math.max(...analytics.membersByMonth.map(m => m.members));

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your performance and growth metrics
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          {(['7d', '30d', '90d', '1y'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeframe === period
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700'
              }`}
            >
              {period === '7d' ? '7 Days' :
               period === '30d' ? '30 Days' :
               period === '90d' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`₹${analytics.totalRevenue.toLocaleString()}`}
          change={analytics.revenueGrowth}
          icon={DollarSign}
          color="from-green-500 to-emerald-600"
        />
        <StatCard
          title="Total Members"
          value={analytics.totalMembers.toLocaleString()}
          change={analytics.memberGrowth}
          icon={Users}
          color="from-blue-500 to-indigo-600"
        />
        <StatCard
          title="Total Views"
          value={analytics.totalViews.toLocaleString()}
          change={analytics.viewsGrowth}
          icon={Eye}
          color="from-purple-500 to-pink-600"
        />
        <StatCard
          title="Engagement Rate"
          value={`${analytics.engagementRate}%`}
          change={analytics.engagementGrowth}
          icon={Activity}
          color="from-orange-500 to-red-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Revenue Trend
            </h2>
            <LineChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <div className="flex h-full items-end justify-between gap-2">
              {analytics.revenueByMonth.map((month, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-t-lg relative">
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-purple-600 rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${(month.revenue / maxRevenue) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {month.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Monthly Revenue</span>
            <span className="text-green-500 font-medium">+23.5% vs last period</span>
          </div>
        </div>

        {/* Members Chart */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Member Growth
            </h2>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <div className="flex h-full items-end justify-between gap-2">
              {analytics.membersByMonth.map((month, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-t-lg relative">
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-indigo-600 rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${(month.members / maxMembers) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {month.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Monthly New Members</span>
            <span className="text-green-500 font-medium">+15.2% vs last period</span>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Communities */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Communities
            </h2>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analytics.topCommunities.map((community, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {community.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {community.members} members
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ₹{community.revenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Revenue
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gift Revenue Distribution */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gift Revenue
            </h2>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analytics.giftRevenue.map((gift, index) => {
              const totalGiftRevenue = analytics.giftRevenue.reduce((acc, g) => acc + g.revenue, 0);
              const percentage = (gift.revenue / totalGiftRevenue) * 100;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {gift.gift}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      ₹{gift.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {percentage.toFixed(1)}% of total
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}