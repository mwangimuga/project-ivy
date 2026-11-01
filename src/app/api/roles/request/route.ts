import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Any authenticated user can request an additional role (e.g. a client
 * who also owns a property requesting to be a landlord too). This never
 * grants anything by itself — it just creates a pending request that a
 * Super Agent or System Agent has to explicitly approve.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { requestedRole, note } = await req.json();
  const validRoles = ["landlord", "client", "project_manager", "maintenance"];
  if (!validRoles.includes(requestedRole)) {
    return NextResponse.json({ error: "Invalid role requested" }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("role, additional_roles").eq("id", user.id).single();
  if (profile?.role === requestedRole || (profile?.additional_roles || []).includes(requestedRole)) {
    return NextResponse.json({ error: "You already have this role" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("role_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("requested_role", requestedRole)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "You already have a pending request for this role" }, { status: 400 });
  }

  const { error } = await supabase.from("role_requests").insert({
    user_id: user.id,
    requested_role: requestedRole,
    note: note || null,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
