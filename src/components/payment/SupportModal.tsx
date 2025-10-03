"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Heart,
  Coffee,
  Gift,
  CreditCard,
  Calendar,
  ChevronRight,
  Check,
  Zap,
  Trophy,
  Diamond,
  Sparkles,
  Star,
  Crown,
  Flame
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Script from "next/script";
import Image from "next/image";

interface Creator {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  support_tiers?: {
    id: string;
    name: string;
    price: number;
    description: string;
    benefits: string[];
  }[];
}

interface SupportModalProps {
  creator: Creator;
  selectedTierId?: string | null;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function SupportModal({ creator, selectedTierId, onClose }: SupportModalProps) {
  const [amount, setAmount] = useState<number>(200);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isMonthly, setIsMonthly] = useState(false);
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(200);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedTier, setSelectedTier] = useState<string | null>(selectedTierId || null);

  const supabase = createClient();

  const quickAmounts = [
    { value: 50, label: "₹50", icon: Coffee, description: "Chai & Samosa", badge: null, color: "gray" },
    { value: 100, label: "₹100", icon: Heart, description: "Support with love", badge: "⭐ Supporter", color: "blue" },
    { value: 250, label: "₹250", icon: Gift, description: "Movie ticket", badge: "🎯 Contributor", color: "green" },
    { value: 500, label: "₹500", icon: Sparkles, description: "Special meal", badge: "✨ Champion", color: "purple" },
    { value: 1000, label: "₹1000", icon: Trophy, description: "Super supporter", badge: "🏆 Hero", color: "orange" },
    { value: 2000, label: "₹2000", icon: Diamond, description: "Top fan", badge: "👑 Legend", color: "yellow" }
  ];

  useEffect(() => {
    if (selectedTierId && creator.support_tiers) {
      const tier = creator.support_tiers.find(t => t.id === selectedTierId);
      if (tier) {
        setAmount(tier.price);
        setIsMonthly(true);
        setSelectedQuickAmount(null);
      }
    }
  }, [selectedTierId, creator.support_tiers]);

  const handleQuickAmountSelect = (value: number) => {
    setAmount(value);
    setSelectedQuickAmount(value);
    setCustomAmount("");
    setShowCustomInput(false);
    setSelectedTier(null);
  };

  const handleCustomAmountClick = () => {
    setShowCustomInput(true);
    setSelectedQuickAmount(null);
    setSelectedTier(null);
  };

  const handleCustomAmountChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue > 0) {
      setAmount(numValue);
      setSelectedQuickAmount(null);
      setCustomAmount(value);
      setSelectedTier(null);
    }
  };

  const handleTierSelect = (tierId: string) => {
    const tier = creator.support_tiers?.find(t => t.id === tierId);
    if (tier) {
      setSelectedTier(tierId);
      setAmount(tier.price);
      setIsMonthly(true);
      setSelectedQuickAmount(null);
      setCustomAmount("");
    }
  };

  const initiatePayment = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth';
        return;
      }

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('payments')
        .insert({
          amount,
          currency: 'INR',
          status: 'pending',
          creator_id: creator.username,
          user_id: user.id,
          is_monthly: isMonthly,
          tier_id: selectedTier,
          message
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        name: 'Spaecs',
        description: `Support ${creator.display_name}`,
        order_id: order.id,
        handler: async function (response: any) {
          // Payment successful
          await supabase
            .from('payments')
            .update({
              status: 'completed',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
            .eq('id', order.id);

          // Show success animation
          setLoading(false);
          onClose();
        },
        prefill: {
          email: user.email
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key="support-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-lg max-h-[90vh] bg-white dark:bg-neutral-900 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 pb-4 border-b border-gray-100 dark:border-neutral-800">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>

              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-neutral-800">
                  {creator.avatar_url ? (
                    <Image
                      src={creator.avatar_url}
                      alt={creator.display_name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-purple-600 flex items-center justify-center text-white font-bold">
                      {creator.display_name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Support {creator.display_name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose an amount to support
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              {/* Support Type Toggle */}
              <div className="flex bg-gray-100 dark:bg-neutral-800 rounded-xl p-1 mb-6">
                <button
                  onClick={() => setIsMonthly(false)}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                    !isMonthly
                      ? 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  One-time
                </button>
                <button
                  onClick={() => setIsMonthly(true)}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all ${
                    isMonthly
                      ? 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Monthly
                </button>
              </div>

              {/* Membership Tiers (for monthly) */}
              {isMonthly && creator.support_tiers && creator.support_tiers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Membership Tiers
                  </h3>
                  <div className="space-y-3">
                    {creator.support_tiers.map((tier) => (
                      <motion.button
                        key={tier.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleTierSelect(tier.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selectedTier === tier.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                            : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {tier.name}
                          </span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            ₹{tier.price}/mo
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {tier.description}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Amounts */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Quick Amount
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {quickAmounts.map(({ value, label, icon: Icon, description, badge, color }) => (
                    <motion.button
                      key={value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickAmountSelect(value)}
                      className={`relative p-3 pt-4 rounded-xl border-2 transition-all ${
                        selectedQuickAmount === value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                          : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                      }`}
                    >
                      {badge && (
                        <div className="absolute top-1 left-1 right-1 bg-purple-600 dark:bg-purple-500 text-white text-[8px] px-1.5 py-0.5 rounded-md font-medium text-center">
                          {badge}
                        </div>
                      )}
                      <Icon className={`h-5 w-5 mb-1 mx-auto mt-2 ${
                        selectedQuickAmount === value
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium block ${
                        selectedQuickAmount === value
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {label}
                      </span>
                      <span className={`text-[10px] block mt-0.5 ${
                        selectedQuickAmount === value
                          ? 'text-purple-500 dark:text-purple-500'
                          : 'text-gray-500 dark:text-gray-500'
                      }`}>
                        {description}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Custom Amount Button */}
              <div className="mb-6">
                {!showCustomInput ? (
                  <motion.button
                    onClick={handleCustomAmountClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-neutral-600 hover:border-purple-500 dark:hover:border-purple-500 transition-all text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    <CreditCard className="h-5 w-5 mb-1 mx-auto" />
                    <span className="text-sm font-medium">Custom Amount</span>
                  </motion.button>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Custom Amount
                      </h3>
                      <button
                        onClick={() => setShowCustomInput(false)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        placeholder="Enter amount (min ₹100)"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                        min="100"
                        autoFocus
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Add a message (optional)
                </h3>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share some kind words..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white resize-none"
                  rows={3}
                />
              </div>

              {/* Achievement Preview */}
              {selectedQuickAmount && selectedQuickAmount >= 100 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {quickAmounts.find(a => a.value === selectedQuickAmount)?.badge?.split(' ')[0] || '⭐'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        You'll earn: {quickAmounts.find(a => a.value === selectedQuickAmount)?.badge || 'Supporter Badge'}
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300">
                        Your support makes a real difference! 🙏
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Support amount
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ₹{amount}
                  </span>
                </div>
                {isMonthly && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Billing
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Monthly
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-gray-100 dark:border-neutral-800">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={initiatePayment}
                disabled={loading || amount < 1}
                className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pay ₹{amount} {isMonthly && 'Monthly'}</span>
                  </>
                )}
              </motion.button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-4">
                Powered by Razorpay • Secure payment
              </p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}