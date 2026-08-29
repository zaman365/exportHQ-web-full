import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono, Manrope } from "next/font/google";
import { tenantTheme } from "@exporthq/ui";
import { resolveLocale } from "@exporthq/domain";
import { cookies } from "next/headers";
import { AuthProvider } from "./_components/auth-provider";
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  /* The only route a customer colour takes into the DOM. tenantTheme() emits
     exactly four custom properties and clamps them for contrast, so a tenant
     can never reach Export HQ chrome, actions or status colour. */
  const tenant = tenantTheme();
  const store = await cookies();
  const locale = resolveLocale(store.get("exporthq_locale")?.value);
  const lowData = store.get("exporthq_low_data")?.value === "true";

  return (
    <html lang={locale} className={`${sans.variable} ${mono.variable} ${display.variable}${lowData ? " low-data" : ""}`}>
      <body style={tenant}>
        <AuthProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
