"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, MapPin, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import LoadingState from "@/components/ui/LoadingState";
import type { PropertyRow, Profile } from "@/lib/types/database";

const GlbViewer = dynamic(() => import("@/components/three/GlbViewer"), { ssr: false });

const C = {
  forest: "#63BC46",
  forestLight: "#7FCB63",
  sage: "#4F9636",
  cream: "#F7F8FA",
  warmWhite: "#FAFBFC",
  charcoal: "#0A0A0A",
  gray: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
  gold: "#FF3131",
  emerald: "#16A34A",
  amber: "#D97706",
};

const TYPE_LABEL: Record<string, string> = {
  apartment: "Apartment",
  student_housing: "Student Housing",
  commercial: "Commercial",
  land: "Land",
  airbnb: "Airbnb",
};

function fmtKSh(n: number) {
  return "KSh " + Math.round(n || 0).toLocaleString();
}

function detailLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PropertyDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const supabase = createClient();
  const [property, setProperty] = useState<PropertyRow | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "3d" | "gallery">("overview");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .eq("status", "active")
      .single()
      .then(({ data }) => {
        setProperty((data as PropertyRow) || null);
        setLoading(false);
      });

    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
        setProfile((p as Profile) || null);
      }
      setCheckedAuth(true);
    });
  }, [id, supabase]);

  const apply = async () => {
    if (!property || !profile) return;
    setApplying(true);
    setError(null);
    const start = new Date();
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    const { error: insertError } = await supabase.from("leases").insert({
      client_id: profile.id,
      property_id: property.id,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      rent_amount: property.rent,
      status: "pending",
    });
    setApplying(false);
    if (insertError) setError(insertError.message);
    else setApplied(true);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.warmWhite, fontFamily: "var(--font-outfit), sans-serif" }}>
        <LoadingState label="Loading listing" size="lg" />
      </div>
    );
  }

  if (!property) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.warmWhite, color: C.gray, fontFamily: "var(--font-outfit), sans-serif", gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.charcoal }}>Listing not found</div>
        <Link href="/properties" style={{ color: C.forest, fontWeight: 600 }}>← Back to all units</Link>
      </div>
    );
  }

  const priceUnit = property.property_type === "airbnb" ? " / night" : property.property_type === "land" ? "" : " / month";
  const details = (property.details as Record<string, unknown>) || {};

  return (
    <div style={{ minHeight: "100vh", background: C.warmWhite, fontFamily: "var(--font-outfit), sans-serif" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,253,249,0.92)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ivy-logo-light.png" alt="Project Ivy by Infoma" style={{ height: 38, width: "auto" }} />
        </Link>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/about" style={{ padding: "9px 18px", color: C.charcoal, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>About</Link>
          <Link href="/login" style={{ padding: "9px 18px", color: C.forest, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          <Link href="/signup" style={{ padding: "9px 22px", background: C.forest, color: "white", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Get started</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>
        <Link href="/properties" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.gray, textDecoration: "none", fontSize: 14, marginBottom: 20 }}>
          <ArrowLeft size={16} /> Back to all units
        </Link>

        <div style={{ height: 320, borderRadius: 20, overflow: "hidden", position: "relative", marginBottom: 24, background: `linear-gradient(135deg, ${C.forest}, ${C.sage})` }}>
          {property.media_urls?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={property.media_urls[0]} alt={property.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent 55%)" }} />
          <div style={{ position: "absolute", bottom: 24, left: 28, color: "white" }}>
            <div style={{ marginBottom: 8, display: "inline-block", background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              {TYPE_LABEL[property.property_type]}
            </div>
            <div style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 32, fontWeight: 600, textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>{property.name}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
              <MapPin size={14} /> {property.address}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontSize: 32, fontWeight: 800, color: C.forest }}>{fmtKSh(property.rent)}</span>
            <span style={{ fontSize: 15, color: C.gray }}>{priceUnit}</span>
          </div>

          {applied ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#D1FAE5", color: C.emerald, borderRadius: 12, fontWeight: 600, fontSize: 14 }}>
              <CheckCircle size={18} /> Application submitted
            </div>
          ) : !checkedAuth ? null : profile ? (
            profile.role === "client" ? (
              <button
                onClick={apply}
                disabled={applying}
                style={{ padding: "14px 32px", background: C.forest, color: "white", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: applying ? 0.7 : 1 }}
              >
                {applying ? "Submitting…" : "Reserve This Unit"}
              </button>
            ) : (
              <div style={{ fontSize: 13, color: C.gray, maxWidth: 260, textAlign: "right" }}>
                Only client accounts can apply for a lease. You&apos;re signed in as a {profile.role.replace("_", " ")}.
              </div>
            )
          ) : (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: C.gray }}>Sign in to reserve</span>
              <Link href={`/login?redirect=/properties/${id}`} style={{ padding: "12px 22px", background: C.cream, color: C.forest, borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none", border: `1px solid ${C.border}` }}>
                Sign in
              </Link>
              <Link href={`/signup?redirect=/properties/${id}`} style={{ padding: "12px 22px", background: C.forest, color: "white", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                Sign up
              </Link>
            </div>
          )}
        </div>
        {error && <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 20 }}>{error}</div>}

        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: C.cream, borderRadius: 12, padding: 4, border: `1px solid ${C.border}`, width: "fit-content" }}>
          {[["overview", "Overview"], ["3d", "🏛 Virtual Tour"], ["gallery", "Gallery"]].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k as typeof tab)}
              style={{ padding: "8px 20px", borderRadius: 9, border: "none", background: tab === k ? C.white : "transparent", color: tab === k ? C.forest : C.gray, fontWeight: tab === k ? 700 : 400, fontSize: 14, cursor: "pointer" }}
            >
              {l}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div style={{ background: C.white, borderRadius: 16, padding: 28, border: `1px solid ${C.border}` }}>
            {property.description && <p style={{ fontSize: 15, color: C.charcoal, lineHeight: 1.7, margin: "0 0 24px" }}>{property.description}</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
              {Object.entries(details).map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: C.gray, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{detailLabel(k)}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal }}>{Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "3d" && (
          <div style={{ background: C.white, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
            <GlbViewer url={property.virtual_tour_url} />
          </div>
        )}
        {tab === "gallery" && (
          <div style={{ background: C.white, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
            {property.media_urls && property.media_urls.length > 0 ? (
              <div className="ivy-gallery" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {property.media_urls.map((url, i) => (
                  <div key={url} style={{ height: 160, borderRadius: 12, overflow: "hidden", background: C.cream }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`${property.name} photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: C.gray, fontSize: 13 }}>No photos uploaded yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
