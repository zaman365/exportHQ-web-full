import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";

/* The operator console loads the same three families as the customer product
   and the public website — docs/brand/05-typography.md. */
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
  title: "Export HQ — Operations",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = { themeColor: "#ff6a1a", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
