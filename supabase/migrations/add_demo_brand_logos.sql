-- =====================================================
-- Demo Brand Logos
-- Add these sample brand logos for testing
-- =====================================================

-- First, get your user ID by running:
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Replace 'YOUR_USER_ID' below with your actual user ID

-- Sample Brand Logos (using Clearbit Logo API for high-quality logos)
INSERT INTO public.brand_logos (creator_id, brand_name, logo_url, website_url, display_order, is_active)
VALUES
  ('YOUR_USER_ID', 'Nike', 'https://logo.clearbit.com/nike.com', 'https://nike.com', 1, true),
  ('YOUR_USER_ID', 'Apple', 'https://logo.clearbit.com/apple.com', 'https://apple.com', 2, true),
  ('YOUR_USER_ID', 'Google', 'https://logo.clearbit.com/google.com', 'https://google.com', 3, true),
  ('YOUR_USER_ID', 'Microsoft', 'https://logo.clearbit.com/microsoft.com', 'https://microsoft.com', 4, true),
  ('YOUR_USER_ID', 'Amazon', 'https://logo.clearbit.com/amazon.com', 'https://amazon.com', 5, true),
  ('YOUR_USER_ID', 'Netflix', 'https://logo.clearbit.com/netflix.com', 'https://netflix.com', 6, true),
  ('YOUR_USER_ID', 'Spotify', 'https://logo.clearbit.com/spotify.com', 'https://spotify.com', 7, true),
  ('YOUR_USER_ID', 'Adobe', 'https://logo.clearbit.com/adobe.com', 'https://adobe.com', 8, true),
  ('YOUR_USER_ID', 'Tesla', 'https://logo.clearbit.com/tesla.com', 'https://tesla.com', 9, true),
  ('YOUR_USER_ID', 'Samsung', 'https://logo.clearbit.com/samsung.com', 'https://samsung.com', 10, true);

-- Alternative: Using logo.dev API
-- INSERT INTO public.brand_logos (creator_id, brand_name, logo_url, website_url, display_order, is_active)
-- VALUES
--   ('YOUR_USER_ID', 'Nike', 'https://img.logo.dev/nike.com?token=pk_X-HaDKV0TfOh7tQj2HCqbg', 'https://nike.com', 1, true),
--   ('YOUR_USER_ID', 'Apple', 'https://img.logo.dev/apple.com?token=pk_X-HaDKV0TfOh7tQj2HCqbg', 'https://apple.com', 2, true);

-- To verify the logos were added:
-- SELECT * FROM public.brand_logos WHERE creator_id = 'YOUR_USER_ID' ORDER BY display_order;
