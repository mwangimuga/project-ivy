import { NextRequest, NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireRole(["super_agent", "system_agent"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { actor, serviceClient } = auth;

  const { requestId } = await req.json();
  if (!requestId) return NextResponse.json({ error: "requestId is required" }, { status: 400 });

  const { error } = await serviceClient.rpc("approve_role_request", {
    p_request_id: requestId,
    p_reviewer_id: actor.id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit(serviceClient, actor.id, "approve_role_request", "role_requests", requestId, {});
  return NextResponse.json({ success: true });
}
