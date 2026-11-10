"use client";

import { C } from "@/components/ProjectIvy";
import BrandLoader from "@/components/ui/BrandLoader";

/**
 * Loading indicator used across the dashboard. Small/inline uses a compact
 * spinner; medium and large use the Ivy mark. If things take longer than
 * expected (`slow`), the message says so instead of spinning silently or
 * failing early.
 */
export default function LoadingState({
  label = "Loading",
  slow = false,
  size = "md",
  inline = false,
}: {
  label?: string;
  slow?: boolean;
  size?: "sm" | "md" | "lg";
  inline?: boolean;
}) {
  if (size === "sm" || inline) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: inline ? 0 : 28 }}>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: `2px solid ${C.border}`,
            borderTopColor: C.forest,
            animation: "ivy-spin 0.8s linear infinite",
          }}
        />
        <div style={{ fontSize: 13, color: slow ? C.amber : C.gray, fontWeight: slow ? 600 : 400 }}>
          {slow ? "This is taking longer than expected. Still working on it." : label}
        </div>
        <style>{`@keyframes ivy-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: size === "lg" ? 60 : 36, ["--ivy-bl-text" as string]: C.gray }}>
      <BrandLoader size={size === "lg" ? 104 : 72} label={label} slow={slow} />
    </div>
  );
}

/** A shimmering content-shaped placeholder for card and table skeletons. */
export function Skeleton({ width = "100%", height = 16, radius = 8 }: { width?: string | number; height?: number; radius?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${C.border} 25%, ${C.cream} 50%, ${C.border} 75%)`,
        backgroundSize: "200% 100%",
        animation: "ivy-shimmer 1.4s ease-in-out infinite",
      }}
    >
      <style>{`@keyframes ivy-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}
