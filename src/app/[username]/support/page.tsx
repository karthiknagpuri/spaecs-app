"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  Heart,
  Coffee,
  Gift,
  Star,
  Check,
  ArrowLeft,
  Crown,
  Sparkles,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
} from "lucide-react";
import {
  MembershipTier,
  CreatePaymentRequest,
  formatPaiseToINR,
  formatINRToPaise,
} from "@/types/payment";
import Image from "next/image";

interface CreatorProfile {
  id: string;
  slug: string;
  title: string;
  description: string;
  avatar_url?: string;
  is_verified: boolean;
  followers_count: number;
  monthly_earnings: number;
}

export default function SupportPage() {
  const params = useParams();
  const router = useRouter();
  const username = (params.username as string).replace("@", "");
  const supabase = createClient();

  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<
    "tip" | "membership" | null
  >(null);
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(
    null
  );
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [processing, setProcessing] = useState(false);

  const quickTipAmounts = [
    { label: "☕ Coffee", amount: 50, icon: Coffee },
    { label: "❤️ Support", amount: 100, icon: Heart },
    { label: "🎁 Gift", amount: 500, icon: Gift },
    { label: "⭐ Super", amount: 1000, icon: Star },
  ];

  useEffect(() => {
    loadData();
  }, [username]);

  const loadData = async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      // Fetch creator profile
      const { data: profile, error: profileError } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("slug", username)
        .single();

      if (profileError) {
        console.error("Error loading creator:", profileError);
        return;
      }

      setCreator({
        id: profile.user_id,
        slug: profile.slug,
        title: profile.title,
        description: profile.description,
        avatar_url: profile.avatar_url,
        is_verified: profile.is_verified,
        followers_count: profile.followers_count || 0,
        monthly_earnings: profile.monthly_earnings || 0,
      });

      // Fetch active membership tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from("membership_tiers")
        .select("*")
        .eq("creator_id", profile.user_id)
        .eq("is_active", true)
        .order("tier_level", { ascending: true });

      if (tiersError) {
        console.error("Error loading tiers:", tiersError);
      } else {
        setTiers(tiersData || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!user) {
      // Redirect to login
      router.push(`/?redirect=/${username}/support`);
      return;
    }

    if (!creator) return;

    let amount = 0;
    let supportType: "one_time_tip" | "monthly_membership" = "one_time_tip";

    if (selectedType === "tip") {
      const parsedAmount = parseFloat(customAmount);
      if (!parsedAmount || parsedAmount < 10) {
        alert("Please enter a valid amount (minimum ₹10)");
        return;
      }
      amount = formatINRToPaise(parsedAmount);
      supportType = "one_time_tip";
    } else if (selectedType === "membership" && selectedTier) {
      amount = selectedTier.price_inr;
      supportType = "monthly_membership";
    } else {
      alert("Please select a support option");
      return;
    }

    setProcessing(true);

    try {
      const paymentRequest: CreatePaymentRequest = {
        creator_id: creator.id,
        support_type: supportType,
        amount_inr: amount,
        membership_tier_id:
          selectedType === "membership" ? selectedTier?.id : undefined,
        supporter_message: message || undefined,
        is_public: isPublic,
      };

      // Call API route to initiate payment
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Payment initiation failed");
      }

      const data = await response.json();

      // Redirect to payment page
      window.location.href = data.redirect_url;
    } catch (error) {
      console.error("Payment initiation error:", error);
      alert(error instanceof Error ? error.message : "Failed to initiate payment. Please try again.");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Creator not found
          </h2>
          <p className="text-gray-600 mb-6">
            The creator @{username} doesn't exist
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => router.push(`/@${username}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to profile
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              {creator.avatar_url ? (
                <Image
                  src={creator.avatar_url}
                  alt={creator.title}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-400">
                    {creator.title
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Support {creator.title}
                </h1>
                {creator.is_verified && (
                  <Check className="w-6 h-6 text-blue-500" />
                )}
              </div>
              <p className="text-gray-600">@{creator.slug}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* One-Time Tips */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                One-Time Tip 💝
              </h2>
              <p className="text-gray-600 text-sm">
                Show your appreciation with a one-time contribution
              </p>
            </div>

            {/* Quick Tip Amounts */}
            <div className="grid grid-cols-2 gap-3">
              {quickTipAmounts.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.amount}
                    onClick={() => {
                      setSelectedType("tip");
                      setCustomAmount(item.amount.toString());
                      setSelectedTier(null);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedType === "tip" &&
                      customAmount === item.amount.toString()
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <Icon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">
                      {item.label}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      ₹{item.amount}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter custom amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  min="10"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedType("tip");
                    setSelectedTier(null);
                  }}
                  placeholder="100"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum ₹10</p>
            </div>
          </div>

          {/* Monthly Memberships */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Monthly Membership 🌟
              </h2>
              <p className="text-gray-600 text-sm">
                Get exclusive perks and ongoing support
              </p>
            </div>

            {tiers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Crown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">
                  No membership tiers available yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tiers.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => {
                      setSelectedType("membership");
                      setSelectedTier(tier);
                      setCustomAmount("");
                    }}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedTier?.id === tier.id
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{tier.name}</h3>
                        <p className="text-sm text-gray-600">
                          {tier.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600">
                          {formatPaiseToINR(tier.price_inr)}
                        </p>
                        <p className="text-xs text-gray-500">/month</p>
                      </div>
                    </div>

                    {tier.benefits && tier.benefits.length > 0 && (
                      <ul className="space-y-1 mt-3">
                        {tier.benefits.map((benefit, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-gray-600"
                          >
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message and Options */}
        {(selectedType === "tip" || selectedTier) && (
          <div className="mt-8 space-y-6 bg-white p-6 rounded-lg border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Say something nice to the creator..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {message.length}/500 characters
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label
                htmlFor="public"
                className="text-sm text-gray-700 cursor-pointer"
              >
                Show my support publicly on supporter list
              </label>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-600">Support Type</span>
                <span className="font-medium text-gray-900">
                  {selectedType === "tip" ? "One-Time Tip" : "Monthly Membership"}
                </span>
              </div>

              {selectedTier && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600">Tier</span>
                  <span className="font-medium text-gray-900">
                    {selectedTier.name}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <span className="text-gray-600">Amount</span>
                <span className="text-xl font-bold text-gray-900">
                  {selectedType === "tip"
                    ? `₹${customAmount}`
                    : formatPaiseToINR(selectedTier!.price_inr)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Platform fee (5%)</span>
                <span>
                  ₹
                  {selectedType === "tip"
                    ? (parseFloat(customAmount || "0") * 0.05).toFixed(2)
                    : ((selectedTier?.price_inr || 0) / 100 * 0.05).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-200">
                <span className="font-medium text-gray-900">Creator receives</span>
                <span className="font-bold text-green-600">
                  ₹
                  {selectedType === "tip"
                    ? (parseFloat(customAmount || "0") * 0.95).toFixed(2)
                    : ((selectedTier?.price_inr || 0) / 100 * 0.95).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleProceedToPayment}
              disabled={processing || (!customAmount && !selectedTier)}
              className="w-full py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5" />
                  Proceed to Payment
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Powered by edodwaja.com payment gateway. Secure and encrypted.
            </p>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <Users className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">
              {creator.followers_count} followers
            </p>
            <p className="text-sm text-gray-600">Active community</p>
          </div>

          <div className="text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">
              ₹{creator.monthly_earnings}/month
            </p>
            <p className="text-sm text-gray-600">Current support</p>
          </div>

          <div className="text-center">
            <Sparkles className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Verified Creator</p>
            <p className="text-sm text-gray-600">Trusted by Spaecs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
