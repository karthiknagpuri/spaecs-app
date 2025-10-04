-- Email leads collection table
CREATE TABLE IF NOT EXISTS email_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  source TEXT NOT NULL, -- 'linktree', 'newsletter', 'community'
  metadata JSONB DEFAULT '{}', -- additional data like link clicked, referrer, etc.
  status TEXT DEFAULT 'active', -- 'active', 'unsubscribed', 'bounced'
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
  status TEXT DEFAULT 'subscribed', -- 'subscribed', 'unsubscribed', 'bounced'
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
  access_level TEXT NOT NULL, -- 'free', 'paid', 'tier_1', 'tier_2', 'tier_3', etc.
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'banned'
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
  type TEXT NOT NULL, -- 'upgrade_offer', 'teaser', 'retention', 'annual_offer'
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  target_audience JSONB DEFAULT '{}', -- { tier: 'free', days_since_join: 30, etc. }
  offer_details JSONB DEFAULT '{}', -- discount, duration, etc.
  email_template JSONB DEFAULT '{}', -- subject, body, etc.
  stats JSONB DEFAULT '{}', -- sent, opened, clicked, converted
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member benefits table
CREATE TABLE IF NOT EXISTS member_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id TEXT NOT NULL, -- 'tier_1', 'tier_2', 'tier_3', or 'all'
  benefit_type TEXT NOT NULL, -- 'merch', 'shoutout', 'call', 'archive', 'community', 'downloads', 'tickets', 'ebook', 'early_access', 'vip', 'exclusive_content', 'fan_requests'
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}', -- benefit-specific configuration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link analytics for email collection
CREATE TABLE IF NOT EXISTS link_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_id TEXT NOT NULL, -- identifier for the link
  email_collected TEXT, -- email if collected
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}', -- user agent, referrer, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add community and email collection settings to creator_pages
ALTER TABLE creator_pages
ADD COLUMN IF NOT EXISTS email_collection_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_collection_message TEXT DEFAULT 'Join my community! Enter your email to access my links.',
ADD COLUMN IF NOT EXISTS newsletter_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS newsletter_message TEXT DEFAULT 'Subscribe to my newsletter for exclusive updates!',
ADD COLUMN IF NOT EXISTS community_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS community_url TEXT,
ADD COLUMN IF NOT EXISTS community_access_level TEXT DEFAULT 'all', -- 'all', 'members_only', 'tier_only', 'paid_only', 'free_only'
ADD COLUMN IF NOT EXISTS autopilot_enabled BOOLEAN DEFAULT false;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_leads_creator ON email_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_email_leads_email ON email_leads(email);
CREATE INDEX IF NOT EXISTS idx_email_leads_source ON email_leads(source);
CREATE INDEX IF NOT EXISTS idx_email_leads_created ON email_leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_newsletter_creator ON newsletter_subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);

CREATE INDEX IF NOT EXISTS idx_community_creator ON community_members(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_community_member ON community_members(member_user_id);
CREATE INDEX IF NOT EXISTS idx_community_access ON community_members(access_level);

CREATE INDEX IF NOT EXISTS idx_campaigns_creator ON autopilot_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON autopilot_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON autopilot_campaigns(type);

CREATE INDEX IF NOT EXISTS idx_benefits_creator ON member_benefits(user_id);
CREATE INDEX IF NOT EXISTS idx_benefits_tier ON member_benefits(tier_id);

CREATE INDEX IF NOT EXISTS idx_analytics_creator ON link_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_clicked ON link_analytics(clicked_at DESC);

-- RLS Policies
ALTER TABLE email_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopilot_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_analytics ENABLE ROW LEVEL SECURITY;

-- Email leads policies
CREATE POLICY "Creators can view their email leads"
  ON email_leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert email leads"
  ON email_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Creators can update their email leads"
  ON email_leads FOR UPDATE
  USING (auth.uid() = user_id);

-- Newsletter subscribers policies
CREATE POLICY "Creators can view their subscribers"
  ON newsletter_subscribers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can subscribe"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can unsubscribe"
  ON newsletter_subscribers FOR UPDATE
  WITH CHECK (true);

-- Community members policies
CREATE POLICY "Creators can view their community"
  ON community_members FOR SELECT
  USING (auth.uid() = creator_user_id OR auth.uid() = member_user_id);

CREATE POLICY "Anyone can join community"
  ON community_members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Creators can update community members"
  ON community_members FOR UPDATE
  USING (auth.uid() = creator_user_id);

-- Autopilot campaigns policies
CREATE POLICY "Creators can manage their campaigns"
  ON autopilot_campaigns FOR ALL
  USING (auth.uid() = user_id);

-- Member benefits policies
CREATE POLICY "Creators can manage their benefits"
  ON member_benefits FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view enabled benefits"
  ON member_benefits FOR SELECT
  USING (is_enabled = true);

-- Link analytics policies
CREATE POLICY "Creators can view their analytics"
  ON link_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert analytics"
  ON link_analytics FOR INSERT
  WITH CHECK (true);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_email_leads_updated_at
  BEFORE UPDATE ON email_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_community_members_updated_at
  BEFORE UPDATE ON community_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_autopilot_campaigns_updated_at
  BEFORE UPDATE ON autopilot_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_member_benefits_updated_at
  BEFORE UPDATE ON member_benefits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
