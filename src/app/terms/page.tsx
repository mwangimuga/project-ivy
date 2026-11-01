import Link from "next/link";
import { LEGAL_SECTIONS, TERMS_VERSION, TERMS_EFFECTIVE, OPERATOR, type Audience } from "@/lib/legal";
import { FEE_TIERS, kes, paymentFeeFor, withdrawalFeeFor } from "@/lib/feeSchedule";

export const metadata = {
  title: "Terms of Use — Project Ivy by Infoma",
  description: "The agreement between Infoma and everyone who uses Project Ivy: landlords, clients and staff — including fees, payments, tenancies and privacy.",
};

const C = {
  forest: "#4CAF50",
  dark: "#14171A",
  cream: "#F6F7F9",
  warmWhite: "#FBFBFC",
  charcoal: "#16181A",
  gray: "#667085",
  border: "#E4E7EC",
  amber: "#B45309",
  white: "#FFFFFF",
};

const AUDIENCE_LABEL: Record<Audience, string> = {
  all: "Applies to everyone",
  landlord: "Applies to Landlords",
  client: "Applies to Clients",
};

const examplePayments = [30000, 120000, 250000];
const exampleWithdrawals = [100000, 300000];

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: C.warmWhite, fontFamily: "var(--font-outfit), sans-serif", color: C.charcoal }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(251,251,252,0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ivy-logo-light.png" alt="Project Ivy by Infoma" style={{ height: 38, width: "auto" }} />
        </Link>
        <div style={{ display: "flex", gap: 6 }}>
          <Link href="/" style={{ padding: "9px 14px", color: C.charcoal, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Home</Link>
          <Link href="/login" style={{ padding: "9px 14px", color: C.forest, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "56px 24px 100px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
          Legal · Version {TERMS_VERSION} · Effective {TERMS_EFFECTIVE}
        </div>
        <h1 style={{ fontSize: "clamp(30px, 5vw, 42px)", fontWeight: 700, lineHeight: 1.15, margin: "0 0 18px" }}>Terms of Use</h1>
        <p style={{ fontSize: 16, color: C.gray, lineHeight: 1.7, margin: "0 0 28px" }}>
          This is the agreement between {OPERATOR.name} (which runs {OPERATOR.product}) and everyone who uses it — landlords, clients and staff. It covers how the platform works, what it costs, how money moves, how tenancies start and end, and how your data is handled. Please read it; you are asked to accept it when you sign up and again whenever it changes.
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          {(["all", "landlord", "client"] as Audience[]).map((a) => (
            <span key={a} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20, background: a === "landlord" ? "#DBEAFE" : a === "client" ? "#FEF3C7" : C.cream, color: a === "landlord" ? "#1D4ED8" : a === "client" ? "#92400E" : C.gray }}>
              {AUDIENCE_LABEL[a]}
            </span>
          ))}
        </div>

        <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 44 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Contents</div>
          <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6, fontSize: 14 }}>
            {LEGAL_SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} style={{ color: C.charcoal, textDecoration: "none", fontWeight: 500 }}>{s.title}</a>
              </li>
            ))}
          </ol>
        </div>

        {LEGAL_SECTIONS.map((s, si) => (
          <section key={s.id} id={s.id} style={{ marginBottom: 44, scrollMarginTop: 84 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
                {si + 1}. {s.title}
              </h2>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: C.gray }}>{AUDIENCE_LABEL[s.audience]}</span>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {s.clauses.map((c, ci) => (
                <p key={ci} style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: "#344054", paddingLeft: 44, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, top: 0, fontSize: 13, fontWeight: 600, color: C.gray }}>
                    {si + 1}.{ci + 1}
                  </span>
                  {c}
                </p>
              ))}
            </div>

            {s.kind === "fees" && (
              <div style={{ marginTop: 22 }}>
                <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 14 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 460 }}>
                    <thead>
                      <tr style={{ background: C.cream, textAlign: "left" }}>
                        {["Payment or withdrawal size", "Service fee per rent payment", "Withdrawal fee"].map((h) => (
                          <th key={h} style={{ padding: "12px 16px", fontSize: 12, color: C.gray, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {FEE_TIERS.map((t) => (
                        <tr key={t.tier} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td style={{ padding: "12px 16px", fontWeight: 600 }}>{t.label}</td>
                          <td style={{ padding: "12px 16px" }}>{kes(t.paymentFee)}</td>
                          <td style={{ padding: "12px 16px" }}>{t.withdrawalRatePct}% of the amount withdrawn</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 16, fontSize: 14, color: "#344054", lineHeight: 1.7 }}>
                  <strong>Worked examples.</strong>
                  <ul style={{ margin: "8px 0 0", paddingLeft: 20, display: "grid", gap: 4 }}>
                    {examplePayments.map((p) => (
                      <li key={p}>
                        A Client pays {kes(p)} → service fee {kes(paymentFeeFor(p))} → the Landlord’s balance is credited {kes(p - paymentFeeFor(p))}.
                      </li>
                    ))}
                    {exampleWithdrawals.map((w) => (
                      <li key={w}>
                        A Landlord withdraws {kes(w)} → withdrawal fee {kes(withdrawalFeeFor(w))} → {kes(w - withdrawalFeeFor(w))} is paid out.
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        ))}

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, fontSize: 13, color: C.gray, lineHeight: 1.7 }}>
          {OPERATOR.registration && <div>{OPERATOR.registration}</div>}
          <div>
            {OPERATOR.name} · {OPERATOR.location} ·{" "}
            <a href={`mailto:${OPERATOR.email}`} style={{ color: C.forest, fontWeight: 600 }}>{OPERATOR.email}</a>
          </div>
          <div style={{ marginTop: 6 }}>
            <Link href="/about" style={{ color: C.gray }}>About Ivy and Infoma</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
