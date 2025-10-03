"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  Plus,
  Loader2,
  Send,
  Users,
  TrendingUp,
  Pause,
  Play,
  Edit,
  Trash2,
  BarChart,
  Clock,
  Target,
  Gift,
  DollarSign,
  Heart
} from "lucide-react";

interface Campaign {
  id: string;
  type: string;
  name: string;
  description?: string;
  status: string;
  target_audience: any;
  offer_details: any;
  email_template: any;
  stats: any;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export default function AutopilotPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/autopilot/campaigns');
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const campaignTypes = [
    {
      type: 'upgrade_offer',
      name: 'Free Member Upgrade Offer',
      description: 'Send one-time paid upgrade offers to selected free members',
      icon: TrendingUp,
      color: 'bg-blue-500'
    },
    {
      type: 'teaser',
      name: 'Paid Content Teaser',
      description: 'Let free members preview selected paid posts',
      icon: Gift,
      color: 'bg-purple-500'
    },
    {
      type: 'annual_offer',
      name: 'Annual Membership Offer',
      description: 'Offer annual payment option to monthly members',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      type: 'retention',
      name: 'Cancellation Retention',
      description: 'Show retention discount to members about to cancel',
      icon: Heart,
      color: 'bg-red-500'
    }
  ];

  const getTypeInfo = (type: string) => {
    return campaignTypes.find(t => t.type === type) || campaignTypes[0];
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Autopilot & Promotions
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Automatically send targeted offers and campaigns to your members
        </p>
      </div>

      {/* Campaign Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {campaignTypes.map((type) => {
          const Icon = type.icon;
          const count = campaigns.filter(c => c.type === type.type && c.status === 'active').length;

          return (
            <div
              key={type.type}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 cursor-pointer hover:shadow-md transition-all"
              onClick={() => {
                setSelectedCampaign({ type: type.type } as Campaign);
                setShowCreateModal(true);
              }}
            >
              <div className={`w-12 h-12 ${type.color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {type.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {type.description}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">{count} active</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Campaigns */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Campaigns
            </h2>
            <button
              onClick={() => {
                setSelectedCampaign(null);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center p-12">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No campaigns yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first autopilot campaign to start converting members
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {campaigns.map((campaign) => {
              const typeInfo = getTypeInfo(campaign.type);
              const Icon = typeInfo.icon;
              const stats = campaign.stats || {};

              return (
                <div key={campaign.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-10 h-10 ${typeInfo.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {campaign.name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            campaign.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : campaign.status === 'paused'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}>
                            {campaign.status}
                          </span>
                        </div>

                        {campaign.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {campaign.description}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-1">
                            <Send className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {stats.sent || 0} sent
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {stats.opened || 0} opened
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {stats.converted || 0} converted
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {stats.sent > 0 ? Math.round((stats.converted || 0) / stats.sent * 100) : 0}% rate
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          // Toggle status
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={campaign.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {campaign.status === 'active' ? (
                          <Pause className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <Play className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setShowCreateModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => {
                          // Delete campaign
                        }}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            💡 Autopilot Best Practices
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• Test campaigns with small audiences first</li>
            <li>• Personalize offers based on member behavior</li>
            <li>• Track conversion rates and optimize regularly</li>
            <li>• A/B test different email templates</li>
            <li>• Set appropriate time delays between offers</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            📊 Performance Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• Send offers during peak engagement hours</li>
            <li>• Use scarcity (limited time) to drive action</li>
            <li>• Offer exclusive benefits for early adopters</li>
            <li>• Create urgency with countdown timers</li>
            <li>• Follow up with non-openers after 3-5 days</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
