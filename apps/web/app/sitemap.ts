import type { MetadataRoute } from "next";
import { legalDocumentSlugs } from "@exporthq/domain";
import { publicSiteUrl } from "./_lib/deployment-urls";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = publicSiteUrl();
  return [{
    url: publicSiteUrl().toString(),
    changeFrequency: "weekly",
    priority: 1
  }, {
    url: new URL("/legal", siteUrl).toString(),
    changeFrequency: "monthly",
    priority: 0.5
  }, ...legalDocumentSlugs.map((slug) => ({
    url: new URL(`/legal/${slug}`, siteUrl).toString(),
    changeFrequency: "monthly" as const,
    priority: 0.4
  }))];
}
