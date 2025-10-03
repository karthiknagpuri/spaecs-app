# Quick Database Setup Guide

## You need to run these SQL commands in your Supabase SQL Editor

**Location**: Go to your Supabase Dashboard → SQL Editor → New Query

---

## Step 1: Run Custom Links Enhancements (Required for thumbnails & platform detection)

Copy and paste this SQL into Supabase SQL Editor:

```sql
-- =====================================================
-- Add thumbnail_url and platform to custom_links table
-- =====================================================

-- Add thumbnail_url column
ALTER TABLE public.custom_links
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add platform column
ALTER TABLE public.custom_links
ADD COLUMN IF NOT EXISTS platform VARCHAR(50);

-- Add index for platform filtering
CREATE INDEX IF NOT EXISTS idx_custom_links_platform ON public.custom_links(platform);

-- Add comments for documentation
COMMENT ON COLUMN public.custom_links.thumbnail_url IS 'Optional image thumbnail URL for link preview';
COMMENT ON COLUMN public.custom_links.platform IS 'Auto-detected social platform (youtube, instagram, twitter, etc.)';
```

**Click "Run"** in Supabase SQL Editor

---

## Step 2: Run Collaboration System (Required for Collab button & brand logos)

Copy and paste the entire SQL from `supabase/migrations/add_collaboration_system.sql` into Supabase SQL Editor.

**Or run this complete SQL**:

```sql
-- =====================================================
-- PART 1: Custom Links Enhancement (if not done above)
-- =====================================================

-- Add thumbnail_url column
ALTER TABLE public.custom_links
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add platform column
ALTER TABLE public.custom_links
ADD COLUMN IF NOT EXISTS platform VARCHAR(50);

-- Add index
CREATE INDEX IF NOT EXISTS idx_custom_links_platform ON public.custom_links(platform);

-- Add comments
COMMENT ON COLUMN public.custom_links.thumbnail_url IS 'Optional image thumbnail URL for link preview';
COMMENT ON COLUMN public.custom_links.platform IS 'Auto-detected social platform (youtube, instagram, twitter, etc.)';

-- =====================================================
-- PART 2: Collaboration System
-- =====================================================

-- Collaboration Requests Table
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
  collab_type VARCHAR(50),

  -- Status Tracking
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(10) DEFAULT 'normal',

  -- Metadata
  source VARCHAR(50) DEFAULT 'website',
  referrer_url TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Brand Logos Table
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
  partnership_type VARCHAR(50),
  partnership_start_date DATE,
  partnership_end_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator Stats Table
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
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_views INTEGER DEFAULT 0,
  avg_likes INTEGER DEFAULT 0,
  avg_comments INTEGER DEFAULT 0,
  avg_shares INTEGER DEFAULT 0,

  -- Platform Presence
  primary_platform VARCHAR(50),
  active_platforms TEXT[],

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

-- Indexes
CREATE INDEX idx_collab_requests_creator_id ON public.collaboration_requests(creator_id);
CREATE INDEX idx_collab_requests_status ON public.collaboration_requests(status);
CREATE INDEX idx_collab_requests_created_at ON public.collaboration_requests(created_at DESC);
CREATE INDEX idx_brand_logos_creator_id ON public.brand_logos(creator_id);
CREATE INDEX idx_brand_logos_active ON public.brand_logos(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX idx_creator_stats_creator_id ON public.creator_stats(creator_id);

-- RLS Policies
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_stats ENABLE ROW LEVEL SECURITY;

-- Collaboration Requests Policies
CREATE POLICY "Creators can view own collab requests"
  ON public.collaboration_requests
  FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can update own collab requests"
  ON public.collaboration_requests
  FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can submit collab requests"
  ON public.collaboration_requests
  FOR INSERT
  WITH CHECK (true);

-- Brand Logos Policies
CREATE POLICY "Public can view active brand logos"
  ON public.brand_logos
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Creators can manage own brand logos"
  ON public.brand_logos
  FOR ALL
  USING (auth.uid() = creator_id);

-- Creator Stats Policies
CREATE POLICY "Public can view creator stats"
  ON public.creator_stats
  FOR SELECT
  USING (true);

CREATE POLICY "Creators can update own stats"
  ON public.creator_stats
  FOR ALL
  USING (auth.uid() = creator_id);

-- Triggers
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
```

**Click "Run"** in Supabase SQL Editor

---

## Step 3: Add Sample Data (Optional - for testing)

### Get your User ID first:

```sql
SELECT id FROM auth.users WHERE email = 'your-email@example.com';
```

Copy the ID returned, then replace `YOUR_USER_ID` below with that ID:

### Add Sample Creator Stats:

```sql
INSERT INTO public.creator_stats (creator_id, total_followers, avg_engagement_rate, monthly_content_avg, total_collaborations)
VALUES (
  'YOUR_USER_ID',  -- Replace with your user ID
  125000,          -- 125K followers
  4.5,             -- 4.5% engagement
  12,              -- 12 posts/month
  8                -- 8 collaborations
);
```

### Add Sample Brand Logos:

```sql
INSERT INTO public.brand_logos (creator_id, brand_name, logo_url, website_url, display_order, is_active)
VALUES
  ('YOUR_USER_ID', 'Nike', 'https://logo.clearbit.com/nike.com', 'https://nike.com', 1, true),
  ('YOUR_USER_ID', 'Apple', 'https://logo.clearbit.com/apple.com', 'https://apple.com', 2, true),
  ('YOUR_USER_ID', 'Google', 'https://logo.clearbit.com/google.com', 'https://google.com', 3, true),
  ('YOUR_USER_ID', 'Microsoft', 'https://logo.clearbit.com/microsoft.com', 'https://microsoft.com', 4, true),
  ('YOUR_USER_ID', 'Amazon', 'https://logo.clearbit.com/amazon.com', 'https://amazon.com', 5, true),
  ('YOUR_USER_ID', 'Netflix', 'https://logo.clearbit.com/netflix.com', 'https://netflix.com', 6, true),
  ('YOUR_USER_ID', 'Spotify', 'https://logo.clearbit.com/spotify.com', 'https://spotify.com', 7, true),
  ('YOUR_USER_ID', 'Adobe', 'https://logo.clearbit.com/adobe.com', 'https://adobe.com', 8, true),
  ('YOUR_USER_ID', 'Tesla', 'https://logo.clearbit.com/tesla.com', 'https://tesla.com', 9, true),
  ('YOUR_USER_ID', 'Samsung', 'https://logo.clearbit.com/samsung.com', 'https://samsung.com', 10, true);
```

---

## Verification

After running the migrations, verify success:

```sql
-- Check if columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'custom_links'
  AND column_name IN ('thumbnail_url', 'platform');

-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('collaboration_requests', 'brand_logos', 'creator_stats');
```

---

## What This Enables

✅ **Custom Links**: Thumbnail images and auto-platform detection for social links
✅ **Collab Button**: Working collaboration request system
✅ **Brand Logos**: Scrolling brand partnership logos on your profile
✅ **Creator Stats**: Display followers, engagement, content stats

---

## Troubleshooting

If you see errors like "column already exists" or "table already exists", that's **OK** - it means that part was already set up. The `IF NOT EXISTS` clauses prevent errors on re-runs.

If you see permission errors, make sure you're logged into Supabase as the project owner.
