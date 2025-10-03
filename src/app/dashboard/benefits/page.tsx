"use client";

import { useState, useEffect } from "react";
import {
  Gift,
  Package,
  Phone,
  Archive,
  Users,
  Download,
  Ticket,
  BookOpen,
  Zap,
  Star,
  MessageCircle,
  Plus,
  Loader2,
  Check,
  Edit,
  Trash2,
  Crown
} from "lucide-react";

interface Benefit {
  id: string;
  tier_id: string;
  benefit_type: string;
  name: string;
  description?: string;
  is_enabled: boolean;
  config: any;
}

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const benefitTypes = [
    { type: 'merch', name: 'Custom Merchandise', description: 'Ship custom merch to members', icon: Package, color: 'bg-pink-500' },
    { type: 'shoutout', name: 'Member Shout-out', description: 'Feature members in credits', icon: Star, color: 'bg-yellow-500' },
    { type: 'call', name: '1-on-1 Phone Call', description: 'Exclusive calls with members', icon: Phone, color: 'bg-blue-500' },
    { type: 'archive', name: 'Complete Archive', description: 'Access to all past content', icon: Archive, color: 'bg-purple-500' },
    { type: 'community', name: 'Private Community', description: 'Member-only forum access', icon: Users, color: 'bg-green-500' },
    { type: 'downloads', name: 'Digital Downloads', description: 'Templates, files, resources', icon: Download, color: 'bg-indigo-500' },
    { type: 'tickets', name: 'Early Ticket Access', description: 'Premium event access', icon: Ticket, color: 'bg-red-500' },
    { type: 'ebook', name: 'Digital Publications', description: 'eBooks and newsletters', icon: BookOpen, color: 'bg-teal-500' },
    { type: 'early_access', name: 'Early Access', description: 'See content before release', icon: Zap, color: 'bg-orange-500' },
    { type: 'vip', name: 'Live Event VIP', description: 'VIP perks at events', icon: Crown, color: 'bg-amber-500' },
    { type: 'exclusive_content', name: 'Exclusive Content', description: 'Bonus premium content', icon: Star, color: 'bg-violet-500' },
    { type: 'fan_requests', name: 'Fan Requests', description: 'Custom content requests', icon: MessageCircle, color: 'bg-cyan-500' }
  ];

  useEffect(() => {
    fetchBenefits();
  }, [selectedTier]);

  const fetchBenefits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTier !== 'all') params.append('tier_id', selectedTier);

      const response = await fetch(`/api/benefits?${params}`);
      const data = await response.json();
      setBenefits(data.benefits || []);
    } catch (error) {
      console.error('Error fetching benefits:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBenefit = async (benefitId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/benefits/${benefitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: !currentStatus })
      });
      fetchBenefits();
    } catch (error) {
      console.error('Error toggling benefit:', error);
    }
  };

  const getTypeInfo = (type: string) => {
    return benefitTypes.find(t => t.type === type) || benefitTypes[0];
  };

  const groupedBenefits = benefits.reduce((acc, benefit) => {
    if (!acc[benefit.tier_id]) {
      acc[benefit.tier_id] = [];
    }
    acc[benefit.tier_id].push(benefit);
    return acc;
  }, {} as Record<string, Benefit[]>);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Member Benefits
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Configure exclusive perks and benefits for your members
        </p>
      </div>

      {/* Benefit Type Gallery */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Available Benefits
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {benefitTypes.map((type) => {
            const Icon = type.icon;
            const count = benefits.filter(b => b.benefit_type === type.type && b.is_enabled).length;

            return (
              <div
                key={type.type}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
                onClick={() => setShowAddModal(true)}
              >
                <div className={`w-10 h-10 ${type.color} rounded-lg flex items-center justify-center mb-2`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                  {type.name}
                </h3>
                {count > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {count} active
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier Filter */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter by tier:
        </span>
        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        >
          <option value="all">All Tiers</option>
          <option value="tier_1">Tier 1</option>
          <option value="tier_2">Tier 2</option>
          <option value="tier_3">Tier 3</option>
        </select>

        <button
          onClick={() => setShowAddModal(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Benefit
        </button>
      </div>

      {/* Benefits List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center p-12 bg-white dark:bg-gray-900 rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : Object.keys(groupedBenefits).length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
            <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No benefits configured yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add your first member benefit to start offering exclusive perks
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Benefit
            </button>
          </div>
        ) : (
          Object.entries(groupedBenefits).map(([tier, tierBenefits]) => (
            <div key={tier} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tier === 'all' ? 'All Members' : `Tier ${tier.split('_')[1]}`} Benefits
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {tierBenefits.length} benefit{tierBenefits.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {tierBenefits.map((benefit) => {
                  const typeInfo = getTypeInfo(benefit.benefit_type);
                  const Icon = typeInfo.icon;

                  return (
                    <div key={benefit.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-10 h-10 ${typeInfo.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {benefit.name}
                              </h3>
                              {benefit.is_enabled && (
                                <Check className="w-4 h-4 text-green-500" />
                              )}
                            </div>

                            {benefit.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {benefit.description}
                              </p>
                            )}

                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                                {typeInfo.name}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                benefit.is_enabled
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}>
                                {benefit.is_enabled ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleBenefit(benefit.id, benefit.is_enabled)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              benefit.is_enabled
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
                            }`}
                          >
                            {benefit.is_enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            🎁 Benefit Best Practices
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• Offer tier-exclusive benefits to drive upgrades</li>
            <li>• Make higher tiers significantly more valuable</li>
            <li>• Limit availability for premium benefits (scarcity)</li>
            <li>• Survey members to understand desired perks</li>
            <li>• Rotate seasonal or time-limited benefits</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            💡 Value Stacking Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• Combine digital + physical benefits</li>
            <li>• Offer exclusive access before public release</li>
            <li>• Create VIP experiences for top tiers</li>
            <li>• Bundle complementary benefits together</li>
            <li>• Provide ongoing value, not one-time perks</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
