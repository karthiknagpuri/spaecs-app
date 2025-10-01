"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Gift,
  Heart,
  Star,
  Coffee,
  Zap,
  Trophy,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Users,
  Plus,
  Search,
  Filter,
  DollarSign
} from "lucide-react";
import { ResponsiveButton } from "@/components/ui/responsive/ResponsiveButton";

interface VirtualGift {
  id: string;
  name: string;
  icon: string;
  price: number;
  color: string;
  animation?: string;
  times_sent: number;
  total_revenue: number;
}

interface GiftTransaction {
  id: string;
  gift: VirtualGift;
  sender_name: string;
  message: string;
  amount: number;
  created_at: string;
}

export default function VirtualGiftsPage() {
  const [gifts, setGifts] = useState<VirtualGift[]>([]);
  const [transactions, setTransactions] = useState<GiftTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'received'>('catalog');
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

  // Predefined virtual gifts catalog
  const giftsCatalog: VirtualGift[] = [
    {
      id: '1',
      name: 'Heart',
      icon: 'heart',
      price: 10,
      color: 'from-red-500 to-pink-600',
      times_sent: 0,
      total_revenue: 0
    },
    {
      id: '2',
      name: 'Star',
      icon: 'star',
      price: 25,
      color: 'from-yellow-500 to-orange-600',
      times_sent: 0,
      total_revenue: 0
    },
    {
      id: '3',
      name: 'Coffee',
      icon: 'coffee',
      price: 50,
      color: 'from-brown-500 to-amber-600',
      times_sent: 0,
      total_revenue: 0
    },
    {
      id: '4',
      name: 'Lightning',
      icon: 'zap',
      price: 100,
      color: 'from-blue-500 to-indigo-600',
      times_sent: 0,
      total_revenue: 0
    },
    {
      id: '5',
      name: 'Trophy',
      icon: 'trophy',
      price: 250,
      color: 'from-amber-500 to-yellow-600',
      times_sent: 0,
      total_revenue: 0
    },
    {
      id: '6',
      name: 'Diamond',
      icon: 'sparkles',
      price: 500,
      color: 'from-purple-500 to-pink-600',
      animation: 'animate-pulse',
      times_sent: 0,
      total_revenue: 0
    }
  ];

  useEffect(() => {
    fetchGifts();
    fetchTransactions();
  }, []);

  const fetchGifts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch gift statistics from database
      const { data, error } = await supabase
        .from('virtual_gifts')
        .select('*')
        .eq('creator_id', user.id);

      if (error) throw error;

      // Merge with catalog to get display data
      const mergedGifts = giftsCatalog.map(gift => {
        const stats = data?.find(d => d.gift_type === gift.name);
        return {
          ...gift,
          times_sent: stats?.times_sent || 0,
          total_revenue: stats?.total_revenue || 0
        };
      });

      setGifts(mergedGifts);
    } catch (error) {
      console.error('Error fetching gifts:', error);
      setGifts(giftsCatalog); // Fallback to catalog
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mock transactions for demo
      const mockTransactions: GiftTransaction[] = [
        {
          id: '1',
          gift: giftsCatalog[0],
          sender_name: 'John Doe',
          message: 'Love your content! Keep it up!',
          amount: 10,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          gift: giftsCatalog[3],
          sender_name: 'Sarah Smith',
          message: 'Amazing stream today!',
          amount: 100,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          gift: giftsCatalog[2],
          sender_name: 'Mike Johnson',
          message: 'Thanks for the tutorial!',
          amount: 50,
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];

      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const getGiftIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      heart: Heart,
      star: Star,
      coffee: Coffee,
      zap: Zap,
      trophy: Trophy,
      sparkles: Sparkles
    };
    const Icon = icons[iconName] || Gift;
    return Icon;
  };

  const stats = {
    totalGiftsReceived: transactions.length,
    totalRevenue: transactions.reduce((acc, t) => acc + t.amount, 0),
    uniqueSenders: new Set(transactions.map(t => t.sender_name)).size,
    mostPopular: gifts.reduce((prev, current) =>
      (current.times_sent > prev.times_sent) ? current : prev, gifts[0])
  };

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Virtual Gifts
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Receive support from your community through virtual gifts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 bg-opacity-10">
              <Gift className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalGiftsReceived}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gifts Received
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 bg-opacity-10">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            ₹{stats.totalRevenue}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Revenue
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 bg-opacity-10">
              <Users className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.uniqueSenders}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Unique Supporters
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 bg-opacity-10">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.mostPopular?.name || 'None'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Most Popular Gift
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'catalog'
              ? 'bg-indigo-500 text-white'
              : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700'
          }`}
        >
          Gift Catalog
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'received'
              ? 'bg-indigo-500 text-white'
              : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700'
          }`}
        >
          Received Gifts
        </button>
      </div>

      {/* Content */}
      {activeTab === 'catalog' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gifts.map((gift) => {
            const Icon = getGiftIcon(gift.icon);
            return (
              <div
                key={gift.id}
                className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700 hover:shadow-lg transition-shadow"
              >
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${gift.color} flex items-center justify-center ${gift.animation || ''}`}>
                  <Icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                  {gift.name}
                </h3>
                <p className="text-2xl font-bold text-center text-indigo-600 dark:text-indigo-400 mb-4">
                  ₹{gift.price}
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-neutral-700">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Times Sent</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {gift.times_sent}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ₹{gift.total_revenue}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-12 text-center border border-gray-200 dark:border-neutral-700">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No gifts received yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Share your gift link with your community to start receiving support
              </p>
            </div>
          ) : (
            transactions.map((transaction) => {
              const Icon = getGiftIcon(transaction.gift.icon);
              return (
                <div
                  key={transaction.id}
                  className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700 flex items-center gap-6"
                >
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${transaction.gift.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {transaction.sender_name} sent a {transaction.gift.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        ₹{transaction.amount}
                      </span>
                    </div>
                    {transaction.message && (
                      <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
                        <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {transaction.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Gift Link Section */}
      <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Your Gift Link</h3>
        <p className="text-white/80 mb-4">
          Share this link with your community to receive virtual gifts
        </p>
        <div className="flex gap-4">
          <input
            type="text"
            value={`https://spaecs.app/gift/@username`}
            readOnly
            className="flex-1 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 text-white placeholder:text-white/60"
          />
          <ResponsiveButton
            variant="outline"
            className="border-white text-white hover:bg-white/20"
          >
            Copy Link
          </ResponsiveButton>
        </div>
      </div>
    </div>
  );
}