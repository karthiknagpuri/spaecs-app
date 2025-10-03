-- Create storage bucket and policies for profile images
-- Run this in your Supabase Dashboard > SQL Editor

-- Step 1: Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880,  -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;

-- Step 3: Create upload policy
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 4: Create update policy
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING ((storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK ((storage.foldername(name))[1] = auth.uid()::text);

-- Step 5: Create delete policy
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING ((storage.foldername(name))[1] = auth.uid()::text);

-- Step 6: Create public read policy
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');
