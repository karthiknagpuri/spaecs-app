import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

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
    const {
      payment_id,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = body;

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Update payment status
    const { data: payment, error } = await supabase
      .from("payments")
      .update({
        status: "completed",
        razorpay_payment_id,
        razorpay_signature,
      })
      .eq("id", payment_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // If it's a monthly payment, create/update supporter record
    if (payment.is_monthly && payment.tier_id) {
      // Get creator profile
      const { data: creator } = await supabase
        .from("creator_profiles")
        .select("id")
        .eq("username", payment.creator_id)
        .single();

      if (creator) {
        await supabase.from("supporters").upsert({
          user_id: user.id,
          creator_id: creator.id,
          tier_id: payment.tier_id,
          amount: payment.amount,
          status: "active",
        });
      }
    }

    // Update creator's total earnings
    await supabase.rpc("increment_creator_earnings", {
      creator_username: payment.creator_id,
      amount: payment.amount,
    });

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}