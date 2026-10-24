import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Autopay can only be turned ON if a reusable card authorization is
 * already on file (captured by the webhook from a prior successful
 * card payment) — there's nothing to charge automatically otherwise.
 * M-Pesa/mobile-money charges through Paystack are typically one-time
 * and not reusable this way, so autopay is effectively card-only; the
 * error message here says so explicitly rather than silently failing
 * on the next billing cycle.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { leaseId, enable } = await req.json();
  if (!leaseId || typeof enable !== "boolean") {
    return NextResponse.json({ error: "leaseId and enable (boolean) are required" }, { status: 400 });
  }

  const { data: lease, error: fetchError } = await supabase
    .from("leases")
    .select("id, client_id, paystack_authorization_code")
    .eq("id", leaseId)
    .eq("client_id", user.id)
    .single();
  if (fetchError || !lease) {
    return NextResponse.json({ error: "Lease not found for this account" }, { status: 404 });
  }

  if (enable && !lease.paystack_authorization_code) {
    return NextResponse.json(
      { error: "Autopay needs a saved card first — make one card payment (not M-Pesa) with 'Make a Payment', then enable autopay." },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase.from("leases").update({ autopay_enabled: enable }).eq("id", leaseId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true, autopay_enabled: enable });
}
