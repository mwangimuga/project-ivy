import { NextRequest, NextResponse } from "next/server";
import { requireSuperAgent, logAudit } from "@/lib/admin";

export const runtime = "nodejs";

/**
 * "Log in as" a target user. There's no password involved — Supabase's
 * Admin API generates a one-time magic link for the target's email, which
 * this route exchanges for a session on the Super Agent's behalf.
 *
 * IMPORTANT LIMITATION: this REPLACES the Super Agent's session cookie
 * with the target user's session in the same browser — there's no dual-
 * session support here. To return to the Super Agent account, log out
 * and log back in normally. This is heavily audited (every impersonation
 * is written to audit_logs with both identities) since it's the single
 * most sensitive capability in the admin toolkit.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperAgent();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { actor, serviceClient } = auth;

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const { data: targetAuthUser, error: fetchError } = await serviceClient.auth.admin.getUserById(userId);
  if (fetchError || !targetAuthUser.user?.email) {
    return NextResponse.json({ error: "Target user not found or has no email" }, { status: 404 });
  }

  const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
    type: "magiclink",
    email: targetAuthUser.user.email,
  });

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 400 });
  }

  await logAudit(serviceClient, actor.id, "impersonate", "profiles", userId, {
    actor_email: targetAuthUser.user.email,
    note: "Super Agent generated a login-as link for this user",
  });

  return NextResponse.json({ actionLink: linkData.properties.action_link });
}
