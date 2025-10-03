'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/types/posts';
import PostEditor from './PostEditor';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Heart,
  MessageCircle,
  MoreVertical,
  Edit,
  Trash2,
  Globe,
  Lock,
  Crown,
  Calendar,
  TrendingUp,
  Clock,
  Star,
  Loader2,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
} from 'lucide-react';

export default function PostsManager() {
  const supabase = createClient();

  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | undefined>();
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  // Fetch posts
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const params = new URLSearchParams({
        creator_id: user.id,
        sort_by: sortBy,
      });

      if (filterVisibility !== 'all') params.append('visibility', filterVisibility);
      if (filterStatus === 'published') params.append('is_published', 'true');
      if (filterStatus === 'draft') params.append('is_published', 'false');
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch posts');

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [sortBy, filterVisibility, filterStatus, searchQuery]);

  // Handle delete
  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete post');

      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  // Handle edit
  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  // Handle create new
  const handleCreateNew = () => {
    setEditingPost(undefined);
    setShowEditor(true);
  };

  // Handle save
  const handleSave = (savedPost: Post) => {
    if (editingPost) {
      // Update existing
      setPosts(posts.map(p => p.id === savedPost.id ? savedPost : p));
    } else {
      // Add new
      setPosts([savedPost, ...posts]);
    }
    fetchPosts(); // Refresh to get latest data
  };

  // Get post type icon
  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'audio': return Music;
      case 'image': return ImageIcon;
      default: return FileText;
    }
  };

  // Get visibility icon
  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return Globe;
      case 'members': return Lock;
      case 'tier': return Crown;
      default: return Globe;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Posts</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your content and member updates
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Post
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts by title or content..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Visibility Filter */}
          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Visibility</option>
            <option value="public">Public</option>
            <option value="members">Members Only</option>
            <option value="tier">Tier Restricted</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
            <option value="trending">Trending</option>
          </select>
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create your first post to share content with your audience
          </p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Your First Post
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const PostTypeIcon = getPostTypeIcon(post.post_type);
            const VisibilityIcon = getVisibilityIcon(post.visibility);

            return (
              <div
                key={post.id}
                className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title & Badges */}
                    <div className="flex items-start gap-3 mb-2">
                      <PostTypeIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            post.is_published
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400'
                          }`}>
                            {post.is_published ? 'Published' : 'Draft'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                            <VisibilityIcon className="h-3 w-3" />
                            {post.visibility}
                          </span>
                          {post.is_featured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">
                              <Star className="h-3 w-3" />
                              Featured
                            </span>
                          )}
                          {post.category && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                              {post.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Stats & Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {post.like_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {post.comment_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {post.view_count}
                      </span>
                      {post.read_time_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.read_time_minutes} min read
                        </span>
                      )}
                      {post.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.published_at).toLocaleDateString()}
                        </span>
                      )}
                      {post.scheduled_for && !post.is_published && (
                        <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                          <Clock className="h-4 w-4" />
                          Scheduled: {new Date(post.scheduled_for).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(post)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <PostEditor
          post={editingPost}
          onClose={() => {
            setShowEditor(false);
            setEditingPost(undefined);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
