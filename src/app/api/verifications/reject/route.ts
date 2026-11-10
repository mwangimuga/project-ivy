import { NextRequest, NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireRole(["super_agent", "system_agent"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { actor, serviceClient } = auth;

  const { verificationId, note } = await req.json();
  if (!verificationId) return NextResponse.json({ error: "verificationId is required" }, { status: 400 });
  if (!note || String(note).trim().length < 5) {
    return NextResponse.json({ error: "Please tell the landlord what to fix (a few words at least)." }, { status: 400 });
  }

  const { error } = await serviceClient.rpc("reject_landlord_verification", {
    p_id: verificationId,
    p_reviewer: actor.id,
    p_note: String(note).trim(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit(serviceClient, actor.id, "reject_landlord_verification", "landlord_verifications", verificationId, { note });
  return NextResponse.json({ success: true });
}
