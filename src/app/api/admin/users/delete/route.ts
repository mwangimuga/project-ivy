import { NextRequest, NextResponse } from "next/server";
import { requireSuperAgent, logAudit } from "@/lib/admin";

export const runtime = "nodejs";

/**
 * Deletes a user via the Auth Admin API (not just their `profiles` row —
 * `profiles.id` has `on delete cascade` against `auth.users`, so deleting
 * the auth user is what actually removes them everywhere, including
 * being able to log in at all).
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperAgent();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { actor, serviceClient } = auth;

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  if (userId === actor.id) {
    return NextResponse.json({ error: "You can't delete your own account from here." }, { status: 400 });
  }

  const { error } = await serviceClient.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAudit(serviceClient, actor.id, "admin_delete_user", "profiles", userId, {});

  return NextResponse.json({ success: true });
}
