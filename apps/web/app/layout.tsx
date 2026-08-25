import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans"
});

const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono"
});

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display"
});

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://exporthq.com");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Export HQ — The operating system for international growth",
  description: "Export readiness, compliance, buyer development, trade operations, logistics and payments—managed in one accountable workspace for businesses of every size and industry.",
  keywords: ["export platform", "international growth", "export compliance", "buyer development", "trade operations"],
  openGraph: {
    title: "Export HQ",
    description: "Everything export. One platform. One accountable team.",
    type: "website",
    url: siteUrl,
    siteName: "Export HQ",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Export HQ — The operating system for international growth" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Export HQ",
    description: "The operating system for international growth.",
    images: ["/og.png"]
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: "#04100b",
  colorScheme: "light"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
