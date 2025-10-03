"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Users,
  DollarSign,
  Heart,
  ArrowUpRight,
  Handshake,
  UserCircle,
  BarChart3,
  MessageSquare,
  Eye,
  ChevronRight,
} from "lucide-react";
import { ClaimUsernameModal } from "@/components/dashboard/ClaimUsernameModal";
import { motion } from "framer-motion";

interface DashboardStats {
  followers: number;
  revenue: number;
  supporters: number;
  pageViews: number;
  engagement: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    followers: 0,
    revenue: 0,
    supporters: 0,
    pageViews: 0,
    engagement: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClaimUsername, setShowClaimUsername] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          router.push('/');
          return;
        }

        if (!mounted) return;
        setUser(user);

        const hasClaimedUsername = localStorage.getItem(`username_claimed_${user.id}`);
        const { data: profile } = await supabase
          .from('creator_pages')
          .select('slug')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!mounted) return;

        if ((!profile || !profile.slug) && !hasClaimedUsername) {
          setShowClaimUsername(true);
        } else {
          setShowClaimUsername(false);
          if (profile && profile.slug) {
            localStorage.setItem(`username_claimed_${user.id}`, 'true');
          }
        }

        // TODO: Load real stats from database
        setStats({
          followers: 0,
          revenue: 0,
          supporters: 0,
          pageViews: 0,
          engagement: 0,
        });

        setLoading(false);
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load dashboard');
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="text-center max-w-md px-4">
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const hasAnyData = stats.followers > 0 || stats.revenue > 0 || stats.supporters > 0;

  const primaryMetrics = [
    {
      label: "Earnings",
      value: stats.revenue > 0 ? `₹${stats.revenue.toLocaleString()}` : "—",
      subtext: "this month",
      icon: DollarSign,
      trend: stats.revenue > 0 ? "+0%" : null,
      href: "/dashboard/analytics?tab=revenue",
    },
    {
      label: "Members",
      value: stats.supporters > 0 ? stats.supporters.toLocaleString() : "—",
      subtext: "active supporters",
      icon: Heart,
      trend: stats.supporters > 0 ? "+0%" : null,
      href: "/dashboard/supporters",
    },
  ];

  const secondaryMetrics = [
    {
      label: "Followers",
      value: stats.followers > 0 ? stats.followers.toLocaleString() : "—",
      icon: Users,
      href: "/dashboard/analytics?tab=audience",
    },
    {
      label: "Views",
      value: stats.pageViews > 0 ? stats.pageViews.toLocaleString() : "—",
      icon: Eye,
      href: "/dashboard/analytics?tab=traffic",
    },
    {
      label: "Engagement",
      value: stats.engagement > 0 ? `${stats.engagement}%` : "—",
      icon: TrendingUp,
      href: "/dashboard/analytics?tab=engagement",
    },
  ];

  const quickActions = [
    {
      title: "Manage collaborations",
      icon: Handshake,
      href: "/dashboard/collaborations",
    },
    {
      title: "Create a post",
      icon: MessageSquare,
      href: "/dashboard/posts",
    },
    {
      title: "Edit your page",
      icon: UserCircle,
      href: "/dashboard/profile",
    },
    {
      title: "View analytics",
      icon: BarChart3,
      href: "/dashboard/analytics",
    },
  ];

  return (
    <>
      {showClaimUsername && user && (
        <ClaimUsernameModal
          isOpen={showClaimUsername}
          onComplete={() => {
            setShowClaimUsername(false);
            window.location.href = window.location.href;
          }}
        />
      )}

      <div className="min-h-screen bg-white dark:bg-black">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-medium text-gray-900 dark:text-white mb-3 tracking-tight">
              Home
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Your creator dashboard
            </p>
          </motion.div>

          {/* Primary Metrics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
          >
            {primaryMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <a
                  key={index}
                  href={metric.href}
                  className="group block bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg p-8 hover:border-gray-900 dark:hover:border-white transition-colors duration-200"
                >
                  <div className="flex items-start justify-between mb-8">
                    <Icon className="w-5 h-5 text-gray-900 dark:text-white" />
                    {metric.trend && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <ArrowUpRight className="w-3 h-3" />
                        {metric.trend}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{metric.label}</p>
                    <p className="text-5xl sm:text-6xl font-medium text-gray-900 dark:text-white mb-2 tracking-tight">
                      {metric.value}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{metric.subtext}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-6 text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    View details
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </a>
              );
            })}
          </motion.div>

          {/* Secondary Metrics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16"
          >
            {secondaryMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <a
                  key={index}
                  href={metric.href}
                  className="group block bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg p-6 hover:border-gray-900 dark:hover:border-white transition-colors duration-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{metric.label}</span>
                  </div>
                  <p className="text-3xl font-medium text-gray-900 dark:text-white mb-1 tracking-tight">
                    {metric.value}
                  </p>
                </a>
              );
            })}
          </motion.div>

          {/* Get Started Section - Only show when no data */}
          {!hasAnyData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-16"
            >
              <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-6 tracking-tight">
                Get started
              </h2>

              <div className="space-y-3">
                <a
                  href="/dashboard/profile"
                  className="group flex items-start justify-between p-6 bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg hover:border-gray-900 dark:hover:border-white transition-colors duration-200"
                >
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                      Complete your page
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Add your bio, social links, and profile picture to help supporters connect with you
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors flex-shrink-0 ml-4 mt-0.5" />
                </a>

                <a
                  href="/dashboard/posts"
                  className="group flex items-start justify-between p-6 bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg hover:border-gray-900 dark:hover:border-white transition-colors duration-200"
                >
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                      Share your first post
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Create an update to engage with your community and start building relationships
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors flex-shrink-0 ml-4 mt-0.5" />
                </a>
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-6 tracking-tight">
              Quick actions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <a
                    key={index}
                    href={action.href}
                    className="group flex items-center gap-3 p-5 bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg hover:border-gray-900 dark:hover:border-white transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <Icon className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.title}
                    </span>
                  </a>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
