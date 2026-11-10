"use client";

import { useEffect, useState, useCallback } from "react";
import { BadgeCheck, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C, Badge } from "@/components/ProjectIvy";
import { getErrorMessage } from "@/lib/errors";
import LoadingState from "@/components/ui/LoadingState";
import type { LandlordVerification, Profile } from "@/lib/types/database";

const BASIS_LABEL: Record<string, string> = {
  title_deed: "Owns it (title deed)",
  lease_with_authority: "Leases it, may sublet",
  management_mandate: "Manages it for the owner",
};

export default function VerificationsPanel({ profilesById, onChanged }: { profilesById: Record<string, Profile>; onChanged: () => void }) {
  const supabase = createClient();
  const [items, setItems] = useState<LandlordVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("landlord_verifications").select("*").eq("status", "pending").order("created_at", { ascending: true });
    setItems((data as LandlordVerification[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // Documents live in a private bucket; open them through short-lived signed links.
  const view = async (path: string | null) => {
    if (!path) return;
    const { data, error } = await supabase.storage.from("verification-docs").createSignedUrl(path, 120);
    if (error || !data?.signedUrl) {
      setNotice({ msg: getErrorMessage(error, "Couldn’t open that document."), type: "error" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const act = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/verifications/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId: id, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Couldn’t ${action} this verification`);
      setNotice({ msg: action === "approve" ? "Landlord verified. Their listings now show the badge." : "Declined. The landlord can see your note and resubmit.", type: "success" });
      setRejecting(null);
      setNote("");
      await load();
      onChanged();
    } catch (e) {
      setNotice({ msg: getErrorMessage(e, "Something went wrong"), type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingState label="Loading verifications" size="sm" />;
  if (items.length === 0 && !notice) return null;

  return (
    <div style={{ background: C.cardBg, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal, display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <BadgeCheck size={16} /> Landlord verifications
        {items.length > 0 && <Badge text={String(items.length)} color={C.amber} bg="#FEF3C7" />}
      </div>
      <div style={{ fontSize: 12.5, color: C.gray, lineHeight: 1.6, marginBottom: 14 }}>
        Before approving: the ID must match the legal name; the ownership document must name the applicant (or the owner who authorised them); for title deeds, confirm with an official land-registry search. Approval is recorded in the audit log.
      </div>

      {notice && (
        <div style={{ background: notice.type === "success" ? "#D1FAE5" : "#FEE2E2", color: notice.type === "success" ? "#065F46" : C.red, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
          {notice.msg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((v) => (
          <div key={v.id} style={{ background: C.cream, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700, color: C.charcoal, fontSize: 14.5 }}>{v.legal_name}</div>
                <div style={{ fontSize: 12.5, color: C.gray, marginTop: 3 }}>
                  Account: {profilesById[v.user_id]?.full_name || "n/a"} (@{profilesById[v.user_id]?.username || "n/a"}) · submitted {new Date(v.created_at).toLocaleDateString("en-KE")}
                </div>
                <div style={{ fontSize: 13, color: C.charcoalLight, marginTop: 8, lineHeight: 1.7 }}>
                  ID no. <strong>{v.national_id_number}</strong> · Phone <strong>{v.phone}</strong>
                  {v.kra_pin ? <> · KRA PIN <strong>{v.kra_pin}</strong></> : null}
                  <br />Right to let: <strong>{BASIS_LABEL[v.ownership_basis] || v.ownership_basis}</strong>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignContent: "flex-start" }}>
                {[
                  ["ID", v.id_document_path],
                  ["Ownership", v.ownership_document_path],
                  ["Selfie", v.selfie_path],
                ].map(([label, path]) =>
                  path ? (
                    <button key={label} onClick={() => view(path)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.charcoal, cursor: "pointer" }}>
                      <FileText size={12} /> {label}
                    </button>
                  ) : null
                )}
              </div>
            </div>

            {rejecting === v.id ? (
              <div style={{ marginTop: 12 }}>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Tell the landlord what to fix, e.g. “ID photo is blurry, please re-upload”" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13.5, fontFamily: "inherit", background: C.cardBg, color: C.charcoal }} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => act(v.id, "reject")} disabled={busyId === v.id || note.trim().length < 5} style={{ padding: "7px 16px", background: C.red, color: "#fff", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", opacity: busyId === v.id || note.trim().length < 5 ? 0.55 : 1 }}>Send decline</button>
                  <button onClick={() => { setRejecting(null); setNote(""); }} style={{ padding: "7px 16px", background: C.cardBg, color: C.gray, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => act(v.id, "approve")} disabled={busyId === v.id} style={{ padding: "7px 18px", background: C.forest, color: "#fff", border: "none", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", opacity: busyId === v.id ? 0.6 : 1 }}>Approve</button>
                <button onClick={() => setRejecting(v.id)} style={{ padding: "7px 18px", background: C.cardBg, color: C.gray, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Decline…</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
