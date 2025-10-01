"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  DollarSign,
  TrendingUp,
  Check,
  X,
} from "lucide-react";
import {
  MembershipTier,
  InsertMembershipTier,
  UpdateMembershipTier,
  formatPaiseToINR,
  formatINRToPaise,
} from "@/types/payment";

export default function MembershipsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setUser(user);
      await loadTiers(user.id);
      setLoading(false);
    };

    loadData();
  }, [router, supabase]);

  const loadTiers = async (creatorId: string) => {
    const { data, error } = await supabase
      .from("membership_tiers")
      .select("*")
      .eq("creator_id", creatorId)
      .order("tier_level", { ascending: true });

    if (error) {
      console.error("Error loading tiers:", error);
      return;
    }

    setTiers(data || []);
  };

  const handleCreateTier = () => {
    setEditingTier(null);
    setShowCreateModal(true);
  };

  const handleEditTier = (tier: MembershipTier) => {
    setEditingTier(tier);
    setShowCreateModal(true);
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm("Are you sure you want to delete this tier?")) return;

    const { error } = await supabase
      .from("membership_tiers")
      .delete()
      .eq("id", tierId);

    if (error) {
      console.error("Error deleting tier:", error);
      alert("Failed to delete tier");
      return;
    }

    if (user) {
      await loadTiers(user.id);
    }
  };

  const handleToggleTier = async (tier: MembershipTier) => {
    const { error } = await supabase
      .from("membership_tiers")
      .update({ is_active: !tier.is_active })
      .eq("id", tier.id);

    if (error) {
      console.error("Error toggling tier:", error);
      alert("Failed to update tier");
      return;
    }

    if (user) {
      await loadTiers(user.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Membership Tiers
              </h1>
              <p className="text-gray-600">
                Create subscription tiers for your supporters
              </p>
            </div>
            <button
              onClick={handleCreateTier}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Tier
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Total Supporters</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-green-600 mt-1">+0% this month</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">₹0</p>
            <p className="text-sm text-green-600 mt-1">+0% this month</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Active Tiers</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {tiers.filter((t) => t.is_active).length}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {tiers.length} total tiers
            </p>
          </div>
        </div>

        {/* Tiers List */}
        {tiers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No membership tiers yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first tier to start accepting supporters
            </p>
            <button
              onClick={handleCreateTier}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Tier
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
                  tier.is_active
                    ? "border-indigo-200"
                    : "border-gray-200 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {tier.name}
                    </h3>
                    <p className="text-2xl font-bold text-indigo-600 mt-2">
                      {formatPaiseToINR(tier.price_inr)}
                      <span className="text-sm text-gray-600">/month</span>
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tier.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {tier.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {tier.description && (
                  <p className="text-gray-600 text-sm mb-4">
                    {tier.description}
                  </p>
                )}

                {tier.benefits && tier.benefits.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Benefits:
                    </p>
                    <ul className="space-y-1">
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
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Users className="w-4 h-4" />
                  <span>0 supporters</span>
                  {tier.max_supporters && (
                    <span className="text-gray-400">
                      (max {tier.max_supporters})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEditTier(tier)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleTier(tier)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      tier.is_active
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {tier.is_active ? (
                      <>
                        <X className="w-4 h-4" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Enable
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteTier(tier.id)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <TierModal
          tier={editingTier}
          userId={user.id}
          onClose={() => setShowCreateModal(false)}
          onSave={async () => {
            setShowCreateModal(false);
            await loadTiers(user.id);
          }}
        />
      )}
    </div>
  );
}

// Tier Creation/Edit Modal Component
function TierModal({
  tier,
  userId,
  onClose,
  onSave,
}: {
  tier: MembershipTier | null;
  userId: string;
  onClose: () => void;
  onSave: () => Promise<void>;
}) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    name: tier?.name || "",
    description: tier?.description || "",
    price_rupees: tier ? tier.price_inr / 100 : 0,
    tier_level: tier?.tier_level || 1,
    benefits: tier?.benefits?.join("\n") || "",
    max_supporters: tier?.max_supporters?.toString() || "",
    custom_message: tier?.custom_message || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const benefits = formData.benefits
      .split("\n")
      .filter((b) => b.trim())
      .map((b) => b.trim());

    const tierData = {
      name: formData.name,
      description: formData.description || null,
      price_inr: formatINRToPaise(formData.price_rupees),
      tier_level: formData.tier_level,
      benefits,
      max_supporters: formData.max_supporters
        ? parseInt(formData.max_supporters)
        : null,
      custom_message: formData.custom_message || null,
    };

    if (tier) {
      // Update existing tier
      const { error } = await supabase
        .from("membership_tiers")
        .update(tierData as UpdateMembershipTier)
        .eq("id", tier.id);

      if (error) {
        console.error("Error updating tier:", error);
        alert("Failed to update tier");
        setSaving(false);
        return;
      }
    } else {
      // Create new tier
      const { error } = await supabase
        .from("membership_tiers")
        .insert({
          ...tierData,
          creator_id: userId,
        } as InsertMembershipTier);

      if (error) {
        console.error("Error creating tier:", error);
        alert("Failed to create tier");
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    await onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {tier ? "Edit Membership Tier" : "Create New Tier"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tier Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Bronze, Silver, Gold"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              placeholder="Describe what supporters get at this tier"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={formData.price_rupees}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price_rupees: parseFloat(e.target.value),
                  })
                }
                placeholder="99"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tier Level *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.tier_level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tier_level: parseInt(e.target.value),
                  })
                }
                placeholder="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                1 = lowest, 5 = highest
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Benefits (one per line)
            </label>
            <textarea
              value={formData.benefits}
              onChange={(e) =>
                setFormData({ ...formData, benefits: e.target.value })
              }
              rows={5}
              placeholder="Early access to content&#10;Exclusive community access&#10;Monthly Q&A sessions"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Supporters (optional)
            </label>
            <input
              type="number"
              min="1"
              value={formData.max_supporters}
              onChange={(e) =>
                setFormData({ ...formData, max_supporters: e.target.value })
              }
              placeholder="Unlimited if blank"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thank You Message
            </label>
            <textarea
              value={formData.custom_message}
              onChange={(e) =>
                setFormData({ ...formData, custom_message: e.target.value })
              }
              rows={3}
              placeholder="Thank you for supporting me! 🙏"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : tier ? "Update Tier" : "Create Tier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
