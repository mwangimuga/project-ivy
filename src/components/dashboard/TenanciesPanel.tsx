"use client";

import { useState } from "react";
import { CalendarClock, X, AlertTriangle, UserX } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C, Badge, fmtKSh } from "@/components/ProjectIvy";
import { getErrorMessage } from "@/lib/errors";
import type { Lease, LedgerEntry, Profile, PropertyRow } from "@/lib/types/database";

const fmtDate = (d?: string | null) =>
  d ? new Date(d.length === 10 ? d + "T00:00:00" : d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "n/a";

const daysUntil = (d: string) => Math.ceil((new Date(d + "T23:59:59").getTime() - Date.now()) / 86400000);

export default function TenanciesPanel({
  profile,
  leases,
  propertyRows,
  profilesById,
  ledger,
  onChanged,
}: {
  profile: Profile;
  leases: Lease[];
  propertyRows: PropertyRow[];
  profilesById: Record<string, Profile>;
  ledger: LedgerEntry[];
  onChanged: () => void;
}) {
  const supabase = createClient();
  const [target, setTarget] = useState<Lease | null>(null);
  const [mode, setMode] = useState<"now" | "date">("date");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // System agents can't see ledgers, so don't pretend a balance is zero.
  const showBalance = profile.role !== "system_agent";
  const balanceFor = (leaseId: string) => ledger.filter((l) => l.lease_id === leaseId).reduce((s, l) => s + (l.balance_change || 0), 0);
  const propFor = (id: string) => propertyRows.find((p) => p.id === id);
  const unitOf = (p?: PropertyRow) => {
    const d = (p?.details || {}) as Record<string, unknown>;
    return [d.floor, d.house_number].filter(Boolean).join(" · ");
  };

  const active = leases.filter((l) => l.status === "active").sort((a, b) => (a.termination_date || a.end_date).localeCompare(b.termination_date || b.end_date));
  const ended = leases
    .filter((l) => l.status === "terminated")
    .sort((a, b) => (b.terminated_at || "").localeCompare(a.terminated_at || ""))
    .slice(0, 15);

  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString("en-CA");

  const open = (l: Lease) => {
    setTarget(l);
    setMode("date");
    setDate("");
    setReason("");
    setAck(false);
    setNotice(null);
  };

  const submit = async () => {
    if (!target) return;
    setBusy(true);
    setNotice(null);
    try {
      const { error } = await supabase.rpc("end_tenancy", {
        p_lease_id: target.id,
        p_effective_date: mode === "now" ? null : date,
        p_reason: reason.trim(),
      });
      if (error) throw error;
      setNotice({ msg: mode === "now" ? "Tenancy ended. The unit is available again." : `Notice recorded. The tenancy ends after ${fmtDate(date)}.`, type: "success" });
      setTarget(null);
      onChanged();
    } catch (e) {
      setNotice({ msg: getErrorMessage(e, "Couldn’t end the tenancy."), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const cancelNotice = async (l: Lease) => {
    setBusy(true);
    setNotice(null);
    try {
      const { error } = await supabase.rpc("cancel_termination_notice", { p_lease_id: l.id });
      if (error) throw error;
      setNotice({ msg: "Notice withdrawn. The tenancy continues to its original end date.", type: "success" });
      onChanged();
    } catch (e) {
      setNotice({ msg: getErrorMessage(e, "Couldn’t withdraw the notice."), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = ack && reason.trim().length >= 5 && (mode === "now" || (date && date >= tomorrow && target && date <= target.end_date));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <CalendarClock size={20} color={C.forest} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13.5, color: C.gray, lineHeight: 1.65 }}>
          Timed tenancies <strong style={{ color: C.charcoal }}>end automatically</strong> after their end date and the unit becomes available again. To end one sooner, use <strong style={{ color: C.charcoal }}>End tenancy</strong>: pick a future date to give the tenant notice, or end it today. Always give the notice the tenancy agreement and the law require first.
        </div>
      </div>

      {notice && (
        <div style={{ background: notice.type === "success" ? "#D1FAE5" : "#FEE2E2", color: notice.type === "success" ? "#065F46" : C.red, padding: "12px 16px", borderRadius: 12, fontSize: 13 }}>
          {notice.msg}
        </div>
      )}

      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal, marginBottom: 12 }}>Active tenancies ({active.length})</div>
        {active.length === 0 ? (
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 36, textAlign: "center", color: C.gray, fontSize: 13.5 }}>
            No active tenancies right now.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {active.map((l) => {
              const prop = propFor(l.property_id);
              const bal = balanceFor(l.id);
              const effEnd = l.termination_date || l.end_date;
              const days = daysUntil(effEnd);
              return (
                <div key={l.id} style={{ background: C.cardBg, border: `1px solid ${l.termination_date ? C.amber + "66" : C.border}`, borderRadius: 16, padding: 18, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal }}>{profilesById[l.client_id]?.full_name || "Tenant"}</div>
                    <div style={{ fontSize: 13, color: C.gray, marginTop: 3 }}>
                      {prop?.name || "Property"}
                      {unitOf(prop) ? ` · ${unitOf(prop)}` : ""} · {fmtKSh(l.rent_amount)}/month
                    </div>
                    <div style={{ fontSize: 12.5, color: C.gray, marginTop: 6 }}>
                      Since {fmtDate(l.start_date)} · {l.termination_date ? "ends" : "auto-ends"} <strong style={{ color: C.charcoal }}>{fmtDate(effEnd)}</strong>
                      {days >= 0 ? ` (${days} day${days === 1 ? "" : "s"} left)` : ""}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                      {l.termination_date ? <Badge text="Notice given" color={C.amber} bg="#FEF3C7" /> : <Badge text="Timed tenancy" color={C.gray} bg="#F3F4F6" />}
                      {showBalance && bal > 0 && <Badge text={`Owes ${fmtKSh(bal)}`} color={C.red} bg="#FEE2E2" />}
                      {l.autopay_enabled && <Badge text="Autopay on" color={C.emerald} bg="#D1FAE5" />}
                    </div>
                    {l.termination_date && l.termination_reason && (
                      <div style={{ fontSize: 12.5, color: C.gray, marginTop: 8 }}>Reason given: {l.termination_reason}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                    {l.termination_date && (
                      <button onClick={() => cancelNotice(l)} disabled={busy} style={{ padding: "8px 14px", background: C.cardBg, color: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                        Withdraw notice
                      </button>
                    )}
                    <button onClick={() => open(l)} style={{ padding: "8px 14px", background: "#FEE2E2", color: C.red, border: "1px solid #FCA5A5", borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <UserX size={13} /> End tenancy
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {ended.length > 0 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal, marginBottom: 12 }}>Recently ended</div>
          <div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
            {ended.map((l, i) => (
              <div key={l.id} style={{ padding: "14px 18px", borderTop: i ? `1px solid ${C.border}` : "none", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal }}>{profilesById[l.client_id]?.full_name || "Tenant"} · {propFor(l.property_id)?.name || "Property"}</div>
                  <div style={{ fontSize: 12.5, color: C.gray, marginTop: 3 }}>{l.termination_reason || "Tenancy ended"}</div>
                </div>
                <div style={{ fontSize: 12.5, color: C.gray, textAlign: "right" }}>
                  Ended {fmtDate(l.terminated_at || l.termination_date)}
                  {showBalance && balanceFor(l.id) > 0 && <div style={{ color: C.red, fontWeight: 600 }}>Owes {fmtKSh(balanceFor(l.id))}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {target && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: C.cardBg, borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, maxHeight: "94vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: C.charcoal, margin: 0 }}>End tenancy</h3>
              <button onClick={() => setTarget(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.gray }}><X size={20} /></button>
            </div>
            <div style={{ fontSize: 13.5, color: C.gray, marginBottom: 16 }}>
              {profilesById[target.client_id]?.full_name || "Tenant"} · {propFor(target.property_id)?.name || "Property"} · tenancy runs to {fmtDate(target.end_date)}
            </div>

            {showBalance && balanceFor(target.id) > 0 && (
              <div style={{ background: "#FEF3C7", color: "#92400E", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 14, display: "flex", gap: 8 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>This tenant owes {fmtKSh(balanceFor(target.id))}. Ending the tenancy does not clear it. It stays recorded and payable. Settle any deposit separately.</span>
              </div>
            )}

            <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
              {([["date", "Give notice and end on a future date"], ["now", "End today (immediately)"]] as const).map(([v, label]) => (
                <label key={v} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", border: `1.5px solid ${mode === v ? C.forest : C.border}`, borderRadius: 12, cursor: "pointer", fontSize: 13.5, color: C.charcoal }}>
                  <input type="radio" name="mode" checked={mode === v} onChange={() => setMode(v)} style={{ accentColor: "#4CAF50" }} />
                  {label}
                </label>
              ))}
            </div>

            {mode === "date" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Last day of the tenancy</label>
                <input type="date" value={date} min={tomorrow} max={target.end_date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, marginTop: 6, fontSize: 14, fontFamily: "inherit", background: C.cardBg, color: C.charcoal }} />
                <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>It can’t be later than the tenancy’s own end date. The tenant sees this notice on their dashboard.</div>
              </div>
            )}

            <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. Landlord is selling · Tenant requested early exit · Lease not renewed" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, margin: "6px 0 14px", fontSize: 14, fontFamily: "inherit", resize: "vertical", background: C.cardBg, color: C.charcoal }} />

            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12.5, color: C.charcoalLight, lineHeight: 1.55, marginBottom: 16, cursor: "pointer" }}>
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ marginTop: 3, accentColor: "#4CAF50", flexShrink: 0 }} />
              <span>I confirm I have given the notice the tenancy agreement and the law require, that I have a lawful reason, and that I will not use lock-outs, removal of belongings or cutting off utilities to remove the tenant.</span>
            </label>

            {notice?.type === "error" && <div style={{ background: "#FEE2E2", color: C.red, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{notice.msg}</div>}

            <button onClick={submit} disabled={!canSubmit || busy} style={{ width: "100%", padding: 13, background: C.red, color: "#fff", border: "none", borderRadius: 12, fontSize: 14.5, fontWeight: 700, cursor: !canSubmit || busy ? "not-allowed" : "pointer", opacity: !canSubmit || busy ? 0.55 : 1 }}>
              {busy ? "Saving…" : mode === "now" ? "End tenancy now" : "Record notice"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
