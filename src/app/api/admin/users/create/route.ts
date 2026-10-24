import { NextRequest, NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/admin";
import type { Role } from "@/lib/types/database";

export const runtime = "nodejs";

// Which roles each creator is allowed to assign to the account they're
// creating. Super/System Agents can provision anyone; landlords are
// scoped down to the two roles the spec calls for (their own project
// managers and their own clients) — they can't create other landlords,
// maintenance, or agent accounts.
const ALLOWED_TARGET_ROLES: Record<string, Role[]> = {
  super_agent: ["super_agent", "system_agent", "project_manager", "landlord", "maintenance", "client"],
  system_agent: ["project_manager", "landlord", "maintenance", "client"],
  landlord: ["project_manager", "client"],
};

/**
 * Account creation, scoped by the creator's role. Bypasses the normal
 * self-signup + email-verification gate — these accounts are created
 * with a temp password and `email_confirm: true` (so the Supabase
 * project's "Confirm email" setting doesn't lock them out before
 * they've ever logged in), but `must_change_password: true`. The
 * account is only really "theirs" once they log in with the temp
 * password and are forced to set their own — that first successful
 * login is the practical verification step, mirroring how the seeded
 * Super Agent account itself works.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(["super_agent", "system_agent", "landlord"]);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { actor, serviceClient } = auth;

  const { email, username, fullName, role, tempPassword } = await req.json();
  if (!email || !username || !fullName || !role || !tempPassword) {
    return NextResponse.json({ error: "email, username, fullName, role, and tempPassword are all required" }, { status: 400 });
  }
  if (tempPassword.length < 8) {
    return NextResponse.json({ error: "tempPassword must be at least 8 characters" }, { status: 400 });
  }

  const allowedRoles = ALLOWED_TARGET_ROLES[actor.role] || [];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: `Your role (${actor.role}) can't create ${role} accounts.` }, { status: 403 });
  }

  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      username,
      full_name: fullName,
      role,
      must_change_password: true,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Track who created this account (landlords creating their own PMs/clients
  // is the main case this matters for) — a direct update since the trigger
  // that creates the profile row doesn't know about the creator.
  await serviceClient.from("profiles").update({ created_by: actor.id }).eq("id", data.user!.id);

  await logAudit(serviceClient, actor.id, "admin_create_user", "profiles", data.user!.id, {
    email,
    username,
    role,
    created_by_role: actor.role,
  });

  return NextResponse.json({ userId: data.user!.id });
}
