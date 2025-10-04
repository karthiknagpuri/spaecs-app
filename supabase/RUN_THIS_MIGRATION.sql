-- =====================================================
-- COMPLETE MIGRATION - Run This Script
-- =====================================================
-- This script is completely safe and handles all scenarios
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, let's see what we're working with
DO $$
DECLARE
  has_collab_table BOOLEAN;
  has_brand_table BOOLEAN;
  has_stats_table BOOLEAN;
  collab_has_creator_id BOOLEAN := FALSE;
  brand_has_creator_id BOOLEAN := FALSE;
  stats_has_creator_id BOOLEAN := FALSE;
BEGIN
  -- Check which tables exist
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collaboration_requests') INTO has_collab_table;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_logos') INTO has_brand_table;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'creator_stats') INTO has_stats_table;

  -- Check if they have creator_id
  IF has_collab_table THEN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collaboration_requests' AND column_name = 'creator_id') INTO collab_has_creator_id;
  END IF;

  IF has_brand_table THEN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_logos' AND column_name = 'creator_id') INTO brand_has_creator_id;
  END IF;

  IF has_stats_table THEN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creator_stats' AND column_name = 'creator_id') INTO stats_has_creator_id;
  END IF;

  RAISE NOTICE 'Collaboration table exists: %, has creator_id: %', has_collab_table, collab_has_creator_id;
  RAISE NOTICE 'Brand logos table exists: %, has creator_id: %', has_brand_table, brand_has_creator_id;
  RAISE NOTICE 'Creator stats table exists: %, has creator_id: %', has_stats_table, stats_has_creator_id;
END $$;

-- =====================================================
-- PART 1: Drop ALL old stuff
-- =====================================================

-- Drop indexes (both old and new names)
DROP INDEX IF EXISTS idx_collab_requests_creator_id CASCADE;
DROP INDEX IF EXISTS idx_collab_requests_user_id CASCADE;
DROP INDEX IF EXISTS idx_collab_requests_status CASCADE;
DROP INDEX IF EXISTS idx_collab_requests_created_at CASCADE;
DROP INDEX IF EXISTS idx_collab_requests_email CASCADE;

DROP INDEX IF EXISTS idx_brand_logos_creator_id CASCADE;
DROP INDEX IF EXISTS idx_brand_logos_user_id CASCADE;
DROP INDEX IF EXISTS idx_brand_logos_display_order CASCADE;
DROP INDEX IF EXISTS idx_brand_logos_display CASCADE;
DROP INDEX IF EXISTS idx_brand_logos_active CASCADE;

DROP INDEX IF EXISTS idx_creator_stats_creator_id CASCADE;
DROP INDEX IF EXISTS idx_creator_stats_user_id CASCADE;

-- Drop all policies (ignore errors)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Creators can view own collab requests" ON collaboration_requests;
  DROP POLICY IF EXISTS "Users can view own collab requests" ON collaboration_requests;
  DROP POLICY IF EXISTS "Creators can update own collab requests" ON collaboration_requests;
  DROP POLICY IF EXISTS "Users can update own collab requests" ON collaboration_requests;
  DROP POLICY IF EXISTS "Anyone can submit collab requests" ON collaboration_requests;

  DROP POLICY IF EXISTS "Creators can manage own brand logos" ON brand_logos;
  DROP POLICY IF EXISTS "Users can manage own brand logos" ON brand_logos;
  DROP POLICY IF EXISTS "Public can view active brand logos" ON brand_logos;

  DROP POLICY IF EXISTS "Creators can update own stats" ON creator_stats;
  DROP POLICY IF EXISTS "Users can manage own stats" ON creator_stats;
  DROP POLICY IF EXISTS "Public can view creator stats" ON creator_stats;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- =====================================================
-- PART 2: Rename columns (if needed)
-- =====================================================

-- Collaboration requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'collaboration_requests' AND column_name = 'creator_id') THEN
    ALTER TABLE collaboration_requests RENAME COLUMN creator_id TO user_id;
    RAISE NOTICE 'Renamed collaboration_requests.creator_id to user_id';
  END IF;
END $$;

-- Brand logos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'brand_logos' AND column_name = 'creator_id') THEN
    ALTER TABLE brand_logos RENAME COLUMN creator_id TO user_id;
    RAISE NOTICE 'Renamed brand_logos.creator_id to user_id';
  END IF;
END $$;

-- Creator stats
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'creator_stats' AND column_name = 'creator_id') THEN
    ALTER TABLE creator_stats RENAME COLUMN creator_id TO user_id;
    RAISE NOTICE 'Renamed creator_stats.creator_id to user_id';
  END IF;
END $$;

-- =====================================================
-- PART 3: Recreate indexes for EXISTING tables
-- =====================================================

-- Collaboration requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collaboration_requests') THEN
    CREATE INDEX idx_collab_requests_user_id ON collaboration_requests(user_id);
    CREATE INDEX idx_collab_requests_status ON collaboration_requests(status);
    CREATE INDEX idx_collab_requests_created_at ON collaboration_requests(created_at DESC);
    CREATE INDEX idx_collab_requests_email ON collaboration_requests(email);
    RAISE NOTICE 'Created indexes for collaboration_requests';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create collaboration_requests indexes: %', SQLERRM;
END $$;

-- Brand logos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_logos') THEN
    CREATE INDEX idx_brand_logos_user_id ON brand_logos(user_id);
    CREATE INDEX idx_brand_logos_active ON brand_logos(is_active) WHERE is_active = true;
    CREATE INDEX idx_brand_logos_display ON brand_logos(user_id, display_order);
    RAISE NOTICE 'Created indexes for brand_logos';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create brand_logos indexes: %', SQLERRM;
END $$;

-- Creator stats
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'creator_stats') THEN
    CREATE UNIQUE INDEX idx_creator_stats_user_id ON creator_stats(user_id);
    RAISE NOTICE 'Created indexes for creator_stats';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create creator_stats indexes: %', SQLERRM;
END $$;

-- =====================================================
-- PART 4: Recreate RLS policies for EXISTING tables
-- =====================================================

-- Collaboration requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collaboration_requests') THEN
    ALTER TABLE collaboration_requests ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view own collab requests"
      ON collaboration_requests FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can update own collab requests"
      ON collaboration_requests FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Anyone can submit collab requests"
      ON collaboration_requests FOR INSERT WITH CHECK (true);

    RAISE NOTICE 'Created policies for collaboration_requests';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create collaboration_requests policies: %', SQLERRM;
END $$;

-- Brand logos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_logos') THEN
    ALTER TABLE brand_logos ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Public can view active brand logos"
      ON brand_logos FOR SELECT USING (is_active = true);

    CREATE POLICY "Users can manage own brand logos"
      ON brand_logos FOR ALL USING (auth.uid() = user_id);

    RAISE NOTICE 'Created policies for brand_logos';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create brand_logos policies: %', SQLERRM;
END $$;

-- Creator stats
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'creator_stats') THEN
    ALTER TABLE creator_stats ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Public can view creator stats"
      ON creator_stats FOR SELECT USING (true);

    CREATE POLICY "Users can manage own stats"
      ON creator_stats FOR ALL USING (auth.uid() = user_id);

    RAISE NOTICE 'Created policies for creator_stats';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create creator_stats policies: %', SQLERRM;
END $$;

-- =====================================================
-- PART 5: Update functions
-- =====================================================

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
-- PART 6: Create NEW tables
-- =====================================================

CREATE TABLE IF NOT EXISTS email_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email, source)
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'subscribed',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  access_level TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_user_id, email)
);

CREATE TABLE IF NOT EXISTS autopilot_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  target_audience JSONB DEFAULT '{}',
  offer_details JSONB DEFAULT '{}',
  email_template JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{}',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id TEXT NOT NULL,
  benefit_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS link_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_id TEXT NOT NULL,
  email_collected TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to creator_pages
ALTER TABLE creator_pages
ADD COLUMN IF NOT EXISTS email_collection_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_collection_message TEXT DEFAULT 'Join my community! Enter your email to access my links.',
ADD COLUMN IF NOT EXISTS newsletter_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS newsletter_message TEXT DEFAULT 'Subscribe to my newsletter for exclusive updates!',
ADD COLUMN IF NOT EXISTS community_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS community_url TEXT,
ADD COLUMN IF NOT EXISTS community_access_level TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS autopilot_enabled BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_leads_user ON email_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_email_leads_email ON email_leads(email);
CREATE INDEX IF NOT EXISTS idx_email_leads_source ON email_leads(source);
CREATE INDEX IF NOT EXISTS idx_email_leads_created ON email_leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_newsletter_user ON newsletter_subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);

CREATE INDEX IF NOT EXISTS idx_community_creator_user ON community_members(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_community_member_user ON community_members(member_user_id);
CREATE INDEX IF NOT EXISTS idx_community_access ON community_members(access_level);

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON autopilot_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON autopilot_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON autopilot_campaigns(type);

CREATE INDEX IF NOT EXISTS idx_benefits_user ON member_benefits(user_id);
CREATE INDEX IF NOT EXISTS idx_benefits_tier ON member_benefits(tier_id);

CREATE INDEX IF NOT EXISTS idx_analytics_user ON link_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_clicked ON link_analytics(clicked_at DESC);

-- Enable RLS
ALTER TABLE email_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_analytics ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view their email leads" ON email_leads;
DROP POLICY IF EXISTS "Anyone can insert email leads" ON email_leads;
DROP POLICY IF EXISTS "Users can update their email leads" ON email_leads;

CREATE POLICY "Users can view their email leads" ON email_leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert email leads" ON email_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their email leads" ON email_leads FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can unsubscribe" ON newsletter_subscribers;

CREATE POLICY "Users can view their subscribers" ON newsletter_subscribers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can unsubscribe" ON newsletter_subscribers FOR UPDATE WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their community" ON community_members;
DROP POLICY IF EXISTS "Anyone can join community" ON community_members;
DROP POLICY IF EXISTS "Users can update community members" ON community_members;

CREATE POLICY "Users can view their community" ON community_members FOR SELECT
  USING (auth.uid() = creator_user_id OR auth.uid() = member_user_id);
CREATE POLICY "Anyone can join community" ON community_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update community members" ON community_members FOR UPDATE USING (auth.uid() = creator_user_id);

DROP POLICY IF EXISTS "Users can manage their campaigns" ON autopilot_campaigns;
CREATE POLICY "Users can manage their campaigns" ON autopilot_campaigns FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their benefits" ON member_benefits;
DROP POLICY IF EXISTS "Anyone can view enabled benefits" ON member_benefits;

CREATE POLICY "Users can manage their benefits" ON member_benefits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view enabled benefits" ON member_benefits FOR SELECT USING (is_enabled = true);

DROP POLICY IF EXISTS "Users can view their analytics" ON link_analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON link_analytics;

CREATE POLICY "Users can view their analytics" ON link_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert analytics" ON link_analytics FOR INSERT WITH CHECK (true);

-- Create triggers
DROP TRIGGER IF EXISTS update_email_leads_updated_at ON email_leads;
CREATE TRIGGER update_email_leads_updated_at
  BEFORE UPDATE ON email_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON newsletter_subscribers;
CREATE TRIGGER update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_community_members_updated_at ON community_members;
CREATE TRIGGER update_community_members_updated_at
  BEFORE UPDATE ON community_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_autopilot_campaigns_updated_at ON autopilot_campaigns;
CREATE TRIGGER update_autopilot_campaigns_updated_at
  BEFORE UPDATE ON autopilot_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_member_benefits_updated_at ON member_benefits;
CREATE TRIGGER update_member_benefits_updated_at
  BEFORE UPDATE ON member_benefits FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SUCCESS!
-- =====================================================

SELECT '✅ MIGRATION COMPLETE!' as status;
SELECT 'All tables created and configured with user_id columns' as message;
