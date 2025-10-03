-- =====================================================
-- Posts System Migration
-- Features: Member-only content, Tiers, Likes, Comments, Rich media
-- =====================================================

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Post Content
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT, -- Short preview (generated or custom)

  -- Post Type & Media
  post_type VARCHAR(20) DEFAULT 'text', -- 'text', 'video', 'audio', 'image', 'poll'
  media_url TEXT, -- URL to video/audio/image
  thumbnail_url TEXT, -- Thumbnail for video/image posts
  media_duration INTEGER, -- Duration in seconds for video/audio

  -- Access Control
  visibility VARCHAR(20) DEFAULT 'public', -- 'public', 'members', 'tier'
  required_tier_id UUID, -- Minimum tier required (references membership_tiers if using tier-based access)
  is_published BOOLEAN DEFAULT false,

  -- Scheduling
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ, -- Auto-publish at this time

  -- Engagement
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  -- Organization
  category VARCHAR(50), -- 'tutorial', 'update', 'behind-the-scenes', 'announcement'
  tags TEXT[], -- Array of tags
  is_featured BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,

  -- SEO & Discovery
  slug VARCHAR(200) UNIQUE,
  meta_description TEXT,

  -- Read Time Estimation
  read_time_minutes INTEGER, -- Estimated read time

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX idx_posts_creator_id ON public.posts(creator_id);
CREATE INDEX idx_posts_published ON public.posts(is_published, published_at DESC) WHERE is_published = true;
CREATE INDEX idx_posts_visibility ON public.posts(visibility);
CREATE INDEX idx_posts_tier ON public.posts(required_tier_id) WHERE required_tier_id IS NOT NULL;
CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_posts_scheduled ON public.posts(scheduled_for) WHERE scheduled_for IS NOT NULL AND is_published = false;
CREATE INDEX idx_posts_slug ON public.posts(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_posts_featured ON public.posts(is_featured, created_at DESC) WHERE is_featured = true;

-- =====================================================
-- Post Likes Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(post_id, user_id) -- Prevent duplicate likes
);

CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);

-- =====================================================
-- Post Comments Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE, -- For nested replies

  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false, -- Creator can pin comments

  like_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id, created_at DESC);
CREATE INDEX idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX idx_post_comments_parent ON public.post_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- =====================================================
-- Post Views/Analytics Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for anonymous views

  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  read_percentage DECIMAL(5,2), -- How much of the post was read (0-100)
  time_spent_seconds INTEGER, -- Time spent on post

  -- User context
  is_supporter BOOLEAN DEFAULT false,
  supporter_tier VARCHAR(50),

  -- Device/Browser info
  user_agent TEXT,
  referrer TEXT
);

CREATE INDEX idx_post_views_post_id ON public.post_views(post_id, viewed_at DESC);
CREATE INDEX idx_post_views_user_id ON public.post_views(user_id) WHERE user_id IS NOT NULL;

-- =====================================================
-- Auto-publish Scheduled Posts Function
-- =====================================================

CREATE OR REPLACE FUNCTION auto_publish_scheduled_posts()
RETURNS void AS $$
BEGIN
  UPDATE public.posts
  SET is_published = true,
      published_at = NOW(),
      updated_at = NOW()
  WHERE scheduled_for IS NOT NULL
    AND scheduled_for <= NOW()
    AND is_published = false;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Generate Slug Function
-- =====================================================

CREATE OR REPLACE FUNCTION generate_post_slug(post_title TEXT, post_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert title to slug format
  base_slug := lower(regexp_replace(post_title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g'); -- Remove leading/trailing hyphens
  base_slug := left(base_slug, 100); -- Limit length

  final_slug := base_slug;

  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM public.posts WHERE slug = final_slug AND id != post_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Auto-generate Excerpt Function
-- =====================================================

CREATE OR REPLACE FUNCTION generate_post_excerpt(post_content TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Strip HTML/Markdown and get first 150 characters
  RETURN left(regexp_replace(post_content, '<[^>]*>|\*\*|\*|__|_|#', '', 'g'), 150) || '...';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Calculate Read Time Function
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_read_time(post_content TEXT)
RETURNS INTEGER AS $$
DECLARE
  word_count INTEGER;
  words_per_minute INTEGER := 200;
BEGIN
  -- Count words (simple split by whitespace)
  word_count := array_length(regexp_split_to_array(trim(post_content), '\s+'), 1);

  -- Calculate minutes (minimum 1 minute)
  RETURN GREATEST(1, CEIL(word_count::DECIMAL / words_per_minute));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Update Like Count Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET like_count = like_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET like_count = GREATEST(0, like_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_likes_update_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

-- =====================================================
-- Update Comment Count Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_comments_update_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- =====================================================
-- Auto-populate Post Metadata Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION populate_post_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate slug if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_post_slug(NEW.title, NEW.id);
  END IF;

  -- Generate excerpt if not provided
  IF NEW.excerpt IS NULL OR NEW.excerpt = '' THEN
    NEW.excerpt := generate_post_excerpt(NEW.content);
  END IF;

  -- Calculate read time
  IF NEW.post_type = 'text' THEN
    NEW.read_time_minutes := calculate_read_time(NEW.content);
  END IF;

  -- Set published_at if publishing
  IF NEW.is_published = true AND OLD.is_published = false THEN
    NEW.published_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_populate_metadata
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION populate_post_metadata();

-- =====================================================
-- Updated At Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION update_posts_updated_at();

-- =====================================================
-- RLS Policies - Posts
-- =====================================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Creators can view all their posts
CREATE POLICY "Creators can view own posts"
  ON public.posts
  FOR SELECT
  USING (auth.uid() = creator_id);

-- Creators can insert their own posts
CREATE POLICY "Creators can insert own posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Creators can update their own posts
CREATE POLICY "Creators can update own posts"
  ON public.posts
  FOR UPDATE
  USING (auth.uid() = creator_id);

-- Creators can delete their own posts
CREATE POLICY "Creators can delete own posts"
  ON public.posts
  FOR DELETE
  USING (auth.uid() = creator_id);

-- Public can view published public posts
CREATE POLICY "Public can view published public posts"
  ON public.posts
  FOR SELECT
  USING (
    is_published = true
    AND visibility = 'public'
    AND (scheduled_for IS NULL OR scheduled_for <= NOW())
  );

-- Members can view member-only posts (this will be enhanced with tier checking)
CREATE POLICY "Members can view member posts"
  ON public.posts
  FOR SELECT
  USING (
    is_published = true
    AND visibility IN ('members', 'tier')
    AND auth.uid() IS NOT NULL
    AND (scheduled_for IS NULL OR scheduled_for <= NOW())
  );

-- =====================================================
-- RLS Policies - Post Likes
-- =====================================================

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Users can view all likes
CREATE POLICY "Anyone can view post likes"
  ON public.post_likes
  FOR SELECT
  USING (true);

-- Authenticated users can like posts
CREATE POLICY "Authenticated users can like posts"
  ON public.post_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike their own likes
CREATE POLICY "Users can unlike own likes"
  ON public.post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- RLS Policies - Post Comments
-- =====================================================

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments on published posts
CREATE POLICY "Anyone can view published post comments"
  ON public.post_comments
  FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM public.posts WHERE is_published = true
    )
  );

-- Authenticated users can comment
CREATE POLICY "Authenticated users can comment"
  ON public.post_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.post_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.post_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Creators can delete any comment on their posts
CREATE POLICY "Creators can delete comments on own posts"
  ON public.post_comments
  FOR DELETE
  USING (
    post_id IN (
      SELECT id FROM public.posts WHERE creator_id = auth.uid()
    )
  );

-- =====================================================
-- RLS Policies - Post Views
-- =====================================================

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Creators can view analytics for their posts
CREATE POLICY "Creators can view own post analytics"
  ON public.post_views
  FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM public.posts WHERE creator_id = auth.uid()
    )
  );

-- Anyone can insert view records
CREATE POLICY "Anyone can track post views"
  ON public.post_views
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- Helper Views
-- =====================================================

-- View for posts with engagement stats
CREATE OR REPLACE VIEW posts_with_stats AS
SELECT
  p.*,
  COALESCE(v.view_count_7days, 0) as views_last_7_days,
  COALESCE(v.unique_viewers_7days, 0) as unique_viewers_last_7_days,
  COALESCE(v.avg_read_percentage, 0) as avg_read_percentage
FROM public.posts p
LEFT JOIN (
  SELECT
    post_id,
    COUNT(*) FILTER (WHERE viewed_at > NOW() - INTERVAL '7 days') as view_count_7days,
    COUNT(DISTINCT user_id) FILTER (WHERE viewed_at > NOW() - INTERVAL '7 days' AND user_id IS NOT NULL) as unique_viewers_7days,
    AVG(read_percentage) FILTER (WHERE viewed_at > NOW() - INTERVAL '7 days') as avg_read_percentage
  FROM public.post_views
  GROUP BY post_id
) v ON p.id = v.post_id;

-- =====================================================
-- Utility Functions
-- =====================================================

-- Function to track post view
CREATE OR REPLACE FUNCTION track_post_view(
  p_post_id UUID,
  p_read_percentage DECIMAL DEFAULT NULL,
  p_time_spent_seconds INTEGER DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.post_views (
    post_id,
    user_id,
    read_percentage,
    time_spent_seconds
  ) VALUES (
    p_post_id,
    auth.uid(),
    p_read_percentage,
    p_time_spent_seconds
  );

  -- Update view count
  UPDATE public.posts
  SET view_count = view_count + 1
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle like
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  liked BOOLEAN;
BEGIN
  -- Check if already liked
  IF EXISTS (SELECT 1 FROM public.post_likes WHERE post_id = p_post_id AND user_id = auth.uid()) THEN
    -- Unlike
    DELETE FROM public.post_likes WHERE post_id = p_post_id AND user_id = auth.uid();
    liked := false;
  ELSE
    -- Like
    INSERT INTO public.post_likes (post_id, user_id) VALUES (p_post_id, auth.uid());
    liked := true;
  END IF;

  RETURN liked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to duplicate a post (time-saver)
CREATE OR REPLACE FUNCTION duplicate_post(original_post_id UUID)
RETURNS UUID AS $$
DECLARE
  new_post_id UUID;
BEGIN
  INSERT INTO public.posts (
    creator_id, title, content, post_type, media_url, thumbnail_url,
    visibility, required_tier_id, category, tags,
    is_published, is_featured
  )
  SELECT
    creator_id,
    title || ' (Copy)',
    content, post_type, media_url, thumbnail_url,
    visibility, required_tier_id, category, tags,
    false, -- Unpublish the copy
    is_featured
  FROM public.posts
  WHERE id = original_post_id AND creator_id = auth.uid()
  RETURNING id INTO new_post_id;

  RETURN new_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Add Foreign Key to membership_tiers (if table exists)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'membership_tiers'
  ) THEN
    ALTER TABLE public.posts
    ADD CONSTRAINT posts_required_tier_id_fkey
    FOREIGN KEY (required_tier_id)
    REFERENCES public.membership_tiers(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE public.posts IS 'Creator posts with member-only access, scheduling, and rich media support';
COMMENT ON COLUMN public.posts.visibility IS 'Access level: public, members (any tier), tier (specific tier required)';
COMMENT ON COLUMN public.posts.required_tier_id IS 'Minimum tier required to view this post (references membership_tiers.id)';
COMMENT ON COLUMN public.posts.scheduled_for IS 'Auto-publish at this time';
COMMENT ON COLUMN public.posts.post_type IS 'Content type: text, video, audio, image, poll';
COMMENT ON FUNCTION toggle_post_like IS 'Toggle like status for a post, returns true if liked, false if unliked';
COMMENT ON FUNCTION track_post_view IS 'Record a post view with optional engagement metrics';
