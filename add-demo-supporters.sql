-- Add 10 demo supporters for testing
-- Run this in your Supabase Dashboard > SQL Editor

-- First, let's get your user_id from the creator_pages table
-- Replace 'your-username' with your actual username/slug

-- Insert 10 demo supporters
-- Note: These are anonymous supporters (no real user accounts needed for demo)
DO $$
DECLARE
  creator_user_id UUID;
  supporter_ids UUID[] := ARRAY[
    gen_random_uuid(),
    gen_random_uuid(),
    gen_random_uuid(),
    gen_random_uuid(),
    gen_random_uuid(),
    gen_random_uuid(),
    gen_random_uuid(),
    gen_random_uuid(),
    gen_random_uuid(),
    gen_random_uuid()
  ];
  supporter_names TEXT[] := ARRAY[
    'Arjun Sharma',
    'Priya Patel',
    'Rahul Kumar',
    'Sneha Reddy',
    'Amit Singh',
    'Pooja Gupta',
    'Vikram Rao',
    'Ananya Iyer',
    'Rohan Desai',
    'Kavya Nair'
  ];
  tier_id UUID;
  i INT;
BEGIN
  -- Get the creator's user_id from creator_pages
  -- You'll need to update this query with your actual slug
  SELECT user_id INTO creator_user_id
  FROM creator_pages
  WHERE slug = 'karthik' -- CHANGE THIS TO YOUR ACTUAL USERNAME
  LIMIT 1;

  -- Get a random tier_id for the creator
  SELECT id INTO tier_id
  FROM membership_tiers
  WHERE creator_id = creator_user_id
  LIMIT 1;

  -- If creator found, insert supporters
  IF creator_user_id IS NOT NULL THEN
    FOR i IN 1..10 LOOP
      -- Create fake user account for demo
      INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data
      ) VALUES (
        supporter_ids[i],
        'demo' || i || '@example.com',
        crypt('demo_password', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"name":"' || supporter_names[i] || '"}'
      ) ON CONFLICT (id) DO NOTHING;

      -- Insert supporter record
      INSERT INTO supporters (
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
        is_public
      ) VALUES (
        supporter_ids[i],
        creator_user_id,
        tier_id,
        'monthly_membership',
        'active',
        (ARRAY[9900, 29900, 49900])[1 + floor(random() * 3)::int], -- Random tier price
        'INR',
        NOW() - (random() * 30 || ' days')::interval, -- Random start date in last 30 days
        NOW(),
        (ARRAY[9900, 29900, 49900])[1 + floor(random() * 3)::int],
        true
      );
    END LOOP;

    RAISE NOTICE 'Successfully added 10 demo supporters for creator: %', creator_user_id;
  ELSE
    RAISE EXCEPTION 'Creator not found. Please update the slug in the query.';
  END IF;
END $$;
