"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const C = { forest: "#4CAF50", forestLight: "#66BB6A", cream: "#F6F7F9", charcoal: "#16181A", border: "#E4E7EC", red: "#DC2626", amber: "#D97706", dark: "#14171A" };

export default function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/login");
      else setChecking(false);
    });
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    if (updateErr) {
      setError(updateErr.message);
      setLoading(false);
      return;
    }

    if (userRes.user) {
      await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", userRes.user.id);
    }

    setLoading(false);
    router.push(redirect || "/dashboard");
  };

  if (checking) return null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.dark, fontFamily: "var(--font-outfit), sans-serif", padding: 20 }}>
      <form onSubmit={handleSubmit} style={{ background: C.cream, padding: 40, borderRadius: 20, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <Link href="/" style={{ fontSize: 20, fontWeight: 800, color: C.forest, marginBottom: 12, display: "block", textDecoration: "none" }}>IVY</Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ background: "#FEF3C7", color: C.amber, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
            REQUIRED
          </div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.forest, marginBottom: 4 }}>
          Set a new password
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>
          For security, first-time and seeded accounts must set a new password before continuing.
        </div>

        {error && (
          <div style={{ background: "#FEE2E2", color: C.red, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>New password</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, margin: "8px 0 16px", fontSize: 14, fontFamily: "inherit" }} />

        <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Confirm password</label>
        <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, margin: "8px 0 24px", fontSize: 14, fontFamily: "inherit" }} />

        <button type="submit" disabled={loading}
          style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: C.forestLight, color: "white", fontWeight: 700, fontSize: 15, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Updating…" : "Update password & continue"}
        </button>
      </form>
    </div>
  );
}
