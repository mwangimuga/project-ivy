import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the redirect from Supabase's email-verification link.
// Exchanges the one-time code for a real session cookie, then routes
// the user into the app (or straight to forced password change for Mark).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect");
  const redirectQuery = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("id", data.user.id)
        .single();

      if (profile?.must_change_password) {
        return NextResponse.redirect(`${origin}/change-password${redirectQuery}`);
      }
      return NextResponse.redirect(`${origin}${redirect || "/dashboard"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=verification_failed`);
}
