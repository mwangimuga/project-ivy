"use client";

import { useState } from "react";
import { ScrollText, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/components/ProjectIvy";
import { GATE_SUMMARY, TERMS_VERSION, TERMS_EFFECTIVE } from "@/lib/legal";
import { getErrorMessage } from "@/lib/errors";
import type { LegalDocument } from "@/lib/types/database";

const TITLES: Record<LegalDocument, string> = {
  terms: "Terms of Use",
  landlord_agreement: "Landlord Agreement",
};
const LINKS: Record<LegalDocument, string> = {
  terms: "/terms",
  landlord_agreement: "/terms#landlord-agreement",
};

/**
 * Blocks the dashboard until the signed-in user has accepted the CURRENT
 * version of the Terms (and, for landlords, the Landlord Agreement). Acceptance
 * is stored with the version and a timestamp, so there is a record of who
 * agreed to what, and a new version re-prompts everybody.
 */
export default function TermsGate({
  userId,
  needed,
  onAccepted,
  onLogout,
}: {
  userId: string;
  needed: LegalDocument[];
  onAccepted: () => void;
  onLogout: () => void;
}) {
  const supabase = createClient();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = async () => {
    setBusy(true);
    setError(null);
    try {
      const { error: insertError } = await supabase
        .from("terms_acceptances")
        .insert(needed.map((document) => ({ user_id: userId, document, version: TERMS_VERSION })));
      // 23505 = already recorded (e.g. double-click or second tab): that is success.
      if (insertError && insertError.code !== "23505") throw insertError;
      onAccepted();
    } catch (e) {
      setError(getErrorMessage(e, "We couldn’t record your acceptance. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(10,12,14,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.cardBg, borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "94vh", overflowY: "auto", padding: 28, boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: C.forest + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ScrollText size={20} color={C.forest} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.charcoal }}>Before you continue</div>
            <div style={{ fontSize: 12.5, color: C.gray }}>Version {TERMS_VERSION} · effective {TERMS_EFFECTIVE}</div>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: C.gray, lineHeight: 1.6, margin: "12px 0 16px" }}>
          Please review and accept the following to keep using Ivy. This is a summary — the full text is what binds you.
        </p>

        {needed.map((doc) => (
          <div key={doc} style={{ background: C.cream, borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal }}>{TITLES[doc]}</div>
              <a href={LINKS[doc]} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: C.forest, display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                Read in full <ExternalLink size={12} />
              </a>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 5, fontSize: 13, color: C.charcoalLight, lineHeight: 1.5 }}>
              {GATE_SUMMARY[doc].map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}

        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", margin: "16px 0", fontSize: 13.5, color: C.charcoal, lineHeight: 1.5, cursor: "pointer" }}>
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16, accentColor: "#4CAF50", flexShrink: 0 }} />
          <span>I have read and agree to {needed.map((d) => TITLES[d]).join(" and the ")}.</span>
        </label>

        {error && <div style={{ background: "#FEE2E2", color: C.red, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button
          onClick={accept}
          disabled={!checked || busy}
          style={{ width: "100%", padding: 14, background: C.forest, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: !checked || busy ? "not-allowed" : "pointer", opacity: !checked || busy ? 0.55 : 1 }}
        >
          {busy ? "Saving…" : "Accept and continue"}
        </button>
        <button onClick={onLogout} style={{ width: "100%", marginTop: 10, padding: 10, background: "none", color: C.gray, border: "none", fontSize: 13, cursor: "pointer" }}>
          I don’t agree — sign me out
        </button>
      </div>
    </div>
  );
}
