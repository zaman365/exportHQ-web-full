import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Export HQ — Command Center",
  description: "The operating system for international growth."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
