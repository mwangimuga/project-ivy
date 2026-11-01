"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

const C = {
  forest: "#4CAF50",
  forestLight: "#66BB6A",
  sage: "#3F8B2C",
  cream: "#F6F7F9",
  charcoal: "#16181A",
  border: "#E4E7EC",
  red: "#DC2626",
  dark: "#14171A",
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const timedOut = searchParams.get("reason") === "timeout";
  const supabase = createClient();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let email = identifier.trim();
    if (!email.includes("@")) {
      let res: Response;
      try {
        res = await fetchWithRetry(
          "/api/auth/resolve-username",
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: email }) },
          { onSlow: () => setSlow(true) }
        );
      } catch {
        setError("We're having trouble reaching the server. Please check your connection and try again in a moment.");
        setSlow(false);
        setLoading(false);
        return;
      }
      const data0 = await res.json();
      if (!res.ok) {
        setError(data0.error || "No account found for that username.");
        setLoading(false);
        return;
      }
      email = data0.email;
    }

    let { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    // Retry transient network/server failures quietly (a wrong password is a
    // normal 400-class auth error and must NOT be retried).
    const isTransient = (msg?: string) => !!msg && /fetch|network|timeout|50\d|unavailable/i.test(msg);
    for (let attempt = 0; attempt < 2 && signInError && isTransient(signInError.message); attempt++) {
      setSlow(true);
      await new Promise((r) => setTimeout(r, 900 * Math.pow(2, attempt)));
      ({ data, error: signInError } = await supabase.auth.signInWithPassword({ email, password }));
    }
    setSlow(false);

    if (signInError) {
      setError(
        isTransient(signInError.message)
          ? "We're having trouble reaching the server. Please try again in a moment."
          : signInError.message
      );
      setLoading(false);
      return;
    }

    if (data.user && !data.user.email_confirmed_at) {
      setError("Please verify your email before signing in. Check your inbox.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("must_change_password")
      .eq("id", data.user!.id)
      .single();

    setLoading(false);
    if (profile?.must_change_password) {
      router.push(`/change-password${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`);
    } else {
      router.push(redirect || "/dashboard");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.dark,
        fontFamily: "var(--font-outfit), sans-serif",
        padding: 20,
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          background: C.cream,
          padding: 40,
          borderRadius: 20,
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <Link href="/" style={{ fontSize: 26, fontWeight: 800, color: C.forest, marginBottom: 4, display: "block", textDecoration: "none" }}>
          IVY
        </Link>
        <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 28 }}>
          {redirect ? "Sign in to continue your application" : "Sign in to your account"}
        </div>

        {timedOut && !error && (
          <div style={{ background: "#FEF3C7", color: "#92400E", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            You were signed out after a period of inactivity. Please sign in again.
          </div>
        )}
        {error && (
          <div
            style={{
              background: "#FEE2E2",
              color: C.red,
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Email or Username</label>
        <input
          type="text"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            margin: "8px 0 16px",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        />

        <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            margin: "8px 0 24px",
            fontSize: 14,
            fontFamily: "inherit",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: C.forestLight,
            color: "white",
            fontWeight: 700,
            fontSize: 15,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (slow ? "Still working — this is taking longer than expected…" : "Signing in…") : "Sign in"}
        </button>

        <div style={{ marginTop: 20, fontSize: 13, color: "#6B7280", textAlign: "center" }}>
          No account?{" "}
          <a href={`/signup${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} style={{ color: C.sage, fontWeight: 600 }}>
            Create one
          </a>
        </div>
      </form>
    </div>
  );
}
