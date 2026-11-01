import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Runs on Vercel's Node.js serverless runtime (not Edge) - `crypto` and the
// Supabase service-role key both need that.
export const runtime = "nodejs";

/**
 * Paystack Webhook Handler
 * Verifies the `x-paystack-signature` HMAC SHA-512, then persists the
 * tiered revenue split into Supabase via the `process_payment` /
 * `process_withdrawal` Postgres functions. Doing the split math in the
 * database - not just here - means it can never drift even if this
 * route is called from somewhere else.
 *
 * Events handled:
 *   charge.success       -> credits the client's ledger, splits system/landlord cut,
 *                            and captures a reusable card authorization for autopay
 *   transfer.success/fail -> marks a landlord withdrawal request as paid/failed
 *   paymentrequest.success -> marks an invoice as paid (also flows through
 *                            charge.success for the ledger itself)
 */
export async function POST(req: NextRequest) {
  const body = await req.text();

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) {
    return NextResponse.json({ error: "Missing PAYSTACK_SECRET_KEY" }, { status: 500 });
  }

  const hash = createHmac("sha512", paystackSecret).update(body).digest("hex");
  const signature = req.headers.get("x-paystack-signature");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  // Service-role client: webhooks have no user session, and RLS would
  // otherwise block these writes. Never expose this key to the browser.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing Supabase service credentials" }, { status: 500 });
  }
  const supabase = createServiceClient(supabaseUrl, serviceKey);

  if (event.event === "charge.success") {
    const { amount, reference, metadata, authorization, channel } = event.data;
    const amountKSh = amount / 100; // Paystack sends amounts in kobo/cents
    const clientId: string | undefined = metadata?.client_id;
    const leaseId: string | undefined = metadata?.lease_id;

    if (!clientId || !leaseId) {
      console.error("[Paystack Webhook] charge.success missing client_id/lease_id metadata", { reference });
      // Acknowledge receipt so Paystack doesn't retry forever on bad metadata,
      // but do not fabricate a ledger entry we can't attribute correctly.
      return NextResponse.json({ received: true, warning: "missing metadata" });
    }

    const { error: rpcError } = await supabase.rpc("process_payment", {
      p_client_id: clientId,
      p_lease_id: leaseId,
      p_amount: amountKSh,
      p_description: `Paystack payment - ${reference}`,
      p_paystack_reference: reference,
    });

    if (rpcError) {
      console.error("[Paystack Webhook] process_payment failed:", rpcError.message);
      return NextResponse.json({ error: "ledger write failed" }, { status: 500 });
    }
    // The insert inside process_payment fires Supabase Realtime automatically
    // (public.ledgers is in the supabase_realtime publication), so the
    // client's balance updates in the UI with no page reload.

    // Autopay setup: card payments can return a reusable authorization
    // code. Save it so the client can later opt in to autopay — this
    // never enables autopay by itself, it only makes the option available.
    if (authorization?.reusable && channel === "card" && authorization?.authorization_code) {
      const { error: leaseUpdateError } = await supabase
        .from("leases")
        .update({ paystack_authorization_code: authorization.authorization_code })
        .eq("id", leaseId);
      if (leaseUpdateError) {
        console.error("[Paystack Webhook] failed to save authorization code:", leaseUpdateError.message);
      }
    }

    // If this payment came from a Paystack Payment Request (invoice),
    // mark our own invoice record paid too.
    if (event.data.paid_at && metadata?.invoice_id) {
      await supabase.from("invoices").update({ status: "paid" }).eq("id", metadata.invoice_id);
    }
  }

  if (event.event === "transfer.success" || event.event === "transfer.failed") {
    const { reference } = event.data;
    const status = event.event === "transfer.success" ? "paid" : "failed";

    const { error: updateError } = await supabase
      .from("withdrawal_requests")
      .update({ status, resolved_at: new Date().toISOString() })
      .eq("paystack_reference", reference);

    if (updateError) {
      console.error("[Paystack Webhook] withdrawal_requests update failed:", updateError.message);
      return NextResponse.json({ error: "withdrawal update failed" }, { status: 500 });
    }
  }

  if (event.event === "paymentrequest.success" || event.event === "paymentrequest.pending") {
    const requestCode = event.data.request_code;
    const status = event.event === "paymentrequest.success" ? "paid" : "pending";
    if (requestCode) {
      await supabase.from("invoices").update({ status }).eq("paystack_request_code", requestCode);
    }
  }

  return NextResponse.json({ received: true });
}
