"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Upload, Globe, Lock, CreditCard } from "lucide-react";
import { ResponsiveButton } from "@/components/ui/responsive/ResponsiveButton";

interface Community {
  id?: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'paid';
  member_count?: number;
  monthly_revenue?: number;
  image_url?: string;
  created_at?: string;
  is_active?: boolean;
  subscription_price?: number;
}

interface CommunityModalProps {
  community?: Community | null;
  onClose: () => void;
  onSave: () => void;
}

export function CommunityModal({ community, onClose, onSave }: CommunityModalProps) {
  const [formData, setFormData] = useState<Community>({
    name: '',
    description: '',
    type: 'public',
    subscription_price: 0,
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (community) {
      setFormData(community);
    }
  }, [community]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (community?.id) {
        // Update existing community
        const { error } = await supabase
          .from('communities')
          .update({
            name: formData.name,
            description: formData.description,
            type: formData.type,
            subscription_price: formData.type === 'paid' ? formData.subscription_price : null,
            is_active: formData.is_active
          })
          .eq('id', community.id);

        if (error) throw error;
      } else {
        // Create new community
        const { error } = await supabase
          .from('communities')
          .insert({
            creator_id: user.id,
            name: formData.name,
            description: formData.description,
            type: formData.type,
            subscription_price: formData.type === 'paid' ? formData.subscription_price : null,
            member_count: 0,
            monthly_revenue: 0,
            is_active: true
          });

        if (error) throw error;
      }

      onSave();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {community ? 'Edit Community' : 'Create New Community'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Community Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Community Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                placeholder="Enter community name"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                placeholder="Describe your community"
                rows={4}
                required
              />
            </div>

            {/* Community Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Community Type
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'public' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'public'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300'
                  }`}
                >
                  <Globe className={`h-6 w-6 mx-auto mb-2 ${
                    formData.type === 'public' ? 'text-indigo-500' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    formData.type === 'public' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Public
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Open to everyone
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'private' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'private'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300'
                  }`}
                >
                  <Lock className={`h-6 w-6 mx-auto mb-2 ${
                    formData.type === 'private' ? 'text-indigo-500' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    formData.type === 'private' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Private
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Invite only
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'paid' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === 'paid'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className={`h-6 w-6 mx-auto mb-2 ${
                    formData.type === 'paid' ? 'text-indigo-500' : 'text-gray-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    formData.type === 'paid' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Paid
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Subscription based
                  </p>
                </button>
              </div>
            </div>

            {/* Subscription Price (for paid communities) */}
            {formData.type === 'paid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Subscription Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.subscription_price}
                  onChange={(e) => setFormData({ ...formData, subscription_price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  placeholder="0"
                  min="0"
                  step="1"
                  required
                />
              </div>
            )}

            {/* Cover Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cover Image
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-neutral-600 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  PNG, JPG up to 5MB
                </p>
              </div>
            </div>

            {/* Active Status (only for editing) */}
            {community && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Community is active
                </label>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <ResponsiveButton
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </ResponsiveButton>
              <ResponsiveButton
                type="submit"
                loading={loading}
                className="flex-1"
              >
                {community ? 'Update Community' : 'Create Community'}
              </ResponsiveButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}