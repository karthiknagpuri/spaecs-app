-- Migration to add theme configuration support to creator_pages
-- Allows creators to customize the appearance of their public profile

-- Add theme_config column to store theme settings
ALTER TABLE public.creator_pages
ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{"template": "minimal", "colors": {"primary": "#000000", "accent": "#f5f5f5"}}'::jsonb;

-- Add comment to document the structure
COMMENT ON COLUMN public.creator_pages.theme_config IS
'Theme configuration for public profile. Structure: {
  "template": "minimal" | "luma" | "dark" | "gradient" | "brutalist" | "glass",
  "colors": {
    "primary": "#hex",
    "accent": "#hex"
  }
}';

-- Create index for faster theme queries
CREATE INDEX IF NOT EXISTS idx_creator_pages_theme_config ON public.creator_pages USING GIN (theme_config);
