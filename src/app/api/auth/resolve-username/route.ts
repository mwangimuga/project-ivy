import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * Supabase Auth only signs in by email (or phone/OAuth) — there's no
 * native "sign in with username" path. This route is the workaround:
 * given a username, look up its associated email using the service
 * role (anon can't query `profiles` before being authenticated — a
 * chicken-and-egg problem), then the client calls
 * `signInWithPassword({ email, password })` with the resolved email.
 *
 * Deliberately returns a generic "not found" for any failure rather
 * than distinguishing "no such username" from a lookup error, so this
 * can't be used to enumerate valid usernames beyond what a failed
 * login attempt would already reveal.
 */
export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing Supabase service credentials" }, { status: 500 });
  }
  const serviceClient = createServiceClient(supabaseUrl, serviceKey);

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("id")
    .ilike("username", username.trim())
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "No account found for that username." }, { status: 404 });
  }

  const { data: authUser, error } = await serviceClient.auth.admin.getUserById(profile.id);
  if (error || !authUser.user?.email) {
    return NextResponse.json({ error: "No account found for that username." }, { status: 404 });
  }

  return NextResponse.json({ email: authUser.user.email });
}
