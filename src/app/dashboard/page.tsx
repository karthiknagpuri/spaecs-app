"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  ArrowUp,
  Gift,
  Calendar,
  UserCircle,
  Settings,
  BarChart3,
} from "lucide-react";

interface DashboardStats {
  followers: number;
  revenue: number;
  events: number;
  gifts: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    followers: 0,
    revenue: 0,
    events: 0,
    gifts: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      setUser(user);

      // TODO: Load real stats from database
      // For now, using placeholder data
      setStats({
        followers: 0,
        revenue: 0,
        events: 0,
        gifts: 0,
      });

      setLoading(false);
    };

    loadDashboard();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const statCards = [
    {
      title: "Followers",
      value: stats.followers.toLocaleString(),
      change: "+0%",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Revenue",
      value: `₹${stats.revenue.toLocaleString()}`,
      change: "+0%",
      icon: DollarSign,
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Events",
      value: stats.events.toLocaleString(),
      change: "+0%",
      icon: Calendar,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Gifts",
      value: stats.gifts.toLocaleString(),
      change: "+0%",
      icon: Gift,
      color: "from-orange-500 to-red-500",
    },
  ];

  const quickActions = [
    {
      title: "Create Event",
      description: "Schedule a new event for your community",
      icon: Calendar,
      href: "/dashboard/events",
      color: "bg-purple-500",
    },
    {
      title: "View Analytics",
      description: "See detailed insights and metrics",
      icon: BarChart3,
      href: "/dashboard/analytics",
      color: "bg-blue-500",
    },
    {
      title: "Manage Profile",
      description: "Update your creator profile",
      icon: UserCircle,
      href: "/dashboard/profile",
      color: "bg-emerald-500",
    },
    {
      title: "Settings",
      description: "Configure your account preferences",
      icon: Settings,
      href: "/dashboard/profile",
      color: "bg-gray-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Welcome back!
              </h1>
              <p className="text-gray-600 text-lg">
                {user.email?.split('@')[0] || user.email}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Activity className="w-4 h-4" />
              <span>Last login: Just now</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                    <ArrowUp className="w-4 h-4" />
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <a
                  key={index}
                  href={action.href}
                  className="group p-6 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:shadow-lg transition-all duration-200 flex flex-col items-start gap-3"
                >
                  <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No recent activity</p>
            <p className="text-sm text-gray-400 mt-2">
              Your activity will appear here once you start engaging with your community
            </p>
          </div>
        </div>

        {/* Getting Started Tips */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 md:p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
          <p className="text-indigo-100 mb-6">
            Start building your creator community with these essential steps:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="font-semibold mb-2">1. Complete Your Profile</div>
              <p className="text-sm text-indigo-100">
                Add your bio, social links, and profile picture
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="font-semibold mb-2">2. Create Your First Event</div>
              <p className="text-sm text-indigo-100">
                Schedule a meetup or workshop for your community
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="font-semibold mb-2">3. Share Your Profile</div>
              <p className="text-sm text-indigo-100">
                Spread the word and grow your follower base
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
