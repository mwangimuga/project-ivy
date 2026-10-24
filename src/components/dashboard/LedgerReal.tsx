"use client";

import { useState } from "react";
import { Wallet, TrendingUp, CreditCard, DollarSign, Download, FileText, X, BarChart2 } from "lucide-react";
import { MCard as MCardBase, Badge, SHdr as SHdrBase, Fld as FldBase, fmtKSh, C } from "@/components/ProjectIvy";

// These three are exported from an untyped .jsx design-system file; cast
// once here rather than threading every optional prop through call sites.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MCard = MCardBase as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SHdr = SHdrBase as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Fld = FldBase as any;
import type { LedgerEntry, Lease, Profile } from "@/lib/types/database";
import { getErrorMessage } from "@/lib/errors";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
import { AutopayCard, InvoiceButton, ReceiptButton, ReceiptModal } from "@/components/dashboard/PaymentTools";
import { calculatePaymentSplit, calculateWithdrawalFee, calculateTier } from "@/lib/types/database";

// Defined at module scope (not inside LedgerReal) deliberately: a component
// defined inside another component's body gets a new function identity on
// every render, which makes React treat it as a different component type
// and remount its entire subtree — including any <input> inside it — on
// every keystroke. That remount is what drops focus/cursor position.
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.cardBg, borderRadius: 20, padding: 40, maxWidth: 460, width: "100%", boxShadow: "0 32px 80px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: C.charcoal, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.gray }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function LedgerReal({
  profile,
  ledger,
  leases,
  profilesById = {},
  onChanged = () => {},
}: {
  profile: Profile;
  ledger: LedgerEntry[];
  leases: Lease[];
  profilesById?: Record<string, Profile>;
  onChanged?: () => void;
}) {
  const [receiptTx, setReceiptTx] = useState<LedgerEntry | null>(null);
  const [showPay, setShowPay] = useState(false);
  const [showWD, setShowWD] = useState(false);
  const [payAmt, setPayAmt] = useState("");
  const [wdAmt, setWdAmt] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const sys = ledger.reduce((s, t) => s + (t.system_cut || 0), 0);
  const vol = ledger.filter((t) => t.transaction_type === "payment").reduce((s, t) => s + t.amount, 0);
  const llInc = ledger.filter((t) => t.transaction_type === "payment").reduce((s, t) => s + t.landlord_share, 0);
  const lease = leases.find((l) => l.client_id === profile.id && l.status === "active");
  const leaseBalance = lease
    ? ledger.filter((t) => t.lease_id === lease.id).reduce((s, t) => s + t.balance_change, 0)
    : 0;

  const pa = +payAmt;
  const sp = pa >= 1000 ? calculatePaymentSplit(pa) : null;
  const wa = +wdAmt;
  const wc = wa >= 10000 ? calculateWithdrawalFee(wa) : null;

  const doPayment = async () => {
    if (!sp || !lease) return;
    setBusy(true);
    setNotice(null);
    try {
      // Safe to retry: initialization only creates an unused Paystack payment
      // link — no money moves until the user completes it on Paystack's page.
      const res = await fetchWithRetry(
        "/api/payments/initialize",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leaseId: lease.id, amount: pa }) },
        { onSlow: () => setNotice("This is taking longer than expected — still working on it…") }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start payment");
      window.location.href = data.authorizationUrl;
    } catch (e) {
      setNotice(getErrorMessage(e, "Payment failed to start."));
      setBusy(false);
    }
  };

  const doWD = async () => {
    if (!wc) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/withdrawals/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: wa }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request withdrawal");
      setNotice(`Withdrawal request submitted — pending Super Agent approval. Net after fee: ${fmtKSh(wc.net)}.`);
      setShowWD(false);
      setWdAmt("");
    } catch (e) {
      setNotice(getErrorMessage(e, "Withdrawal request failed."));
    } finally {
      setBusy(false);
    }
  };


  return (
    <div>
      {notice && (
        <div style={{ background: "#DBEAFE", color: "#1D4ED8", padding: "12px 16px", borderRadius: 12, fontSize: 13, marginBottom: 20 }}>
          {notice}
        </div>
      )}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        {profile.role === "super_agent" && <MCard icon={Wallet} label="IVY System Balance" value={fmtKSh(sys)} color={C.gold} />}
        {(profile.role === "landlord" || profile.role === "super_agent") && (
          <MCard icon={TrendingUp} label="Landlord Revenue" value={fmtKSh(llInc)} color={C.forest} />
        )}
        {profile.role === "client" && lease && (
          <MCard
            icon={CreditCard}
            label="Account Balance"
            value={leaseBalance <= 0 ? `${fmtKSh(Math.abs(leaseBalance))} CR` : fmtKSh(leaseBalance)}
            color={leaseBalance <= 0 ? C.emerald : C.amber}
            sub={leaseBalance <= 0 ? "Credit (next cycle)" : "Outstanding"}
          />
        )}
        <MCard icon={DollarSign} label="Total Transactions" value={ledger.length} color={C.sage} />
        {profile.role === "super_agent" && <MCard icon={BarChart2} label="Platform Volume" value={fmtKSh(vol)} color={C.blue} />}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {profile.role === "client" && lease && (
          <button onClick={() => setShowPay(true)} style={{ padding: "12px 28px", background: C.forest, color: C.white, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCard size={16} /> Make a Payment (Paystack)
          </button>
        )}
        {profile.role === "landlord" && (
          <button onClick={() => setShowWD(true)} style={{ padding: "12px 28px", background: C.sage, color: C.white, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Download size={16} /> Request Withdrawal
          </button>
        )}
        {["landlord", "project_manager", "super_agent", "system_agent"].includes(profile.role) && (
          <InvoiceButton leases={leases} clientName={(id) => profilesById[id]?.full_name || "Tenant"} />
        )}
      </div>

      {profile.role === "client" && lease && <AutopayCard lease={lease} onChanged={onChanged} />}

      <div style={{ background: C.cardBg, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
        <SHdr title="Transaction History" icon={FileText} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {(profile.role === "client"
                  ? ["Date", "Description", "Amount", "Type", "Receipt"]
                  : ["Date", "Description", "Amount", "System Cut", "Landlord Share", "Tier", "Type", "Receipt"]
                ).map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, color: C.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ledger.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: 12, color: C.gray, whiteSpace: "nowrap" }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: 12, color: C.charcoal, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description}</td>
                  <td style={{ padding: 12, fontWeight: 700, color: tx.transaction_type === "payment" ? C.emerald : C.blue, whiteSpace: "nowrap" }}>{fmtKSh(tx.amount)}</td>
                  {profile.role !== "client" && (
                    <>
                      <td style={{ padding: 12, color: C.amber, whiteSpace: "nowrap" }}>{fmtKSh(tx.system_cut)}</td>
                      <td style={{ padding: 12, color: C.forest, fontWeight: 600, whiteSpace: "nowrap" }}>{fmtKSh(tx.landlord_share)}</td>
                      <td style={{ padding: 12, whiteSpace: "nowrap" }}>
                        {(() => { const t = calculateTier(tx.amount); return <Badge text={`Tier ${t}`} color={t === 1 ? C.sage : t === 2 ? C.gold : C.forest} bg={t === 1 ? "#CCFBF1" : t === 2 ? "#FEF3C7" : "#D1FAE5"} />; })()}
                      </td>
                    </>
                  )}
                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>
                    <Badge text={tx.transaction_type} color={tx.transaction_type === "payment" ? C.emerald : C.blue} bg={tx.transaction_type === "payment" ? "#D1FAE5" : "#DBEAFE"} />
                  </td>
                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>
                    {tx.transaction_type === "payment" ? <ReceiptButton onClick={() => setReceiptTx(tx)} /> : <span style={{ color: C.grayLight }}>—</span>}
                  </td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={profile.role === "client" ? 5 : 8} style={{ padding: 20, textAlign: "center", color: C.gray }}>
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPay && (
        <Modal title="Make a Payment" onClose={() => setShowPay(false)}>
          <div style={{ padding: 16, background: `${C.forest}10`, borderRadius: 12, marginBottom: 20, border: `1px solid ${C.forest}25` }}>
            <div style={{ fontSize: 12, color: C.forest, fontWeight: 600, marginBottom: 2 }}>POWERED BY PAYSTACK</div>
            <div style={{ fontSize: 13, color: C.gray }}>M-Pesa &amp; Card accepted. You&apos;ll be redirected to complete payment securely.</div>
          </div>
          <Fld label="Payment Amount (KSh)" type="number" value={payAmt} onChange={setPayAmt} placeholder="e.g. 85000" req />
          {sp && (
            <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#065F46", marginBottom: 8 }}>Transaction Breakdown — Tier {sp.tier}</div>
              <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#047857" }}>Amount</span>
                <span style={{ fontWeight: 600 }}>{fmtKSh(pa)}</span>
              </div>
              <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: C.amber }}>IVY Cut</span>
                <span style={{ fontWeight: 600, color: C.amber }}>− {fmtKSh(sp.systemCut)}</span>
              </div>
              <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", borderTop: "1px solid #6EE7B7", paddingTop: 6, marginTop: 4 }}>
                <span style={{ color: C.forest, fontWeight: 600 }}>Landlord Receives</span>
                <span style={{ fontWeight: 700, color: C.forest }}>{fmtKSh(sp.landlordShare)}</span>
              </div>
            </div>
          )}
          <button onClick={doPayment} disabled={!sp || busy} style={{ width: "100%", padding: 14, background: sp ? C.forest : C.grayLight, color: C.white, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: sp ? "pointer" : "not-allowed" }}>
            {busy ? "Redirecting to Paystack…" : sp ? `Pay ${fmtKSh(pa)} via Paystack` : "Enter an amount to continue"}
          </button>
        </Modal>
      )}

      {showWD && (
        <Modal title="Withdrawal Request" onClose={() => setShowWD(false)}>
          <Fld label="Withdrawal Amount (KSh)" type="number" value={wdAmt} onChange={setWdAmt} placeholder="e.g. 420000" req />
          {wc && (
            <div style={{ background: "#DBEAFE", border: "1px solid #93C5FD", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8", marginBottom: 8 }}>Breakdown — Tier {wc.tier} ({wc.rate}% fee)</div>
              <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: C.gray }}>Requested</span>
                <span style={{ fontWeight: 600 }}>{fmtKSh(wa)}</span>
              </div>
              <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: C.amber }}>IVY Fee ({wc.rate}%)</span>
                <span style={{ fontWeight: 600, color: C.amber }}>− {fmtKSh(wc.fee)}</span>
              </div>
              <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between", borderTop: "1px solid #93C5FD", paddingTop: 6, marginTop: 4 }}>
                <span style={{ color: "#1D4ED8", fontWeight: 600 }}>You Receive</span>
                <span style={{ fontWeight: 700, color: "#1D4ED8" }}>{fmtKSh(wc.net)}</span>
              </div>
            </div>
          )}
          <button onClick={doWD} disabled={!wc || busy} style={{ width: "100%", padding: 14, background: wc ? C.sage : C.grayLight, color: C.white, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: wc ? "pointer" : "not-allowed" }}>
            {busy ? "Submitting…" : "Submit Withdrawal Request"}
          </button>
        </Modal>
      )}

      {receiptTx && (
        <ReceiptModal
          tx={receiptTx}
          payer={profilesById[receiptTx.client_id]}
          showSplit={profile.role !== "client"}
          onClose={() => setReceiptTx(null)}
        />
      )}
    </div>
  );
}
