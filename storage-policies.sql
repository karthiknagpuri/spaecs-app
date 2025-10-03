-- Storage policies for profile-images bucket
-- Run this in your Supabase Dashboard > SQL Editor

-- Drop existing policies if they exist (to avoid errors)
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Policy 1: Allow users to upload their own images
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow users to update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING ((storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK ((storage.foldername(name))[1] = auth.uid()::text);

-- Policy 3: Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING ((storage.foldername(name))[1] = auth.uid()::text);
