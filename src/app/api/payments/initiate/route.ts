// Payment initiation route - Create supporter and transaction records
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initiatePayment } from "@/lib/edodwaja/client";
import {
  CreatePaymentRequest,
  InsertSupporter,
  InsertTransaction,
  calculatePlatformFee,
  calculateNetAmount,
} from "@/types/payment";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const paymentRequest: CreatePaymentRequest = await request.json();

    // Validate request
    if (!paymentRequest.creator_id || !paymentRequest.amount_inr || paymentRequest.amount_inr < 1000) {
      return NextResponse.json(
        { error: "Invalid payment request. Minimum amount is ₹10" },
        { status: 400 }
      );
    }

    // Get creator payment settings
    const { data: settings } = await supabase
      .from("creator_payment_settings")
      .select("accept_tips, accept_memberships, platform_fee_percentage")
      .eq("creator_id", paymentRequest.creator_id)
      .single();

    if (!settings) {
      return NextResponse.json(
        { error: "Creator payment settings not found" },
        { status: 404 }
      );
    }

    // Check if creator accepts this payment type
    if (paymentRequest.support_type === "one_time_tip" && !settings.accept_tips) {
      return NextResponse.json(
        { error: "Creator doesn't accept tips" },
        { status: 400 }
      );
    }

    if (paymentRequest.support_type === "monthly_membership" && !settings.accept_memberships) {
      return NextResponse.json(
        { error: "Creator doesn't accept memberships" },
        { status: 400 }
      );
    }

    // Check for existing supporter record
    let supporterId: string | null = null;
    const { data: existingSupporter } = await supabase
      .from("supporters")
      .select("id")
      .eq("supporter_id", user.id)
      .eq("creator_id", paymentRequest.creator_id)
      .eq("membership_tier_id", paymentRequest.membership_tier_id || null)
      .single();

    if (existingSupporter) {
      supporterId = existingSupporter.id;
    } else {
      // Create new supporter record
      const supporterData: InsertSupporter = {
        supporter_id: user.id,
        creator_id: paymentRequest.creator_id,
        membership_tier_id: paymentRequest.membership_tier_id,
        support_type: paymentRequest.support_type,
        status: "pending",
        amount_inr: paymentRequest.amount_inr,
        supporter_message: paymentRequest.supporter_message,
        is_public: paymentRequest.is_public ?? true,
      };

      const { data: newSupporter, error: supporterError } = await supabase
        .from("supporters")
        .insert(supporterData)
        .select()
        .single();

      if (supporterError) {
        console.error("Error creating supporter:", supporterError);
        return NextResponse.json(
          { error: "Failed to create supporter record" },
          { status: 500 }
        );
      }

      supporterId = newSupporter.id;
    }

    // Calculate fees
    const platformFee = calculatePlatformFee(
      paymentRequest.amount_inr,
      settings.platform_fee_percentage
    );
    const netAmount = calculateNetAmount(paymentRequest.amount_inr, platformFee);

    // Create transaction record
    const transactionData: InsertTransaction = {
      supporter_id: supporterId,
      creator_id: paymentRequest.creator_id,
      payer_id: user.id,
      transaction_type:
        paymentRequest.support_type === "one_time_tip"
          ? "tip"
          : "membership_initial",
      amount_inr: paymentRequest.amount_inr,
      platform_fee: platformFee,
      net_amount: netAmount,
      status: "pending",
      payment_gateway: "edodwaja",
      metadata: {
        supporter_message: paymentRequest.supporter_message,
        is_public: paymentRequest.is_public,
      },
    };

    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      return NextResponse.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      );
    }

    // Initiate payment with edodwaja.com
    try {
      const paymentResponse = await initiatePayment(
        paymentRequest,
        user.email!,
        user.user_metadata?.name || user.email!.split("@")[0]
      );

      // Update transaction with order ID
      await supabase
        .from("transactions")
        .update({
          gateway_order_id: paymentResponse.order_id,
        })
        .eq("id", transaction.id);

      return NextResponse.json({
        success: true,
        redirect_url: paymentResponse.redirect_url,
        transaction_id: transaction.id,
        order_id: paymentResponse.order_id,
      });
    } catch (paymentError) {
      console.error("Payment initiation error:", paymentError);

      // Update transaction status to failed
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          error_message: paymentError instanceof Error ? paymentError.message : "Payment initiation failed",
        })
        .eq("id", transaction.id);

      return NextResponse.json(
        { error: "Failed to initiate payment" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
