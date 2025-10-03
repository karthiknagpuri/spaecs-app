-- =====================================================
-- Add platform detection to custom_links table
-- =====================================================

-- Add platform column to store auto-detected social platform
ALTER TABLE public.custom_links
ADD COLUMN IF NOT EXISTS platform VARCHAR(50);

-- Add index for platform filtering
CREATE INDEX IF NOT EXISTS idx_custom_links_platform ON public.custom_links(platform);

-- Add comment for documentation
COMMENT ON COLUMN public.custom_links.platform IS 'Auto-detected social platform (youtube, instagram, twitter, etc.)';
