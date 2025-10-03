-- =====================================================
-- Add thumbnail_url to custom_links table
-- =====================================================

-- Add thumbnail_url column
ALTER TABLE public.custom_links
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.custom_links.thumbnail_url IS 'Optional image thumbnail URL for link preview';
