"use client";

import Link from "next/link";
import { MapPin, Bed, Users as UsersIcon, Building2, TreePine, Home as HomeIcon } from "lucide-react";
import type { PropertyRow } from "@/lib/types/database";

const C = {
  forest: "#63BC46",
  sage: "#4F9636",
  sageLight: "#A3D98C",
  mint: "#E8F5E1",
  cream: "#F7F8FA",
  charcoal: "#0A0A0A",
  gray: "#6B7280",
  border: "#E5E7EB",
  gold: "#FF3131",
  white: "#FFFFFF",
};

const TYPE_LABEL: Record<string, string> = {
  apartment: "Apartment",
  student_housing: "Student Housing",
  commercial: "Commercial",
  land: "Land",
  airbnb: "Airbnb",
};

const TYPE_GRADIENT: Record<string, string> = {
  apartment: `linear-gradient(135deg, ${C.forest}, ${C.sage})`,
  student_housing: `linear-gradient(135deg, #2563EB, #60A5FA)`,
  commercial: `linear-gradient(135deg, #78350F, #FF3131)`,
  land: `linear-gradient(135deg, #166534, ${C.mint})`,
  airbnb: `linear-gradient(135deg, #9D174D, #F472B6)`,
};

const TYPE_ICON: Record<string, typeof Building2> = {
  apartment: HomeIcon,
  student_housing: UsersIcon,
  commercial: Building2,
  land: TreePine,
  airbnb: Bed,
};

function fmtKSh(n: number) {
  return "KSh " + Math.round(n || 0).toLocaleString();
}

export default function PublicPropertyCard({ property, compact = false }: { property: PropertyRow; compact?: boolean }) {
  const Icon = TYPE_ICON[property.property_type] || HomeIcon;
  const cover = property.media_urls?.[0];
  const priceUnit = property.property_type === "airbnb" ? " / night" : property.property_type === "land" ? "" : " / month";

  return (
    <Link
      href={`/properties/${property.id}`}
      style={{
        display: "block",
        textDecoration: "none",
        background: C.white,
        borderRadius: 20,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        flexShrink: 0,
        width: compact ? 320 : "100%",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
      className="ivy-property-card"
    >
      <div style={{ height: compact ? 190 : 210, position: "relative", background: TYPE_GRADIENT[property.property_type] || TYPE_GRADIENT.apartment, overflow: "hidden" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={property.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={56} color="rgba(255,255,255,0.18)" />
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent 55%)" }} />
        <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(255,255,255,0.92)", color: C.charcoal, fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20, letterSpacing: "0.02em" }}>
          {TYPE_LABEL[property.property_type] || property.property_type}
        </div>
        <div style={{ position: "absolute", bottom: 14, left: 16, right: 16, color: C.white }}>
          <div style={{ fontSize: 17, fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{property.name}</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
            <MapPin size={12} /> {property.address}
          </div>
        </div>
      </div>
      <div style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: 19, fontWeight: 800, color: C.forest }}>{fmtKSh(property.rent)}</span>
          <span style={{ fontSize: 12, color: C.gray }}>{priceUnit}</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.gold, display: "flex", alignItems: "center", gap: 4 }}>
          View details →
        </div>
      </div>
    </Link>
  );
}
