-- Migration: Create Payment System for Patreon-style Creator Memberships
-- Description: Tables for membership tiers, supporters, transactions, and payment settings

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Membership Tiers Table
-- Stores creator-defined subscription tiers (like Patreon tiers)
CREATE TABLE IF NOT EXISTS membership_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_inr INTEGER NOT NULL CHECK (price_inr >= 0), -- Price in paise (₹1 = 100 paise)
  currency TEXT DEFAULT 'INR',
  benefits JSONB DEFAULT '[]', -- Array of benefits as JSON
  is_active BOOLEAN DEFAULT true,
  tier_level INTEGER NOT NULL CHECK (tier_level > 0), -- 1, 2, 3, etc. for ordering
  max_supporters INTEGER, -- Optional limit on supporters
  custom_message TEXT, -- Thank you message for supporters
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, tier_level)
);

-- Supporters Table
-- Tracks fans who support creators through tips or memberships
CREATE TABLE IF NOT EXISTS supporters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_tier_id UUID REFERENCES membership_tiers(id) ON DELETE SET NULL,
  support_type TEXT NOT NULL CHECK (support_type IN ('one_time_tip', 'monthly_membership')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  amount_inr INTEGER NOT NULL CHECK (amount_inr > 0), -- Amount in paise
  currency TEXT DEFAULT 'INR',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For monthly memberships
  cancelled_at TIMESTAMPTZ,
  last_payment_at TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ, -- For recurring memberships
  total_contributed INTEGER DEFAULT 0 CHECK (total_contributed >= 0), -- Lifetime contribution in paise
  supporter_message TEXT, -- Optional message from supporter
  is_public BOOLEAN DEFAULT true, -- Show on public supporter list
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supporter_id, creator_id, membership_tier_id)
);

-- Transactions Table
-- Complete payment transaction history
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supporter_id UUID NOT NULL REFERENCES supporters(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('tip', 'membership_initial', 'membership_renewal', 'refund')),
  amount_inr INTEGER NOT NULL CHECK (amount_inr > 0), -- Amount in paise
  platform_fee INTEGER NOT NULL DEFAULT 0 CHECK (platform_fee >= 0), -- Platform fee in paise
  net_amount INTEGER NOT NULL CHECK (net_amount >= 0), -- Amount after fees in paise
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_gateway TEXT NOT NULL DEFAULT 'edodwaja',
  gateway_transaction_id TEXT, -- External transaction ID from edodwaja.com
  gateway_order_id TEXT, -- External order ID from edodwaja.com
  gateway_response JSONB, -- Full response from payment gateway
  payment_method TEXT, -- upi, card, netbanking, etc.
  error_code TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}', -- Additional payment metadata
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator Payment Settings Table
-- Stores edodwaja.com API configuration and payout settings
CREATE TABLE IF NOT EXISTS creator_payment_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  edodwaja_merchant_id TEXT, -- Merchant ID for edodwaja.com
  edodwaja_api_key_encrypted TEXT, -- Encrypted API key
  edodwaja_webhook_secret TEXT, -- Webhook signature verification
  platform_fee_percentage DECIMAL(5,2) DEFAULT 5.00 CHECK (platform_fee_percentage >= 0 AND platform_fee_percentage <= 100),
  min_payout_amount INTEGER DEFAULT 100000 CHECK (min_payout_amount >= 0), -- Minimum ₹1000 for payout
  auto_payout_enabled BOOLEAN DEFAULT false,
  payout_schedule TEXT DEFAULT 'weekly' CHECK (payout_schedule IN ('daily', 'weekly', 'biweekly', 'monthly')),
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  bank_account_holder_name TEXT,
  upi_id TEXT,
  pan_number TEXT,
  gstin TEXT, -- GST number if applicable
  accept_tips BOOLEAN DEFAULT true,
  accept_memberships BOOLEAN DEFAULT true,
  custom_tip_amounts JSONB DEFAULT '[10000, 30000, 50000, 100000]', -- Default tip amounts in paise
  thank_you_message TEXT DEFAULT 'Thank you for your support! 🙏',
  is_verified BOOLEAN DEFAULT false, -- KYC verification status
  verification_documents JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_membership_tiers_creator ON membership_tiers(creator_id) WHERE is_active = true;
CREATE INDEX idx_supporters_creator ON supporters(creator_id) WHERE status = 'active';
CREATE INDEX idx_supporters_supporter ON supporters(supporter_id);
CREATE INDEX idx_supporters_tier ON supporters(membership_tier_id) WHERE status = 'active';
CREATE INDEX idx_transactions_creator ON transactions(creator_id);
CREATE INDEX idx_transactions_payer ON transactions(payer_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_gateway_order ON transactions(gateway_order_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_payment_settings ENABLE ROW LEVEL SECURITY;

-- Membership Tiers Policies
-- Anyone can view active tiers for any creator
CREATE POLICY "Anyone can view active membership tiers"
  ON membership_tiers FOR SELECT
  USING (is_active = true);

-- Creators can manage their own tiers
CREATE POLICY "Creators can manage their own membership tiers"
  ON membership_tiers FOR ALL
  USING (auth.uid() = creator_id);

-- Supporters Policies
-- Supporters can view their own support records
CREATE POLICY "Supporters can view their own support records"
  ON supporters FOR SELECT
  USING (auth.uid() = supporter_id);

-- Creators can view their supporters
CREATE POLICY "Creators can view their supporters"
  ON supporters FOR SELECT
  USING (auth.uid() = creator_id);

-- Anyone can view public supporters
CREATE POLICY "Anyone can view public supporters"
  ON supporters FOR SELECT
  USING (is_public = true);

-- Supporters can update their own records (cancel, change visibility)
CREATE POLICY "Supporters can update their own support records"
  ON supporters FOR UPDATE
  USING (auth.uid() = supporter_id);

-- Transactions Policies
-- Users can view their own transactions (as payer)
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = payer_id);

-- Creators can view transactions for their supporters
CREATE POLICY "Creators can view their transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = creator_id);

-- System can insert transactions (will be handled by server-side functions)
CREATE POLICY "Authenticated users can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = payer_id);

-- Creator Payment Settings Policies
-- Creators can view and manage only their own settings
CREATE POLICY "Creators can manage their own payment settings"
  ON creator_payment_settings FOR ALL
  USING (auth.uid() = creator_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_membership_tiers_updated_at
  BEFORE UPDATE ON membership_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supporters_updated_at
  BEFORE UPDATE ON supporters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_payment_settings_updated_at
  BEFORE UPDATE ON creator_payment_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire memberships
CREATE OR REPLACE FUNCTION check_membership_expiry()
RETURNS void AS $$
BEGIN
  UPDATE supporters
  SET status = 'expired'
  WHERE status = 'active'
    AND support_type = 'monthly_membership'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate next billing date (30 days)
CREATE OR REPLACE FUNCTION calculate_next_billing_date(start_date TIMESTAMPTZ)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN start_date + INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE membership_tiers IS 'Creator-defined subscription tiers similar to Patreon';
COMMENT ON TABLE supporters IS 'Tracks fan support relationships (tips and memberships)';
COMMENT ON TABLE transactions IS 'Complete payment transaction history with edodwaja.com gateway';
COMMENT ON TABLE creator_payment_settings IS 'Creator payment configuration and edodwaja.com API settings';
COMMENT ON COLUMN membership_tiers.price_inr IS 'Price in paise (₹1 = 100 paise)';
COMMENT ON COLUMN supporters.total_contributed IS 'Lifetime contribution amount in paise';
COMMENT ON COLUMN transactions.platform_fee IS 'Platform fee deducted in paise';
COMMENT ON COLUMN transactions.gateway_transaction_id IS 'External transaction ID from edodwaja.com payment gateway';
