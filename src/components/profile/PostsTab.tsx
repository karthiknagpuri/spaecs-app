'use client';

import { Lock, Heart, Crown, Star, Calendar, Loader2, Clock, Eye, MessageCircle, ExternalLink } from 'lucide-react';

interface Post {
  id: string;
  creator_id: string;
  title: string;
  content: string;
  excerpt?: string;
  post_type: string;
  media_url?: string;
  thumbnail_url?: string;
  visibility: string;
  required_tier_id?: string;
  is_published: boolean;
  published_at?: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  category?: string;
  tags?: string[];
  is_featured: boolean;
  read_time_minutes?: number;
  created_at: string;
  updated_at: string;
  membership_tiers?: {
    id: string;
    name: string;
    price: number;
  };
}

interface PostsTabProps {
  posts: Post[];
  loading: boolean;
  profile: {
    slug: string;
    title: string;
    tier_configs: { id: string; name: string; price: number }[];
  };
  onUnlock: (tierId: string) => void;
}

export default function PostsTab({ posts, loading, profile, onUnlock }: PostsTabProps) {
  // Get tier icon based on tier name
  const getTierIcon = (tierName?: string) => {
    if (!tierName) return Lock;
    const name = tierName.toLowerCase();
    if (name.includes('vip') || name.includes('premium')) return Crown;
    if (name.includes('supporter') || name.includes('fan')) return Star;
    return Crown;
  };

  // Get time ago string
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  };

  // Get category color - solid, minimal
  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      tutorial: 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400',
      update: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
      'behind-the-scenes': 'bg-pink-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400',
      announcement: 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400',
      other: 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-400'
    };
    return colors[category || 'other'] || colors.other;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading posts...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          This creator hasn't published any content yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Recent Updates ({posts.length})
          </h3>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {posts.map((post) => {
          const TierIcon = getTierIcon(post.membership_tiers?.name);
          const isLocked = post.visibility !== 'public';
          const hasExternalLink = !isLocked && post.media_url;
          const showReadMore = post.excerpt && post.excerpt.length > 100;

          return (
            <div
              key={post.id}
              className="group relative rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors"
            >
              {/* Lock Badge - Top Right */}
              {isLocked && (
                <div className="absolute top-3 right-3 z-10">
                  <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
              )}

              <div className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold text-sm flex-shrink-0">
                    {profile.title.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 dark:text-gray-400">
                      <span>{getTimeAgo(post.published_at || post.created_at)}</span>
                      {post.membership_tiers && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <TierIcon className="h-3 w-3" />
                            <span>{post.membership_tiers.name}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Thumbnail */}
                {post.thumbnail_url && (
                  <div className="relative mb-3 rounded-lg overflow-hidden aspect-video bg-gray-100 dark:bg-neutral-800">
                    <img
                      src={post.thumbnail_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                    {post.post_type === 'video' && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                          <div className="w-0 h-0 border-l-[10px] border-l-gray-900 border-y-[7px] border-y-transparent ml-1"></div>
                        </div>
                      </div>
                    )}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
                    )}
                  </div>
                )}

                {/* Preview Text */}
                {post.excerpt && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>
                )}

                {/* Tags & Stats Row */}
                <div className="flex items-center justify-between mb-3 gap-3">
                  {/* Tags - Posted Under Category */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.category && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(post.category)}`}>
                        {post.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    )}
                    {post.read_time_minutes && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 rounded text-xs font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.read_time_minutes}m
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {post.like_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" />
                        {post.like_count}
                      </span>
                    )}
                    {post.comment_count > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {post.comment_count}
                      </span>
                    )}
                    {post.view_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {post.view_count}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-2">
                  {isLocked && post.membership_tiers ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onUnlock(post.required_tier_id || '');
                      }}
                      className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Unlock for ₹{post.membership_tiers.price}/mo
                    </button>
                  ) : (
                    <>
                      {showReadMore && (
                        <a
                          href={`/${profile.slug}/posts/${post.id}`}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition-colors"
                        >
                          Read More
                        </a>
                      )}
                      {hasExternalLink && (
                        <a
                          href={post.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          Open Link
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
