"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Search,
  UserCheck,
  Upload,
  Wallet,
  Smartphone,
  RefreshCw,
  BadgeCheck,
  Receipt,
  Wrench,
  Box,
  MessageSquare,
  CalendarClock,
  Plus,
  MapPin,
  Home as HomeIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PublicPropertyCard from "@/components/public/PublicPropertyCard";
import type { PropertyRow } from "@/lib/types/database";

/* ───────────── Reveal on scroll ───────────── */
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setArmed(true);
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${armed ? "iv-rv" : ""} ${shown ? "iv-in" : ""} ${className}`} style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}>
      {children}
    </div>
  );
}

/* ───────────── Content ───────────── */
const TENANT_STEPS = [
  { icon: Search, title: "Find a unit", text: "Browse without an account. Filter by type and price, then open any listing for photos and the full cost breakdown." },
  { icon: UserCheck, title: "Apply", text: "Create an account and apply. The landlord's team reviews your application and you see the decision on your dashboard." },
  { icon: Wallet, title: "Pay and stay on top of it", text: "Pay rent by M-Pesa or card, report repairs and message your landlord. Every payment gets a receipt." },
];

const LANDLORD_STEPS = [
  { icon: BadgeCheck, title: "Get verified", text: "Upload your ID and proof that you can let the property. A reviewer checks them before your listings go live." },
  { icon: Upload, title: "List your units", text: "Add the rent, deposit, utility charges, photos and an optional 3D tour. Add your own project managers if you have them." },
  { icon: Wallet, title: "Get paid", text: "Rent lands in your balance, less a small fee. Withdraw to your own account when you need it." },
];

const FEATURES = [
  { icon: Smartphone, title: "Rent by M-Pesa or card", text: "Tenants pay from their phone. The ledger updates as soon as Paystack confirms the payment.", span: 2, pills: ["M-Pesa", "Card"] },
  { icon: RefreshCw, title: "Autopay", text: "Save a card once and rent is charged each month. Switch it off whenever you like.", span: 1 },
  { icon: BadgeCheck, title: "Verified landlords", text: "IDs and proof of ownership are checked before a listing goes live, and verified listings carry a badge.", span: 1 },
  { icon: Receipt, title: "Receipts and invoices", text: "Every payment produces a receipt you can print or save as a PDF. Landlords can send an invoice that tenants pay online.", span: 1 },
  { icon: Wrench, title: "Repairs, tracked", text: "Tenants log a problem. Maintenance moves it from open to resolved, and everyone can see where it stands.", span: 1 },
  { icon: Box, title: "3D tours", text: "Walk through a unit on your phone before you travel to see it.", span: 1 },
  { icon: MessageSquare, title: "Messages tied to the lease", text: "Billing, maintenance and security conversations stay with the tenancy instead of getting lost in group chats.", span: 1 },
  { icon: CalendarClock, title: "Clear tenancy dates", text: "Timed leases end on their date. If a landlord gives notice, the tenant sees it on their dashboard.", span: 1 },
];

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "Do tenants pay Ivy anything?",
    a: (
      <>
        No. The rent you pay is the rent in the listing. Your card issuer or mobile-money provider may charge their own fees. Ivy&apos;s fee comes from the landlord&apos;s side, and the exact schedule is in the{" "}
        <Link href="/terms#fees">Terms of Use</Link>.
      </>
    ),
  },
  { q: "How do I pay rent?", a: "By M-Pesa or card, through Paystack. You get a receipt as soon as the payment is confirmed." },
  { q: "Can I pay automatically?", a: "Yes, with a card. Pay once by card, then turn on autopay from your ledger. M-Pesa payments can't be saved for autopay." },
  {
    q: "How are landlords verified?",
    a: "Landlords upload their ID and proof that they can let the property: a title deed, a lease that allows subletting, or a management mandate. Staff review the documents before new listings go live, and a badge on the listing shows who has passed.",
  },
  {
    q: "What happens when a tenancy ends?",
    a: "Timed leases end on their end date and the unit becomes available again. A landlord can also give notice, and the tenant sees the date on their dashboard. Anything still owed stays on the account.",
  },
  {
    q: "Is my data safe?",
    a: (
      <>
        Identity documents are stored privately, and only you and Ivy administrators can open them. We handle personal data under Kenya&apos;s Data Protection Act. The privacy section of the <Link href="/terms#privacy">Terms</Link> has the detail.
      </>
    ),
  },
  {
    q: "Who is behind Ivy?",
    a: (
      <>
        Ivy is a product of Infoma, a digital services company in Nairobi. <Link href="/about">Read more about Ivy and Infoma</Link>.
      </>
    ),
  },
];

/* ───────────── Page ───────────── */
export default function Landing() {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tenant" | "landlord">("tenant");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("properties")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        setProperties((data as PropertyRow[]) || []);
        setLoading(false);
      });
  }, []);

  const steps = tab === "tenant" ? TENANT_STEPS : LANDLORD_STEPS;

  return (
    <div className="iv-root">
      <style>{CSS}</style>

      {/* Navigation */}
      <nav className="iv-nav">
        <Link href="/" aria-label="Project Ivy home" style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ivy-logo-light.png" alt="Project Ivy by Infoma" style={{ height: 40, width: "auto" }} />
        </Link>
        <div className="iv-links">
          <a href="#units">Units</a>
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#faq">FAQ</a>
          <Link href="/about">About</Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Link href="/login" className="iv-signin">Sign in</Link>
          <Link href="/signup" className="iv-btn iv-btn-dark">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="iv-hero">
        <div className="iv-wrap iv-hero-grid">
          <div>
            <div className="iv-eyebrow iv-a iv-a1">
              <span className="iv-eyedot" />
              For landlords and tenants in Kenya
            </div>
            <h1 className="iv-h1 iv-a iv-a2">
              Rent, without the <em>chasing</em>
              <span className="iv-stop">.</span>
            </h1>
            <p className="iv-lead iv-a iv-a3">
              Tenants pay by M-Pesa or card and get a receipt straight away. Landlords see who has paid, handle repairs and keep every lease in one place, with no spreadsheet.
            </p>
            <div className="iv-cta iv-a iv-a4">
              <Link href="/properties" className="iv-btn iv-btn-green">
                Browse available units <ArrowRight size={17} />
              </Link>
              <Link href="/signup" className="iv-btn iv-btn-ghost">List your property</Link>
            </div>
            <ul className="iv-proof iv-a iv-a5">
              {["No extra fee for tenants", "Landlords are verified before new listings go live", "A receipt for every payment"].map((t) => (
                <li key={t}>
                  <span className="iv-tick"><Check size={12} strokeWidth={3} /></span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Illustration of the tenant view */}
          <div className="iv-mock-wrap iv-a iv-a3" aria-hidden="true">
            <div className="iv-mock">
              <div className="iv-card iv-float iv-unit">
                <div className="iv-unit-img">
                  <HomeIcon size={54} color="rgba(255,255,255,0.35)" />
                  <span className="iv-chip iv-chip-white"><BadgeCheck size={12} /> Verified landlord</span>
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Two bedroom apartment</div>
                  <div className="iv-muted-row"><MapPin size={13} /> Kilimani, Nairobi</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "12px 0 14px" }}>
                    <span style={{ fontSize: 22, fontWeight: 800 }}>KSh 45,000</span>
                    <span style={{ fontSize: 12.5, color: "#667085" }}>/ month</span>
                  </div>
                  <div className="iv-mini-btn">Apply for this unit</div>
                </div>
              </div>

              <div className="iv-card iv-float iv-receipt" style={{ animationDelay: "-2.4s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="iv-okdot"><Check size={15} strokeWidth={3} /></span>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Payment received</div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, margin: "14px 0 12px" }}>KSh 45,000</div>
                <div className="iv-dash" />
                {[["Method", "M-Pesa"], ["Receipt", "Sent to you"], ["Status", "Recorded"]].map(([k, v]) => (
                  <div key={k} className="iv-kv"><span>{k}</span><strong>{v}</strong></div>
                ))}
              </div>

              <div className="iv-card iv-float iv-repair" style={{ animationDelay: "-4.6s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="iv-wrench"><Wrench size={15} /></span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>Kitchen tap leaking</div>
                    <div style={{ fontSize: 11.5, color: "#667085" }}>Repair request</div>
                  </div>
                </div>
                <div className="iv-steps3"><i className="on" /><i className="on" /><i /></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#667085", marginTop: 6 }}>
                  <span>Open</span><strong style={{ color: "#B45309" }}>In progress</strong><span>Resolved</span>
                </div>
              </div>

              <div className="iv-chip iv-chip-pill iv-float iv-autopay" style={{ animationDelay: "-1.2s" }}>
                <RefreshCw size={13} /> Autopay on
              </div>
            </div>
            <div className="iv-caption">Illustration of the tenant view</div>
          </div>
        </div>
      </header>

      {/* Live units */}
      <section id="units" className="iv-section">
        <div className="iv-wrap">
          <Reveal>
            <div className="iv-head-row">
              <div>
                <div className="iv-eyebrow"><span className="iv-eyedot iv-green" />Available now</div>
                <h2 className="iv-h2">Units you can apply for today</h2>
                <p className="iv-sub">These are live listings. Open one to see photos, the full price breakdown and, where the landlord has added one, a 3D tour.</p>
              </div>
              <Link href="/properties" className="iv-btn iv-btn-ghost">See all units <ArrowRight size={16} /></Link>
            </div>
          </Reveal>

          <div className="iv-grid-units">
            {loading &&
              [0, 1, 2].map((i) => (
                <div key={i} className="iv-skel">
                  <div className="iv-skel-img" />
                  <div className="iv-skel-line" style={{ width: "70%" }} />
                  <div className="iv-skel-line" style={{ width: "45%" }} />
                </div>
              ))}
            {!loading &&
              properties.map((p, i) => (
                <Reveal key={p.id} delay={i * 60}>
                  <PublicPropertyCard property={p} />
                </Reveal>
              ))}
          </div>
          {!loading && properties.length === 0 && (
            <div className="iv-empty">
              No units are live right now. Check back soon, or <Link href="/signup">list your own</Link>.
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="iv-section iv-tint">
        <div className="iv-wrap">
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 34px" }}>
              <div className="iv-eyebrow" style={{ justifyContent: "center" }}><span className="iv-eyedot" />How it works</div>
              <h2 className="iv-h2">Simple on both sides of the lease</h2>
            </div>
            <div className="iv-tabs" role="tablist">
              <button role="tab" aria-selected={tab === "tenant"} className={tab === "tenant" ? "on" : ""} onClick={() => setTab("tenant")}>I&apos;m looking for a place</button>
              <button role="tab" aria-selected={tab === "landlord"} className={tab === "landlord" ? "on" : ""} onClick={() => setTab("landlord")}>I own property</button>
            </div>
          </Reveal>
          <div className="iv-steps" key={tab}>
            {steps.map((s, i) => (
              <div key={s.title} className="iv-step" style={{ animationDelay: `${i * 90}ms` }}>
                <div className="iv-num">0{i + 1}</div>
                <div className="iv-iconchip"><s.icon size={20} /></div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="iv-section">
        <div className="iv-wrap">
          <Reveal>
            <div style={{ maxWidth: 620, marginBottom: 34 }}>
              <div className="iv-eyebrow"><span className="iv-eyedot iv-green" />What you get</div>
              <h2 className="iv-h2">The everyday parts of renting, handled</h2>
            </div>
          </Reveal>
          <div className="iv-bento">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 70} className={f.span === 2 ? "iv-span2" : ""}>
                <div className="iv-feature">
                  <div className="iv-iconchip"><f.icon size={20} /></div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                  {f.pills && (
                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                      {f.pills.map((p) => (
                        <span key={p} className="iv-pill">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="iv-section iv-tint">
        <div className="iv-wrap iv-faq-wrap">
          <Reveal>
            <div className="iv-eyebrow"><span className="iv-eyedot" />Questions</div>
            <h2 className="iv-h2">Straight answers</h2>
            <p className="iv-sub">Anything else, write to <a href="mailto:hello@infoma.tech">hello@infoma.tech</a>.</p>
          </Reveal>
          <div>
            {FAQ.map((f, i) => (
              <div key={f.q} className={`iv-faq ${openFaq === i ? "iv-open" : ""}`}>
                <button aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{f.q}</span>
                  <span className="iv-plus"><Plus size={18} /></span>
                </button>
                <div className="iv-faq-body"><div><p>{f.a}</p></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="iv-section" style={{ paddingTop: 40 }}>
        <div className="iv-wrap">
          <Reveal>
            <div className="iv-final">
              <h2>Start with a free account.</h2>
              <p>It takes about a minute. You can browse every listing first if you would rather look around.</p>
              <div className="iv-cta" style={{ justifyContent: "center" }}>
                <Link href="/signup" className="iv-btn iv-btn-green">Create an account <ArrowRight size={17} /></Link>
                <Link href="/properties" className="iv-btn iv-btn-outline-light">Browse units</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="iv-footer">
        <div className="iv-wrap iv-footer-grid">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ivy-logo-light.png" alt="Project Ivy by Infoma" style={{ height: 52, width: "auto" }} />
            <p style={{ fontSize: 13.5, color: "#667085", lineHeight: 1.7, maxWidth: 320, margin: "14px 0 0" }}>
              Rent collection and property management for landlords and tenants in Kenya. Ivy is a product of Infoma.
            </p>
          </div>
          <div>
            <div className="iv-foot-h">Ivy</div>
            <Link href="/properties">Browse units</Link>
            <Link href="/signup">Create an account</Link>
            <Link href="/login">Sign in</Link>
          </div>
          <div>
            <div className="iv-foot-h">Company</div>
            <Link href="/about">About</Link>
            <Link href="/terms">Terms of Use</Link>
            <a href="mailto:hello@infoma.tech">hello@infoma.tech</a>
          </div>
        </div>
        <div className="iv-wrap" style={{ paddingTop: 22, borderTop: "1px solid #E4E7EC", marginTop: 34, fontSize: 12.5, color: "#98A2B3", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span>© {new Date().getFullYear()} Infoma. Nairobi, Kenya.</span>
          <a href="https://infoma-new.netlify.app/" target="_blank" rel="noopener noreferrer" style={{ color: "#98A2B3" }}>infoma-new.netlify.app</a>
        </div>
      </footer>
    </div>
  );
}

/* ───────────── Styles ───────────── */
const CSS = `
.iv-root{font-family:var(--font-outfit),sans-serif;color:#16181A;background:#FBFBFC;overflow-x:hidden}
.iv-root a{color:inherit}
.iv-wrap{max-width:1180px;margin:0 auto;padding:0 24px}

/* nav */
.iv-nav{position:fixed;top:14px;left:50%;transform:translateX(-50%);width:min(1180px,calc(100% - 28px));height:66px;background:rgba(255,255,255,.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid #E4E7EC;border-radius:20px;display:flex;align-items:center;justify-content:space-between;padding:0 14px 0 20px;z-index:60;box-shadow:0 10px 34px rgba(16,24,40,.07)}
.iv-links{display:flex;gap:30px}
.iv-links a{font-size:12px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:#667085;text-decoration:none;padding:6px 0;border-bottom:2px solid transparent;transition:color .2s,border-color .2s}
.iv-links a:hover{color:#16181A;border-color:#F03E3E}
.iv-signin{font-size:13.5px;font-weight:600;color:#16181A;text-decoration:none;padding:10px 14px}

/* buttons */
.iv-btn{display:inline-flex;align-items:center;gap:9px;border-radius:999px;font-weight:700;font-size:14.5px;text-decoration:none;transition:transform .2s,box-shadow .2s,background .2s;border:0;cursor:pointer;font-family:inherit;white-space:nowrap}
.iv-btn:hover{transform:translateY(-2px)}
.iv-btn-green{background:#4CAF50;color:#fff !important;padding:16px 28px;box-shadow:0 12px 28px rgba(76,175,80,.34)}
.iv-btn-green:hover{background:#43A047;box-shadow:0 16px 34px rgba(76,175,80,.42)}
.iv-btn-ghost{background:#fff;color:#16181A !important;padding:15px 26px;border:1px solid #D0D5DD}
.iv-btn-ghost:hover{border-color:#16181A}
.iv-btn-dark{background:#16181A;color:#fff !important;padding:12px 20px;font-size:13px}
.iv-btn-outline-light{background:transparent;color:#fff !important;padding:15px 26px;border:1px solid rgba(255,255,255,.35)}
.iv-btn-outline-light:hover{border-color:#fff}

/* hero */
.iv-hero{position:relative;padding:158px 0 96px}
.iv-hero::before{content:"";position:absolute;right:-14%;top:30px;width:min(820px,86vw);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 38% 36%,#EAF6E7 0%,#F2F4F6 52%,rgba(242,244,246,0) 72%);z-index:0}
.iv-hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:1.05fr .95fr;gap:40px;align-items:center}
.iv-eyebrow{display:flex;align-items:center;gap:10px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#667085;margin-bottom:20px}
.iv-eyedot{width:7px;height:7px;border-radius:50%;background:#F03E3E;display:inline-block}
.iv-eyedot.iv-green{background:#4CAF50}
.iv-h1{font-size:clamp(42px,6.4vw,74px);line-height:1.02;letter-spacing:-.04em;font-weight:800;margin:0 0 24px}
.iv-h1 em{font-style:normal;color:#4CAF50}
.iv-lead{font-size:18px;line-height:1.7;color:#667085;max-width:520px;margin:0 0 32px}
.iv-cta{display:flex;gap:12px;flex-wrap:wrap}
.iv-proof{list-style:none;padding:0;margin:30px 0 0;display:grid;gap:11px;font-size:14px;color:#344054}
.iv-proof li{display:flex;align-items:center;gap:10px}
.iv-tick{width:20px;height:20px;border-radius:50%;background:#E8F5E1;color:#2E7D32;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}

/* entrance */
.iv-a{opacity:0;transform:translateY(18px);animation:iv-up .85s cubic-bezier(.2,.7,.2,1) forwards}
.iv-a1{animation-delay:.04s}.iv-a2{animation-delay:.14s}.iv-a3{animation-delay:.26s}.iv-a4{animation-delay:.38s}.iv-a5{animation-delay:.5s}
@keyframes iv-up{to{opacity:1;transform:none}}

/* hero illustration */
.iv-mock-wrap{position:relative}
.iv-mock{position:relative;height:540px;max-width:520px;margin-left:auto}
.iv-card{position:absolute;background:#fff;border:1px solid #E4E7EC;border-radius:22px;box-shadow:0 28px 64px rgba(16,24,40,.13)}
.iv-float{animation:iv-float 7s ease-in-out infinite alternate}
@keyframes iv-float{from{transform:translateY(-7px)}to{transform:translateY(9px)}}
.iv-unit{right:0;top:6px;width:316px;overflow:hidden;z-index:2}
.iv-unit-img{height:150px;background:linear-gradient(135deg,#4CAF50 0%,#2E7D32 100%);display:flex;align-items:center;justify-content:center;position:relative}
.iv-chip{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;border-radius:999px;padding:5px 10px}
.iv-chip-white{position:absolute;top:12px;left:12px;background:rgba(255,255,255,.94);color:#15803D}
.iv-chip-pill{background:#16181A;color:#fff;padding:9px 14px;font-size:12px;box-shadow:0 14px 30px rgba(16,24,40,.25)}
.iv-muted-row{display:flex;align-items:center;gap:5px;font-size:12.5px;color:#667085;margin-top:4px}
.iv-mini-btn{background:#4CAF50;color:#fff;text-align:center;padding:11px;border-radius:12px;font-weight:700;font-size:13px}
.iv-receipt{left:0;top:292px;width:262px;padding:20px;z-index:3}
.iv-okdot{width:28px;height:28px;border-radius:50%;background:#4CAF50;color:#fff;display:inline-flex;align-items:center;justify-content:center}
.iv-dash{border-top:1.5px dashed #D0D5DD;margin:0 0 10px}
.iv-kv{display:flex;justify-content:space-between;font-size:12.5px;padding:4px 0;color:#667085}
.iv-kv strong{color:#16181A;font-weight:600}
.iv-repair{left:14px;top:44px;width:228px;padding:16px;z-index:3}
.iv-wrench{width:32px;height:32px;border-radius:10px;background:#FEF3C7;color:#B45309;display:inline-flex;align-items:center;justify-content:center}
.iv-steps3{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:14px}
.iv-steps3 i{height:5px;border-radius:3px;background:#E4E7EC}
.iv-steps3 i.on{background:#F59E0B}
.iv-autopay{right:26px;bottom:14px;z-index:4;position:absolute}
.iv-caption{text-align:center;font-size:11.5px;color:#98A2B3;margin-top:6px}

/* sections */
.iv-section{padding:96px 0}
.iv-tint{background:#F3F5F7}
.iv-h2{font-size:clamp(30px,4.2vw,46px);line-height:1.1;letter-spacing:-.03em;font-weight:800;margin:0 0 14px}
.iv-sub{font-size:16.5px;line-height:1.7;color:#667085;max-width:560px;margin:0}
.iv-sub a{color:#2E7D32;font-weight:600}
.iv-head-row{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;margin-bottom:38px}
.iv-grid-units{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:22px}
.iv-empty{background:#fff;border:1px dashed #D0D5DD;border-radius:20px;padding:44px 24px;text-align:center;color:#667085;font-size:15px}
.iv-empty a{color:#2E7D32;font-weight:600}
.iv-skel{background:#fff;border:1px solid #E4E7EC;border-radius:20px;padding:14px;display:grid;gap:12px}
.iv-skel-img,.iv-skel-line{border-radius:12px;background:linear-gradient(90deg,#EEF0F3 25%,#F8F9FA 50%,#EEF0F3 75%);background-size:200% 100%;animation:iv-shimmer 1.4s ease-in-out infinite}
.iv-skel-img{height:170px}.iv-skel-line{height:14px}
@keyframes iv-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.ivy-property-card{transition:transform .25s,box-shadow .25s}
.ivy-property-card:hover{transform:translateY(-5px);box-shadow:0 20px 44px rgba(16,24,40,.12)}

/* how it works */
.iv-tabs{display:flex;gap:6px;background:#fff;border:1px solid #E4E7EC;border-radius:999px;padding:5px;width:fit-content;margin:0 auto 42px}
.iv-tabs button{border:0;background:transparent;font-family:inherit;font-weight:600;font-size:14px;color:#667085;padding:11px 22px;border-radius:999px;cursor:pointer;transition:background .25s,color .25s}
.iv-tabs button.on{background:#16181A;color:#fff}
.iv-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.iv-step{position:relative;background:#fff;border:1px solid #E4E7EC;border-radius:24px;padding:30px 26px;overflow:hidden;opacity:0;transform:translateY(14px);animation:iv-up .6s cubic-bezier(.2,.7,.2,1) forwards}
.iv-num{position:absolute;right:18px;top:6px;font-size:76px;font-weight:800;letter-spacing:-.05em;color:#F0F2F5;line-height:1}
.iv-iconchip{width:44px;height:44px;border-radius:14px;background:#EAF6E7;color:#2E7D32;display:flex;align-items:center;justify-content:center;margin-bottom:18px;position:relative}
.iv-step h3,.iv-feature h3{font-size:18px;font-weight:700;margin:0 0 8px;position:relative;letter-spacing:-.01em}
.iv-step p,.iv-feature p{font-size:14.5px;line-height:1.7;color:#667085;margin:0;position:relative}

/* features */
.iv-bento{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.iv-span2{grid-column:span 2}
.iv-feature{height:100%;background:#fff;border:1px solid #E4E7EC;border-radius:24px;padding:28px;transition:transform .25s,box-shadow .25s,border-color .25s}
.iv-feature:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(16,24,40,.09);border-color:#CFE8CB}
.iv-pill{font-size:12.5px;font-weight:600;padding:7px 14px;border-radius:999px;background:#EAF6E7;color:#2E7D32}

/* faq */
.iv-faq-wrap{display:grid;grid-template-columns:.8fr 1.2fr;gap:56px;align-items:start}
.iv-faq{border-bottom:1px solid #D9DEE5}
.iv-faq button{all:unset;box-sizing:border-box;width:100%;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:22px 0;cursor:pointer;font-size:16.5px;font-weight:600;color:#16181A}
.iv-faq button:focus-visible{outline:2px solid #4CAF50;outline-offset:2px;border-radius:6px}
.iv-plus{width:32px;height:32px;border-radius:50%;background:#fff;border:1px solid #D0D5DD;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .3s,background .3s}
.iv-open .iv-plus{transform:rotate(45deg);background:#16181A;color:#fff;border-color:#16181A}
.iv-faq-body{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s ease}
.iv-open .iv-faq-body{grid-template-rows:1fr}
.iv-faq-body>div{overflow:hidden}
.iv-faq-body p{margin:0;padding:0 48px 22px 0;font-size:15px;line-height:1.75;color:#667085}
.iv-faq-body p a{color:#2E7D32;font-weight:600}

/* final cta */
.iv-final{position:relative;overflow:hidden;background:#14171A;color:#fff;border-radius:36px;padding:72px 28px;text-align:center}
.iv-final::before{content:"";position:absolute;left:50%;top:-40%;width:640px;height:640px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle,rgba(76,175,80,.32),rgba(76,175,80,0) 66%)}
.iv-final>*{position:relative}
.iv-final h2{font-size:clamp(30px,4.6vw,52px);font-weight:800;letter-spacing:-.03em;margin:0 0 14px}
.iv-final p{font-size:17px;line-height:1.7;color:rgba(255,255,255,.7);max-width:480px;margin:0 auto 30px}

/* footer */
.iv-footer{padding:64px 0 34px;background:#FBFBFC}
.iv-footer-grid{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:40px}
.iv-footer a{display:block;font-size:14px;color:#475467;text-decoration:none;padding:5px 0}
.iv-footer a:hover{color:#16181A}
.iv-foot-h{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#98A2B3;margin-bottom:10px}

/* reveal */
.iv-rv{opacity:0;transform:translateY(22px);transition:opacity .75s ease,transform .75s cubic-bezier(.2,.7,.2,1)}
.iv-rv.iv-in{opacity:1;transform:none}

@media (max-width:960px){
  .iv-links{display:none}
  .iv-hero{padding:128px 0 70px}
  .iv-hero-grid{grid-template-columns:1fr;gap:34px}
  .iv-mock{margin:0 auto;height:520px;max-width:440px}
  .iv-steps{grid-template-columns:1fr}
  .iv-bento{grid-template-columns:1fr 1fr}
  .iv-faq-wrap{grid-template-columns:1fr;gap:26px}
  .iv-footer-grid{grid-template-columns:1fr 1fr}
  .iv-footer-grid>div:first-child{grid-column:1/-1}
  .iv-section{padding:72px 0}
}
@media (max-width:560px){
  .iv-wrap{padding:0 18px}
  .iv-signin{display:none}
  .iv-bento{grid-template-columns:1fr}
  .iv-span2{grid-column:auto}
  .iv-mock{height:490px}
  .iv-unit{width:286px}
  .iv-receipt{top:300px;width:240px}
  .iv-repair{width:206px;left:0}
  .iv-btn-green,.iv-btn-ghost{width:100%;justify-content:center}
  .iv-tabs{width:100%}
  .iv-tabs button{flex:1;padding:11px 10px;font-size:13px}
  .iv-final{border-radius:28px;padding:54px 20px}
  .iv-faq-body p{padding-right:8px}
}
@media (prefers-reduced-motion:reduce){
  .iv-a,.iv-step{opacity:1;transform:none;animation:none}
  .iv-float,.iv-skel-img,.iv-skel-line{animation:none}
  .iv-rv{opacity:1;transform:none;transition:none}
}
`;
