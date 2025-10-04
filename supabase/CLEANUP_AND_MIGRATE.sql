-- =====================================================
-- CLEANUP AND MIGRATE - Complete Reset and Setup
-- Run this ONCE to fix all naming issues
-- =====================================================

-- =====================================================
-- PART 1: Clean up old indexes and constraints
-- =====================================================

-- Drop old indexes with creator_id naming
DROP INDEX IF EXISTS idx_collab_requests_creator_id CASCADE;
DROP INDEX IF EXISTS idx_brand_logos_creator_id CASCADE;
DROP INDEX IF EXISTS idx_brand_logos_display_order CASCADE;
DROP INDEX IF EXISTS idx_creator_stats_creator_id CASCADE;
DROP INDEX IF EXISTS idx_email_leads_creator CASCADE;
DROP INDEX IF EXISTS idx_newsletter_creator CASCADE;
DROP INDEX IF EXISTS idx_community_creator CASCADE;
DROP INDEX IF EXISTS idx_community_user CASCADE;
DROP INDEX IF EXISTS idx_campaigns_creator CASCADE;
DROP INDEX IF EXISTS idx_benefits_creator CASCADE;
DROP INDEX IF EXISTS idx_analytics_creator CASCADE;

-- Drop old policies
DROP POLICY IF EXISTS "Creators can view own collab requests" ON collaboration_requests;
DROP POLICY IF EXISTS "Creators can update own collab requests" ON collaboration_requests;
DROP POLICY IF EXISTS "Anyone can submit collab requests" ON collaboration_requests;
DROP POLICY IF EXISTS "Creators can manage own brand logos" ON brand_logos;
DROP POLICY IF EXISTS "Public can view active brand logos" ON brand_logos;
DROP POLICY IF EXISTS "Creators can update own stats" ON creator_stats;
DROP POLICY IF EXISTS "Public can view creator stats" ON creator_stats;

-- =====================================================
-- PART 2: Rename columns from creator_id to user_id
-- =====================================================

-- Collaboration requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'collaboration_requests' AND column_name = 'creator_id') THEN
    ALTER TABLE collaboration_requests RENAME COLUMN creator_id TO user_id;
  END IF;
END $$;

-- Brand logos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'brand_logos' AND column_name = 'creator_id') THEN
    ALTER TABLE brand_logos RENAME COLUMN creator_id TO user_id;
  END IF;
END $$;

-- Creator stats
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'creator_stats' AND column_name = 'creator_id') THEN
    ALTER TABLE creator_stats RENAME COLUMN creator_id TO user_id;
  END IF;
END $$;

-- =====================================================
-- PART 3: Create new indexes with correct naming
-- =====================================================

-- Collaboration requests indexes
CREATE INDEX IF NOT EXISTS idx_collab_requests_user_id ON collaboration_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_requests_status ON collaboration_requests(status);
CREATE INDEX IF NOT EXISTS idx_collab_requests_created_at ON collaboration_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collab_requests_email ON collaboration_requests(email);

-- Brand logos indexes
CREATE INDEX IF NOT EXISTS idx_brand_logos_user_id ON brand_logos(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_logos_active ON brand_logos(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_brand_logos_display ON brand_logos(user_id, display_order);

-- Creator stats index
CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_stats_user_id ON creator_stats(user_id);

-- =====================================================
-- PART 4: Recreate RLS policies with user_id
-- =====================================================

-- Collaboration requests policies
CREATE POLICY "Users can view own collab requests"
  ON collaboration_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own collab requests"
  ON collaboration_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can submit collab requests"
  ON collaboration_requests FOR INSERT
  WITH CHECK (true);

-- Brand logos policies
CREATE POLICY "Public can view active brand logos"
  ON brand_logos FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can manage own brand logos"
  ON brand_logos FOR ALL
  USING (auth.uid() = user_id);

-- Creator stats policies
CREATE POLICY "Public can view creator stats"
  ON creator_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own stats"
  ON creator_stats FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- PART 5: Update helper functions
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
-- PART 6: Create new email leads tables
-- =====================================================

-- Email leads
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

-- Newsletter subscribers
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

-- Community members
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

-- Autopilot campaigns
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

-- Member benefits
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

-- Link analytics
CREATE TABLE IF NOT EXISTS link_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_id TEXT NOT NULL,
  email_collected TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PART 7: Add columns to creator_pages
-- =====================================================

ALTER TABLE creator_pages
ADD COLUMN IF NOT EXISTS email_collection_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_collection_message TEXT DEFAULT 'Join my community! Enter your email to access my links.',
ADD COLUMN IF NOT EXISTS newsletter_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS newsletter_message TEXT DEFAULT 'Subscribe to my newsletter for exclusive updates!',
ADD COLUMN IF NOT EXISTS community_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS community_url TEXT,
ADD COLUMN IF NOT EXISTS community_access_level TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS autopilot_enabled BOOLEAN DEFAULT false;

-- =====================================================
-- PART 8: Create indexes for new tables
-- =====================================================

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

-- =====================================================
-- PART 9: Enable RLS and create policies
-- =====================================================

ALTER TABLE email_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_analytics ENABLE ROW LEVEL SECURITY;

-- Email leads policies
DROP POLICY IF EXISTS "Users can view their email leads" ON email_leads;
CREATE POLICY "Users can view their email leads"
  ON email_leads FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert email leads" ON email_leads;
CREATE POLICY "Anyone can insert email leads"
  ON email_leads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their email leads" ON email_leads;
CREATE POLICY "Users can update their email leads"
  ON email_leads FOR UPDATE USING (auth.uid() = user_id);

-- Newsletter policies
DROP POLICY IF EXISTS "Users can view their subscribers" ON newsletter_subscribers;
CREATE POLICY "Users can view their subscribers"
  ON newsletter_subscribers FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe"
  ON newsletter_subscribers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can unsubscribe" ON newsletter_subscribers;
CREATE POLICY "Anyone can unsubscribe"
  ON newsletter_subscribers FOR UPDATE WITH CHECK (true);

-- Community policies
DROP POLICY IF EXISTS "Users can view their community" ON community_members;
CREATE POLICY "Users can view their community"
  ON community_members FOR SELECT
  USING (auth.uid() = creator_user_id OR auth.uid() = member_user_id);

DROP POLICY IF EXISTS "Anyone can join community" ON community_members;
CREATE POLICY "Anyone can join community"
  ON community_members FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update community members" ON community_members;
CREATE POLICY "Users can update community members"
  ON community_members FOR UPDATE USING (auth.uid() = creator_user_id);

-- Autopilot policies
DROP POLICY IF EXISTS "Users can manage their campaigns" ON autopilot_campaigns;
CREATE POLICY "Users can manage their campaigns"
  ON autopilot_campaigns FOR ALL USING (auth.uid() = user_id);

-- Benefits policies
DROP POLICY IF EXISTS "Users can manage their benefits" ON member_benefits;
CREATE POLICY "Users can manage their benefits"
  ON member_benefits FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view enabled benefits" ON member_benefits;
CREATE POLICY "Anyone can view enabled benefits"
  ON member_benefits FOR SELECT USING (is_enabled = true);

-- Analytics policies
DROP POLICY IF EXISTS "Users can view their analytics" ON link_analytics;
CREATE POLICY "Users can view their analytics"
  ON link_analytics FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert analytics" ON link_analytics;
CREATE POLICY "Anyone can insert analytics"
  ON link_analytics FOR INSERT WITH CHECK (true);

-- =====================================================
-- PART 10: Create triggers
-- =====================================================

DROP TRIGGER IF EXISTS update_email_leads_updated_at ON email_leads;
CREATE TRIGGER update_email_leads_updated_at
  BEFORE UPDATE ON email_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON newsletter_subscribers;
CREATE TRIGGER update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_community_members_updated_at ON community_members;
CREATE TRIGGER update_community_members_updated_at
  BEFORE UPDATE ON community_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_autopilot_campaigns_updated_at ON autopilot_campaigns;
CREATE TRIGGER update_autopilot_campaigns_updated_at
  BEFORE UPDATE ON autopilot_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_member_benefits_updated_at ON member_benefits;
CREATE TRIGGER update_member_benefits_updated_at
  BEFORE UPDATE ON member_benefits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show final state
SELECT 'COMPLETE! All tables now use user_id' as status;

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name LIKE '%user_id%' OR column_name = 'creator_id')
ORDER BY table_name, column_name;
