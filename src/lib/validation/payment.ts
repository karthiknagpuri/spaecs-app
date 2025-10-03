/**
 * Payment validation schemas using Zod
 * Provides runtime type validation and sanitization
 */

import { z } from 'zod';

/**
 * Schema for creating a payment order
 */
export const createPaymentSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount exceeds maximum limit')
    .finite('Amount must be a finite number'),

  currency: z.string()
    .length(3, 'Currency must be 3 letters')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase letters')
    .default('INR'),

  creator_id: z.string()
    .uuid('Invalid creator ID format')
    .or(z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid creator ID format')),

  is_monthly: z.boolean()
    .optional()
    .default(false),

  tier_id: z.string()
    .uuid('Invalid tier ID format')
    .optional(),

  message: z.string()
    .max(500, 'Message too long')
    .optional()
    .transform(str => str?.trim()),
}).strict();

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

/**
 * Schema for verifying a payment
 */
export const verifyPaymentSchema = z.object({
  payment_id: z.string()
    .uuid('Invalid payment ID format'),

  razorpay_payment_id: z.string()
    .min(1, 'Razorpay payment ID required')
    .max(100, 'Invalid Razorpay payment ID'),

  razorpay_order_id: z.string()
    .min(1, 'Razorpay order ID required')
    .max(100, 'Invalid Razorpay order ID'),

  razorpay_signature: z.string()
    .min(1, 'Signature required')
    .max(200, 'Invalid signature'),
}).strict();

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

/**
 * Schema for webhook payload
 */
export const webhookPayloadSchema = z.object({
  event: z.enum(['payment.success', 'payment.failed', 'payment.pending']),

  order_id: z.string()
    .min(1, 'Order ID required'),

  transaction_id: z.string()
    .min(1, 'Transaction ID required'),

  gateway_transaction_id: z.string()
    .min(1, 'Gateway transaction ID required'),

  amount: z.number()
    .positive('Amount must be positive'),

  currency: z.string()
    .length(3, 'Currency must be 3 letters'),

  status: z.enum(['pending', 'completed', 'failed', 'refunded']),

  payment_method: z.string()
    .min(1, 'Payment method required'),

  paid_at: z.string()
    .datetime('Invalid date format'),

  signature: z.string()
    .min(1, 'Signature required'),

  metadata: z.record(z.unknown())
    .optional(),
}).strict();

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

/**
 * Schema for initiating payment
 */
export const initiatePaymentSchema = z.object({
  creator_id: z.string()
    .min(1, 'Creator ID required'),

  support_type: z.enum(['one_time_tip', 'monthly_membership']),

  amount_inr: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount exceeds maximum limit')
    .int('Amount must be an integer'),

  membership_tier_id: z.string()
    .uuid('Invalid tier ID')
    .optional(),

  supporter_message: z.string()
    .max(500, 'Message too long')
    .optional()
    .transform(str => str?.trim()),

  is_public: z.boolean()
    .optional()
    .default(true),
}).strict();

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

/**
 * Schema for RPC increment_creator_earnings
 */
export const incrementEarningsSchema = z.object({
  creator_username: z.string()
    .min(1, 'Creator username required')
    .max(50, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid username format'),

  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount exceeds maximum'),
}).strict();

export type IncrementEarningsInput = z.infer<typeof incrementEarningsSchema>;

/**
 * Validation helper function
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }
    return {
      success: false,
      error: 'Validation failed',
    };
  }
}
