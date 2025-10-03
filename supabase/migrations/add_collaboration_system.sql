-- =====================================================
-- Collaboration System Migration
-- Features: Collab requests, brand logos, creator stats
-- =====================================================

-- =====================================================
-- Collaboration Requests Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.collaboration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contact Info
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  company_name VARCHAR(200),

  -- Request Details
  message TEXT NOT NULL,
  budget_min INTEGER,
  budget_max INTEGER,
  budget_currency VARCHAR(3) DEFAULT 'INR',

  -- Collaboration Type
  collab_type VARCHAR(50), -- 'sponsorship', 'partnership', 'content', 'event', 'other'

  -- Status Tracking
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'accepted', 'rejected'
  priority VARCHAR(10) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

  -- Metadata
  source VARCHAR(50) DEFAULT 'website', -- 'website', 'email', 'social'
  referrer_url TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_collab_requests_creator_id ON public.collaboration_requests(creator_id);
CREATE INDEX idx_collab_requests_status ON public.collaboration_requests(status);
CREATE INDEX idx_collab_requests_created_at ON public.collaboration_requests(created_at DESC);
CREATE INDEX idx_collab_requests_email ON public.collaboration_requests(email);

-- =====================================================
-- Brand Logos Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.brand_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Brand Info
  brand_name VARCHAR(100) NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,

  -- Display Settings
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Partnership Details
  partnership_type VARCHAR(50), -- 'sponsor', 'partner', 'client', 'collaboration'
  partnership_start_date DATE,
  partnership_end_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_brand_logos_creator_id ON public.brand_logos(creator_id);
CREATE INDEX idx_brand_logos_active ON public.brand_logos(is_active) WHERE is_active = true;
CREATE INDEX idx_brand_logos_display_order ON public.brand_logos(creator_id, display_order);

-- =====================================================
-- Creator Stats Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.creator_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Social Media Stats
  total_followers INTEGER DEFAULT 0,
  youtube_followers INTEGER DEFAULT 0,
  instagram_followers INTEGER DEFAULT 0,
  twitter_followers INTEGER DEFAULT 0,
  tiktok_followers INTEGER DEFAULT 0,

  -- Engagement Metrics
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
  avg_views INTEGER DEFAULT 0,
  avg_likes INTEGER DEFAULT 0,
  avg_comments INTEGER DEFAULT 0,
  avg_shares INTEGER DEFAULT 0,

  -- Platform Presence
  primary_platform VARCHAR(50),
  active_platforms TEXT[], -- Array of platforms

  -- Content Stats
  total_content_pieces INTEGER DEFAULT 0,
  monthly_content_avg INTEGER DEFAULT 0,

  -- Collaboration History
  total_collaborations INTEGER DEFAULT 0,
  active_collaborations INTEGER DEFAULT 0,

  -- Last Updated
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE UNIQUE INDEX idx_creator_stats_creator_id ON public.creator_stats(creator_id);

-- =====================================================
-- RLS Policies - Collaboration Requests
-- =====================================================

ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

-- Creators can view their own collaboration requests
CREATE POLICY "Creators can view own collab requests"
  ON public.collaboration_requests
  FOR SELECT
  USING (auth.uid() = creator_id);

-- Creators can update their own collaboration requests (status, priority)
CREATE POLICY "Creators can update own collab requests"
  ON public.collaboration_requests
  FOR UPDATE
  USING (auth.uid() = creator_id);

-- Anyone can submit a collaboration request
CREATE POLICY "Anyone can submit collab requests"
  ON public.collaboration_requests
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- RLS Policies - Brand Logos
-- =====================================================

ALTER TABLE public.brand_logos ENABLE ROW LEVEL SECURITY;

-- Public can view active brand logos
CREATE POLICY "Public can view active brand logos"
  ON public.brand_logos
  FOR SELECT
  USING (is_active = true);

-- Creators can manage their own brand logos
CREATE POLICY "Creators can manage own brand logos"
  ON public.brand_logos
  FOR ALL
  USING (auth.uid() = creator_id);

-- =====================================================
-- RLS Policies - Creator Stats
-- =====================================================

ALTER TABLE public.creator_stats ENABLE ROW LEVEL SECURITY;

-- Public can view all creator stats
CREATE POLICY "Public can view creator stats"
  ON public.creator_stats
  FOR SELECT
  USING (true);

-- Creators can update their own stats
CREATE POLICY "Creators can update own stats"
  ON public.creator_stats
  FOR ALL
  USING (auth.uid() = creator_id);

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER collaboration_requests_updated_at
  BEFORE UPDATE ON public.collaboration_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER brand_logos_updated_at
  BEFORE UPDATE ON public.brand_logos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER creator_stats_updated_at
  BEFORE UPDATE ON public.creator_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get creator stats summary
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
  WHERE creator_id = p_creator_id;

  RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment collaboration count
CREATE OR REPLACE FUNCTION increment_collaboration_count(p_creator_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.creator_stats (creator_id, total_collaborations, active_collaborations)
  VALUES (p_creator_id, 1, 1)
  ON CONFLICT (creator_id)
  DO UPDATE SET
    total_collaborations = creator_stats.total_collaborations + 1,
    active_collaborations = creator_stats.active_collaborations + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE public.collaboration_requests IS 'Brand and creator collaboration requests';
COMMENT ON TABLE public.brand_logos IS 'Brand partnerships and logos for creator profiles';
COMMENT ON TABLE public.creator_stats IS 'Creator social media statistics and engagement metrics';

COMMENT ON COLUMN public.collaboration_requests.budget_min IS 'Minimum budget in minor units (e.g., paise for INR)';
COMMENT ON COLUMN public.collaboration_requests.budget_max IS 'Maximum budget in minor units (e.g., paise for INR)';
COMMENT ON COLUMN public.creator_stats.avg_engagement_rate IS 'Average engagement rate as percentage (0-100)';
