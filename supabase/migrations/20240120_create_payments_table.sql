-- Create payments table for tracking creator support payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  creator_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  is_monthly BOOLEAN DEFAULT false,
  tier_id TEXT,
  message TEXT,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_creator_id ON payments(creator_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Create creator_profiles table for storing creator information
CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_image TEXT,
  is_verified BOOLEAN DEFAULT false,
  social_links JSONB DEFAULT '{}',
  support_tiers JSONB DEFAULT '[]',
  stripe_account_id TEXT,
  razorpay_account_id TEXT,
  total_supporters INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for username lookup
CREATE INDEX idx_creator_profiles_username ON creator_profiles(username);

-- Create supporters table for tracking monthly supporters
CREATE TABLE IF NOT EXISTS supporters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE NOT NULL,
  tier_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, creator_id)
);

-- Create indexes for supporters
CREATE INDEX idx_supporters_user_id ON supporters(user_id);
CREATE INDEX idx_supporters_creator_id ON supporters(creator_id);
CREATE INDEX idx_supporters_status ON supporters(status);

-- Enable Row Level Security (RLS)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supporters ENABLE ROW LEVEL SECURITY;

-- Policies for payments table
CREATE POLICY "Users can view their own payments"
  ON payments
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create payments"
  ON payments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Creators can view payments made to them"
  ON payments
  FOR SELECT
  USING (
    creator_id IN (
      SELECT username FROM creator_profiles WHERE user_id = auth.uid()
    )
  );

-- Policies for creator_profiles table
CREATE POLICY "Public profiles are viewable by everyone"
  ON creator_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON creator_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON creator_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own profile"
  ON creator_profiles
  FOR DELETE
  USING (user_id = auth.uid());

-- Policies for supporters table
CREATE POLICY "Users can view their own subscriptions"
  ON supporters
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Creators can view their supporters"
  ON supporters
  FOR SELECT
  USING (creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their subscriptions"
  ON supporters
  FOR ALL
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON creator_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supporters_updated_at BEFORE UPDATE ON supporters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();