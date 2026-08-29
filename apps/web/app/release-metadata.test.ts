import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";
import { createSiteMetadata } from "./_lib/site-metadata";

const canonical = new URL("https://export-hq.com");

describe("public release metadata", () => {
  it("keeps canonical and Open Graph metadata on the validated host", () => {
    const metadata = createSiteMetadata(canonical);
    expect(new URL(metadata.metadataBase ?? canonical).origin).toBe(canonical.origin);
    expect(metadata.alternates).toEqual({ canonical: "/" });
    expect(metadata.openGraph).toMatchObject({ url: canonical, siteName: "Export HQ" });
  });

  it("generates canonical sitemap and robots entries", () => {
    process.env.NEXT_PUBLIC_SITE_URL = canonical.origin;
    expect(sitemap()[0]?.url).toBe("https://export-hq.com/");
    expect(robots()).toMatchObject({
      sitemap: "https://export-hq.com/sitemap.xml",
      host: "https://export-hq.com"
    });
  });

  it("keeps internal product links rooted in the configured ExportPanel URL", async () => {
    const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");
    expect(source).toContain("`${appUrl}/readiness?access=public`");
    expect(source).toContain("`${appUrl}/sign-in`");
    expect(source).toContain("`${appUrl}/plans`");
    expect(source).not.toContain("https://exporthq.com");
  });
});
