"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Globe,
  Lock,
  TrendingUp,
  UserPlus,
  Settings,
  Eye
} from "lucide-react";
import { ResponsiveButton } from "@/components/ui/responsive/ResponsiveButton";
import { CommunityModal } from "@/components/communities/CommunityModal";

interface Community {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'paid';
  member_count: number;
  monthly_revenue: number;
  image_url?: string;
  created_at: string;
  is_active: boolean;
}

export default function CommunitiesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchUser();
    fetchCommunities();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommunity = async (communityId: string) => {
    if (!confirm('Are you sure you want to delete this community?')) return;

    try {
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId);

      if (error) throw error;

      setCommunities(communities.filter(c => c.id !== communityId));
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error deleting community:', error);
    }
  };

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalCommunities: communities.length,
    totalMembers: communities.reduce((acc, c) => acc + c.member_count, 0),
    monthlyRevenue: communities.reduce((acc, c) => acc + c.monthly_revenue, 0),
    activeCommunities: communities.filter(c => c.is_active).length
  };

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Communities
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and grow your creator communities
          </p>
        </div>
        <ResponsiveButton
          onClick={() => setShowCreateModal(true)}
          className="mt-4 md:mt-0"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Community
        </ResponsiveButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 bg-opacity-10">
              <Users className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalCommunities}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Communities
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 bg-opacity-10">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalMembers}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Members
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 bg-opacity-10">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            ₹{stats.monthlyRevenue.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monthly Revenue
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 bg-opacity-10">
              <Globe className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.activeCommunities}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Active Communities
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-neutral-700 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Communities Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredCommunities.length === 0 ? (
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-12 text-center border border-gray-200 dark:border-neutral-700">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No communities found' : 'No communities yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Create your first community to start building your audience'}
          </p>
          {!searchQuery && (
            <ResponsiveButton onClick={() => setShowCreateModal(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Community
            </ResponsiveButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <div
              key={community.id}
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Community Image */}
              <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                {community.image_url ? (
                  <img
                    src={community.image_url}
                    alt={community.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Users className="h-16 w-16 text-white/50" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    community.type === 'public'
                      ? 'bg-green-500/20 text-green-300 backdrop-blur-sm'
                      : community.type === 'private'
                      ? 'bg-yellow-500/20 text-yellow-300 backdrop-blur-sm'
                      : 'bg-purple-500/20 text-purple-300 backdrop-blur-sm'
                  }`}>
                    {community.type === 'public' && <Globe className="inline h-3 w-3 mr-1" />}
                    {community.type === 'private' && <Lock className="inline h-3 w-3 mr-1" />}
                    {community.type === 'paid' && <TrendingUp className="inline h-3 w-3 mr-1" />}
                    {community.type}
                  </span>
                </div>
              </div>

              {/* Community Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {community.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {community.description}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === community.id ? null : community.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                    {activeDropdown === community.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-700 z-10">
                        <button
                          onClick={() => {
                            window.location.href = `/dashboard/communities/${community.id}`;
                            setActiveDropdown(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCommunity(community);
                            setShowCreateModal(true);
                            setActiveDropdown(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            window.location.href = `/dashboard/communities/${community.id}/settings`;
                            setActiveDropdown(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </button>
                        <button
                          onClick={() => handleDeleteCommunity(community.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {community.member_count}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Members</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{community.monthly_revenue}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Monthly</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    community.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}>
                    {community.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Created {new Date(community.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Community Modal */}
      {showCreateModal && (
        <CommunityModal
          community={selectedCommunity}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedCommunity(null);
          }}
          onSave={() => {
            setShowCreateModal(false);
            setSelectedCommunity(null);
            fetchCommunities();
          }}
        />
      )}
    </div>
  );
}