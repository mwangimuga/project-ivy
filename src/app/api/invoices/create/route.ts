import { NextRequest, NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/admin";

export const runtime = "nodejs";

/**
 * Creates a Paystack "Payment Request" — Paystack's own invoicing
 * primitive. Given a customer email, amount, and description, Paystack
 * generates a hosted payment page and (with send_notification: true)
 * emails the client a link to it directly — no separate email service
 * needed on our side.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(["landlord", "project_manager", "super_agent", "system_agent"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { actor, serviceClient } = auth;

  const { leaseId, amount, description, dueDate } = await req.json();
  if (!leaseId || !amount || amount <= 0) {
    return NextResponse.json({ error: "leaseId and a positive amount are required" }, { status: 400 });
  }

  const { data: lease, error: leaseError } = await serviceClient
    .from("leases")
    .select("id, client_id, property_id, properties(landlord_id)")
    .eq("id", leaseId)
    .single();
  if (leaseError || !lease) {
    return NextResponse.json({ error: "Lease not found" }, { status: 404 });
  }

  // Landlords can only invoice tenants of their own properties; PM/Super
  // Agent/System Agent can invoice any lease.
  if (actor.role === "landlord") {
    const landlordId = (lease as unknown as { properties: { landlord_id: string } }).properties?.landlord_id;
    if (landlordId !== actor.id) {
      return NextResponse.json({ error: "This lease isn't on one of your properties." }, { status: 403 });
    }
  }

  const { data: clientAuth } = await serviceClient.auth.admin.getUserById(lease.client_id);
  const clientEmail = clientAuth.user?.email;
  if (!clientEmail) {
    return NextResponse.json({ error: "Could not find the client's email." }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Missing PAYSTACK_SECRET_KEY" }, { status: 500 });
  }

  const paystackRes = await fetch("https://api.paystack.co/paymentrequest", {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: clientEmail,
      amount: Math.round(amount * 100),
      description: description || "Rent invoice",
      due_date: dueDate || undefined,
      send_notification: true,
      metadata: { lease_id: leaseId, client_id: lease.client_id },
    }),
  });
  const paystackData = await paystackRes.json();
  if (!paystackRes.ok) {
    return NextResponse.json({ error: paystackData?.message || "Paystack invoice creation failed" }, { status: 502 });
  }

  const { data: invoice, error: insertError } = await serviceClient
    .from("invoices")
    .insert({
      lease_id: leaseId,
      client_id: lease.client_id,
      created_by: actor.id,
      amount,
      description: description || "Rent invoice",
      status: "pending",
      paystack_request_code: paystackData.data?.request_code || null,
      due_date: dueDate || null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await logAudit(serviceClient, actor.id, "create_invoice", "invoices", invoice.id, { leaseId, amount });

  return NextResponse.json({ invoice });
}
