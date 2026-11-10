/**
 * The Ivy loading mark: the house draws in, the red circle is "drawn" around it,
 * then a brush underline. Pure SVG + CSS, no hooks and no dependencies, so it can
 * be used from server-rendered loading.tsx files and anywhere else.
 */
export default function BrandLoader({
  size = 88,
  label,
  slow = false,
}: {
  size?: number;
  label?: string;
  slow?: boolean;
}) {
  return (
    <div role="status" aria-live="polite" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
        <g className="ivy-bl-house">
          <path
            d="M60 36 L90 62 H83 V86 H68 V67 H52 V86 H37 V62 H30 Z"
            fill="#4CAF50"
            stroke="#4CAF50"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>
        <path
          className="ivy-bl-circle"
          pathLength={100}
          d="M88 26 C66 6 20 14 11 52 C3 90 46 114 82 104 C108 96 117 64 99 40"
          stroke="#FF3131"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          className="ivy-bl-brush"
          pathLength={100}
          d="M20 113 C46 110 78 111 102 109"
          stroke="#FF3131"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
      {(label || slow) && (
        <div style={{ fontSize: 13, textAlign: "center", color: slow ? "#B45309" : "var(--ivy-bl-text, #667085)", fontWeight: slow ? 600 : 400, maxWidth: 280, lineHeight: 1.5 }}>
          {slow ? "This is taking longer than expected. Still working on it." : label}
        </div>
      )}
      <style>{`
        .ivy-bl-circle { stroke-dasharray: 100; stroke-dashoffset: 100; animation: ivy-bl-draw 2.4s cubic-bezier(.65,0,.35,1) infinite; }
        .ivy-bl-brush { stroke-dasharray: 100; stroke-dashoffset: 100; animation: ivy-bl-brush 2.4s cubic-bezier(.65,0,.35,1) infinite; }
        .ivy-bl-house { transform-origin: 60px 70px; animation: ivy-bl-pop 2.4s ease-in-out infinite; }
        @keyframes ivy-bl-draw { 0% { stroke-dashoffset: 100; opacity: 1; } 50% { stroke-dashoffset: 0; opacity: 1; } 88% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }
        @keyframes ivy-bl-brush { 0%, 40% { stroke-dashoffset: 100; opacity: 1; } 68% { stroke-dashoffset: 0; opacity: 1; } 88% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 0; } }
        @keyframes ivy-bl-pop { 0% { transform: scale(.9); opacity: .35; } 28% { transform: scale(1); opacity: 1; } 88% { transform: scale(1); opacity: 1; } 100% { transform: scale(.96); opacity: .35; } }
        @media (prefers-reduced-motion: reduce) {
          .ivy-bl-circle, .ivy-bl-brush { animation: none; stroke-dashoffset: 0; }
          .ivy-bl-house { animation: none; }
        }
      `}</style>
    </div>
  );
}

/** Full-screen version used by Next's route-level loading.tsx files. */
export function BrandLoaderScreen({ label = "Loading" }: { label?: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ivy-bl-bg, #FBFBFC)",
        fontFamily: "var(--font-outfit), sans-serif",
      }}
    >
      <BrandLoader size={104} label={label} />
      <style>{`
        :root { --ivy-bl-bg: #FBFBFC; --ivy-bl-text: #667085; }
        @media (prefers-color-scheme: dark) { :root { --ivy-bl-bg: #0D0F12; --ivy-bl-text: #9098A5; } }
      `}</style>
    </div>
  );
}
