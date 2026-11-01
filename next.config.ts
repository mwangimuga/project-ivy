import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Root cause of the "Cannot read properties of undefined (reading
  // 'ReactCurrentBatchConfig')" crash: Next.js 15.5's own internal runtime
  // bundles React 19 (next/dist/compiled/react), independent of whatever
  // version this app's package.json specifies. @react-three/fiber v8 only
  // supports React 18, which is what created the mismatch. The real fix is
  // the version pins in package.json (React 19 + @react-three/fiber v9 +
  // @react-three/drei v10, all of which require React 19) — this
  // transpilePackages entry is kept as a secondary safeguard against
  // duplicate-instance bundling issues, not the primary fix.
  // Authenticated pages must never be served from the browser's cache or
  // back/forward cache — otherwise Back after logout shows a stale dashboard.
  async headers() {
    return [
      { source: "/dashboard/:path*", headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }] },
      { source: "/change-password", headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }] },
    ];
  },
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
};

export default nextConfig;
