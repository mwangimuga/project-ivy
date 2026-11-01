"use client";

import { useState } from "react";
import { Plus, X, Briefcase, User as UserIcon } from "lucide-react";
import { Badge, RCFG, C } from "@/components/ProjectIvy";
import { getErrorMessage } from "@/lib/errors";
import type { Profile, Role } from "@/lib/types/database";

function randomPassword() {
  return Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-4).toUpperCase();
}

const TEAM_ROLES: { value: Role; label: string; icon: typeof Briefcase }[] = [
  { value: "project_manager", label: "Project Manager", icon: Briefcase },
  { value: "client", label: "Client", icon: UserIcon },
];

export default function MyTeam({ myTeam, onChanged }: { myTeam: Profile[]; onChanged: () => void }) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", username: "", fullName: "", role: "project_manager" as Role, tempPassword: randomPassword() });
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const flash = (msg: string, type: "success" | "error" = "success") => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 6000);
  };

  const createMember = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account");
      flash(`Account created for ${form.email}. Temp password: ${form.tempPassword} — share it securely.`);
      setShowCreate(false);
      setForm({ email: "", username: "", fullName: "", role: "project_manager", tempPassword: randomPassword() });
      onChanged();
    } catch (e) {
      flash(getErrorMessage(e, "Failed to create account"), "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {notice && (
        <div style={{ background: notice.type === "success" ? "#D1FAE5" : "#FEE2E2", color: notice.type === "success" ? "#065F46" : C.red, padding: "12px 16px", borderRadius: 12, fontSize: 13, marginBottom: 20 }}>
          {notice.msg}
        </div>
      )}

      <div style={{ background: C.cardBg, borderRadius: 16, border: `1px solid ${C.border}`, overflowX: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.charcoal, margin: 0 }}>My Team</h2>
            <p style={{ fontSize: 13, color: C.gray, margin: "4px 0 0" }}>Project Managers and Clients you&apos;ve created directly.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: C.forest, color: C.white, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <Plus size={14} /> Add Team Member
          </button>
        </div>
        {myTeam.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: C.gray, fontSize: 13 }}>
            No team members yet. Add a Project Manager to help run your properties, or a Client to fast-track someone into a lease.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.cream }}>
                {["Name", "Role", "Status"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, color: C.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myTeam.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: 600, color: C.charcoal }}>{u.full_name}</div>
                    <div style={{ fontSize: 12, color: C.gray }}>@{u.username}</div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <Badge text={RCFG[u.role]?.label} color={RCFG[u.role]?.color} bg={RCFG[u.role]?.bg} />
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <Badge text={u.must_change_password ? "Pending setup" : "Active"} color={u.must_change_password ? C.amber : C.emerald} bg={u.must_change_password ? "#FEF3C7" : "#D1FAE5"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.cardBg, borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: C.charcoal, margin: 0 }}>Add Team Member</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.gray }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {TEAM_ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 10px", borderRadius: 12, border: `1.5px solid ${form.role === r.value ? C.forest : C.border}`, background: form.role === r.value ? C.forest + "10" : C.white, cursor: "pointer" }}
                >
                  <r.icon size={18} color={form.role === r.value ? C.forest : C.gray} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: form.role === r.value ? C.forest : C.gray }}>{r.label}</span>
                </button>
              ))}
            </div>
            {(["email", "username", "fullName"] as const).map((k) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>{k === "email" ? "Email" : k === "username" ? "Username" : "Full Name"}</label>
                <input
                  type={k === "email" ? "email" : "text"}
                  value={form[k]}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, marginTop: 6, fontSize: 14, fontFamily: "inherit" }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Temporary Password</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input value={form.tempPassword} onChange={(e) => setForm((f) => ({ ...f, tempPassword: e.target.value }))} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "monospace" }} />
                <button onClick={() => setForm((f) => ({ ...f, tempPassword: randomPassword() }))} style={{ padding: "10px 14px", background: C.cream, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, cursor: "pointer" }}>Regenerate</button>
              </div>
            </div>
            <button
              onClick={createMember}
              disabled={creating || !form.email || !form.username || !form.fullName}
              style={{ width: "100%", padding: 14, background: C.forest, color: C.white, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: creating ? 0.7 : 1 }}
            >
              {creating ? "Creating…" : "Create Account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
