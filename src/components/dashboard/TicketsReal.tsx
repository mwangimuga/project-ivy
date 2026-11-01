"use client";

import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw, CheckCircle, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MCard as MCardBase, Badge, SCFG, C } from "@/components/ProjectIvy";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MCard = MCardBase as any;
import type { Ticket, Profile, PropertyRow } from "@/lib/types/database";

export default function TicketsReal({
  profile,
  tickets: initialTickets,
  properties,
  profilesById,
}: {
  profile: Profile;
  tickets: Ticket[];
  properties: PropertyRow[];
  profilesById: Record<string, Profile>;
}) {
  const supabase = createClient();
  const [tickets, setTickets] = useState(initialTickets);

  useEffect(() => {
    const channel = supabase
      .channel("tickets-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, (payload) => {
        setTickets((prev) => {
          if (payload.eventType === "INSERT") return [...prev, payload.new as Ticket];
          if (payload.eventType === "UPDATE")
            return prev.map((t) => (t.id === (payload.new as Ticket).id ? (payload.new as Ticket) : t));
          if (payload.eventType === "DELETE") return prev.filter((t) => t.id !== (payload.old as Ticket).id);
          return prev;
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const propertyName = (id: string) => properties.find((p) => p.id === id)?.name || "Unknown property";
  const clientName = (id: string | null) => (id && profilesById[id]?.full_name) || "Unknown";
  const canManage = profile.role === "maintenance" || profile.role === "project_manager" || profile.role === "super_agent";

  const updateStatus = async (id: string, status: Ticket["status"]) => {
    await supabase.from("tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <MCard icon={AlertCircle} label="Open" value={tickets.filter((t) => t.status === "open").length} color={C.red} trend={undefined} sub={undefined} />
        <MCard icon={RefreshCw} label="In Progress" value={tickets.filter((t) => t.status === "in_progress").length} color={C.amber} trend={undefined} sub={undefined} />
        <MCard icon={CheckCircle} label="Resolved" value={tickets.filter((t) => t.status === "resolved").length} color={C.emerald} trend={undefined} sub={undefined} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {tickets.map((t) => (
          <div
            key={t.id}
            style={{
              background: C.cardBg,
              borderRadius: 16,
              padding: 24,
              border: `1px solid ${C.border}`,
              borderLeft: `4px solid ${t.priority === "critical" ? C.red : t.priority === "high" ? C.amber : t.priority === "medium" ? C.blue : C.gray}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.charcoal, marginBottom: 4 }}>{t.title}</div>
                <div style={{ fontSize: 13, color: C.gray }}>
                  {propertyName(t.property_id)} · <strong>{t.unit || "—"}</strong> · Reported by {clientName(t.client_id)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <Badge
                  text={t.priority}
                  color={t.priority === "critical" ? C.red : t.priority === "high" ? C.amber : t.priority === "medium" ? C.blue : C.gray}
                  bg={t.priority === "critical" ? "#FEE2E2" : t.priority === "high" ? "#FEF3C7" : t.priority === "medium" ? "#DBEAFE" : "#F3F4F6"}
                />
                <Badge text={SCFG[t.status]?.label || t.status} color={SCFG[t.status]?.color} bg={SCFG[t.status]?.bg} />
              </div>
            </div>
            <p style={{ fontSize: 13, color: C.gray, margin: "0 0 16px", lineHeight: 1.6 }}>{t.description}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 12, color: C.grayLight }}>
                Reported: {new Date(t.created_at).toLocaleDateString()}
              </span>
              {canManage && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {t.status === "open" && (
                    <button onClick={() => updateStatus(t.id, "in_progress")} style={{ padding: "7px 16px", background: "#FEF3C7", color: C.amber, border: `1px solid ${C.amber}30`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Start Work
                    </button>
                  )}
                  {t.status === "in_progress" && (
                    <button onClick={() => updateStatus(t.id, "resolved")} style={{ padding: "7px 16px", background: "#D1FAE5", color: C.emerald, border: `1px solid ${C.emerald}30`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Check size={12} /> Mark Resolved
                    </button>
                  )}
                  {t.status === "resolved" && (
                    <button onClick={() => updateStatus(t.id, "open")} style={{ padding: "7px 16px", background: C.cream, color: C.gray, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
                      Reopen
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {tickets.length === 0 && <div style={{ color: C.gray, fontSize: 13, textAlign: "center", padding: 40 }}>No maintenance tickets.</div>}
      </div>
    </div>
  );
}
