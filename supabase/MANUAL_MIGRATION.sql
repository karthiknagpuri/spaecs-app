-- =====================================================
-- Email Leads & Community System - Manual Migration
-- Run this directly in Supabase SQL Editor
-- =====================================================

-- Email leads collection table
CREATE TABLE IF NOT EXISTS email_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  source TEXT NOT NULL, -- 'linktree', 'newsletter', 'community'
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email, source)
);

-- Newsletter subscribers table
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

-- Community members table
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

-- Autopilot campaigns table
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

-- Member benefits table
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

-- Link analytics table
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

CREATE INDEX IF NOT EXISTS idx_community_creator ON community_members(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_community_member ON community_members(member_user_id);
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

-- RLS Policies for email_leads
DROP POLICY IF EXISTS "Creators can view their email leads" ON email_leads;
CREATE POLICY "Creators can view their email leads"
  ON email_leads FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert email leads" ON email_leads;
CREATE POLICY "Anyone can insert email leads"
  ON email_leads FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Creators can update their email leads" ON email_leads;
CREATE POLICY "Creators can update their email leads"
  ON email_leads FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for newsletter_subscribers
DROP POLICY IF EXISTS "Creators can view their subscribers" ON newsletter_subscribers;
CREATE POLICY "Creators can view their subscribers"
  ON newsletter_subscribers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can unsubscribe" ON newsletter_subscribers;
CREATE POLICY "Anyone can unsubscribe"
  ON newsletter_subscribers FOR UPDATE
  WITH CHECK (true);

-- RLS Policies for community_members
DROP POLICY IF EXISTS "Creators can view their community" ON community_members;
CREATE POLICY "Creators can view their community"
  ON community_members FOR SELECT
  USING (auth.uid() = creator_user_id OR auth.uid() = member_user_id);

DROP POLICY IF EXISTS "Anyone can join community" ON community_members;
CREATE POLICY "Anyone can join community"
  ON community_members FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Creators can update community members" ON community_members;
CREATE POLICY "Creators can update community members"
  ON community_members FOR UPDATE
  USING (auth.uid() = creator_user_id);

-- RLS Policies for autopilot_campaigns
DROP POLICY IF EXISTS "Creators can manage their campaigns" ON autopilot_campaigns;
CREATE POLICY "Creators can manage their campaigns"
  ON autopilot_campaigns FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for member_benefits
DROP POLICY IF EXISTS "Creators can manage their benefits" ON member_benefits;
CREATE POLICY "Creators can manage their benefits"
  ON member_benefits FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view enabled benefits" ON member_benefits;
CREATE POLICY "Anyone can view enabled benefits"
  ON member_benefits FOR SELECT
  USING (is_enabled = true);

-- RLS Policies for link_analytics
DROP POLICY IF EXISTS "Creators can view their analytics" ON link_analytics;
CREATE POLICY "Creators can view their analytics"
  ON link_analytics FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert analytics" ON link_analytics;
CREATE POLICY "Anyone can insert analytics"
  ON link_analytics FOR INSERT
  WITH CHECK (true);

-- Triggers for updated_at
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
