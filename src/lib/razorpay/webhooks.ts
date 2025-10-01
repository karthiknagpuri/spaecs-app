import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function validateWebhookSignature(
  body: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

export async function handleWebhookEvent(event: any) {
  const supabase = await createClient();

  switch (event.event) {
    case 'payment.captured':
      await handlePaymentCaptured(event.payload.payment.entity, supabase);
      break;

    case 'payment.failed':
      await handlePaymentFailed(event.payload.payment.entity, supabase);
      break;

    case 'subscription.activated':
      await handleSubscriptionActivated(event.payload.subscription.entity, supabase);
      break;

    case 'subscription.cancelled':
      await handleSubscriptionCancelled(event.payload.subscription.entity, supabase);
      break;

    case 'refund.processed':
      await handleRefundProcessed(event.payload.refund.entity, supabase);
      break;

    default:
      console.log(`Unhandled event type: ${event.event}`);
  }
}

async function handlePaymentCaptured(payment: any, supabase: any) {
  const { notes } = payment;

  // Update payment record
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      razorpay_payment_id: payment.id,
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_order_id', payment.order_id);

  if (error) {
    console.error('Failed to update payment:', error);
    return;
  }

  // Create notification for creator
  await supabase
    .from('notifications')
    .insert({
      user_id: notes.creatorId,
      type: 'payment',
      title: 'New Payment Received!',
      message: `You received a payment of ₹${payment.amount / 100}`,
      data: { paymentId: payment.id, amount: payment.amount }
    });

  // Update analytics
  const today = new Date().toISOString().split('T')[0];
  await supabase.rpc('increment_analytics', {
    creator_id: notes.creatorId,
    date: today,
    revenue: payment.amount / 100
  });
}

async function handlePaymentFailed(payment: any, supabase: any) {
  // Update payment record
  await supabase
    .from('payments')
    .update({
      status: 'failed',
      razorpay_payment_id: payment.id,
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_order_id', payment.order_id);

  // Notify user about failed payment
  const { notes } = payment;
  await supabase
    .from('notifications')
    .insert({
      user_id: notes.userId,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: 'Your payment could not be processed. Please try again.',
      data: { paymentId: payment.id, reason: payment.error_description }
    });
}

async function handleSubscriptionActivated(subscription: any, supabase: any) {
  const { notes } = subscription;

  // Create or update membership
  await supabase
    .from('memberships')
    .upsert({
      user_id: notes.userId,
      creator_id: notes.creatorId,
      community_id: notes.communityId,
      tier: subscription.plan_id,
      status: 'active',
      expires_at: new Date(subscription.current_end * 1000).toISOString()
    });

  // Notify creator
  await supabase
    .from('notifications')
    .insert({
      user_id: notes.creatorId,
      type: 'new_subscriber',
      title: 'New Subscriber!',
      message: 'You have a new subscriber to your community',
      data: { subscriptionId: subscription.id }
    });
}

async function handleSubscriptionCancelled(subscription: any, supabase: any) {
  const { notes } = subscription;

  // Update membership status
  await supabase
    .from('memberships')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .match({
      user_id: notes.userId,
      creator_id: notes.creatorId
    });

  // Notify creator
  await supabase
    .from('notifications')
    .insert({
      user_id: notes.creatorId,
      type: 'subscription_cancelled',
      title: 'Subscription Cancelled',
      message: 'A subscriber has cancelled their subscription',
      data: { subscriptionId: subscription.id }
    });
}

async function handleRefundProcessed(refund: any, supabase: any) {
  // Update payment status
  await supabase
    .from('payments')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString()
    })
    .eq('razorpay_payment_id', refund.payment_id);

  // Notify both parties
  const payment = await supabase
    .from('payments')
    .select('from_user_id, to_creator_id')
    .eq('razorpay_payment_id', refund.payment_id)
    .single();

  if (payment.data) {
    // Notify user
    await supabase
      .from('notifications')
      .insert({
        user_id: payment.data.from_user_id,
        type: 'refund',
        title: 'Refund Processed',
        message: `Your refund of ₹${refund.amount / 100} has been processed`,
        data: { refundId: refund.id }
      });

    // Notify creator
    await supabase
      .from('notifications')
      .insert({
        user_id: payment.data.to_creator_id,
        type: 'refund',
        title: 'Payment Refunded',
        message: `A payment of ₹${refund.amount / 100} has been refunded`,
        data: { refundId: refund.id }
      });
  }
}