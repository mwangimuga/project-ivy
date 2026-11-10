import Link from "next/link";
import { ArrowRight, ExternalLink, Receipt, BadgeCheck, FileText, Mail } from "lucide-react";

const C = {
  forest: "#4CAF50",
  green: "#2E7D32",
  cream: "#F6F7F9",
  warmWhite: "#FBFBFC",
  charcoal: "#16181A",
  gray: "#667085",
  border: "#E4E7EC",
};

const COMMITMENTS = [
  { icon: Receipt, title: "Fees in plain sight", text: "Our fee schedule is published in the Terms. Tenants pay no extra fee to Ivy." },
  { icon: BadgeCheck, title: "Landlords are checked", text: "Landlords upload their ID and proof that they can let the property before new listings go live." },
  { icon: FileText, title: "Records you can check", text: "Every payment has a receipt, and important actions on the platform are written to an audit log." },
  { icon: Mail, title: "A team you can write to", text: "Email hello@infoma.tech and you will reach the people who built Ivy." },
];

export const metadata = {
  title: "About Project Ivy and Infoma",
  description: "Project Ivy is a rent collection and property management platform built by Infoma, a digital services company in Nairobi.",
};

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: C.warmWhite, fontFamily: "var(--font-outfit), sans-serif", color: C.charcoal }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(251,251,252,0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ivy-logo-light.png" alt="Project Ivy by Infoma" style={{ height: 38, width: "auto" }} />
        </Link>
        <div style={{ display: "flex", gap: 4 }}>
          <Link href="/" style={{ padding: "9px 14px", color: C.charcoal, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Home</Link>
          <Link href="/properties" style={{ padding: "9px 14px", color: C.charcoal, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Browse units</Link>
          <Link href="/login" style={{ padding: "9px 14px", color: C.green, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "64px 24px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 700, color: C.gray, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 18 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#F03E3E", display: "inline-block" }} />
          About
        </div>
        <h1 style={{ fontSize: "clamp(34px, 5.6vw, 54px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.035em", margin: "0 0 22px" }}>
          Ivy is built by <span style={{ color: C.forest }}>Infoma</span>.
        </h1>
        <p style={{ fontSize: 18, color: C.gray, lineHeight: 1.75, margin: "0 0 18px" }}>
          Infoma is a small digital services company in Nairobi. We build software and do brand and media work for businesses across East Africa. Ivy is the product we built to take the paperwork out of renting.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "28px 0 64px" }}>
          <a
            href="https://infoma-new.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 26px", background: C.charcoal, color: "#fff", borderRadius: 999, fontSize: 14.5, fontWeight: 700, textDecoration: "none" }}
          >
            Visit Infoma <ExternalLink size={15} />
          </a>
          <Link
            href="/terms"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", background: "#fff", color: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 999, fontSize: 14.5, fontWeight: 700, textDecoration: "none" }}
          >
            Read the Terms <ArrowRight size={15} />
          </Link>
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 14px" }}>Why we built it</h2>
        <p style={{ fontSize: 16.5, color: C.gray, lineHeight: 1.8, margin: "0 0 14px" }}>
          In a lot of rentals, rent is tracked through WhatsApp messages, paper receipts and spreadsheets. A payment is made and nobody can find the proof. A repair request gets buried. A landlord isn&apos;t sure who is up to date.
        </p>
        <p style={{ fontSize: 16.5, color: C.gray, lineHeight: 1.8, margin: "0 0 56px" }}>
          Ivy puts payments, receipts, repairs, messages and lease dates in one place that tenants, landlords and their managers can all see.
        </p>

        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 22px" }}>What we commit to</h2>
        <div className="ivy-about-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 64 }}>
          {COMMITMENTS.map((c) => (
            <div key={c.title} style={{ padding: 24, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 20 }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: "#EAF6E7", color: C.green, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <c.icon size={19} />
              </div>
              <h3 style={{ fontSize: 16.5, fontWeight: 700, margin: "0 0 6px" }}>{c.title}</h3>
              <p style={{ fontSize: 14.5, color: C.gray, lineHeight: 1.65, margin: 0 }}>{c.text}</p>
            </div>
          ))}
        </div>

        <div style={{ background: C.cream, borderRadius: 24, padding: 32, marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px" }}>About Infoma</h2>
          <p style={{ fontSize: 15.5, color: C.gray, lineHeight: 1.8, margin: "0 0 12px" }}>
            Infoma has worked with companies and independent clients in East Africa since 2018 on IT infrastructure, software and digital media, either as one-off projects or on an ongoing basis.
          </p>
          <p style={{ fontSize: 15.5, color: C.gray, lineHeight: 1.8, margin: 0 }}>
            The name is short for <strong style={{ color: C.charcoal }}>information</strong> and <strong style={{ color: C.charcoal }}>media</strong>. We think software and communication work best when they are built together.
          </p>
        </div>

        <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.8, margin: 0 }}>
          Questions about Ivy? Write to{" "}
          <a href="mailto:hello@infoma.tech" style={{ color: C.green, fontWeight: 600 }}>hello@infoma.tech</a>. To see what else we build, visit{" "}
          <a href="https://infoma-new.netlify.app/" target="_blank" rel="noopener noreferrer" style={{ color: C.green, fontWeight: 600 }}>infoma-new.netlify.app</a>.
        </p>
      </div>
    </div>
  );
}
