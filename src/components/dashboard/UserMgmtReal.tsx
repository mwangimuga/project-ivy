"use client";

import { useState } from "react";
import { Plus, X, LogIn, Pencil, Trash2, ShieldCheck, ShieldHalf, Briefcase, Building2, Wrench, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import { MCard as MCardBase, Badge, Av, RCFG, C } from "@/components/ProjectIvy";
import type { Profile, Role } from "@/lib/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MCard = MCardBase as any;

const ROLE_ICON: Record<Role, typeof ShieldCheck> = {
  super_agent: ShieldCheck,
  system_agent: ShieldHalf,
  project_manager: Briefcase,
  landlord: Building2,
  maintenance: Wrench,
  client: User,
};

const ROLES: { value: Role; label: string }[] = [
  { value: "client", label: "Client" },
  { value: "landlord", label: "Landlord" },
  { value: "project_manager", label: "Project Manager" },
  { value: "maintenance", label: "Maintenance" },
  { value: "system_agent", label: "System Agent" },
  { value: "super_agent", label: "Super Agent" },
];

function randomPassword() {
  return Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-4).toUpperCase();
}

function initialsOf(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}

export default function UserMgmtReal({
  profiles,
  currentUserId,
  onChanged,
}: {
  profiles: Profile[];
  currentUserId: string;
  onChanged: () => void;
}) {
  const supabase = createClient();
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [form, setForm] = useState({ email: "", username: "", fullName: "", role: "client" as Role, tempPassword: randomPassword() });
  const [creating, setCreating] = useState(false);

  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", username: "", role: "client" as Role });
  const [savingEdit, setSavingEdit] = useState(false);

  const flash = (msg: string, type: "success" | "error" = "success") => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 5000);
  };

  const createUser = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      flash(`Account created for ${form.email}. Temp password: ${form.tempPassword} — share it securely; they'll be forced to change it on first login.`);
      setShowCreate(false);
      setForm({ email: "", username: "", fullName: "", role: "client", tempPassword: randomPassword() });
      onChanged();
    } catch (e) {
      flash(getErrorMessage(e, "Failed to create user"), "error");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (u: Profile) => {
    setEditingUser(u);
    setEditForm({ fullName: u.full_name, username: u.username, role: u.role });
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    if (!editForm.fullName.trim() || !editForm.username.trim()) {
      flash("Name and username can't be empty.", "error");
      return;
    }
    setSavingEdit(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editForm.fullName.trim(), username: editForm.username.trim(), role: editForm.role })
      .eq("id", editingUser.id);
    setSavingEdit(false);
    if (error) {
      flash(error.message, "error");
    } else {
      flash("User updated.");
      setEditingUser(null);
      onChanged();
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}'s account? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      flash(`${name}'s account deleted.`);
      onChanged();
    } catch (e) {
      flash(getErrorMessage(e, "Failed to delete user"), "error");
    } finally {
      setBusyId(null);
    }
  };

  const impersonate = async (id: string, name: string) => {
    if (
      !confirm(
        `Log in as ${name}? This replaces YOUR current session with theirs in this browser tab — you'll need to log back in as yourself afterward. This action is permanently logged.`
      )
    )
      return;
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/users/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate login link");
      window.location.href = data.actionLink;
    } catch (e) {
      flash(getErrorMessage(e, "Failed to log in as user"), "error");
      setBusyId(null);
    }
  };

  return (
    <div>
      {notice && (
        <div style={{ background: notice.type === "success" ? "#D1FAE5" : "#FEE2E2", color: notice.type === "success" ? "#065F46" : C.red, padding: "12px 16px", borderRadius: 12, fontSize: 13, marginBottom: 20 }}>
          {notice.msg}
        </div>
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        {Object.entries(RCFG).map(([role, cfg]: [string, { label: string; color: string }]) => (
          <MCard key={role} icon={ROLE_ICON[role as Role]} label={cfg.label} value={profiles.filter((p) => p.role === role).length} color={cfg.color} trend={undefined} sub={undefined} />
        ))}
      </div>

      <div style={{ background: C.cardBg, borderRadius: 16, border: `1px solid ${C.border}`, overflowX: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.charcoal, margin: 0 }}>All Platform Users</h2>
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: C.forest, color: C.white, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <Plus size={14} /> Create User
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.cream }}>
              {["User", "Role", "Status", "Actions"].map((h) => (
                <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, color: C.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map((u) => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Av initials={initialsOf(u.full_name)} size={36} color={RCFG[u.role]?.color || C.sage} />
                    <div>
                      <div style={{ fontWeight: 600, color: C.charcoal }}>{u.full_name}</div>
                      <div style={{ fontSize: 12, color: C.gray }}>@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <Badge text={RCFG[u.role]?.label} color={RCFG[u.role]?.color} bg={RCFG[u.role]?.bg} />
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <Badge text={u.must_change_password ? "Pending setup" : "Active"} color={u.must_change_password ? C.amber : C.emerald} bg={u.must_change_password ? "#FEF3C7" : "#D1FAE5"} />
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      onClick={() => openEdit(u)}
                      disabled={busyId === u.id}
                      title="Edit user"
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", background: C.cream, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, cursor: "pointer", color: C.charcoal }}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    {u.id !== currentUserId && (
                      <>
                        <button
                          onClick={() => impersonate(u.id, u.full_name)}
                          disabled={busyId === u.id}
                          title="Log in as this user"
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", background: "#DBEAFE", border: "1px solid #93C5FD", borderRadius: 8, fontSize: 12, cursor: "pointer", color: "#1D4ED8" }}
                        >
                          <LogIn size={12} /> Log in as
                        </button>
                        <button
                          onClick={() => deleteUser(u.id, u.full_name)}
                          disabled={busyId === u.id}
                          title="Delete account"
                          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 8, fontSize: 12, cursor: "pointer", color: C.red }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.cardBg, borderRadius: 20, padding: 36, maxWidth: 460, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: C.charcoal, margin: 0 }}>Create User</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.gray }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 16, lineHeight: 1.5 }}>
              This creates the account immediately with a temporary password — no email confirmation needed upfront. They&apos;re forced to set their own password (and effectively verify the account) the first time they log in.
            </div>
            {(["email", "username", "fullName"] as const).map((k) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>
                  {k === "email" ? "Email" : k === "username" ? "Username" : "Full Name"}
                </label>
                <input
                  type={k === "email" ? "email" : "text"}
                  value={form[k]}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, marginTop: 6, fontSize: 14, fontFamily: "inherit" }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, marginTop: 6, fontSize: 14, background: "white" }}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Temporary Password</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input
                  value={form.tempPassword}
                  onChange={(e) => setForm((f) => ({ ...f, tempPassword: e.target.value }))}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "monospace" }}
                />
                <button
                  onClick={() => setForm((f) => ({ ...f, tempPassword: randomPassword() }))}
                  style={{ padding: "10px 14px", background: C.cream, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, cursor: "pointer" }}
                >
                  Regenerate
                </button>
              </div>
            </div>
            <button
              onClick={createUser}
              disabled={creating || !form.email || !form.username || !form.fullName}
              style={{ width: "100%", padding: 14, background: C.forest, color: C.white, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: creating ? 0.7 : 1 }}
            >
              {creating ? "Creating…" : "Create Account"}
            </button>
          </div>
        </div>
      )}

      {editingUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.cardBg, borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: C.charcoal, margin: 0 }}>Edit User</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.gray }}>
                <X size={20} />
              </button>
            </div>

            <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Full Name</label>
            <input
              value={editForm.fullName}
              onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, margin: "6px 0 14px", fontSize: 14, fontFamily: "inherit" }}
            />

            <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Username</label>
            <input
              value={editForm.username}
              onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, margin: "6px 0 14px", fontSize: 14, fontFamily: "inherit" }}
            />

            <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Role</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as Role }))}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, margin: "6px 0 20px", fontSize: 14, background: "white" }}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <button
              onClick={saveEdit}
              disabled={savingEdit}
              style={{ width: "100%", padding: 14, background: C.forest, color: C.white, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: savingEdit ? 0.7 : 1 }}
            >
              {savingEdit ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
