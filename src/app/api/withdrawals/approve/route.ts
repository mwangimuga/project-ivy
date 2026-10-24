import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Super Agent approves a pending withdrawal — this is the "manual master
 * withdrawal" the spec calls for (section 3.1). Applying the ledger entry
 * only happens here, after a human sign-off, using the same
 * `process_withdrawal` RPC the tiering logic is centralized in.
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
  if (profile?.role !== "super_agent") {
    return NextResponse.json({ error: "Only the Super Agent can approve withdrawals" }, { status: 403 });
  }

  const { requestId } = await req.json();
  if (!requestId) {
    return NextResponse.json({ error: "requestId is required" }, { status: 400 });
  }

  const { data: reqRow, error: fetchError } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "pending")
    .single();

  if (fetchError || !reqRow) {
    return NextResponse.json({ error: "Pending withdrawal request not found" }, { status: 404 });
  }

  const { error: rpcError } = await supabase.rpc("process_withdrawal", {
    p_landlord_id: reqRow.landlord_id,
    p_amount: reqRow.amount,
    p_description: `Withdrawal approved by Super Agent — request ${reqRow.id}`,
  });

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("withdrawal_requests")
    .update({ status: "paid", resolved_at: new Date().toISOString() })
    .eq("id", requestId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
