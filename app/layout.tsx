import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Configuration Viewport pour rendre l'application 100% responsive sur mobile
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "UCUP 2026",
    template: "%s | UCUP 2026",
  },
  description: "Championnat universitaire de football - UCUP 2026",
  openGraph: {
    siteName: "UCUP 2026",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased bg-zinc-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}