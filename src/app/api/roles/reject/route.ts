import { NextRequest, NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireRole(["super_agent", "system_agent"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { actor, serviceClient } = auth;

  const { requestId, note } = await req.json();
  if (!requestId) return NextResponse.json({ error: "requestId is required" }, { status: 400 });

  const { error } = await serviceClient
    .from("role_requests")
    .update({ status: "rejected", reviewed_by: actor.id, reviewed_at: new Date().toISOString(), note: note || null })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit(serviceClient, actor.id, "reject_role_request", "role_requests", requestId, {});
  return NextResponse.json({ success: true });
}
