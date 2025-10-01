import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, currency = "INR", creator_id, is_monthly, tier_id, message } = body;

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // Amount in paise
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes: {
        user_id: user.id,
        creator_id,
        is_monthly: is_monthly.toString(),
        tier_id: tier_id || "",
      },
    });

    // Store payment record in database
    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        creator_id,
        amount,
        currency,
        status: "pending",
        is_monthly,
        tier_id,
        message,
        razorpay_order_id: razorpayOrder.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      payment_id: payment.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}