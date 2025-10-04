-- =====================================================
-- Fix Existing Tables - Update creator_id to user_id
-- Run this FIRST if you have existing collaboration tables
-- =====================================================

-- Step 1: Update collaboration_requests table
DO $$
BEGIN
  -- Check if creator_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collaboration_requests'
    AND column_name = 'creator_id'
  ) THEN
    -- Rename creator_id to user_id
    ALTER TABLE collaboration_requests RENAME COLUMN creator_id TO user_id;

    -- Update indexes
    DROP INDEX IF EXISTS idx_collab_requests_creator_id;
    CREATE INDEX IF NOT EXISTS idx_collab_requests_user_id ON collaboration_requests(user_id);

    -- Update RLS policies
    DROP POLICY IF EXISTS "Creators can view own collab requests" ON collaboration_requests;
    CREATE POLICY "Creators can view own collab requests"
      ON collaboration_requests FOR SELECT
      USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Creators can update own collab requests" ON collaboration_requests;
    CREATE POLICY "Creators can update own collab requests"
      ON collaboration_requests FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Step 2: Update brand_logos table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brand_logos'
    AND column_name = 'creator_id'
  ) THEN
    ALTER TABLE brand_logos RENAME COLUMN creator_id TO user_id;

    DROP INDEX IF EXISTS idx_brand_logos_creator_id;
    DROP INDEX IF EXISTS idx_brand_logos_display_order;
    CREATE INDEX IF NOT EXISTS idx_brand_logos_user_id ON brand_logos(user_id);
    CREATE INDEX IF NOT EXISTS idx_brand_logos_display_order ON brand_logos(user_id, display_order);

    DROP POLICY IF EXISTS "Creators can manage own brand logos" ON brand_logos;
    CREATE POLICY "Creators can manage own brand logos"
      ON brand_logos FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Step 3: Update creator_stats table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'creator_stats'
    AND column_name = 'creator_id'
  ) THEN
    ALTER TABLE creator_stats RENAME COLUMN creator_id TO user_id;

    DROP INDEX IF EXISTS idx_creator_stats_creator_id;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_stats_user_id ON creator_stats(user_id);

    DROP POLICY IF EXISTS "Creators can update own stats" ON creator_stats;
    CREATE POLICY "Creators can update own stats"
      ON creator_stats FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Step 4: Update helper functions
CREATE OR REPLACE FUNCTION get_creator_stats_summary(p_creator_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_followers', COALESCE(total_followers, 0),
    'engagement_rate', COALESCE(avg_engagement_rate, 0.00),
    'total_collaborations', COALESCE(total_collaborations, 0),
    'active_platforms', COALESCE(array_length(active_platforms, 1), 0),
    'monthly_content', COALESCE(monthly_content_avg, 0)
  ) INTO result
  FROM public.creator_stats
  WHERE user_id = p_creator_id;

  RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_collaboration_count(p_creator_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.creator_stats (user_id, total_collaborations, active_collaborations)
  VALUES (p_creator_id, 1, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_collaborations = creator_stats.total_collaborations + 1,
    active_collaborations = creator_stats.active_collaborations + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Verify Changes
-- =====================================================

-- Show all tables and their user_id columns
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name = 'user_id' OR column_name = 'creator_id')
ORDER BY table_name, column_name;
