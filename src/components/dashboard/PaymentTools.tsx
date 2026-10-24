"use client";

import { useState } from "react";
import { RefreshCw, FileText, Receipt, X, Printer } from "lucide-react";
import { C, Badge, fmtKSh } from "@/components/ProjectIvy";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
import { getErrorMessage } from "@/lib/errors";
import type { Lease, LedgerEntry, Profile } from "@/lib/types/database";

/* ───────────── Autopay (client) ───────────── */
export function AutopayCard({ lease, onChanged }: { lease: Lease; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const hasCard = !!lease.paystack_authorization_code;

  const toggle = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetchWithRetry(
        "/api/payments/autopay/toggle",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leaseId: lease.id, enable: !lease.autopay_enabled }) },
        { onSlow: () => setNotice({ msg: "This is taking longer than expected — still working on it…", type: "success" }) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't update autopay");
      setNotice({ msg: data.autopay_enabled ? "Autopay is on — rent will be charged to your saved card automatically." : "Autopay is off.", type: "success" });
      onChanged();
    } catch (e) {
      setNotice({ msg: getErrorMessage(e, "Couldn't update autopay"), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: C.cardBg, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: C.forest + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <RefreshCw size={18} color={C.forest} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.charcoal }}>Autopay</div>
            <div style={{ fontSize: 13, color: C.gray, marginTop: 3, maxWidth: 460, lineHeight: 1.55 }}>
              {hasCard
                ? "Rent is charged to your saved card automatically each month — no need to remember."
                : "Pay once by card (not M-Pesa) with “Make a Payment” and your card is saved, then you can switch autopay on. M-Pesa payments can’t be saved for automatic charging."}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge text={lease.autopay_enabled ? "On" : "Off"} color={lease.autopay_enabled ? C.emerald : C.gray} bg={lease.autopay_enabled ? "#D1FAE5" : "#F3F4F6"} />
          <button
            onClick={toggle}
            disabled={busy || (!hasCard && !lease.autopay_enabled)}
            style={{ padding: "9px 20px", background: lease.autopay_enabled ? C.cardBg : C.forest, color: lease.autopay_enabled ? C.charcoal : C.white, border: lease.autopay_enabled ? `1px solid ${C.border}` : "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: busy || (!hasCard && !lease.autopay_enabled) ? 0.5 : 1 }}
          >
            {busy ? "Working…" : lease.autopay_enabled ? "Turn off" : "Turn on"}
          </button>
        </div>
      </div>
      {notice && (
        <div style={{ marginTop: 14, background: notice.type === "success" ? "#D1FAE5" : "#FEE2E2", color: notice.type === "success" ? "#065F46" : C.red, padding: "10px 14px", borderRadius: 10, fontSize: 13 }}>
          {notice.msg}
        </div>
      )}
    </div>
  );
}

/* ───────────── Invoice generator (landlord / PM / agents) ───────────── */
export function InvoiceButton({ leases, clientName }: { leases: Lease[]; clientName: (id: string) => string }) {
  const [open, setOpen] = useState(false);
  const active = leases.filter((l) => l.status === "active");
  const [leaseId, setLeaseId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const pickLease = (id: string) => {
    setLeaseId(id);
    const l = active.find((x) => x.id === id);
    if (l && !amount) setAmount(String(l.rent_amount));
  };

  const send = async () => {
    if (!leaseId || !amount || Number(amount) <= 0) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId, amount: Number(amount), description: description || undefined, dueDate: dueDate || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't create invoice");
      setNotice({ msg: "Invoice sent — Paystack has emailed the client a payment link.", type: "success" });
      setAmount("");
      setDescription("");
      setDueDate("");
    } catch (e) {
      setNotice({ msg: getErrorMessage(e, "Couldn't create invoice"), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={active.length === 0}
        title={active.length === 0 ? "No active leases to invoice yet" : undefined}
        style={{ padding: "12px 28px", background: C.cardBg, color: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, opacity: active.length === 0 ? 0.5 : 1 }}
      >
        <FileText size={16} /> Send Invoice
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.cardBg, borderRadius: 20, padding: 32, maxWidth: 460, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: C.charcoal, margin: 0 }}>Send Invoice</h3>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.gray }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: C.gray, margin: "0 0 18px", lineHeight: 1.6 }}>
              Creates a Paystack payment request and emails the client a link to pay it — no separate email setup needed.
            </p>

            {notice && (
              <div style={{ background: notice.type === "success" ? "#D1FAE5" : "#FEE2E2", color: notice.type === "success" ? "#065F46" : C.red, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
                {notice.msg}
              </div>
            )}

            <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Lease</label>
            <select value={leaseId} onChange={(e) => pickLease(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, margin: "6px 0 14px", fontSize: 14, background: C.cardBg, color: C.charcoal }}>
              <option value="">Select a tenant…</option>
              {active.map((l) => (
                <option key={l.id} value={l.id}>{clientName(l.client_id)} — {fmtKSh(l.rent_amount)}/mo</option>
              ))}
            </select>

            <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Amount (KSh)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, margin: "6px 0 14px", fontSize: 14, fontFamily: "inherit", background: C.cardBg, color: C.charcoal }} />

            <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Description <span style={{ fontWeight: 400, color: C.gray }}>(optional)</span></label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. August rent" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, margin: "6px 0 14px", fontSize: 14, fontFamily: "inherit", background: C.cardBg, color: C.charcoal }} />

            <label style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>Due date <span style={{ fontWeight: 400, color: C.gray }}>(optional)</span></label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, margin: "6px 0 20px", fontSize: 14, fontFamily: "inherit", background: C.cardBg, color: C.charcoal }} />

            <button onClick={send} disabled={busy || !leaseId || !amount} style={{ width: "100%", padding: 14, background: C.forest, color: C.white, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: busy || !leaseId || !amount ? 0.6 : 1 }}>
              {busy ? "Sending…" : "Send Invoice"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ───────────── Receipt (printable) ───────────── */
export function ReceiptButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", background: C.cream, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11.5, fontWeight: 600, color: C.charcoal, cursor: "pointer" }}>
      <Receipt size={12} /> Receipt
    </button>
  );
}

export function ReceiptModal({ tx, payer, showSplit, onClose }: { tx: LedgerEntry; payer: Profile | undefined; showSplit: boolean; onClose: () => void }) {
  const ref = tx.paystack_reference || tx.id.slice(0, 8).toUpperCase();
  return (
    <div className="ivy-receipt-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .ivy-receipt-print, .ivy-receipt-print * { visibility: visible !important; }
          .ivy-receipt-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
          .ivy-no-print { display: none !important; }
        }
      `}</style>
      <div className="ivy-receipt-print" style={{ background: "#FFFFFF", color: "#16181A", borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.25)" }}>
        <div className="ivy-no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#667085" }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ivy-logo-light.png" alt="Project Ivy by Infoma" style={{ height: 54, width: "auto" }} />
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#667085", marginTop: 14 }}>PAYMENT RECEIPT</div>
        </div>
        <div style={{ textAlign: "center", padding: "18px 0", borderTop: "1px dashed #E4E7EC", borderBottom: "1px dashed #E4E7EC", marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "#667085", marginBottom: 6 }}>Amount paid</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: "#16181A" }}>{fmtKSh(tx.amount)}</div>
        </div>
        {[
          ["Receipt no.", ref],
          ["Date", new Date(tx.created_at).toLocaleString()],
          ["Paid by", payer?.full_name || "—"],
          ["Description", tx.description || "Rent payment"],
          ...(showSplit ? [["IVY service fee", fmtKSh(tx.system_cut)], ["Landlord receives", fmtKSh(tx.landlord_share)]] : []),
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "9px 0", fontSize: 13.5 }}>
            <span style={{ color: "#667085" }}>{k}</span>
            <span style={{ fontWeight: 600, textAlign: "right", wordBreak: "break-word" }}>{v}</span>
          </div>
        ))}
        <div style={{ textAlign: "center", fontSize: 11.5, color: "#98A2B3", marginTop: 20, lineHeight: 1.6 }}>
          Thank you. This receipt was generated automatically after your payment was confirmed by Paystack.
        </div>
        <button className="ivy-no-print" onClick={() => window.print()} style={{ width: "100%", marginTop: 20, padding: 12, background: "#4CAF50", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Printer size={15} /> Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
