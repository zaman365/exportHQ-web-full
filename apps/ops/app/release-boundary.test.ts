import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("operations release boundary", () => {
  it("passes the current request into staff authentication in Proxy", async () => {
    const source = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");
    expect(source).toContain("getStaffPrincipal(request)");
    expect(source).toContain("status: 401");
  });

  it("requires an explicit grant before auditing a customer case view", async () => {
    const source = await readFile(new URL("./_lib/session.ts", import.meta.url), "utf8");
    expect(source).toContain("authorizeOrganization(principal, grant.organizationId, permission)");
    expect(source).toContain('action: "staff_grant.used"');
  });
});
