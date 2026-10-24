import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ivy — Real Estate Operations, Unified | An Infoma Product",
  description:
    "Listings, leases, payments, maintenance, and chat — one platform for landlords, managers, and tenants across Kenya. Built by Infoma.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Poppins: Infoma's brand typeface (visually matched from their site —
            geometric sans, rounded terminals; not confirmed via direct CSS
            inspection, so treat as a close approximation rather than a
            pixel-exact match). Used for both body and display type, at
            different weights, mirroring how Infoma's own site doesn't
            appear to pair a separate serif/display face. Loaded via a
            runtime <link> rather than next/font/google so a font-fetch
            hiccup can never fail the production build itself. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- this rule
            predates the App Router; root layout.tsx is the correct, only
            place to declare a site-wide font link here. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
