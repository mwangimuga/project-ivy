"use client";

import { useState, useEffect } from "react";
import { User, Lock, Save, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge, RCFG, C } from "@/components/ProjectIvy";
import { getErrorMessage } from "@/lib/errors";
import type { Profile, Role, RoleRequest } from "@/lib/types/database";

const REQUESTABLE_ROLES: { value: Role; label: string }[] = [
  { value: "landlord", label: "Landlord" },
  { value: "client", label: "Client" },
  { value: "project_manager", label: "Project Manager" },
  { value: "maintenance", label: "Maintenance" },
];

export default function MyProfile({ profile, onUpdated }: { profile: Profile; onUpdated: () => void }) {
  const supabase = createClient();
  const [fullName, setFullName] = useState(profile.full_name);
  const [username, setUsername] = useState(profile.username);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [myRequests, setMyRequests] = useState<RoleRequest[]>([]);
  const [requestingRole, setRequestingRole] = useState<Role | "">("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestNotice, setRequestNotice] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const loadMyRequests = () => {
    supabase
      .from("role_requests")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMyRequests((data as RoleRequest[]) || []));
  };

  useEffect(() => {
    loadMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  const allRoles = [profile.role, ...(profile.additional_roles || [])];
  const pendingRoles = myRequests.filter((r) => r.status === "pending").map((r) => r.requested_role);
  const availableToRequest = REQUESTABLE_ROLES.filter((r) => !allRoles.includes(r.value) && !pendingRoles.includes(r.value));

  const submitRoleRequest = async () => {
    if (!requestingRole) return;
    setSubmittingRequest(true);
    setRequestNotice(null);
    try {
      const res = await fetch("/api/roles/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestedRole: requestingRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");
      setRequestNotice({ msg: "Request submitted — a Super Agent or System Agent will review it.", type: "success" });
      setRequestingRole("");
      loadMyRequests();
    } catch (e) {
      setRequestNotice({ msg: getErrorMessage(e, "Failed to submit request"), type: "error" });
    } finally {
      setSubmittingRequest(false);
    }
  };

  const saveProfile = async () => {
    if (!fullName.trim() || !username.trim()) {
      setProfileNotice({ msg: "Name and username can't be empty.", type: "error" });
      return;
    }
    setSavingProfile(true);
    setProfileNotice(null);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), username: username.trim() })
      .eq("id", profile.id);
    setSavingProfile(false);
    if (error) {
      setProfileNotice({ msg: error.message, type: "error" });
    } else {
      setProfileNotice({ msg: "Profile updated.", type: "success" });
      onUpdated();
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 8) {
      setPasswordNotice({ msg: "Password must be at least 8 characters.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ msg: "Passwords do not match.", type: "error" });
      return;
    }
    setSavingPassword(true);
    setPasswordNotice(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      setPasswordNotice({ msg: error.message, type: "error" });
    } else {
      setPasswordNotice({ msg: "Password updated.", type: "success" });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const initials = fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: C.cardBg, borderRadius: 16, padding: 28, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: RCFG[profile.role]?.color || C.sage, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.charcoal }}>{profile.full_name}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              <Badge text={RCFG[profile.role]?.label || profile.role} color={RCFG[profile.role]?.color} bg={RCFG[profile.role]?.bg} />
              {(profile.additional_roles || []).map((r) => (
                <Badge key={r} text={RCFG[r]?.label || r} color={RCFG[r]?.color} bg={RCFG[r]?.bg} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <User size={16} /> Profile details
        </div>

        {profileNotice && (
          <div style={{ background: profileNotice.type === "success" ? "#D1FAE5" : "#FEE2E2", color: profileNotice.type === "success" ? "#065F46" : C.red, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {profileNotice.msg}
          </div>
        )}

        <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Full Name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, margin: "6px 0 16px", fontSize: 14, fontFamily: "inherit" }}
        />

        <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, margin: "6px 0 20px", fontSize: 14, fontFamily: "inherit" }}
        />

        <button
          onClick={saveProfile}
          disabled={savingProfile}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", background: C.forest, color: C.white, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: savingProfile ? 0.7 : 1 }}
        >
          <Save size={14} /> {savingProfile ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div style={{ background: C.cardBg, borderRadius: 16, padding: 28, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <UserPlus size={16} /> Additional role
        </div>
        <p style={{ fontSize: 13, color: C.gray, margin: "0 0 16px", lineHeight: 1.6 }}>
          Also acting as a landlord, client, PM, or maintenance on top of your current role? Request it here — a Super Agent or System Agent has to approve it before it takes effect.
        </p>

        {requestNotice && (
          <div style={{ background: requestNotice.type === "success" ? "#D1FAE5" : "#FEE2E2", color: requestNotice.type === "success" ? "#065F46" : C.red, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {requestNotice.msg}
          </div>
        )}

        {availableToRequest.length > 0 ? (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <select
              value={requestingRole}
              onChange={(e) => setRequestingRole(e.target.value as Role)}
              style={{ flex: 1, minWidth: 180, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, background: C.cardBg, color: C.charcoal }}
            >
              <option value="">Select a role…</option>
              {availableToRequest.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <button
              onClick={submitRoleRequest}
              disabled={!requestingRole || submittingRequest}
              style={{ padding: "10px 22px", background: C.sage, color: C.white, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: !requestingRole || submittingRequest ? 0.6 : 1 }}
            >
              {submittingRequest ? "Submitting…" : "Request"}
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>Nothing new to request right now.</div>
        )}

        {myRequests.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Your requests</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {myRequests.map((r) => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: C.cream, borderRadius: 10, fontSize: 13 }}>
                  <span style={{ color: C.charcoal, fontWeight: 600 }}>{RCFG[r.requested_role]?.label || r.requested_role}</span>
                  <Badge
                    text={r.status}
                    color={r.status === "approved" ? C.emerald : r.status === "rejected" ? C.red : C.amber}
                    bg={r.status === "approved" ? "#D1FAE5" : r.status === "rejected" ? "#FEE2E2" : "#FEF3C7"}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: C.cardBg, borderRadius: 16, padding: 28, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Lock size={16} /> Change password
        </div>

        {passwordNotice && (
          <div style={{ background: passwordNotice.type === "success" ? "#D1FAE5" : "#FEE2E2", color: passwordNotice.type === "success" ? "#065F46" : C.red, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {passwordNotice.msg}
          </div>
        )}

        <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, margin: "6px 0 16px", fontSize: 14, fontFamily: "inherit" }}
        />

        <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, margin: "6px 0 20px", fontSize: 14, fontFamily: "inherit" }}
        />

        <button
          onClick={changePassword}
          disabled={savingPassword}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", background: C.sage, color: C.white, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: savingPassword ? 0.7 : 1 }}
        >
          <Lock size={14} /> {savingPassword ? "Updating…" : "Update Password"}
        </button>
      </div>
    </div>
  );
}
