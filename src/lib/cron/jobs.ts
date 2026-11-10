import { NextRequest } from "next/server";
import { createClient as createServiceClient, SupabaseClient } from "@supabase/supabase-js";

export function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

export function serviceClientFromEnv(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

/** Posts this month's rent as a charge on every active lease. */
export async function chargeRent(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("charge_monthly_rent");
  if (error) throw new Error(`charge_monthly_rent failed: ${error.message}`);
  return { charged: Array.isArray(data) ? data.length : 0 };
}

/**
 * Closes every active tenancy whose effective end (an earlier notice date, or
 * the contracted end date) has passed - the "timed tenancy" auto-removal.
 */
export async function expireLeases(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("end_expired_leases");
  if (error) throw new Error(`end_expired_leases failed: ${error.message}`);
  return { ended: typeof data === "number" ? data : 0 };
}

/**
 * Charges the saved card on every autopay lease with an outstanding balance.
 * The ledger entry itself is written by the charge.success webhook, exactly as
 * for a manual payment, so there is one code path that touches the ledger.
 */
export async function autopayCharge(supabase: SupabaseClient) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error("Missing PAYSTACK_SECRET_KEY");

  const { data: leases, error } = await supabase.rpc("get_autopay_leases");
  if (error) throw new Error(`get_autopay_leases failed: ${error.message}`);

  const results: { leaseId: string; status: string }[] = [];
  for (const lease of leases || []) {
    const { data: authUser } = await supabase.auth.admin.getUserById(lease.client_id);
    const email = authUser.user?.email;
    if (!email) {
      results.push({ leaseId: lease.lease_id, status: "skipped: no email" });
      continue;
    }
    try {
      const res = await fetch("https://api.paystack.co/transaction/charge_authorization", {
        method: "POST",
        headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          authorization_code: lease.authorization_code,
          email,
          amount: Math.round(lease.outstanding_balance * 100),
          metadata: { lease_id: lease.lease_id, client_id: lease.client_id, source: "autopay_cron" },
        }),
      });
      const body = await res.json();
      results.push({ leaseId: lease.lease_id, status: res.ok ? "charged" : `failed: ${body?.message}` });
    } catch (e) {
      results.push({ leaseId: lease.lease_id, status: `error: ${e instanceof Error ? e.message : "unknown"}` });
    }
  }
  return { processed: results.length, results };
}
