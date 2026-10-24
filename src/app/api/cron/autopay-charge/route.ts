import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Monthly autopay run (see vercel.json). For each lease with autopay on
 * and an outstanding balance, charges the saved card via Paystack's
 * charge_authorization endpoint. Doesn't write to the ledger directly —
 * the existing charge.success webhook handles that exactly the same way
 * it does for a manual payment, so there's only one code path that ever
 * touches the ledger.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!supabaseUrl || !serviceKey || !secretKey) {
    return NextResponse.json({ error: "Missing required credentials" }, { status: 500 });
  }

  const supabase = createServiceClient(supabaseUrl, serviceKey);
  const { data: leases, error } = await supabase.rpc("get_autopay_leases");
  if (error) {
    console.error("[Cron] get_autopay_leases failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { leaseId: string; status: string }[] = [];

  for (const lease of leases || []) {
    const { data: authUser } = await supabase.auth.admin.getUserById(lease.client_id);
    const email = authUser.user?.email;
    if (!email) {
      results.push({ leaseId: lease.lease_id, status: "skipped: no email" });
      continue;
    }

    try {
      const chargeRes = await fetch("https://api.paystack.co/transaction/charge_authorization", {
        method: "POST",
        headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          authorization_code: lease.authorization_code,
          email,
          amount: Math.round(lease.outstanding_balance * 100),
          metadata: { lease_id: lease.lease_id, client_id: lease.client_id, source: "autopay_cron" },
        }),
      });
      const chargeData = await chargeRes.json();
      results.push({ leaseId: lease.lease_id, status: chargeRes.ok ? "charged" : `failed: ${chargeData?.message}` });
      // The webhook (charge.success) writes the ledger entry once Paystack
      // confirms — we don't duplicate that logic here.
    } catch (e) {
      results.push({ leaseId: lease.lease_id, status: `error: ${e instanceof Error ? e.message : "unknown"}` });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
