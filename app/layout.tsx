import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { Scanlines } from "@/components/terminal/Scanlines";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jed Gabriel Seno — COBOL Developer · AI Engineer · People Manager",
  description:
    "Engineering leader with 9 years spanning COBOL mainframe development and people management, now driving AI adoption at DXC Technology.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plexMono.variable}>
      <body className="min-h-dvh antialiased">
        <Scanlines />
        {children}
      </body>
    </html>
  );
}
