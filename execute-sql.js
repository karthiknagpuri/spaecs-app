const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vnqgdftaxhflidnoksnv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZucWdkZnRheGhmbGlkbm9rc252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTM1MzcsImV4cCI6MjA3Mzc2OTUzN30.FgTBtHxOrnvi_oueHaxfKfvQNdShylf-c-TiIH1e4jI';

async function executeSql() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Note: To execute DDL statements like ALTER TABLE and CREATE POLICY,
  // you need to use the Supabase Dashboard SQL editor or the service role key.
  // The anon key doesn't have permission to modify table policies.

  console.log(`
To fix the RLS policies, please:

1. Go to your Supabase Dashboard:
   https://supabase.com/dashboard/project/vnqgdftaxhflidnoksnv/sql/new

2. Copy and paste this SQL:

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

3. Click "Run" to execute the SQL.

This will fix the RLS policies and allow users to create their profiles.
  `);
}

executeSql();