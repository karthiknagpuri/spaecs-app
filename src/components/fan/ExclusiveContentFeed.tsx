"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Unlock,
  Crown,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Image as ImageIcon,
  FileText,
  Calendar,
  Eye,
  Sparkles,
  Star,
  TrendingUp
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  post_type: 'text' | 'image' | 'video' | 'audio';
  media_url?: string;
  thumbnail_url?: string;
  creator: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
  };
  tier: {
    name: string;
    color: string;
  };
  is_locked: boolean;
  published_at: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  is_featured: boolean;
  read_time_minutes?: number;
}

interface ExclusiveContentFeedProps {
  userId: string;
}

export function ExclusiveContentFeed({ userId }: ExclusiveContentFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'featured'>('all');

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Simulated data - replace with actual API call
      const mockPosts: Post[] = [
        {
          id: '1',
          title: 'Behind the Scenes: My Creative Process',
          excerpt: 'An exclusive look into how I create content...',
          content: 'Full content here...',
          post_type: 'image',
          media_url: '/placeholder-content.jpg',
          thumbnail_url: '/placeholder-thumb.jpg',
          creator: {
            id: 'creator1',
            name: 'Jane Doe',
            username: 'janedoe',
            avatar_url: undefined
          },
          tier: {
            name: 'Champion',
            color: 'purple'
          },
          is_locked: false,
          published_at: new Date().toISOString(),
          like_count: 234,
          comment_count: 45,
          view_count: 1567,
          is_featured: true,
          read_time_minutes: 5
        }
      ];
      setPosts(mockPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'image': return ImageIcon;
      case 'audio': return Play;
      default: return FileText;
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (filter === 'unlocked') return !post.is_locked;
    if (filter === 'featured') return post.is_featured;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
            filter === 'all'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
          }`}
        >
          All Posts
        </button>
        <button
          onClick={() => setFilter('unlocked')}
          className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
            filter === 'unlocked'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
          }`}
        >
          <Unlock className="h-4 w-4" />
          Unlocked
        </button>
        <button
          onClick={() => setFilter('featured')}
          className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
            filter === 'featured'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
          }`}
        >
          <Star className="h-4 w-4" />
          Featured
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredPosts.map((post, index) => {
          const PostTypeIcon = getPostTypeIcon(post.post_type);

          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden ${
                post.is_locked ? 'opacity-80' : ''
              }`}
            >
              {/* Featured Badge */}
              {post.is_featured && !post.is_locked && (
                <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center gap-1 shadow-lg">
                  <Sparkles className="h-3 w-3 text-white" />
                  <span className="text-xs font-bold text-white">Featured</span>
                </div>
              )}

              {/* Locked Overlay */}
              {post.is_locked && (
                <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center px-6">
                    <Lock className="h-12 w-12 text-white mx-auto mb-3" />
                    <h4 className="text-white font-bold mb-2">Exclusive Content</h4>
                    <p className="text-white/80 text-sm mb-4">
                      Join {post.tier.name} tier to unlock
                    </p>
                    <Link
                      href={`/${post.creator.username}`}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                    >
                      <Crown className="h-4 w-4" />
                      Unlock Access
                    </Link>
                  </div>
                </div>
              )}

              {/* Thumbnail */}
              {post.thumbnail_url && (
                <div className="relative h-48 bg-gray-100 dark:bg-neutral-800">
                  <Image
                    src={post.thumbnail_url}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full">
                    <PostTypeIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-5">
                {/* Creator Info */}
                <div className="flex items-center gap-3 mb-3">
                  <Link href={`/${post.creator.username}`} className="flex items-center gap-2 group">
                    {post.creator.avatar_url ? (
                      <div className="h-8 w-8 rounded-full overflow-hidden">
                        <Image
                          src={post.creator.avatar_url}
                          alt={post.creator.name}
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {post.creator.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {post.creator.name}
                      </p>
                    </div>
                  </Link>
                  <div className="flex-1"></div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    post.tier.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                    post.tier.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                    'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
                  }`}>
                    {post.tier.name}
                  </div>
                </div>

                {/* Title & Excerpt */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(post.published_at).toLocaleDateString()}</span>
                  </div>
                  {post.read_time_minutes && (
                    <div className="flex items-center gap-1">
                      <span>{post.read_time_minutes} min read</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{post.view_count.toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                      <Heart className="h-4 w-4" />
                      <span className="text-sm">{post.like_count}</span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">{post.comment_count}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                      <Bookmark className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <div className="text-center py-16">
          <TrendingUp className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No posts yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Exclusive content from your supported creators will appear here
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors"
          >
            Discover Creators
          </Link>
        </div>
      )}
    </div>
  );
}
