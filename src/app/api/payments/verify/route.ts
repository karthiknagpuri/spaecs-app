import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { rateLimit, getIdentifier, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { verifyCSRF } from "@/lib/middleware/csrf";

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify CSRF token
    if (!verifyCSRF(request)) {
      return NextResponse.json(
        { error: "CSRF validation failed" },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // SECURITY: Apply rate limiting
    const identifier = getIdentifier(request, user.id);
    const rateLimitResult = rateLimit(identifier, RATE_LIMITS.payment);

    if (!rateLimitResult.success) {
      const resetDate = new Date(rateLimitResult.resetTime);
      return NextResponse.json(
        {
          error: "Too many requests",
          resetTime: resetDate.toISOString(),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": RATE_LIMITS.payment.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetDate.toISOString(),
          },
        }
      );
    }

    const body = await request.json();

    // SECURITY: Validate input
    const { verifyPaymentSchema, validateInput } = await import("@/lib/validation/payment");
    const validation = validateInput(verifyPaymentSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const {
      payment_id,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = validation.data;

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

    // SECURITY: Validate and sanitize RPC input
    const { incrementEarningsSchema, validateInput: validateRpc } = await import("@/lib/validation/payment");
    const rpcValidation = validateRpc(incrementEarningsSchema, {
      creator_username: payment.creator_id,
      amount: payment.amount,
    });

    if (rpcValidation.success) {
      await supabase.rpc("increment_creator_earnings", rpcValidation.data);
    } else {
      console.error("RPC validation failed:", rpcValidation.error);
    }

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}