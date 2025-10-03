'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Post, CreatePostInput, PostType, PostVisibility, PostCategory } from '@/types/posts';
import {
  X,
  Save,
  Eye,
  EyeOff,
  Calendar,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Lock,
  Globe,
  Crown,
  Tag,
  Clock,
  Loader2,
  Upload,
  Trash2
} from 'lucide-react';

interface PostEditorProps {
  post?: Post;
  onClose: () => void;
  onSave: (post: Post) => void;
}

export default function PostEditor({ post, onClose, onSave }: PostEditorProps) {
  const supabase = createClient();

  // Form state
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [postType, setPostType] = useState<PostType>(post?.post_type || 'text');
  const [visibility, setVisibility] = useState<PostVisibility>(post?.visibility || 'public');
  const [category, setCategory] = useState<PostCategory | undefined>(post?.category);
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [requiredTierId, setRequiredTierId] = useState<string | undefined>(post?.required_tier_id);
  const [isFeatured, setIsFeatured] = useState(post?.is_featured || false);
  const [isPublished, setIsPublished] = useState(post?.is_published || false);
  const [scheduledFor, setScheduledFor] = useState<string | undefined>(post?.scheduled_for);
  const [mediaUrl, setMediaUrl] = useState(post?.media_url || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(post?.thumbnail_url || '');

  // UI state
  const [loading, setLoading] = useState(false);
  const [tiers, setTiers] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch tiers
  useEffect(() => {
    const fetchTiers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', user.id)
        .order('price', { ascending: true });

      if (data) setTiers(data);
    };

    fetchTiers();
  }, []);

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (title.length > 200) newErrors.title = 'Title must be less than 200 characters';
    if (!content.trim()) newErrors.content = 'Content is required';
    if (visibility === 'tier' && !requiredTierId) newErrors.tier = 'Please select a tier for tier-restricted content';
    if (postType !== 'text' && !mediaUrl) newErrors.media = `${postType} URL is required`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle tag addition
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Handle tag removal
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle save
  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const postData: CreatePostInput = {
        title,
        content,
        post_type: postType,
        visibility,
        category,
        tags: tags.length > 0 ? tags : undefined,
        required_tier_id: visibility === 'tier' ? requiredTierId : undefined,
        is_featured: isFeatured,
        is_published: isPublished,
        scheduled_for: scheduledFor,
        media_url: postType !== 'text' ? mediaUrl : undefined,
        thumbnail_url: thumbnailUrl || undefined,
      };

      let response;

      if (post?.id) {
        // Update existing post
        response = await fetch(`/api/posts/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });
      } else {
        // Create new post
        response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save post');
      }

      const { post: savedPost } = await response.json();
      onSave(savedPost);
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save post' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {post ? 'Edit Post' : 'Create Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Post Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Post Type
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { type: 'text' as PostType, icon: FileText, label: 'Text' },
                { type: 'video' as PostType, icon: Video, label: 'Video' },
                { type: 'audio' as PostType, icon: Music, label: 'Audio' },
                { type: 'image' as PostType, icon: ImageIcon, label: 'Image' },
                { type: 'poll' as PostType, icon: FileText, label: 'Poll' },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setPostType(type)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    postType === type
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${postType === type ? 'text-purple-600' : 'text-gray-500'}`} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Media URL (for non-text posts) */}
          {postType !== 'text' && postType !== 'poll' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {postType.charAt(0).toUpperCase() + postType.slice(1)} URL *
                </label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={`Enter ${postType} URL...`}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.media && <p className="mt-1 text-sm text-red-600">{errors.media}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="Enter thumbnail URL..."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content..."
              rows={10}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visibility
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'public' as PostVisibility, icon: Globe, label: 'Public' },
                { value: 'members' as PostVisibility, icon: Lock, label: 'Members Only' },
                { value: 'tier' as PostVisibility, icon: Crown, label: 'Tier Restricted' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setVisibility(value)}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    visibility === value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${visibility === value ? 'text-purple-600' : 'text-gray-500'}`} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tier Selection (for tier-restricted) */}
          {visibility === 'tier' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Required Tier *
              </label>
              <select
                value={requiredTierId || ''}
                onChange={(e) => setRequiredTierId(e.target.value || undefined)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a tier</option>
                {tiers.map(tier => (
                  <option key={tier.id} value={tier.id}>
                    {tier.name} - ${tier.price}/{tier.billing_period}
                  </option>
                ))}
              </select>
              {errors.tier && <p className="mt-1 text-sm text-red-600">{errors.tier}</p>}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={category || ''}
              onChange={(e) => setCategory(e.target.value as PostCategory || undefined)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select category</option>
              <option value="tutorial">Tutorial</option>
              <option value="update">Update</option>
              <option value="behind-the-scenes">Behind the Scenes</option>
              <option value="announcement">Announcement</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tags..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Tag className="h-4 w-4" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-purple-900 dark:hover:text-purple-100">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Schedule for Later
            </label>
            <input
              type="datetime-local"
              value={scheduledFor || ''}
              onChange={(e) => setScheduledFor(e.target.value || undefined)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Feature this post</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</span>
            </label>
          </div>

          {errors.submit && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {post ? 'Update Post' : 'Create Post'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
