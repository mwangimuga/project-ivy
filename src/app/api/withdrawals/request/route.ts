import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateWithdrawalFee } from "@/lib/types/database";

export const runtime = "nodejs";

/**
 * Landlord withdrawal request. Creates a `withdrawal_requests` row (status
 * "pending") with the tiered fee pre-computed for display; a Super Agent
 * approves it, which is when the actual Paystack transfer + ledger RPC
 * fire (see /api/withdrawals/approve). Splitting request vs. approval
 * keeps a human in the loop before money actually moves.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "landlord") {
    return NextResponse.json({ error: "Only landlords can request withdrawals" }, { status: 403 });
  }

  const { amount } = await req.json();
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "A positive amount is required" }, { status: 400 });
  }

  const { tier, fee, net } = calculateWithdrawalFee(amount);

  const { data: reqRow, error: insertError } = await supabase
    .from("withdrawal_requests")
    .insert({
      landlord_id: user.id,
      amount,
      tier,
      fee,
      net_amount: net,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ request: reqRow });
}
