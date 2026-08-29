import type { MetadataRoute } from "next";
import { publicSiteUrl } from "./_lib/deployment-urls";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{
    url: publicSiteUrl().toString(),
    changeFrequency: "weekly",
    priority: 1
  }];
}
