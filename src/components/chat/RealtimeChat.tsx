"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LoadingState from "@/components/ui/LoadingState";
import type { ChatStream, Profile } from "@/lib/types/database";

const C = { forest: "#4CAF50", forestLight: "#66BB6A", sage: "#3F8B2C", cream: "#F6F7F9", charcoal: "#16181A", gray: "#667085", border: "#E4E7EC", white: "#FFFFFF", cardBg: "#FFFFFF" };

const STREAMS: { key: ChatStream; label: string }[] = [
  { key: "maintenance", label: "Maintenance" },
  { key: "security", label: "Security" },
  { key: "billing", label: "Billing" },
];

interface ChatMessage {
  id: string;
  sender_id: string;
  lease_id: string;
  stream_type: ChatStream;
  content: string;
  created_at: string;
  sender_name?: string;
}

/**
 * Unified Operations Chat — real-time, Supabase-backed.
 * Clients open a stream tied to their active lease; the stream
 * determines routing (maintenance → caretakers, security/billing →
 * project managers). Rows insert into `public.messages` and are
 * pushed to every subscriber over Supabase Realtime (WebSockets),
 * which is exactly the kind of persistent-connection workload that
 * would NOT survive on Vercel's serverless functions — it lives in
 * Supabase's own realtime infra instead, so the app stays 100%
 * deployable on Vercel.
 */
export default function RealtimeChat({
  profile,
  leaseId,
}: {
  profile: Profile;
  leaseId: string;
}) {
  const supabase = createClient();
  const [stream, setStream] = useState<ChatStream>("maintenance");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    supabase
      .from("messages")
      .select("*")
      .eq("lease_id", leaseId)
      .eq("stream_type", stream)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active) {
          setMessages((data as ChatMessage[]) || []);
          setLoading(false);
        }
      });

    const channel = supabase
      .channel(`messages-${leaseId}-${stream}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `lease_id=eq.${leaseId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          if (row.stream_type === stream) {
            setMessages((prev) => [...prev, row]);
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [leaseId, stream, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    await supabase.from("messages").insert({
      sender_id: profile.id,
      lease_id: leaseId,
      stream_type: stream,
      content,
    });
    // No local optimistic push needed — the Realtime subscription above
    // will receive our own INSERT and render it.
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 180px)", background: C.cardBg, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      <div style={{ width: 200, borderRight: `1px solid ${C.border}`, background: C.cream, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
          Streams
        </div>
        {STREAMS.map((s) => (
          <button
            key={s.key}
            onClick={() => setStream(s.key)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              marginBottom: 6,
              background: stream === s.key ? C.forest : "transparent",
              color: stream === s.key ? C.white : C.charcoal,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          {loading && <LoadingState label="Loading conversation" size="sm" />}
          {!loading && messages.length === 0 && (
            <div style={{ color: C.gray, fontSize: 13 }}>No messages yet in this stream.</div>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === profile.id;
            return (
              <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                <div
                  style={{
                    background: mine ? C.forestLight : C.cream,
                    color: mine ? C.white : C.charcoal,
                    padding: "10px 14px",
                    borderRadius: 14,
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {m.content}
                </div>
                <div style={{ fontSize: 10, color: C.gray, marginTop: 4, textAlign: mine ? "right" : "left" }}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: "flex", gap: 8, padding: 16, borderTop: `1px solid ${C.border}` }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`Message ${stream}…`}
            style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "inherit" }}
          />
          <button
            onClick={send}
            style={{ width: 44, height: 44, borderRadius: 12, border: "none", background: C.forest, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
