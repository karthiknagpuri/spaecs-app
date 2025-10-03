-- =====================================================
-- COMBINED MIGRATIONS FOR CUSTOM LINKS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add thumbnail_url column
ALTER TABLE public.custom_links
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.custom_links.thumbnail_url IS 'Optional image thumbnail URL for link preview';

-- Add platform column to store auto-detected social platform
ALTER TABLE public.custom_links
ADD COLUMN IF NOT EXISTS platform VARCHAR(50);

-- Add index for platform filtering
CREATE INDEX IF NOT EXISTS idx_custom_links_platform ON public.custom_links(platform);

-- Add comment for documentation
COMMENT ON COLUMN public.custom_links.platform IS 'Auto-detected social platform (youtube, instagram, twitter, etc.)';
