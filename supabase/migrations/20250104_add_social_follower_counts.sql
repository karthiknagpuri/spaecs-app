-- Migration to support follower counts in social_links
-- The social_links JSONB field will now support structure like:
-- {
--   "twitter": "username",
--   "twitter_followers": 1234,
--   "instagram": "username",
--   "instagram_followers": 5678,
--   "youtube": "channel_url",
--   "youtube_subscribers": 9012,
--   "website": "url"
-- }

-- Add comment to document the structure
COMMENT ON COLUMN public.creator_pages.social_links IS
'Social media links and follower counts stored as JSONB. Structure: {"platform": "handle", "platform_followers": count}';

-- No structural changes needed as JSONB is already flexible
-- This migration just documents the expected structure
