// Webhook route - Handle server-to-server notifications from edodwaja.com
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/edodwaja/client";
import { EdodwajaWebhookPayload } from "@/lib/edodwaja/client";
import { UpdateTransaction, UpdateSupporter, TransactionStatus } from "@/types/payment";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  try {
    // Parse webhook payload
    const payload: EdodwajaWebhookPayload = await request.json();

    // Get webhook secret from creator payment settings
    const { data: transaction } = await supabase
      .from("transactions")
      .select("creator_id")
      .eq("gateway_order_id", payload.order_id)
      .single();

    if (!transaction) {
      console.error("Transaction not found for webhook:", payload.order_id);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const { data: settings } = await supabase
      .from("creator_payment_settings")
      .select("edodwaja_webhook_secret")
      .eq("creator_id", transaction.creator_id)
      .single();

    if (!settings || !settings.edodwaja_webhook_secret) {
      console.error("Webhook secret not found for creator");
      return NextResponse.json({ error: "Invalid configuration" }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(payload, settings.edodwaja_webhook_secret);

    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Map webhook status to transaction status
    let transactionStatus: TransactionStatus = "pending";
    if (payload.event === "payment.success") {
      transactionStatus = "completed";
    } else if (payload.event === "payment.failed") {
      transactionStatus = "failed";
    }

    // Update transaction
    const transactionUpdate: UpdateTransaction = {
      status: transactionStatus,
      gateway_transaction_id: payload.gateway_transaction_id,
      payment_method: payload.payment_method,
      gateway_response: payload.metadata,
      completed_at: payload.event === "payment.success" ? payload.paid_at : undefined,
    };

    const { data: updatedTransaction, error: transactionError } = await supabase
      .from("transactions")
      .update(transactionUpdate)
      .eq("gateway_order_id", payload.order_id)
      .select()
      .single();

    if (transactionError) {
      console.error("Error updating transaction:", transactionError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // If payment successful, update supporter record
    if (payload.event === "payment.success") {
      const { data: supporter } = await supabase
        .from("supporters")
        .select("total_contributed")
        .eq("id", updatedTransaction.supporter_id)
        .single();

      const supporterUpdate: UpdateSupporter = {
        status: "active",
        last_payment_at: payload.paid_at,
        total_contributed: supporter ? supporter.total_contributed + payload.amount : payload.amount,
      };

      // Set next billing date for membership renewals
      if (
        updatedTransaction.transaction_type === "membership_initial" ||
        updatedTransaction.transaction_type === "membership_renewal"
      ) {
        const nextBilling = new Date(payload.paid_at);
        nextBilling.setDate(nextBilling.getDate() + 30); // 30 days billing cycle
        supporterUpdate.next_billing_date = nextBilling.toISOString();
      }

      const { error: supporterError } = await supabase
        .from("supporters")
        .update(supporterUpdate)
        .eq("id", updatedTransaction.supporter_id);

      if (supporterError) {
        console.error("Error updating supporter:", supporterError);
      }

      // TODO: Send notification to creator
      // TODO: Send thank you email to supporter
    }

    return NextResponse.json({ success: true, status: "processed" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
