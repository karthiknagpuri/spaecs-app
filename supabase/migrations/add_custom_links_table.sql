-- =====================================================
-- Custom Links Table Migration
-- Features: Auto-expire, Click tracking, Scheduling, Categories
-- =====================================================

-- Create custom_links table
CREATE TABLE IF NOT EXISTS public.custom_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Link Details
  title VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- For custom icon/emoji

  -- Categorization & Organization
  category VARCHAR(50), -- 'social', 'shop', 'content', 'event', 'other'
  tags TEXT[], -- Array of tags for filtering
  display_order INTEGER DEFAULT 0, -- For manual ordering

  -- Scheduling & Expiration
  start_date TIMESTAMPTZ, -- When link should become visible
  expire_date TIMESTAMPTZ, -- When link should auto-hide/delete
  is_active BOOLEAN DEFAULT true,

  -- Analytics & Tracking
  click_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,

  -- Appearance & Behavior
  is_featured BOOLEAN DEFAULT false, -- Highlight important links
  button_color VARCHAR(7), -- Hex color for custom styling
  open_in_new_tab BOOLEAN DEFAULT true,

  -- Time-savers
  is_pinned BOOLEAN DEFAULT false, -- Pin to top regardless of order
  show_click_count BOOLEAN DEFAULT false, -- Display click count to visitors

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX idx_custom_links_creator_id ON public.custom_links(creator_id);
CREATE INDEX idx_custom_links_active ON public.custom_links(is_active) WHERE is_active = true;
CREATE INDEX idx_custom_links_expire_date ON public.custom_links(expire_date) WHERE expire_date IS NOT NULL;
CREATE INDEX idx_custom_links_category ON public.custom_links(category);
CREATE INDEX idx_custom_links_display_order ON public.custom_links(creator_id, display_order);

-- =====================================================
-- Auto-expire Function
-- =====================================================

-- Function to auto-deactivate expired links
CREATE OR REPLACE FUNCTION auto_expire_custom_links()
RETURNS void AS $$
BEGIN
  UPDATE public.custom_links
  SET is_active = false,
      updated_at = NOW()
  WHERE expire_date IS NOT NULL
    AND expire_date < NOW()
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Auto-activate Scheduled Links
-- =====================================================

-- Function to auto-activate scheduled links
CREATE OR REPLACE FUNCTION auto_activate_custom_links()
RETURNS void AS $$
BEGIN
  UPDATE public.custom_links
  SET is_active = true,
      updated_at = NOW()
  WHERE start_date IS NOT NULL
    AND start_date <= NOW()
    AND is_active = false
    AND (expire_date IS NULL OR expire_date > NOW());
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Scheduled Tasks (using pg_cron extension)
-- =====================================================

-- Note: pg_cron needs to be enabled first
-- SELECT cron.schedule('auto-expire-links', '*/5 * * * *', 'SELECT auto_expire_custom_links()');
-- SELECT cron.schedule('auto-activate-links', '*/5 * * * *', 'SELECT auto_activate_custom_links()');

-- Alternative: Create a function that runs both
CREATE OR REPLACE FUNCTION manage_scheduled_links()
RETURNS void AS $$
BEGIN
  PERFORM auto_expire_custom_links();
  PERFORM auto_activate_custom_links();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Click Tracking Function
-- =====================================================

CREATE OR REPLACE FUNCTION increment_link_clicks(link_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.custom_links
  SET click_count = click_count + 1,
      last_clicked_at = NOW(),
      updated_at = NOW()
  WHERE id = link_id AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Updated At Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_custom_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_links_updated_at
  BEFORE UPDATE ON public.custom_links
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_links_updated_at();

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE public.custom_links ENABLE ROW LEVEL SECURITY;

-- Creators can view their own links
CREATE POLICY "Creators can view own links"
  ON public.custom_links
  FOR SELECT
  USING (auth.uid() = creator_id);

-- Creators can insert their own links
CREATE POLICY "Creators can insert own links"
  ON public.custom_links
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Creators can update their own links
CREATE POLICY "Creators can update own links"
  ON public.custom_links
  FOR UPDATE
  USING (auth.uid() = creator_id);

-- Creators can delete their own links
CREATE POLICY "Creators can delete own links"
  ON public.custom_links
  FOR DELETE
  USING (auth.uid() = creator_id);

-- Public can view active links (for public profile pages)
CREATE POLICY "Public can view active links"
  ON public.custom_links
  FOR SELECT
  USING (
    is_active = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (expire_date IS NULL OR expire_date > NOW())
  );

-- =====================================================
-- Link Templates Table (Time-saver for creators)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.link_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  icon VARCHAR(50),
  button_color VARCHAR(7),
  is_system BOOLEAN DEFAULT false, -- System templates vs user templates
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add some default templates
INSERT INTO public.link_templates (name, category, icon, button_color, is_system) VALUES
  ('YouTube Video', 'content', '🎥', '#FF0000', true),
  ('New Blog Post', 'content', '📝', '#1DA1F2', true),
  ('Shop Now', 'shop', '🛍️', '#10B981', true),
  ('Limited Offer', 'shop', '⚡', '#F59E0B', true),
  ('Join Discord', 'social', '💬', '#5865F2', true),
  ('Follow on Twitter', 'social', '🐦', '#1DA1F2', true),
  ('Instagram', 'social', '📸', '#E4405F', true),
  ('Live Event', 'event', '📅', '#8B5CF6', true),
  ('Book a Call', 'event', '📞', '#3B82F6', true),
  ('Newsletter', 'content', '📧', '#059669', true);

-- RLS for templates
ALTER TABLE public.link_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system templates"
  ON public.link_templates
  FOR SELECT
  USING (is_system = true OR created_by = auth.uid());

-- =====================================================
-- Link Analytics Table (Detailed tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.link_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.custom_links(id) ON DELETE CASCADE,

  -- Click Details
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,

  -- Geo data (optional, can be populated via API)
  country VARCHAR(2),
  city VARCHAR(100),

  -- User context
  is_supporter BOOLEAN DEFAULT false,
  supporter_tier VARCHAR(50)
);

CREATE INDEX idx_link_analytics_link_id ON public.link_analytics(link_id);
CREATE INDEX idx_link_analytics_clicked_at ON public.link_analytics(clicked_at DESC);

ALTER TABLE public.link_analytics ENABLE ROW LEVEL SECURITY;

-- Creators can view analytics for their links
CREATE POLICY "Creators can view own link analytics"
  ON public.link_analytics
  FOR SELECT
  USING (
    link_id IN (
      SELECT id FROM public.custom_links WHERE creator_id = auth.uid()
    )
  );

-- =====================================================
-- Helper Views
-- =====================================================

-- View for active links with analytics
CREATE OR REPLACE VIEW active_links_with_stats AS
SELECT
  cl.*,
  COALESCE(la.recent_clicks, 0) as clicks_last_7_days,
  COALESCE(la.total_analytics_clicks, 0) as total_analytics_clicks
FROM public.custom_links cl
LEFT JOIN (
  SELECT
    link_id,
    COUNT(*) FILTER (WHERE clicked_at > NOW() - INTERVAL '7 days') as recent_clicks,
    COUNT(*) as total_analytics_clicks
  FROM public.link_analytics
  GROUP BY link_id
) la ON cl.id = la.link_id
WHERE cl.is_active = true
  AND (cl.start_date IS NULL OR cl.start_date <= NOW())
  AND (cl.expire_date IS NULL OR cl.expire_date > NOW());

-- =====================================================
-- Utility Functions for Creators
-- =====================================================

-- Function to duplicate a link (time-saver)
CREATE OR REPLACE FUNCTION duplicate_custom_link(original_link_id UUID)
RETURNS UUID AS $$
DECLARE
  new_link_id UUID;
BEGIN
  INSERT INTO public.custom_links (
    creator_id, title, url, description, icon, category, tags,
    button_color, open_in_new_tab, is_featured, show_click_count
  )
  SELECT
    creator_id,
    title || ' (Copy)',
    url, description, icon, category, tags,
    button_color, open_in_new_tab, is_featured, show_click_count
  FROM public.custom_links
  WHERE id = original_link_id AND creator_id = auth.uid()
  RETURNING id INTO new_link_id;

  RETURN new_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk update link order
CREATE OR REPLACE FUNCTION reorder_links(link_ids UUID[], new_orders INTEGER[])
RETURNS void AS $$
BEGIN
  UPDATE public.custom_links
  SET display_order = new_orders[array_position(link_ids, id)]
  WHERE id = ANY(link_ids) AND creator_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Migration for existing creator_pages custom_links
-- =====================================================

-- Migrate existing JSONB custom_links to new table (safely handles missing column)
DO $$
DECLARE
  creator_record RECORD;
  link_record JSONB;
  new_order INTEGER;
  column_exists BOOLEAN;
BEGIN
  -- Check if custom_links column exists in creator_pages
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'creator_pages'
      AND column_name = 'custom_links'
  ) INTO column_exists;

  -- Only attempt migration if column exists
  IF column_exists THEN
    FOR creator_record IN
      SELECT id, user_id, custom_links
      FROM public.creator_pages
      WHERE custom_links IS NOT NULL AND jsonb_array_length(custom_links) > 0
    LOOP
      new_order := 0;
      FOR link_record IN
        SELECT * FROM jsonb_array_elements(creator_record.custom_links)
      LOOP
        -- Check if link already exists to prevent duplicates on re-run
        IF NOT EXISTS (
          SELECT 1 FROM public.custom_links
          WHERE creator_id = creator_record.user_id
            AND title = COALESCE(link_record->>'title', 'Untitled Link')
            AND url = COALESCE(link_record->>'url', '#')
        ) THEN
          INSERT INTO public.custom_links (
            creator_id,
            title,
            url,
            icon,
            display_order,
            is_active
          ) VALUES (
            creator_record.user_id,
            COALESCE(link_record->>'title', 'Untitled Link'),
            COALESCE(link_record->>'url', '#'),
            link_record->>'icon',
            new_order,
            true
          );
        END IF;
        new_order := new_order + 1;
      END LOOP;
    END LOOP;
  ELSE
    RAISE NOTICE 'custom_links column does not exist in creator_pages - skipping migration';
  END IF;
END $$;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE public.custom_links IS 'Custom links for creator profiles with scheduling, analytics, and auto-expiration';
COMMENT ON COLUMN public.custom_links.expire_date IS 'Link auto-deactivates after this date (useful for limited offers, events)';
COMMENT ON COLUMN public.custom_links.start_date IS 'Link auto-activates on this date (useful for scheduled releases)';
COMMENT ON COLUMN public.custom_links.is_pinned IS 'Pinned links always appear at the top';
COMMENT ON COLUMN public.custom_links.category IS 'Category for grouping: social, shop, content, event, other';
COMMENT ON COLUMN public.custom_links.tags IS 'Array of tags for filtering and organization';
COMMENT ON FUNCTION increment_link_clicks IS 'Increments click counter and updates last clicked timestamp';
COMMENT ON FUNCTION manage_scheduled_links IS 'Run this function periodically to auto-activate/expire links based on dates';
