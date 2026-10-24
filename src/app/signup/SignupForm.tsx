"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const C = {
  forest: "#4CAF50",
  forestLight: "#66BB6A",
  sage: "#3F8B2C",
  cream: "#F6F7F9",
  charcoal: "#16181A",
  border: "#E4E7EC",
  red: "#DC2626",
  emerald: "#16A34A",
  dark: "#14171A",
};

const ROLES = [
  { value: "client", label: "Client (Leaser)" },
  { value: "landlord", label: "Landlord" },
  { value: "maintenance", label: "Maintenance / Caretaker" },
  { value: "project_manager", label: "Project Manager" },
];

export default function SignupForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    role: "client",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Mandatory email verification: Supabase sends a confirmation email by
    // default when "Confirm email" is enabled on the project. We rely on
    // that project setting (see README) rather than trying to bypass it.
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`,
        data: {
          username: form.username,
          full_name: form.fullName,
          role: form.role,
          must_change_password: false,
        },
      },
    });

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.dark, fontFamily: "var(--font-outfit), sans-serif", padding: 20 }}>
        <div style={{ background: C.cream, padding: 40, borderRadius: 20, maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.forest, marginBottom: 8 }}>
            Verify your email
          </div>
          <div style={{ fontSize: 14, color: "#6B7280" }}>
            We sent a confirmation link to <strong>{form.email}</strong>. You must verify
            it before you can sign in — protected routes stay locked until then.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.dark, fontFamily: "var(--font-outfit), sans-serif", padding: 20 }}>
      <form onSubmit={handleSignup} style={{ background: C.cream, padding: 40, borderRadius: 20, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <Link href="/" style={{ fontSize: 26, fontWeight: 800, color: C.forest, marginBottom: 4, display: "block", textDecoration: "none" }}>IVY</Link>
        <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>Create your account</div>

        {error && (
          <div style={{ background: "#FEE2E2", color: C.red, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {[
          { k: "fullName", label: "Full name", type: "text" },
          { k: "username", label: "Username", type: "text" },
          { k: "email", label: "Email", type: "email" },
          { k: "password", label: "Password", type: "password" },
        ].map((f) => (
          <div key={f.k} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>{f.label}</label>
            <input
              type={f.type}
              required
              minLength={f.k === "password" ? 6 : undefined}
              value={(form as Record<string, string>)[f.k]}
              onChange={set(f.k)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, marginTop: 6, fontSize: 14, fontFamily: "inherit" }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>I am a…</label>
          <select
            value={form.role}
            onChange={set("role")}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, marginTop: 6, fontSize: 14, fontFamily: "inherit", background: "white" }}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>
            Super Agent accounts are provisioned by the system, not self-registered.
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: C.forestLight, color: "white", fontWeight: 700, fontSize: 15, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Creating account…" : "Create account"}
        </button>

        <div style={{ marginTop: 20, fontSize: 13, color: "#6B7280", textAlign: "center" }}>
          Already have an account? <a href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} style={{ color: C.sage, fontWeight: 600 }}>Sign in</a>
        </div>
      </form>
    </div>
  );
}
