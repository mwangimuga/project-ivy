import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Initializes a Paystack transaction for the authenticated client's rent
 * payment. The client_id/lease_id are stamped into `metadata` so the
 * webhook (which only ever sees Paystack's payload, never our session)
 * can attribute the payment to the right ledger + lease.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { leaseId, amount } = await req.json();
  if (!leaseId || !amount || amount <= 0) {
    return NextResponse.json({ error: "leaseId and a positive amount are required" }, { status: 400 });
  }

  // Confirm the lease actually belongs to this client (defense in depth on
  // top of RLS, since we're about to charge money against it).
  const { data: lease, error: leaseError } = await supabase
    .from("leases")
    .select("id, client_id")
    .eq("id", leaseId)
    .eq("client_id", user.id)
    .single();

  if (leaseError || !lease) {
    return NextResponse.json({ error: "Lease not found for this client" }, { status: 404 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Missing PAYSTACK_SECRET_KEY" }, { status: 500 });
  }

  const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: Math.round(amount * 100), // KSh -> kobo/cents
      metadata: {
        client_id: user.id,
        lease_id: leaseId,
      },
      callback_url: `${req.nextUrl.origin}/dashboard?payment=complete`,
    }),
  });

  const data = await initRes.json();
  if (!initRes.ok) {
    return NextResponse.json({ error: data?.message || "Paystack initialization failed" }, { status: 502 });
  }

  return NextResponse.json({ authorizationUrl: data.data.authorization_url, reference: data.data.reference });
}
