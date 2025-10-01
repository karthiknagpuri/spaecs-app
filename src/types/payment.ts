// TypeScript types for payment system database tables

export type SupportType = 'one_time_tip' | 'monthly_membership';
export type SupporterStatus = 'active' | 'cancelled' | 'expired' | 'paused';
export type TransactionType = 'tip' | 'membership_initial' | 'membership_renewal' | 'refund';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentGateway = 'edodwaja';
export type PayoutSchedule = 'daily' | 'weekly' | 'biweekly' | 'monthly';

// Membership Tier
export interface MembershipTier {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  price_inr: number; // Price in paise (₹1 = 100 paise)
  currency: string;
  benefits: string[]; // Array of benefit strings
  is_active: boolean;
  tier_level: number; // 1, 2, 3, etc. for ordering
  max_supporters: number | null;
  custom_message: string | null;
  created_at: string;
  updated_at: string;
}

// Insert type for creating new tier
export interface InsertMembershipTier {
  creator_id: string;
  name: string;
  description?: string;
  price_inr: number;
  currency?: string;
  benefits?: string[];
  is_active?: boolean;
  tier_level: number;
  max_supporters?: number;
  custom_message?: string;
}

// Update type for editing tier
export interface UpdateMembershipTier {
  name?: string;
  description?: string | null;
  price_inr?: number;
  benefits?: string[];
  is_active?: boolean;
  tier_level?: number;
  max_supporters?: number | null;
  custom_message?: string | null;
}

// Supporter
export interface Supporter {
  id: string;
  supporter_id: string;
  creator_id: string;
  membership_tier_id: string | null;
  support_type: SupportType;
  status: SupporterStatus;
  amount_inr: number; // Amount in paise
  currency: string;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  last_payment_at: string | null;
  next_billing_date: string | null;
  total_contributed: number; // Lifetime contribution in paise
  supporter_message: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Insert type for creating new supporter
export interface InsertSupporter {
  supporter_id: string;
  creator_id: string;
  membership_tier_id?: string;
  support_type: SupportType;
  status?: SupporterStatus;
  amount_inr: number;
  currency?: string;
  started_at?: string;
  expires_at?: string;
  supporter_message?: string;
  is_public?: boolean;
}

// Update type for editing supporter
export interface UpdateSupporter {
  status?: SupporterStatus;
  expires_at?: string | null;
  cancelled_at?: string | null;
  last_payment_at?: string | null;
  next_billing_date?: string | null;
  total_contributed?: number;
  supporter_message?: string | null;
  is_public?: boolean;
}

// Transaction
export interface Transaction {
  id: string;
  supporter_id: string;
  creator_id: string;
  payer_id: string;
  transaction_type: TransactionType;
  amount_inr: number; // Amount in paise
  platform_fee: number; // Platform fee in paise
  net_amount: number; // Amount after fees in paise
  currency: string;
  status: TransactionStatus;
  payment_gateway: PaymentGateway;
  gateway_transaction_id: string | null;
  gateway_order_id: string | null;
  gateway_response: Record<string, any> | null;
  payment_method: string | null;
  error_code: string | null;
  error_message: string | null;
  metadata: Record<string, any>;
  initiated_at: string;
  completed_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

// Insert type for creating new transaction
export interface InsertTransaction {
  supporter_id: string;
  creator_id: string;
  payer_id: string;
  transaction_type: TransactionType;
  amount_inr: number;
  platform_fee?: number;
  net_amount: number;
  currency?: string;
  status?: TransactionStatus;
  payment_gateway?: PaymentGateway;
  gateway_transaction_id?: string;
  gateway_order_id?: string;
  gateway_response?: Record<string, any>;
  payment_method?: string;
  metadata?: Record<string, any>;
  initiated_at?: string;
}

// Update type for editing transaction
export interface UpdateTransaction {
  status?: TransactionStatus;
  gateway_transaction_id?: string;
  gateway_order_id?: string;
  gateway_response?: Record<string, any>;
  payment_method?: string;
  error_code?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  completed_at?: string;
  refunded_at?: string;
}

// Creator Payment Settings
export interface CreatorPaymentSettings {
  id: string;
  creator_id: string;
  edodwaja_merchant_id: string | null;
  edodwaja_api_key_encrypted: string | null;
  edodwaja_webhook_secret: string | null;
  platform_fee_percentage: number;
  min_payout_amount: number; // In paise
  auto_payout_enabled: boolean;
  payout_schedule: PayoutSchedule;
  bank_account_number: string | null;
  bank_ifsc_code: string | null;
  bank_account_holder_name: string | null;
  upi_id: string | null;
  pan_number: string | null;
  gstin: string | null;
  accept_tips: boolean;
  accept_memberships: boolean;
  custom_tip_amounts: number[]; // Array of amounts in paise
  thank_you_message: string;
  is_verified: boolean;
  verification_documents: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// Insert type for creating new payment settings
export interface InsertCreatorPaymentSettings {
  creator_id: string;
  edodwaja_merchant_id?: string;
  edodwaja_api_key_encrypted?: string;
  edodwaja_webhook_secret?: string;
  platform_fee_percentage?: number;
  min_payout_amount?: number;
  auto_payout_enabled?: boolean;
  payout_schedule?: PayoutSchedule;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_account_holder_name?: string;
  upi_id?: string;
  pan_number?: string;
  gstin?: string;
  accept_tips?: boolean;
  accept_memberships?: boolean;
  custom_tip_amounts?: number[];
  thank_you_message?: string;
}

// Update type for editing payment settings
export interface UpdateCreatorPaymentSettings {
  edodwaja_merchant_id?: string | null;
  edodwaja_api_key_encrypted?: string | null;
  edodwaja_webhook_secret?: string | null;
  platform_fee_percentage?: number;
  min_payout_amount?: number;
  auto_payout_enabled?: boolean;
  payout_schedule?: PayoutSchedule;
  bank_account_number?: string | null;
  bank_ifsc_code?: string | null;
  bank_account_holder_name?: string | null;
  upi_id?: string | null;
  pan_number?: string | null;
  gstin?: string | null;
  accept_tips?: boolean;
  accept_memberships?: boolean;
  custom_tip_amounts?: number[];
  thank_you_message?: string;
  is_verified?: boolean;
  verification_documents?: Record<string, any> | null;
}

// Helper types for UI and business logic

export interface MembershipTierWithStats extends MembershipTier {
  supporter_count: number;
  monthly_revenue: number; // In paise
}

export interface SupporterWithDetails extends Supporter {
  supporter_email: string;
  supporter_name: string;
  tier_name: string | null;
}

export interface TransactionWithDetails extends Transaction {
  payer_email: string;
  payer_name: string;
  creator_email: string;
  creator_name: string;
}

// Payment request types for frontend

export interface CreatePaymentRequest {
  creator_id: string;
  support_type: SupportType;
  amount_inr: number; // In paise
  membership_tier_id?: string;
  supporter_message?: string;
  is_public?: boolean;
}

export interface PaymentRedirectResponse {
  redirect_url: string;
  order_id: string;
  transaction_id: string;
}

export interface PaymentCallbackData {
  order_id: string;
  transaction_id: string;
  gateway_transaction_id: string;
  status: TransactionStatus;
  signature: string;
}

// Utility functions for price formatting

export const formatPaiseToINR = (paise: number): string => {
  return `₹${(paise / 100).toFixed(2)}`;
};

export const formatINRToPaise = (rupees: number): number => {
  return Math.round(rupees * 100);
};

export const calculatePlatformFee = (amount: number, feePercentage: number): number => {
  return Math.round((amount * feePercentage) / 100);
};

export const calculateNetAmount = (amount: number, platformFee: number): number => {
  return amount - platformFee;
};
