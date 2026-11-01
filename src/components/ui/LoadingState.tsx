"use client";

import { useEffect, useState } from "react";
import { C } from "@/components/ProjectIvy";

/**
 * A loading indicator that escalates its message if things take longer
 * than expected, instead of either (a) spinning forever with no context
 * or (b) failing immediately and looking broken. Pass `slow` to force
 * the "taking longer than expected" copy as soon as a retry kicks in
 * (wired up by fetchWithRetry's onSlow callback).
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
  const [dots, setDots] = useState("");
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 450);
    return () => clearInterval(t);
  }, []);

  const px = size === "sm" ? 18 : size === "lg" ? 40 : 26;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: inline ? "row" : "column",
        alignItems: "center",
        justifyContent: "center",
        gap: inline ? 10 : 14,
        padding: inline ? 0 : size === "lg" ? 60 : 36,
      }}
    >
      <div
        style={{
          width: px,
          height: px,
          borderRadius: "50%",
          border: `${Math.max(2, px / 10)}px solid ${C.border}`,
          borderTopColor: C.forest,
          animation: "ivy-spin 0.8s linear infinite",
        }}
      />
      <div style={{ fontSize: size === "lg" ? 14 : 13, color: slow ? C.amber : C.gray, fontWeight: slow ? 600 : 400, textAlign: "center" }}>
        {slow ? "This is taking longer than expected, still working on it" : label}
        {dots}
      </div>
      <style>{`@keyframes ivy-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/** A content-shaped placeholder (shimmering block) for card/table skeletons. */
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
