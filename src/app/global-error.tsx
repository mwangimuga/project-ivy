"use client";

import { useEffect } from "react";

const C = { forest: "#63BC46", cream: "#F7F8FA", charcoal: "#0A0A0A", red: "#DC2626", border: "#E5E7EB" };

// Next.js swallows error details in production by default. This boundary
// catches anything that throws during render anywhere in the app and
// actually shows the message + digest, so "Application error: a
// client-side exception has occurred" stops being a dead end.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, fontFamily: "var(--font-outfit), sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: C.forest,
            padding: 20,
          }}
        >
          <div style={{ background: C.cream, borderRadius: 20, padding: 40, maxWidth: 560, width: "100%" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.red, marginBottom: 8 }}>
              Something went wrong
            </div>
            <div
              style={{
                background: "#FEE2E2",
                border: "1px solid #FECACA",
                borderRadius: 10,
                padding: 14,
                fontSize: 13,
                color: "#7F1D1D",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                marginBottom: 16,
              }}
            >
              {error.message || "Unknown error"}
              {error.digest && `\n\ndigest: ${error.digest}`}
            </div>
            <button
              onClick={() => reset()}
              style={{ padding: "10px 20px", background: C.forest, color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
