-- Add 10 demo supporters for testing (Simple Version)
-- Run this in your Supabase Dashboard > SQL Editor

-- IMPORTANT: Update 'karthik' below to your actual username/slug

DO $$
DECLARE
  creator_user_id UUID;
  your_user_id UUID;
  tier_id UUID;
  i INT;
  demo_amount INT;
BEGIN
  -- Get the creator's user_id from creator_pages
  SELECT user_id INTO creator_user_id
  FROM creator_pages
  WHERE slug = 'karthik' -- CHANGE THIS TO YOUR ACTUAL USERNAME/SLUG
  LIMIT 1;

  -- Use the creator's own user_id as supporter (for demo purposes)
  your_user_id := creator_user_id;

  -- Get a tier_id for the creator
  SELECT id INTO tier_id
  FROM membership_tiers
  WHERE creator_id = creator_user_id
  ORDER BY price_inr ASC
  LIMIT 1;

  -- If creator found, insert 10 supporter records
  IF creator_user_id IS NOT NULL THEN
    FOR i IN 1..10 LOOP
      -- Randomly pick an amount
      demo_amount := (ARRAY[9900, 29900, 49900])[1 + floor(random() * 3)::int];

      -- Insert supporter record (using creator as supporter for demo)
      INSERT INTO supporters (
        id,
        supporter_id,
        creator_id,
        membership_tier_id,
        support_type,
        status,
        amount_inr,
        currency,
        started_at,
        last_payment_at,
        total_contributed,
        supporter_message,
        is_public
      ) VALUES (
        gen_random_uuid(),
        your_user_id, -- Using your own user_id for demo
        creator_user_id,
        tier_id,
        'monthly_membership',
        'active',
        demo_amount,
        'INR',
        NOW() - (random() * 30 || ' days')::interval,
        NOW(),
        demo_amount * (1 + floor(random() * 5)::int), -- Random lifetime contribution
        'Thank you for the amazing content! 🎉',
        true
      );
    END LOOP;

    RAISE NOTICE 'Successfully added 10 demo supporters for creator: %', creator_user_id;
  ELSE
    RAISE EXCEPTION 'Creator not found. Please update the slug in the query to match your username.';
  END IF;
END $$;

-- Verify the supporters were added
SELECT
  COUNT(*) as total_supporters,
  SUM(total_contributed) as total_contributed_paise,
  SUM(total_contributed) / 100 as total_contributed_rupees
FROM supporters
WHERE creator_id = (SELECT user_id FROM creator_pages WHERE slug = 'karthik' LIMIT 1)
  AND status = 'active';
