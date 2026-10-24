import Link from "next/link";
import { ExternalLink, Lightbulb, Shield, Sparkles, Users2 } from "lucide-react";

const C = {
  forest: "#63BC46",
  sage: "#4F9636",
  cream: "#F7F8FA",
  warmWhite: "#FAFBFC",
  charcoal: "#0A0A0A",
  gray: "#6B7280",
  border: "#E5E7EB",
  gold: "#FF3131",
  white: "#FFFFFF",
};

const DNA = [
  { icon: Lightbulb, title: "Innovation as Standard", desc: "Constantly exploring new technologies and creative approaches — not settling for the 'industry standard', but defining it." },
  { icon: Shield, title: "Unwavering Integrity", desc: "Honest, transparent communication and long-term trust with every client and every user." },
  { icon: Sparkles, title: "Relentless Excellence", desc: "Delivering high-quality work that exceeds expectations and drives tangible results." },
  { icon: Users2, title: "Deep Collaboration", desc: "Working closely with the people who use what we build, treating their goals as our own." },
];

export const metadata = {
  title: "About — Project Ivy by Infoma",
  description: "Project Ivy is a product built by Infoma, a Nairobi-based digital transformation and IT services company.",
};

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: C.warmWhite, fontFamily: "var(--font-outfit), sans-serif" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,253,249,0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ivy-logo-light.png" alt="Project Ivy by Infoma" style={{ height: 38, width: "auto" }} />
        </Link>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/properties" style={{ padding: "9px 18px", color: C.charcoal, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Browse Units</Link>
          <Link href="/login" style={{ padding: "9px 18px", color: C.forest, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "64px 24px 100px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
          About this product
        </div>
        <h1 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(32px, 5vw, 46px)", fontWeight: 600, color: C.charcoal, lineHeight: 1.15, margin: "0 0 24px" }}>
          Ivy is a product built by Infoma.
        </h1>
        <p style={{ fontSize: 17, color: C.gray, lineHeight: 1.75, marginBottom: 20 }}>
          Everything on this platform — the listings, the leases, the payment engine, the real-time chat — was designed and built by <strong>Infoma</strong>, a Nairobi-based company working at the intersection of technology and digital media. Ivy is one expression of that work: a real, live product, not a demo.
        </p>
        <p style={{ fontSize: 17, color: C.gray, lineHeight: 1.75, marginBottom: 40 }}>
          If you&apos;re a landlord, tenant, or property manager using Ivy, you&apos;re using something Infoma built end to end. If you&apos;re here because you&apos;re evaluating Infoma&apos;s work, this platform — real users, real payments, real infrastructure — is a fair sample of it.
        </p>

        <a
          href="https://infoma-new.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: C.forest, color: C.white, borderRadius: 14, fontSize: 15, fontWeight: 700, textDecoration: "none", marginBottom: 64 }}
        >
          Visit Infoma <ExternalLink size={16} />
        </a>

        <div style={{ background: C.cream, borderRadius: 20, padding: 36, marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sage, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            The name
          </div>
          <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 26, fontWeight: 600, color: C.charcoal, margin: "0 0 16px" }}>
            INFOrmation + MediA
          </h2>
          <p style={{ fontSize: 15.5, color: C.gray, lineHeight: 1.75, margin: 0 }}>
            Infoma&apos;s name is a fusion of two ideas: that in a digital world, technology and creative storytelling can&apos;t exist in isolation — they have to be interwoven to create something that actually works and actually resonates. Infoma builds software (web platforms, cloud infrastructure, automation) and brand-level digital media (identity, strategy, content) under one roof, for the same reason: the best products are engineered <em>and</em> designed with equal seriousness.
          </p>
        </div>

        <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 28, fontWeight: 600, color: C.charcoal, marginBottom: 28 }}>
          What Infoma stands on
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 64 }}>
          {DNA.map((d) => (
            <div key={d.title} style={{ padding: 24, border: `1px solid ${C.border}`, borderRadius: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: `${C.forest}12`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <d.icon size={19} color={C.forest} />
              </div>
              <h3 style={{ fontSize: 15.5, fontWeight: 700, color: C.charcoal, margin: "0 0 8px" }}>{d.title}</h3>
              <p style={{ fontSize: 13.5, color: C.gray, lineHeight: 1.65, margin: 0 }}>{d.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 40 }}>
          <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.75, marginBottom: 12 }}>
            Infoma has been driving digital transformation across East Africa since 2018, working with corporate and independent clients on IT infrastructure, software development, and brand-level digital media — either as one-off projects or ongoing retainer partnerships.
          </p>
          <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.75 }}>
            Based in Nairobi, Kenya. Reach Infoma directly at{" "}
            <a href="mailto:hello@infoma.tech" style={{ color: C.forest, fontWeight: 600 }}>hello@infoma.tech</a>, or explore their full range of services at{" "}
            <a href="https://infoma-new.netlify.app/" target="_blank" rel="noopener noreferrer" style={{ color: C.forest, fontWeight: 600 }}>infoma-new.netlify.app</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
