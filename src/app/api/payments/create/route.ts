import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpay } from "@/lib/razorpay/client";
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
    const { createPaymentSchema, validateInput } = await import("@/lib/validation/payment");
    const validation = validateInput(createPaymentSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { amount, currency, creator_id, is_monthly, tier_id, message } = validation.data;

    // Create Razorpay order
    const razorpay = getRazorpay();
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