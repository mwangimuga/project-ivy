"use client";

import { Zap, Lock, Radio, Database, Server, Layers, GitBranch } from "lucide-react";
import { C } from "@/components/ProjectIvy";

const TIERS = [
  { t: 1, range: "KSh 10K–50K", cut: "KSh 20", wd: "2.0%", c: C.sage },
  { t: 2, range: "KSh 50K–200K", cut: "KSh 50", wd: "2.5%", c: C.gold },
  { t: 3, range: "Above KSh 200K", cut: "KSh 500", wd: "3.0%", c: C.forest },
];

const TECH_FACTS = [
  { icon: Database, title: "Database", desc: "PostgreSQL via Supabase. Row-Level Security enforces every access rule at the database layer — not just in application code — so a client physically cannot query a landlord's revenue, an API bug or a compromised session notwithstanding." },
  { icon: Server, title: "Hosting", desc: "Next.js 15 (App Router) on Vercel. API routes run on Vercel's Node.js serverless runtime; the marketing site is statically generated where possible." },
  { icon: Radio, title: "Realtime", desc: "Ledger balances, chat, tickets, and audit logs push live over WebSocket via Supabase Realtime — a persistent-connection workload that deliberately runs outside Vercel's serverless functions, which can't hold long-lived connections." },
  { icon: Lock, title: "Payments", desc: "Paystack. Webhook payloads are verified with an HMAC-SHA512 signature before any ledger write happens. The tiered split itself is computed by a Postgres function (calc_payment_split), not application code, so it can't drift regardless of what calls it." },
  { icon: Layers, title: "3D tours", desc: "React Three Fiber + drei, rendering .glb files uploaded to Supabase Storage, client-side only." },
  { icon: GitBranch, title: "Audit trail", desc: "A Postgres trigger logs every insert/update/delete on properties, leases, profiles, tickets, and withdrawal requests to audit_logs automatically — it can't be bypassed by forgetting to log something in a route handler." },
];

export default function SystemInfo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#92400E" }}>
        Super Agent only. This page documents internal mechanics — tiered pricing and system architecture — that aren&apos;t shown anywhere else in the product.
      </div>

      <div style={{ background: C.cardBg, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.charcoal, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={16} color={C.gold} /> Revenue Split Tiers
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {TIERS.map((x) => (
            <div key={x.t} style={{ padding: "16px 18px", background: x.c + "10", borderRadius: 12, border: `1px solid ${x.c}30` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: x.c, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tier {x.t}</div>
              <div style={{ fontSize: 11, color: C.gray, marginBottom: 6 }}>{x.range}</div>
              <div style={{ fontSize: 13, color: C.charcoal, marginBottom: 2 }}><strong>On Payment:</strong> {x.cut}</div>
              <div style={{ fontSize: 13, color: C.charcoal }}><strong>On Withdrawal:</strong> {x.wd}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.cardBg, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.charcoal, margin: "0 0 16px" }}>Architecture</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {TECH_FACTS.map((f) => (
            <div key={f.title} style={{ padding: 18, background: C.cream, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <f.icon size={16} color={C.forest} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: C.charcoal }}>{f.title}</span>
              </div>
              <p style={{ fontSize: 12.5, color: C.gray, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.cardBg, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.charcoal, margin: "0 0 12px" }}>Roles</h3>
        <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.7, margin: 0 }}>
          Super Agent has full administrative control (create/edit/delete any user, impersonate, edit/delete any listing, approve withdrawals). System Agent shares Super Agent&apos;s day-to-day approval powers — lease applications, ticket status, role requests — but not the higher-risk actions: no user deletion, no impersonation, no withdrawal approval, no listing deletion. Landlords can create Project Manager and Client accounts scoped to their own properties. Any user can request an additional role (e.g. a client also becoming a landlord); Super Agent or System Agent must approve it before it takes effect.
        </p>
      </div>
    </div>
  );
}
