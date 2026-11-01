"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Html } from "@react-three/drei";

function GlbModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function Loader() {
  return (
    <Html center>
      <div
        style={{
          background: "rgba(27,67,50,0.85)",
          color: "white",
          padding: "8px 16px",
          borderRadius: 20,
          fontSize: 12,
          fontFamily: "var(--font-outfit), sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        Loading virtual tour…
      </div>
    </Html>
  );
}

/**
 * Interactive .glb virtual-tour viewer (React Three Fiber + drei).
 * Falls back to a friendly empty state when the property has no tour yet.
 */
export default function GlbViewer({ url }: { url?: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div
        style={{
          height: 380,
          borderRadius: 12,
          background: "#F0ECE6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 8,
          fontFamily: "var(--font-outfit), sans-serif",
          color: "#6B6B6B",
        }}
      >
        <div style={{ fontSize: 32 }}>🏠</div>
        <div style={{ fontSize: 13 }}>
          {failed ? "Couldn't load this 3D tour" : "No 3D virtual tour uploaded yet"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ width: "100%", height: 380, borderRadius: 12, overflow: "hidden", background: "#F0ECE6" }}>
        <Canvas camera={{ position: [4, 3, 6], fov: 42 }} shadows dpr={[1, 2]}>
          <Suspense fallback={<Loader />}>
            <Stage environment="city" intensity={0.6} shadows="contact" adjustCamera>
              <ErrorBoundaryModel url={url} onError={() => setFailed(true)} />
            </Stage>
            <OrbitControls makeDefault autoRotate autoRotateSpeed={0.6} enableDamping />
          </Suspense>
        </Canvas>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          background: "rgba(27,67,50,0.8)",
          color: "white",
          fontSize: 11,
          padding: "6px 12px",
          borderRadius: 20,
          fontFamily: "var(--font-outfit), sans-serif",
        }}
      >
        🖱 Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}

// Minimal error boundary since useGLTF throws (via suspense) on bad URLs.
import React from "react";
class ErrorBoundaryModel extends React.Component<
  { url: string; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { url: string; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return <GlbModel url={this.props.url} />;
  }
}
