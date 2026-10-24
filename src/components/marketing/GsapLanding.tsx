"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  ShieldCheck,
  Zap,
  Eye,
  MessageSquare,
  Wrench,
  Building2,
  Users as UsersIcon,
  Home as HomeIcon,
  TreePine,
  Bed,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Lock,
  Radio,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createClient } from "@/lib/supabase/client";
import type { PropertyRow, PropertyType } from "@/lib/types/database";

const C = {
  forest: "#4CAF50",
  forestLight: "#66BB6A",
  sage: "#3F8B2C",
  sageLight: "#8BC77A",
  mint: "#E8F5E1",
  cream: "#F6F7F9",
  warmWhite: "#FBFBFC",
  charcoal: "#16181A",
  gray: "#667085",
  border: "#E4E7EC",
  gold: "#F03E3E",
  white: "#FFFFFF",
  blue: "#2563EB",
  amber: "#D97706",
  dark: "#14171A",
  darkLight: "#1D2125",
};

const TYPE_LABEL: Record<PropertyType, string> = {
  apartment: "Apartment",
  student_housing: "Student Housing",
  commercial: "Commercial",
  land: "Land",
  airbnb: "Airbnb",
};

const TYPE_GRADIENT: Record<PropertyType, string> = {
  apartment: `linear-gradient(135deg, ${C.forest}, ${C.sage})`,
  student_housing: `linear-gradient(135deg, #1E3A8A, #3B82F6)`,
  commercial: `linear-gradient(135deg, #78350F, ${C.gold})`,
  land: `linear-gradient(135deg, #14532D, ${C.mint})`,
  airbnb: `linear-gradient(135deg, #831843, #EC4899)`,
};

const TYPE_ICON: Record<PropertyType, typeof Building2> = {
  apartment: HomeIcon,
  student_housing: UsersIcon,
  commercial: Building2,
  land: TreePine,
  airbnb: Bed,
};

function fmtKSh(n: number) {
  return "KSh " + Math.round(n || 0).toLocaleString();
}

const ROLES = [
  { icon: HomeIcon, title: "Clients", desc: "Browse real units, view 3D tours, apply in minutes, and pay rent by M-Pesa or card without leaving the platform.", color: C.forest },
  { icon: Building2, title: "Landlords", desc: "List once across five property types, watch payments settle automatically, and request withdrawals on your schedule.", color: C.gold },
  { icon: UsersIcon, title: "Project Managers", desc: "Approve applications, route maintenance tickets to the right team, and keep every property portfolio moving.", color: C.blue },
  { icon: Wrench, title: "Maintenance", desc: "Get assigned tickets in real time, update status as you work, and close the loop without a single phone call.", color: C.amber },
  { icon: ShieldCheck, title: "Super Agent", desc: "Full oversight — every ledger, every log, every account — with tiered revenue automatically reconciled.", color: C.sage },
];

const STEPS = [
  { n: "01", title: "Browse", desc: "Explore live listings — apartments, student housing, commercial space, land, or short stays — with interactive 3D tours, before you ever sign in." },
  { n: "02", title: "Apply", desc: "Create an account, submit your application for the unit you want, and a Project Manager reviews it — usually within a day." },
  { n: "03", title: "Move in", desc: "Once approved, pay your first rent via Paystack (M-Pesa or card), and your dashboard, ledger, and support chat are ready." },
];

const TRUST = [
  { icon: Lock, title: "Row-level security", desc: "Every table is protected at the database layer — a client physically cannot query a landlord's revenue, by design, not just by UI convention." },
  { icon: Zap, title: "Tiered settlement, in Postgres", desc: "Revenue splits are computed by database functions, not application code, so the math can never drift no matter what calls it." },
  { icon: Radio, title: "Real-time, end to end", desc: "Ledger balances, chat, and ticket status update live via WebSocket — no refresh button, anywhere." },
  { icon: Eye, title: "Interactive 3D tours", desc: "Walk through a listing before you visit — drag to rotate, scroll to zoom, powered by real-time 3D rendering in your browser." },
];

export default function GsapLanding() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const roleCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const vineRef = useRef<SVGPathElement>(null);

  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("properties")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setProperties((data as PropertyRow[]) || []);
        setLoadingProps(false);
      });
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Vine growth on load — the one signature motion element, contained
      // to the hero so it never has to track dynamic content height.
      if (vineRef.current) {
        const len = vineRef.current.getTotalLength();
        gsap.set(vineRef.current, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(vineRef.current, { strokeDashoffset: 0, duration: 2.2, delay: 0.3, ease: "power2.inOut" });
      }

      gsap.fromTo(
        ".hero-badge, .hero-title, .hero-sub, .hero-cta, .hero-stats",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: "power3.out", delay: 0.15 }
      );
      gsap.fromTo(".hero-card", { opacity: 0, y: 30, rotate: 6 }, { opacity: 1, y: 0, rotate: 3, duration: 1, delay: 0.5, ease: "power3.out" });

      gsap.to(".blob-1", { y: 120, scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1 } });
      gsap.to(".blob-2", { y: -80, scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 1 } });

      gsap.fromTo(".rail-label", { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.7, scrollTrigger: { trigger: ".rail-section", start: "top 80%" } });

      [".step-item", ".trust-item"].forEach((sel) => {
        gsap.utils.toArray<HTMLElement>(sel).forEach((el, i) => {
          gsap.fromTo(el, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.7, delay: i * 0.1, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 88%" } });
        });
      });

      roleCardsRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, delay: (i % 3) * 0.08, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });

      gsap.fromTo(".cta-band", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: ".cta-band", start: "top 85%" } });

      // Count-up on the hero stat once it's live data
      gsap.utils.toArray<HTMLElement>(".count-up").forEach((el) => {
        const target = Number(el.dataset.count || 0);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.4,
          delay: 0.6,
          ease: "power2.out",
          onUpdate: () => { el.textContent = Math.round(obj.val).toString(); },
        });
      });
    });

    return () => ctx.revert();
  }, [properties]);

  const scrollRail = (dir: number) => {
    railRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  const typeCount = new Set(properties.map((p) => p.property_type)).size;

  return (
    <div style={{ minHeight: "100vh", background: C.warmWhite, fontFamily: "var(--font-outfit), sans-serif", overflowX: "hidden" }}>
      {/* ============ NAV ============ */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(255,253,249,0.9)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, padding: "0 40px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ivy-logo-light.png" alt="Project Ivy by Infoma" style={{ height: 44, width: "auto" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Link href="/properties" className="ivy-hide-mobile" style={{ padding: "10px 18px", color: C.charcoal, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Browse Units
          </Link>
          <Link href="/about" className="ivy-hide-mobile" style={{ padding: "10px 18px", color: C.charcoal, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            About
          </Link>
          <Link href="/login" style={{ padding: "10px 18px", color: C.forest, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
          <Link href="/signup" style={{ padding: "10px 24px", background: C.forest, color: C.white, borderRadius: 11, fontSize: 14, fontWeight: 600, textDecoration: "none", marginLeft: 6 }}>
            Get started →
          </Link>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <div ref={heroRef} style={{ minHeight: "94vh", background: `linear-gradient(160deg, ${C.dark} 0%, #1B1F23 55%, ${C.darkLight} 100%)`, position: "relative", overflow: "hidden", paddingTop: 68 }}>
        <div className="blob-1" style={{ position: "absolute", width: 620, height: 620, borderRadius: "50%", background: "rgba(149,213,178,0.055)", top: -220, right: -120 }} />
        <div className="blob-2" style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "rgba(149,213,178,0.04)", bottom: -120, left: -60 }} />

        {/* Signature vine — grows in once on load */}
        <svg viewBox="0 0 220 700" style={{ position: "absolute", left: 0, top: 68, height: "calc(94vh - 68px)", width: 160, opacity: 0.35 }} className="ivy-hide-mobile">
          <path
            ref={vineRef}
            d="M20,0 C60,60 -10,120 40,180 C90,240 10,300 55,360 C100,420 20,480 60,540 C90,585 40,620 70,700"
            fill="none"
            stroke={C.mint}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {[90, 220, 340, 470, 600].map((y, i) => (
            <circle key={i} cx={i % 2 === 0 ? 45 : 55} cy={y} r="5" fill={C.mint} opacity="0.7" />
          ))}
        </svg>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 40px 80px", position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 40, alignItems: "center" }}>
          <div>
            <div className="hero-badge" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", background: "rgba(255,255,255,0.1)", borderRadius: 30, marginBottom: 28, border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.mint }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>Live across Nairobi &amp; beyond</span>
            </div>
            <h1 className="hero-title" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(38px, 5vw, 60px)", fontWeight: 600, color: C.white, lineHeight: 1.08, margin: "0 0 22px", letterSpacing: "-0.5px" }}>
              Property management,<br /><em style={{ color: C.mint, fontStyle: "italic" }}>grown</em> the right way.
            </h1>
            <p className="hero-sub" style={{ fontSize: 18, color: "rgba(255,255,255,0.78)", lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
              Browse real units with interactive 3D tours before you sign in. Apply, pay by M-Pesa or card, and manage everything from one calm dashboard.
            </p>
            <div className="hero-cta" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/properties" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "17px 34px", background: C.white, color: C.forest, borderRadius: 15, fontSize: 15.5, fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}>
                Browse available units <ArrowRight size={17} />
              </Link>
              <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", padding: "17px 34px", background: "rgba(255,255,255,0.08)", color: C.white, borderRadius: 15, fontSize: 15.5, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.25)" }}>
                Create an account
              </Link>
            </div>
            <div className="hero-stats" style={{ display: "flex", gap: 32, marginTop: 44, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.white }}>
                  <span className="count-up" data-count={properties.length}>0</span>+
                </div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>Active listings</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.white }}>
                  <span className="count-up" data-count={typeCount || 5}>0</span>
                </div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>Property types</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.white }}>24/7</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>Real-time support chat</div>
              </div>
            </div>
          </div>

          {/* Floating featured-unit card — a real listing if one exists yet */}
          <div className="hero-card ivy-hide-mobile" style={{ justifySelf: "end", width: "100%", maxWidth: 340 }}>
            {properties[0] ? (
              <Link href={`/properties/${properties[0].id}`} style={{ display: "block", textDecoration: "none", background: C.white, borderRadius: 22, overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,0.35)" }}>
                <div style={{ height: 200, position: "relative", background: TYPE_GRADIENT[properties[0].property_type] }}>
                  {properties[0].media_urls?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={properties[0].media_urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {(() => { const Ic = TYPE_ICON[properties[0].property_type]; return <Ic size={48} color="rgba(255,255,255,0.2)" />; })()}
                    </div>
                  )}
                  <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(255,255,255,0.92)", color: C.charcoal, fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20 }}>
                    {TYPE_LABEL[properties[0].property_type]}
                  </div>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.charcoal, marginBottom: 4 }}>{properties[0].name}</div>
                  <div style={{ fontSize: 12.5, color: C.gray, display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
                    <MapPin size={12} /> {properties[0].address}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.forest }}>{fmtKSh(properties[0].rent)}<span style={{ fontSize: 12, color: C.gray, fontWeight: 400 }}> /mo</span></div>
                </div>
              </Link>
            ) : (
              <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 22, padding: 32, textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                First listings landing soon — check back shortly.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============ AVAILABLE UNITS RAIL ============ */}
      <div className="rail-section" style={{ padding: "88px 0 96px", background: C.warmWhite }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div className="rail-label">
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Available now</div>
            <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(28px, 3.5vw, 38px)", fontWeight: 600, color: C.charcoal, margin: 0 }}>
              See what&apos;s open, before you sign in
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => scrollRail(-1)} aria-label="Scroll left" style={{ width: 42, height: 42, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={18} color={C.charcoal} />
            </button>
            <button onClick={() => scrollRail(1)} aria-label="Scroll right" style={{ width: 42, height: 42, borderRadius: "50%", border: `1px solid ${C.border}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={18} color={C.charcoal} />
            </button>
          </div>
        </div>

        {loadingProps ? (
          <div style={{ display: "flex", gap: 20, padding: "0 40px", maxWidth: 1200, margin: "0 auto" }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ width: 320, height: 280, borderRadius: 20, background: C.cream, flexShrink: 0, animation: "ivy-pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
            <div style={{ background: C.cream, borderRadius: 20, padding: 56, textAlign: "center", color: C.gray, border: `1px dashed ${C.border}` }}>
              No units are published yet — the first listings will appear here the moment a landlord publishes one.
            </div>
          </div>
        ) : (
          <div ref={railRef} className="ivy-rail" style={{ display: "flex", gap: 20, overflowX: "auto", padding: "4px 40px 20px", scrollSnapType: "x mandatory" }}>
            {properties.map((p, i) => {
              const Icon = TYPE_ICON[p.property_type];
              const priceUnit = p.property_type === "airbnb" ? "/night" : p.property_type === "land" ? "" : "/mo";
              return (
                <Link
                  key={p.id}
                  href={`/properties/${p.id}`}
                  ref={(el) => { cardsRef.current[i] = el as unknown as HTMLDivElement; }}
                  className="ivy-unit-card"
                  style={{ scrollSnapAlign: "start", flexShrink: 0, width: 320, textDecoration: "none", background: C.white, borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}` }}
                >
                  <div style={{ height: 190, position: "relative", background: TYPE_GRADIENT[p.property_type] }}>
                    {p.media_urls?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.media_urls[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={48} color="rgba(255,255,255,0.2)" />
                      </div>
                    )}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent 55%)" }} />
                    <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(255,255,255,0.92)", color: C.charcoal, fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20 }}>
                      {TYPE_LABEL[p.property_type]}
                    </div>
                    <div style={{ position: "absolute", bottom: 14, left: 16, right: 16, color: C.white }}>
                      <div style={{ fontSize: 16, fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                        <MapPin size={11} /> {p.address}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: C.forest }}>{fmtKSh(p.rent)}</span>
                      <span style={{ fontSize: 12, color: C.gray }}> {priceUnit}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.gold }}>View →</span>
                  </div>
                </Link>
              );
            })}
            <Link
              href="/properties"
              style={{ scrollSnapAlign: "start", flexShrink: 0, width: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: C.forest, borderRadius: 20, textDecoration: "none", color: C.white, fontWeight: 700, fontSize: 14 }}
            >
              See all units <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>

      {/* ============ HOW IT WORKS ============ */}
      <div style={{ padding: "40px 40px 100px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>The process</div>
          <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(28px, 3.5vw, 38px)", fontWeight: 600, color: C.charcoal, margin: 0 }}>
            From browsing to move-in, three steps
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, position: "relative" }}>
          {STEPS.map((s) => (
            <div key={s.n} className="step-item" style={{ position: "relative" }}>
              <div style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 44, fontWeight: 600, color: C.mint, marginBottom: 12 }}>{s.n}</div>
              <h3 style={{ fontSize: 19, fontWeight: 700, color: C.charcoal, margin: "0 0 10px" }}>{s.title}</h3>
              <p style={{ fontSize: 14.5, color: C.gray, lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ============ BUILT FOR EVERY ROLE ============ */}
      <div style={{ padding: "80px 40px 100px", background: C.cream }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>One platform, five roles</div>
            <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(28px, 3.5vw, 38px)", fontWeight: 600, color: C.charcoal, margin: 0 }}>
              Built for everyone in the building
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {ROLES.map((r, i) => (
              <div key={r.title} ref={(el) => { roleCardsRef.current[i] = el; }} style={{ padding: 30, background: C.white, borderRadius: 20, border: `1px solid ${C.border}` }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: r.color + "16", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <r.icon size={21} color={r.color} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: C.charcoal, margin: "0 0 8px" }}>{r.title}</h3>
                <p style={{ fontSize: 13.5, color: C.gray, lineHeight: 1.65, margin: 0 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ TRUST / UNDER THE HOOD ============ */}
      <div style={{ padding: "90px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Under the hood</div>
          <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(28px, 3.5vw, 38px)", fontWeight: 600, color: C.charcoal, margin: 0 }}>
            Built to be trusted with real money
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 28 }}>
          {TRUST.map((t) => (
            <div key={t.title} className="trust-item">
              <div style={{ width: 40, height: 40, borderRadius: 11, background: `${C.forest}12`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <t.icon size={19} color={C.forest} />
              </div>
              <h3 style={{ fontSize: 15.5, fontWeight: 700, color: C.charcoal, margin: "0 0 8px" }}>{t.title}</h3>
              <p style={{ fontSize: 13.5, color: C.gray, lineHeight: 1.65, margin: 0 }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ============ FINAL CTA ============ */}
      <div className="cta-band" style={{ padding: "90px 40px", background: `linear-gradient(135deg, ${C.dark}, ${C.darkLight})`, textAlign: "center" }}>
        <MessageSquare size={28} color={C.mint} style={{ marginBottom: 18 }} />
        <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 600, color: C.white, margin: "0 0 16px" }}>
          Ready to see what&apos;s available?
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", marginBottom: 36 }}>No account needed to look. Sign up only when you&apos;re ready to apply.</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/properties" style={{ display: "inline-block", padding: "17px 44px", background: C.white, color: C.forest, borderRadius: 15, fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}>
            Browse units
          </Link>
          <Link href="/signup" style={{ display: "inline-block", padding: "17px 44px", background: "rgba(255,255,255,0.1)", color: C.white, borderRadius: 15, fontSize: 16, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.3)" }}>
            Create account
          </Link>
        </div>
      </div>

      {/* ============ FOOTER ============ */}
      <footer style={{ background: C.charcoal, padding: "56px 40px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ marginBottom: 14 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ivy-logo-dark.png" alt="Project Ivy by Infoma" style={{ height: 46, width: "auto" }} />
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 280 }}>
                Real estate operations, unified — listings, leases, payments, maintenance, and chat in one platform. <Link href="/about" style={{ color: "rgba(255,255,255,0.75)" }}>Learn more.</Link>
              </p>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Platform</div>
              {[["Browse units", "/properties"], ["About", "/about"], ["Sign in", "/login"], ["Create account", "/signup"]].map(([l, h]) => (
                <Link key={l} href={h} style={{ display: "block", fontSize: 13.5, color: "rgba(255,255,255,0.65)", textDecoration: "none", marginBottom: 12 }}>{l}</Link>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Property types</div>
              {Object.values(TYPE_LABEL).map((l) => (
                <div key={l} style={{ fontSize: 13.5, color: "rgba(255,255,255,0.65)", marginBottom: 12 }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Payments</div>
              <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.65)", marginBottom: 12 }}>M-Pesa via Paystack</div>
              <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.65)" }}>Card payments</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, fontSize: 12.5, color: "rgba(255,255,255,0.4)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span>© {new Date().getFullYear()} Ivy Property. All rights reserved.</span>
            <span>Built with Next.js, Supabase &amp; Paystack.</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes ivy-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
        .ivy-rail::-webkit-scrollbar { height: 6px; }
        .ivy-rail::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        .ivy-unit-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .ivy-unit-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(27,67,50,0.14); }
        @media (max-width: 860px) {
          .ivy-hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
