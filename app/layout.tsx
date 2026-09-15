import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { StructuredData } from "@/components/StructuredData";
import { Scanlines } from "@/components/terminal/Scanlines";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Jed Gabriel Seno — COBOL Developer · AI Engineer · People Manager",
  description:
    "Engineering leader with 9 years spanning COBOL mainframe development and people management, now driving AI adoption at DXC Technology. Ask the AI assistant about his career.",
  keywords: [
    "COBOL",
    "mainframe",
    "AI engineer",
    "DXC Technology",
    "Philippines",
    "multi-agent",
    "N8N",
    "MCP",
  ],
  authors: [{ name: "Jed Gabriel Seno" }],
  openGraph: {
    type: "profile",
    title: "Jed Gabriel Seno — COBOL Developer · AI Engineer",
    description: "9 years of mainframe delivery, now leading AI adoption at DXC Technology.",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plexMono.variable}>
      <body className="min-h-dvh antialiased">
        <StructuredData />
        <Scanlines />
        {children}
      </body>
    </html>
  );
}
