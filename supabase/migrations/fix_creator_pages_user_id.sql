-- Fix creator_pages.user_id to reference auth.users instead of public.users
-- This allows users to create profiles without needing a public.users row first

-- Drop the old foreign key constraint if it exists
ALTER TABLE creator_pages
  DROP CONSTRAINT IF EXISTS creator_pages_user_id_fkey;

-- Add new foreign key constraint referencing auth.users
ALTER TABLE creator_pages
  ADD CONSTRAINT creator_pages_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;
