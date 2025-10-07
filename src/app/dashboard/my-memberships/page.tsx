"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Star,
  Crown,
  Calendar,
  TrendingUp,
  Users,
  Gift,
  Bell,
  Settings,
  ExternalLink,
  Lock,
  Unlock,
  ChevronRight,
  Sparkles,
  Trophy,
  Zap,
  Check,
  X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

interface Membership {
  id: string;
  creator_id: string;
  tier_id: string;
  status: 'active' | 'cancelled' | 'paused';
  started_at: string;
  next_billing_date?: string;
  amount: number;
  creator: {
    username: string;
    display_name: string;
    avatar_url?: string;
    bio?: string;
  };
  tier: {
    name: string;
    price: number;
    benefits: string[];
  };
  stats: {
    posts_unlocked: number;
    benefits_used: number;
  };
}

interface SupportHistory {
  id: string;
  amount: number;
  creator_name: string;
  creator_avatar?: string;
  creator_username: string;
  date: string;
  type: 'one_time' | 'monthly';
  message?: string;
  badge?: string;
}

export default function MyMembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [supportHistory, setSupportHistory] = useState<SupportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [totalSpent, setTotalSpent] = useState(0);
  const [fanLevel, setFanLevel] = useState<string>('Supporter');

  const supabase = createClient();

  useEffect(() => {
    fetchMemberships();
    fetchSupportHistory();
  }, []);

  const fetchMemberships = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch active memberships
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          id,
          creator_user_id,
          access_level,
          status,
          joined_at,
          metadata
        `)
        .eq('member_user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      // Transform data to match interface
      const transformedData: Membership[] = (data || []).map((item: any) => ({
        id: item.id,
        creator_id: item.creator_user_id,
        tier_id: item.access_level,
        status: item.status,
        started_at: item.joined_at,
        next_billing_date: undefined,
        amount: 0,
        creator: {
          username: 'creator',
          display_name: 'Creator',
          avatar_url: undefined,
          bio: undefined
        },
        tier: {
          name: item.access_level,
          price: 0,
          benefits: []
        },
        stats: {
          posts_unlocked: 0,
          benefits_used: 0
        }
      }));

      setMemberships(transformedData);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch payment history
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate total spent
      const total = (data || []).reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
      setTotalSpent(total);

      // Determine fan level based on total spent
      if (total >= 10000) setFanLevel('Legend');
      else if (total >= 5000) setFanLevel('Hero');
      else if (total >= 2000) setFanLevel('Champion');
      else if (total >= 1000) setFanLevel('Contributor');
      else setFanLevel('Supporter');

      // Transform data
      const transformedHistory: SupportHistory[] = (data || []).map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        creator_name: 'Creator',
        creator_username: payment.creator_id,
        date: payment.created_at,
        type: payment.is_monthly ? 'monthly' : 'one_time',
        message: payment.message,
        badge: getBadgeForAmount(payment.amount)
      }));

      setSupportHistory(transformedHistory);
    } catch (error) {
      console.error('Error fetching support history:', error);
    }
  };

  const getBadgeForAmount = (amount: number): string => {
    if (amount >= 2000) return '👑 Legend';
    if (amount >= 1000) return '🏆 Hero';
    if (amount >= 500) return '✨ Champion';
    if (amount >= 250) return '🎯 Contributor';
    if (amount >= 100) return '⭐ Supporter';
    return '';
  };

  const getFanLevelColor = (level: string) => {
    switch (level) {
      case 'Legend': return 'from-yellow-500 to-orange-500';
      case 'Hero': return 'from-purple-500 to-pink-500';
      case 'Champion': return 'from-blue-500 to-cyan-500';
      case 'Contributor': return 'from-green-500 to-emerald-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getFanLevelIcon = (level: string) => {
    switch (level) {
      case 'Legend': return Crown;
      case 'Hero': return Trophy;
      case 'Champion': return Sparkles;
      case 'Contributor': return Zap;
      default: return Star;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const FanLevelIcon = getFanLevelIcon(fanLevel);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with Fan Stats */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Memberships
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your creator support and exclusive access
          </p>
        </div>

        {/* Fan Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-6 text-white shadow-xl"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>

          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FanLevelIcon className="h-8 w-8" />
                <h2 className="text-2xl font-bold">{fanLevel} Fan</h2>
              </div>
              <p className="text-white/80 mb-4">
                You've supported with ₹{totalSpent.toLocaleString()}
              </p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-white/70">Active Memberships</p>
                  <p className="text-2xl font-bold">{memberships.length}</p>
                </div>
                <div className="h-8 w-px bg-white/30"></div>
                <div>
                  <p className="text-sm text-white/70">Total Support</p>
                  <p className="text-2xl font-bold">{supportHistory.length}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getFanLevelColor(fanLevel)} text-white font-semibold shadow-lg`}>
                <Trophy className="h-5 w-5" />
                <span>Top Fan</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-neutral-800 mb-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === 'active'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Active Memberships
              {activeTab === 'active' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === 'history'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Support History
              {activeTab === 'history' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"></div>
              )}
            </button>
          </div>
        </div>

        {/* Active Memberships */}
        {activeTab === 'active' && (
          <div className="grid gap-6 md:grid-cols-2">
            {memberships.length > 0 ? (
              memberships.map((membership) => (
                <motion.div
                  key={membership.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {membership.creator.avatar_url ? (
                        <div className="h-12 w-12 rounded-full overflow-hidden">
                          <Image
                            src={membership.creator.avatar_url}
                            alt={membership.creator.display_name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {membership.creator.display_name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {membership.creator.display_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{membership.creator.username}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/${membership.creator.username}`}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </Link>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {membership.tier.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        • ₹{membership.tier.price}/month
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Since {new Date(membership.started_at).toLocaleDateString()}</span>
                      </div>
                      {membership.next_billing_date && (
                        <div className="flex items-center gap-1">
                          <span>Next billing: {new Date(membership.next_billing_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Unlock className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {membership.stats.posts_unlocked}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Posts unlocked</p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-gray-200 dark:bg-neutral-700"></div>
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {membership.stats.benefits_used}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Benefits used</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${membership.creator.username}`}
                      className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-center text-sm"
                    >
                      View Content
                    </Link>
                    <button className="p-2 border border-gray-200 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                      <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-2 text-center py-16">
                <Heart className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No active memberships
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start supporting your favorite creators today!
                </p>
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors"
                >
                  <Users className="h-5 w-5" />
                  Discover Creators
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Support History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {supportHistory.length > 0 ? (
              supportHistory.map((support) => (
                <motion.div
                  key={support.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {support.creator_avatar ? (
                        <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={support.creator_avatar}
                            alt={support.creator_name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold">
                            {support.creator_name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {support.creator_name}
                          </h4>
                          {support.badge && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                              {support.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {support.type === 'monthly' ? 'Monthly Support' : 'One-time Support'} • {new Date(support.date).toLocaleDateString()}
                        </p>
                        {support.message && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg italic">
                            "{support.message}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ₹{support.amount}
                      </p>
                      <Link
                        href={`/${support.creator_username}`}
                        className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        View profile
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-16">
                <TrendingUp className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No support history yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your support history will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
