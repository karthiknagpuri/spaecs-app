-- Fix RLS policies for creator_pages table

-- First, check if RLS is enabled (it should be)
ALTER TABLE creator_pages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to recreate them properly)
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

-- Also ensure the users table has proper RLS if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;

    -- Drop and recreate policies for users table
    DROP POLICY IF EXISTS "Users can view their own data" ON users;
    DROP POLICY IF EXISTS "Users can update their own data" ON users;

    CREATE POLICY "Users can view their own data"
      ON users
      FOR SELECT
      USING (auth.uid() = id);

    CREATE POLICY "Users can update their own data"
      ON users
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;