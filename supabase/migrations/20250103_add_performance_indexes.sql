-- =====================================================
-- Performance Optimization Migration
-- Add indexes for common query patterns
-- =====================================================

-- Creator pages indexes
CREATE INDEX IF NOT EXISTS idx_creator_pages_slug_active
  ON public.creator_pages(slug) WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_creator_pages_user_id
  ON public.creator_pages(user_id);

-- Custom links composite indexes for public profile queries
CREATE INDEX IF NOT EXISTS idx_custom_links_creator_active
  ON public.custom_links(creator_id, is_active, is_pinned, display_order)
  WHERE is_active = true;

-- Index for scheduled links queries
CREATE INDEX IF NOT EXISTS idx_custom_links_scheduling
  ON public.custom_links(creator_id, start_date, expire_date)
  WHERE is_active = true;

-- Supporters indexes for count queries
CREATE INDEX IF NOT EXISTS idx_supporters_creator_status
  ON public.supporters(creator_id, status)
  WHERE status = 'active';

-- Users table index
CREATE INDEX IF NOT EXISTS idx_users_username
  ON public.users(username) WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_email
  ON public.users(email) WHERE email IS NOT NULL;

-- =====================================================
-- Add unique constraint to prevent duplicate usernames
-- =====================================================

-- Add unique constraint on creator_pages.slug (use DO block to handle existing constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_creator_pages_slug'
  ) THEN
    ALTER TABLE public.creator_pages
      ADD CONSTRAINT unique_creator_pages_slug UNIQUE (slug);
  END IF;
END $$;

-- Add unique constraint on users.username
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_users_username'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT unique_users_username UNIQUE (username);
  END IF;
END $$;

-- =====================================================
-- Add check constraints for data validation
-- =====================================================

-- Ensure expire_date is after start_date for custom links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'custom_links_dates_check'
  ) THEN
    ALTER TABLE public.custom_links
      ADD CONSTRAINT custom_links_dates_check
      CHECK (expire_date IS NULL OR start_date IS NULL OR expire_date > start_date);
  END IF;
END $$;

-- =====================================================
-- Create function to optimize scheduled links query
-- =====================================================

-- Optimized function to get active visible links for a creator
CREATE OR REPLACE FUNCTION get_active_custom_links(
  p_creator_id UUID,
  p_current_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(100),
  url TEXT,
  icon VARCHAR(50),
  description TEXT,
  category VARCHAR(50),
  is_featured BOOLEAN,
  button_color VARCHAR(7),
  show_click_count BOOLEAN,
  click_count INTEGER,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.id,
    cl.title,
    cl.url,
    cl.icon,
    cl.description,
    cl.category,
    cl.is_featured,
    cl.button_color,
    cl.show_click_count,
    cl.click_count,
    cl.display_order
  FROM public.custom_links cl
  WHERE cl.creator_id = p_creator_id
    AND cl.is_active = true
    AND (cl.start_date IS NULL OR cl.start_date <= p_current_time)
    AND (cl.expire_date IS NULL OR cl.expire_date > p_current_time)
  ORDER BY cl.is_pinned DESC, cl.display_order ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_active_custom_links(UUID, TIMESTAMPTZ) TO anon, authenticated;

-- =====================================================
-- Add materialized view for profile stats (optional)
-- =====================================================

-- Create materialized view for frequently accessed profile data
CREATE MATERIALIZED VIEW IF NOT EXISTS profile_stats AS
SELECT
  cp.id as profile_id,
  cp.user_id,
  cp.slug,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as supporter_count,
  COUNT(DISTINCT cl.id) FILTER (WHERE cl.is_active = true) as active_links_count,
  MAX(s.created_at) as last_supporter_date
FROM public.creator_pages cp
LEFT JOIN public.supporters s ON s.creator_id = cp.user_id
LEFT JOIN public.custom_links cl ON cl.creator_id = cp.user_id
GROUP BY cp.id, cp.user_id, cp.slug;

-- Create unique index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_stats_slug
  ON profile_stats(slug);

CREATE INDEX IF NOT EXISTS idx_profile_stats_user_id
  ON profile_stats(user_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_profile_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY profile_stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON INDEX idx_creator_pages_slug_active IS 'Optimizes public profile lookups by slug';
COMMENT ON INDEX idx_custom_links_creator_active IS 'Optimizes custom links queries for public profiles';
COMMENT ON INDEX idx_supporters_creator_status IS 'Optimizes supporter count queries';
COMMENT ON FUNCTION get_active_custom_links IS 'Returns active visible custom links for a creator with proper date filtering';
COMMENT ON MATERIALIZED VIEW profile_stats IS 'Cached profile statistics for frequently accessed data. Refresh periodically with refresh_profile_stats()';
