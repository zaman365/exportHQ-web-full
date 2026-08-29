import type { MetadataRoute } from "next";
import { publicSiteUrl } from "./_lib/deployment-urls";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const site = publicSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/ExportPanel/" },
    sitemap: new URL("/sitemap.xml", site).toString(),
    host: site.origin
  };
}
