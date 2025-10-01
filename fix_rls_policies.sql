-- Run this SQL directly in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/vnqgdftaxhflidnoksnv/sql/new

-- Fix RLS policies for creator_pages table

-- Enable RLS on creator_pages table
ALTER TABLE creator_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON creator_pages;
DROP POLICY IF EXISTS "Users can insert their own profile" ON creator_pages;
DROP POLICY IF EXISTS "Users can update their own profile" ON creator_pages;
DROP POLICY IF EXISTS "Users can delete their own profile" ON creator_pages;

-- Create new policies for creator_pages table

-- Policy 1: Anyone can view creator pages (they're public)
CREATE POLICY "Public profiles are viewable by everyone"
  ON creator_pages
  FOR SELECT
  USING (true);

-- Policy 2: Authenticated users can create their own profile
CREATE POLICY "Users can insert their own profile"
  ON creator_pages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON creator_pages
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
  ON creator_pages
  FOR DELETE
  USING (auth.uid() = user_id);