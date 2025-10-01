// Payment callback route - Handle redirects from edodwaja.com
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyPaymentCallback } from "@/lib/edodwaja/client";
import { UpdateTransaction, UpdateSupporter } from "@/types/payment";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get("order_id");
  const transactionId = searchParams.get("transaction_id");
  const status = searchParams.get("status"); // success, failed, cancelled

  if (!orderId || !transactionId) {
    return NextResponse.redirect(
      new URL("/support/error?message=Invalid payment parameters", request.url)
    );
  }

  const supabase = createClient();

  try {
    // Verify payment status with edodwaja.com
    const verificationResult = await verifyPaymentCallback(
      orderId,
      transactionId
    );

    // Update transaction in database
    const transactionUpdate: UpdateTransaction = {
      status: verificationResult.status,
      gateway_transaction_id: verificationResult.gateway_transaction_id,
      payment_method: verificationResult.payment_method,
      completed_at: verificationResult.status === "completed" ? new Date().toISOString() : undefined,
    };

    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .update(transactionUpdate)
      .eq("id", transactionId)
      .select()
      .single();

    if (transactionError) {
      console.error("Error updating transaction:", transactionError);
      return NextResponse.redirect(
        new URL("/support/error?message=Database error", request.url)
      );
    }

    // If payment successful, update supporter record
    if (verificationResult.status === "completed") {
      const supporterUpdate: UpdateSupporter = {
        status: "active",
        last_payment_at: new Date().toISOString(),
        next_billing_date: transaction.transaction_type === "membership_initial" || transaction.transaction_type === "membership_renewal"
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
          : undefined,
      };

      // Update total contributed amount
      const { data: supporter } = await supabase
        .from("supporters")
        .select("total_contributed")
        .eq("id", transaction.supporter_id)
        .single();

      if (supporter) {
        supporterUpdate.total_contributed = supporter.total_contributed + transaction.amount_inr;
      }

      const { error: supporterError } = await supabase
        .from("supporters")
        .update(supporterUpdate)
        .eq("id", transaction.supporter_id);

      if (supporterError) {
        console.error("Error updating supporter:", supporterError);
      }

      // Redirect to success page
      return NextResponse.redirect(
        new URL(
          `/support/success?order_id=${orderId}&amount=${transaction.amount_inr}`,
          request.url
        )
      );
    } else if (verificationResult.status === "failed") {
      // Redirect to failed page
      return NextResponse.redirect(
        new URL(`/support/failed?order_id=${orderId}`, request.url)
      );
    } else {
      // Redirect to pending page
      return NextResponse.redirect(
        new URL(`/support/pending?order_id=${orderId}`, request.url)
      );
    }
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/support/error?message=${encodeURIComponent("Payment verification failed")}`,
        request.url
      )
    );
  }
}
