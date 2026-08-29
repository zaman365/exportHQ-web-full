import type { Metadata } from "next";

export function createSiteMetadata(siteUrl: URL): Metadata {
  return {
    metadataBase: siteUrl,
    alternates: { canonical: "/" },
    title: "Export HQ — The operating system for international growth",
    description: "Export readiness, compliance, buyer development, trade operations, logistics and payments—managed in one accountable workspace for businesses of every size and industry.",
    keywords: [
      "export platform",
      "international growth",
      "export compliance",
      "buyer development",
      "trade operations"
    ],
    openGraph: {
      title: "Export HQ",
      description: "Everything export. One platform. One accountable team.",
      type: "website",
      url: siteUrl,
      siteName: "Export HQ",
      images: [{
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "Export HQ — The operating system for international growth"
      }]
    },
    twitter: {
      card: "summary_large_image",
      title: "Export HQ",
      description: "The operating system for international growth.",
      images: ["/og.png"]
    },
    robots: { index: true, follow: true }
  };
}
