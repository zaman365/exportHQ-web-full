import { describe, expect, it } from "vitest";
import { exportPanelUrl, publicSiteUrl } from "./deployment-urls";

describe("deployment URLs", () => {
  it("uses the validated canonical host", () => {
    expect(publicSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://export-hq.com" }).origin)
      .toBe("https://export-hq.com");
    expect(exportPanelUrl({ NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "https://export-hq.com/ExportPanel" }).pathname)
      .toBe("/ExportPanel");
  });

  it("fails a production build when either URL is missing or insecure", () => {
    expect(() => publicSiteUrl({ NODE_ENV: "production" })).toThrow(/required/);
    expect(() => exportPanelUrl({ NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "http://example.com/ExportPanel" }))
      .toThrow(/HTTPS/);
  });

  it("keeps local development convenient without creating a production fallback", () => {
    expect(publicSiteUrl({ NODE_ENV: "development" }).hostname).toBe("export-hq.com");
    expect(exportPanelUrl({ NODE_ENV: "development" }).origin).toBe("http://localhost:3001");
  });
});
