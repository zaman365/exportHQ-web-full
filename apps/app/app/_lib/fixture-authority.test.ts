import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = resolve(import.meta.dirname, "..");

function source(relativePath: string): string {
  return readFileSync(resolve(appRoot, relativePath), "utf8");
}

describe("production tenant fixture authority", () => {
  it("keeps the root layout, paid dashboard and workspace shell free of demoSnapshot", () => {
    for (const path of ["layout.tsx", "page.tsx", "_components/workspace-shell.tsx"]) {
      expect(source(path), path).not.toContain("demoSnapshot");
    }
  });

  it("checks the real-tenant branch before loading every preview-only module", () => {
    for (const path of [
      "attention/page.tsx",
      "blueprints/page.tsx",
      "buyers/page.tsx",
      "create/page.tsx",
      "decisions/page.tsx",
      "ideas/page.tsx",
      "inbox/page.tsx",
      "opportunities/page.tsx",
      "requirements/page.tsx",
      "studio/page.tsx",
      "team/page.tsx",
      "waiting/page.tsx",
      "work/page.tsx"
    ]) {
      const value = source(path);
      const tenantGuard = value.indexOf("session.userId && !session.isDemo");
      const previewLoad = value.indexOf("import(");
      expect(tenantGuard, `${path} must guard real tenants`).toBeGreaterThan(-1);
      expect(previewLoad, `${path} must defer preview imports`).toBeGreaterThan(tenantGuard);
    }
  });

  it("confines direct demoSnapshot imports to preview adapters", () => {
    for (const path of ["preview/dashboard/page.tsx", "waiting/preview-waiting.tsx"]) {
      expect(source(path), path).toContain("demoSnapshot");
    }
  });
});
