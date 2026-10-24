"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PublicPropertyCard from "@/components/public/PublicPropertyCard";
import type { PropertyRow, PropertyType } from "@/lib/types/database";

const C = { forest: "#63BC46", cream: "#F7F8FA", warmWhite: "#FAFBFC", charcoal: "#0A0A0A", gray: "#6B7280", border: "#E5E7EB", white: "#FFFFFF" };

const TYPE_FILTERS: { value: PropertyType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "apartment", label: "Apartments" },
  { value: "student_housing", label: "Student Housing" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
  { value: "airbnb", label: "Airbnb" },
];

export default function PropertiesBrowse() {
  const supabase = createClient();
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PropertyType | "all">("all");

  useEffect(() => {
    supabase
      .from("properties")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProperties((data as PropertyRow[]) || []);
        setLoading(false);
      });
  }, [supabase]);

  const filtered = filter === "all" ? properties : properties.filter((p) => p.property_type === filter);

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

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 38, fontWeight: 600, color: C.charcoal, margin: "0 0 8px" }}>
          Available units
        </h1>
        <p style={{ fontSize: 15, color: C.gray, margin: "0 0 32px" }}>
          {loading ? "Loading listings…" : `${filtered.length} listing${filtered.length === 1 ? "" : "s"} live right now — browse freely, sign in when you're ready to apply.`}
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap", alignItems: "center" }}>
          <SlidersHorizontal size={15} color={C.gray} />
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: `1px solid ${filter === f.value ? C.forest : C.border}`,
                background: filter === f.value ? C.forest : C.white,
                color: filter === f.value ? "white" : C.charcoal,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 300, borderRadius: 20, background: C.cream, animation: "ivy-pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: C.gray }}>
            No listings match that filter right now — check back soon.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {filtered.map((p) => (
              <PublicPropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes ivy-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        .ivy-property-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(27,67,50,0.12); }
      `}</style>
    </div>
  );
}
