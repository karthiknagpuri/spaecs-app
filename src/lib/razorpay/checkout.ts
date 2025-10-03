import { getRazorpay } from './client';

export interface CheckoutParams {
  creatorId: string;
  userId: string;
  type: 'gift' | 'subscription' | 'tip' | 'membership';
  amount: number;
  tier?: string;
  currency?: string;
}

export async function createPaymentOrder({
  creatorId,
  userId,
  type,
  amount,
  tier,
  currency = 'INR'
}: CheckoutParams) {
  try {
    const razorpay = getRazorpay();
    // Create order for one-time payments
    if (type !== 'subscription') {
      const order = await razorpay.orders.create({
        amount: amount * 100, // Amount in paise
        currency,
        receipt: `${type}_${Date.now()}`,
        notes: {
          creatorId,
          userId,
          type,
          tier: tier || 'one-time'
        },
        payment_capture: 1
      });

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        type: 'order'
      };
    }

    // Create subscription for recurring payments
    const subscription = await razorpay.subscriptions.create({
      plan_id: tier!, // Plan ID from Razorpay dashboard
      customer_notify: 1,
      quantity: 1,
      total_count: 12, // 12 months by default
      notes: {
        creatorId,
        userId,
        type: 'subscription'
      }
    });

    return {
      success: true,
      subscriptionId: subscription.id,
      planId: subscription.plan_id,
      type: 'subscription'
    };
  } catch (error: any) {
    console.error('Razorpay order creation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to create payment order'
    };
  }
}

export async function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string
) {
  try {
    const crypto = require('crypto');
    const secret = process.env.RAZORPAY_KEY_SECRET!;

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature === signature) {
      return { success: true, verified: true };
    }

    return { success: false, verified: false };
  } catch (error: any) {
    console.error('Payment verification failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify payment'
    };
  }
}

export async function capturePayment(paymentId: string, amount: number) {
  try {
    const payment = await razorpay.payments.capture(paymentId, amount);
    return {
      success: true,
      payment
    };
  } catch (error: any) {
    console.error('Payment capture failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to capture payment'
    };
  }
}

export async function refundPayment(paymentId: string, amount?: number) {
  try {
    const refund = await razorpay.refunds.create({
      payment_id: paymentId,
      amount: amount ? amount * 100 : undefined // Partial refund if amount provided
    });
    return {
      success: true,
      refund
    };
  } catch (error: any) {
    console.error('Refund failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to process refund'
    };
  }
}