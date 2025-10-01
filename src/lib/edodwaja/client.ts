// Edodwaja.com Payment Gateway Client
// Handles payment redirection to spaecs.edodwaja.com subdomain

import {
  CreatePaymentRequest,
  PaymentRedirectResponse,
  TransactionStatus
} from '@/types/payment';

const EDODWAJA_BASE_URL = process.env.NEXT_PUBLIC_EDODWAJA_BASE_URL || 'https://spaecs.edodwaja.com';
const EDODWAJA_API_KEY = process.env.EDODWAJA_API_KEY || '';
const SPAECS_CALLBACK_URL = process.env.NEXT_PUBLIC_SPAECS_CALLBACK_URL || 'https://spaecs.app/api/payments/callback';

export interface EdodwajaPaymentOrder {
  order_id: string;
  amount: number; // In paise
  currency: string;
  merchant_id: string;
  customer_email: string;
  customer_name?: string;
  description: string;
  callback_url: string;
  cancel_url: string;
  metadata?: Record<string, any>;
}

export interface EdodwajaPaymentResponse {
  success: boolean;
  order_id: string;
  payment_url: string;
  transaction_id: string;
  expires_at: string;
  message?: string;
}

export interface EdodwajaWebhookPayload {
  event: 'payment.success' | 'payment.failed' | 'payment.pending';
  order_id: string;
  transaction_id: string;
  gateway_transaction_id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  payment_method: string;
  paid_at: string;
  signature: string;
  metadata?: Record<string, any>;
}

export interface EdodwajaVerifySignatureParams {
  order_id: string;
  transaction_id: string;
  gateway_transaction_id: string;
  signature: string;
  webhook_secret: string;
}

export class EdodwajaClient {
  private baseUrl: string;
  private apiKey: string;
  private callbackUrl: string;

  constructor(options?: {
    baseUrl?: string;
    apiKey?: string;
    callbackUrl?: string;
  }) {
    this.baseUrl = options?.baseUrl || EDODWAJA_BASE_URL;
    this.apiKey = options?.apiKey || EDODWAJA_API_KEY;
    this.callbackUrl = options?.callbackUrl || SPAECS_CALLBACK_URL;
  }

  /**
   * Create payment order and get redirect URL
   */
  async createPaymentOrder(
    request: CreatePaymentRequest,
    userEmail: string,
    userName?: string
  ): Promise<EdodwajaPaymentResponse> {
    try {
      const orderData: EdodwajaPaymentOrder = {
        order_id: `SPAECS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: request.amount_inr,
        currency: 'INR',
        merchant_id: this.getMerchantId(request.creator_id),
        customer_email: userEmail,
        customer_name: userName,
        description: this.getPaymentDescription(request),
        callback_url: this.callbackUrl,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/support/cancelled`,
        metadata: {
          creator_id: request.creator_id,
          support_type: request.support_type,
          membership_tier_id: request.membership_tier_id,
          supporter_message: request.supporter_message,
          is_public: request.is_public,
        },
      };

      const response = await fetch(`${this.baseUrl}/api/v1/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Version': '1.0',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment order');
      }

      const data: EdodwajaPaymentResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Payment order creation failed');
      }

      return data;
    } catch (error) {
      console.error('Edodwaja payment order creation error:', error);
      throw error;
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(orderId: string, transactionId: string): Promise<{
    status: TransactionStatus;
    gateway_transaction_id: string;
    payment_method: string;
    paid_at: string;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/payments/verify/${orderId}/${transactionId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-API-Version': '1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Edodwaja payment verification error:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(params: EdodwajaVerifySignatureParams): boolean {
    try {
      const crypto = require('crypto');

      const data = `${params.order_id}|${params.transaction_id}|${params.gateway_transaction_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', params.webhook_secret)
        .update(data)
        .digest('hex');

      return expectedSignature === params.signature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Get refund for a transaction
   */
  async refundPayment(
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<{
    success: boolean;
    refund_id: string;
    amount: number;
    status: string;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/payments/refund/${transactionId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'X-API-Version': '1.0',
          },
          body: JSON.stringify({
            amount, // Optional - full refund if not provided
            reason,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to process refund');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Edodwaja refund error:', error);
      throw error;
    }
  }

  /**
   * Get payment redirect URL
   */
  getPaymentRedirectUrl(orderId: string, transactionId: string): string {
    return `${this.baseUrl}/pay/${orderId}?transaction=${transactionId}`;
  }

  /**
   * Helper: Get merchant ID for creator
   * In production, this should fetch from creator_payment_settings table
   */
  private getMerchantId(creatorId: string): string {
    // TODO: Fetch from database
    return process.env.EDODWAJA_MERCHANT_ID || 'default_merchant';
  }

  /**
   * Helper: Generate payment description
   */
  private getPaymentDescription(request: CreatePaymentRequest): string {
    if (request.support_type === 'one_time_tip') {
      return 'One-time tip to creator';
    } else if (request.support_type === 'monthly_membership') {
      return 'Monthly membership subscription';
    }
    return 'Creator support';
  }
}

// Export singleton instance
export const edodwajaClient = new EdodwajaClient();

// Export helper functions

/**
 * Initialize payment flow
 */
export async function initiatePayment(
  request: CreatePaymentRequest,
  userEmail: string,
  userName?: string
): Promise<PaymentRedirectResponse> {
  const response = await edodwajaClient.createPaymentOrder(request, userEmail, userName);

  return {
    redirect_url: response.payment_url,
    order_id: response.order_id,
    transaction_id: response.transaction_id,
  };
}

/**
 * Verify payment callback
 */
export async function verifyPaymentCallback(
  orderId: string,
  transactionId: string
): Promise<{
  status: TransactionStatus;
  gateway_transaction_id: string;
  payment_method: string;
  paid_at: string;
}> {
  return await edodwajaClient.verifyPayment(orderId, transactionId);
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: EdodwajaWebhookPayload,
  webhookSecret: string
): boolean {
  return edodwajaClient.verifyWebhookSignature({
    order_id: payload.order_id,
    transaction_id: payload.transaction_id,
    gateway_transaction_id: payload.gateway_transaction_id,
    signature: payload.signature,
    webhook_secret: webhookSecret,
  });
}

/**
 * Process refund
 */
export async function processRefund(
  transactionId: string,
  amount?: number,
  reason?: string
): Promise<{
  success: boolean;
  refund_id: string;
  amount: number;
  status: string;
}> {
  return await edodwajaClient.refundPayment(transactionId, amount, reason);
}
