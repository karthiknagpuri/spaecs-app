import { getRazorpay } from './client';

// Razorpay Route (X) for marketplace transfers and creator payouts

export interface CreateAccountParams {
  creatorId: string;
  email: string;
  phone: string;
  type?: 'route' | 'standard';
  businessName?: string;
  businessType?: string;
}

export async function createLinkedAccount({
  creatorId,
  email,
  phone,
  type = 'route',
  businessName = 'Individual Creator',
  businessType = 'individual'
}: CreateAccountParams) {
  try {
    const razorpay = getRazorpay();
    // Create a linked account for the creator
    const account = await razorpay.accounts.create({
      email,
      phone,
      type,
      business_type: businessType,
      business_name: businessName,
      notes: {
        creatorId
      }
    });

    return {
      success: true,
      accountId: account.id,
      status: account.status
    };
  } catch (error: any) {
    console.error('Failed to create linked account:', error);
    return {
      success: false,
      error: error.message || 'Failed to create account'
    };
  }
}

export interface TransferParams {
  paymentId: string;
  accountId: string;
  amount: number;
  currency?: string;
}

export async function transferToCreator({
  paymentId,
  accountId,
  amount,
  currency = 'INR'
}: TransferParams) {
  try {
    const razorpay = getRazorpay();
    // Create a transfer to the linked account
    const transfer = await razorpay.transfers.create({
      account: accountId,
      amount: amount * 100, // Amount in paise
      currency,
      notes: {
        payment_id: paymentId
      },
      on_hold: false
    });

    return {
      success: true,
      transferId: transfer.id,
      amount: transfer.amount,
      status: transfer.status
    };
  } catch (error: any) {
    console.error('Transfer failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to transfer funds'
    };
  }
}

export async function getAccountBalance(accountId: string) {
  try {
    const razorpay = getRazorpay();
    const balance = await razorpay.accounts.fetch(accountId);

    return {
      success: true,
      balance: balance.balance,
      status: balance.status
    };
  } catch (error: any) {
    console.error('Failed to fetch balance:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch balance'
    };
  }
}

export async function createPayout(accountId: string, amount: number) {
  try {
    const razorpay = getRazorpay();
    const payout = await razorpay.payouts.create({
      account_number: accountId,
      amount: amount * 100,
      currency: 'INR',
      mode: 'IMPS', // IMPS, NEFT, RTGS, UPI
      purpose: 'payout',
      queue_if_low_balance: true,
      notes: {
        type: 'creator_payout'
      }
    });

    return {
      success: true,
      payoutId: payout.id,
      status: payout.status
    };
  } catch (error: any) {
    console.error('Payout failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to create payout'
    };
  }
}