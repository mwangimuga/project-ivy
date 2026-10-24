"use client";

import { useEffect, useState, useCallback } from "react";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge, RCFG, C } from "@/components/ProjectIvy";
import { getErrorMessage } from "@/lib/errors";
import LoadingState from "@/components/ui/LoadingState";
import type { Profile, RoleRequest } from "@/lib/types/database";

export default function RoleRequestsPanel({ profilesById, onChanged }: { profilesById: Record<string, Profile>; onChanged: () => void }) {
  const supabase = createClient();
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("role_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setRequests((data as RoleRequest[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("role-requests-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "role_requests" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, load]);

  const resolve = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/roles/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} request`);
      setNotice({ msg: action === "approve" ? "Role approved." : "Request declined.", type: "success" });
      await load();
      onChanged();
    } catch (e) {
      setNotice({ msg: getErrorMessage(e, `Failed to ${action} request`), type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingState label="Loading role requests" size="sm" />;
  if (requests.length === 0 && !notice) return null;

  return (
    <div style={{ background: C.cardBg, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <UserPlus size={16} /> Role requests
        {requests.length > 0 && <Badge text={String(requests.length)} color={C.amber} bg="#FEF3C7" />}
      </div>

      {notice && (
        <div style={{ background: notice.type === "success" ? "#D1FAE5" : "#FEE2E2", color: notice.type === "success" ? "#065F46" : C.red, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
          {notice.msg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {requests.map((r) => {
          const requester = profilesById[r.user_id];
          return (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, padding: "12px 14px", background: C.cream, borderRadius: 12 }}>
              <div>
                <div style={{ fontWeight: 600, color: C.charcoal, fontSize: 14 }}>{requester?.full_name || "Unknown user"}</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>
                  currently {RCFG[requester?.role || "client"]?.label} · requesting{" "}
                  <strong>{RCFG[r.requested_role]?.label || r.requested_role}</strong>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => resolve(r.id, "approve")}
                  disabled={busyId === r.id}
                  style={{ padding: "7px 16px", background: C.forest, color: C.white, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: busyId === r.id ? 0.6 : 1 }}
                >
                  Approve
                </button>
                <button
                  onClick={() => resolve(r.id, "reject")}
                  disabled={busyId === r.id}
                  style={{ padding: "7px 16px", background: C.cardBg, color: C.gray, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: busyId === r.id ? 0.6 : 1 }}
                >
                  Decline
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
