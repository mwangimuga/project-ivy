import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient, SupabaseClient } from "@supabase/supabase-js";
import type { Role } from "@/lib/types/database";

/**
 * Every /api/admin/* route needs the same two things: proof the caller is
 * a logged-in Super Agent (checked with the normal cookie-based session
 * client, which respects RLS), and a service-role client for the actual
 * privileged operation (Auth Admin API calls always need the service key —
 * RLS doesn't apply to auth.users at all).
 */
export async function requireSuperAgent() {
  return requireRole(["super_agent"]);
}

/**
 * General version: checks the caller's primary role OR additional_roles
 * against an allow-list. Used by routes that admit more than one role
 * (e.g. landlords creating limited-scope accounts, System Agent sharing
 * Super Agent's approval powers).
 */
export async function requireRole(allowed: Role[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" as const, status: 401 as const };
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const hasRole = profile && (allowed.includes(profile.role) || (profile.additional_roles || []).some((r: Role) => allowed.includes(r)));
  if (!hasRole) {
    return { error: `Requires one of: ${allowed.join(", ")}` as const, status: 403 as const };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return { error: "Missing Supabase service credentials" as const, status: 500 as const };
  }

  const serviceClient = createServiceClient(supabaseUrl, serviceKey);
  return { actor: profile, serviceClient };
}

export async function logAudit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any, any, any>,
  actorId: string,
  action: string,
  targetTable: string,
  targetId: string | null,
  details: Record<string, unknown>
) {
  await serviceClient.from("audit_logs").insert({
    actor_id: actorId,
    action,
    target_table: targetTable,
    target_id: targetId,
    details,
  });
}
