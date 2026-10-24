"use client";

import { useEffect, useState } from "react";
import { ScrollText, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge, C } from "@/components/ProjectIvy";
import LoadingState from "@/components/ui/LoadingState";
import type { Profile } from "@/lib/types/database";

interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const ACTION_COLOR: Record<string, string> = {
  insert: C.emerald,
  update: C.blue,
  delete: C.red,
  impersonate: "#7C3AED",
  admin_create_user: C.gold,
  admin_delete_user: C.red,
};

export default function AuditLogs({ profilesById }: { profilesById: Record<string, Profile> }) {
  const supabase = createClient();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterTable, setFilterTable] = useState<string>("all");

  useEffect(() => {
    let active = true;
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300)
      .then(({ data }) => {
        if (active && data) setLogs(data as AuditLog[]);
        setLoading(false);
      });

    const channel = supabase
      .channel("audit-logs-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, (payload) => {
        setLogs((prev) => [payload.new as AuditLog, ...prev].slice(0, 300));
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const tables = Array.from(new Set(logs.map((l) => l.target_table)));
  const filtered = filterTable === "all" ? logs : logs.filter((l) => l.target_table === filterTable);

  if (loading) return <LoadingState label="Loading activity" />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 13, color: C.gray }}>{filtered.length} recent events (last 300, newest first)</div>
        <select
          value={filterTable}
          onChange={(e) => setFilterTable(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, background: "white" }}
        >
          <option value="all">All tables</option>
          {tables.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div style={{ background: C.cardBg, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: C.gray, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <ScrollText size={24} color={C.grayLight} />
            No activity recorded yet.
          </div>
        )}
        {filtered.map((log, i) => {
          const actor = log.actor_id ? profilesById[log.actor_id] : null;
          const isOpen = expanded === log.id;
          return (
            <div key={log.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <button
                onClick={() => setExpanded(isOpen ? null : log.id)}
                style={{ width: "100%", textAlign: "left", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer" }}
              >
                <Badge text={log.action} color={ACTION_COLOR[log.action] || C.gray} bg={(ACTION_COLOR[log.action] || C.gray) + "18"} />
                <span style={{ fontSize: 13, color: C.charcoal, fontWeight: 600 }}>{log.target_table}</span>
                <span style={{ fontSize: 12, color: C.gray, flex: 1 }}>
                  {actor ? actor.full_name : "System"} · {new Date(log.created_at).toLocaleString()}
                </span>
                {isOpen ? <ChevronUp size={16} color={C.gray} /> : <ChevronDown size={16} color={C.gray} />}
              </button>
              {isOpen && (
                <pre
                  style={{
                    margin: 0,
                    padding: "0 20px 16px",
                    fontSize: 11,
                    color: C.gray,
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    background: C.cream,
                  }}
                >
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
