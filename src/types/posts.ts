// =====================================================
// Post Types and Interfaces
// =====================================================

export type PostType = 'text' | 'video' | 'audio' | 'image' | 'poll';
export type PostVisibility = 'public' | 'members' | 'tier';
export type PostCategory = 'tutorial' | 'update' | 'behind-the-scenes' | 'announcement' | 'other';

export interface Post {
  id: string;
  creator_id: string;

  // Content
  title: string;
  content: string;
  excerpt?: string;

  // Type & Media
  post_type: PostType;
  media_url?: string;
  thumbnail_url?: string;
  media_duration?: number; // In seconds

  // Access Control
  visibility: PostVisibility;
  required_tier_id?: string;
  is_published: boolean;

  // Scheduling
  published_at?: string;
  scheduled_for?: string;

  // Engagement
  like_count: number;
  comment_count: number;
  view_count: number;

  // Organization
  category?: PostCategory;
  tags?: string[];
  is_featured: boolean;
  is_pinned: boolean;

  // SEO
  slug?: string;
  meta_description?: string;

  // Read Time
  read_time_minutes?: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id?: string;

  content: string;
  is_edited: boolean;
  is_pinned: boolean;

  like_count: number;

  created_at: string;
  updated_at: string;

  // For nested comments
  replies?: PostComment[];

  // User info (joined from auth.users)
  user?: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export interface PostView {
  id: string;
  post_id: string;
  user_id?: string;

  viewed_at: string;
  read_percentage?: number;
  time_spent_seconds?: number;

  is_supporter: boolean;
  supporter_tier?: string;

  user_agent?: string;
  referrer?: string;
}

export interface PostWithStats extends Post {
  views_last_7_days?: number;
  unique_viewers_last_7_days?: number;
  avg_read_percentage?: number;
  is_liked_by_user?: boolean;
}

// =====================================================
// Form Types
// =====================================================

export interface CreatePostInput {
  title: string;
  content: string;
  post_type?: PostType;
  media_url?: string;
  thumbnail_url?: string;
  visibility?: PostVisibility;
  required_tier_id?: string;
  category?: PostCategory;
  tags?: string[];
  is_featured?: boolean;
  scheduled_for?: string;
  is_published?: boolean;
}

export interface UpdatePostInput extends Partial<CreatePostInput> {
  id: string;
}

export interface CreateCommentInput {
  post_id: string;
  content: string;
  parent_comment_id?: string;
}

// =====================================================
// API Response Types
// =====================================================

export interface PostsResponse {
  posts: PostWithStats[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PostResponse {
  post: PostWithStats;
  comments?: PostComment[];
}

// =====================================================
// Filter & Sort Types
// =====================================================

export interface PostFilters {
  visibility?: PostVisibility | PostVisibility[];
  category?: PostCategory | PostCategory[];
  is_published?: boolean;
  is_featured?: boolean;
  creator_id?: string;
  search?: string;
}

export type PostSortBy = 'recent' | 'popular' | 'trending' | 'oldest';

export interface PostQueryParams extends PostFilters {
  page?: number;
  limit?: number;
  sort_by?: PostSortBy;
}
