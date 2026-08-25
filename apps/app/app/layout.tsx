import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono, Manrope } from "next/font/google";
import { demoSnapshot } from "@exporthq/domain";
import { tenantTheme } from "@exporthq/ui";
import "./globals.css";

/* The product loads the same three families as the public website so the two
   surfaces are typographically identical — docs/brand/05-typography.md. */
const sans = Manrope({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-sans"
});

const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono"
});

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "ExportPanel — Export HQ",
  description: "The operating system for international growth.",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = {
  themeColor: "#ff6a1a",
  colorScheme: "light"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  /* The only route a customer colour takes into the DOM. tenantTheme() emits
     exactly four custom properties and clamps them for contrast, so a tenant
     can never reach Export HQ chrome, actions or status colour. */
  const tenant = tenantTheme(demoSnapshot.organization.brand);

  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body style={tenant}>{children}</body>
    </html>
  );
}
