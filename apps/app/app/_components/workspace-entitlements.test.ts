import { describe, expect, it } from "vitest";
import { describeWorkspaceEntitlement } from "./workspace-entitlements";

describe("workspace entitlement presentation", () => {
  it("keeps a premium marker after plan access is active", () => {
    const result = describeWorkspaceEntitlement({
      authenticated: true,
      businessVerification: "unverified",
      feature: "attention",
      tier: "scale"
    });
    expect(result.displayAccess).toBe("full");
    expect(result.indicator).toBe("gem");
    expect(result.category).toBe("Your premium access · Active");
    expect(result.message).toContain("Scale workspace");
  });

  it("marks trust-gated Basic access as a premium preview", () => {
    const result = describeWorkspaceEntitlement({
      authenticated: true,
      businessVerification: "unverified",
      feature: "opportunities",
      tier: "explore"
    });
    expect(result.routeAccess).toBe("full");
    expect(result.displayAccess).toBe("preview");
    expect(result.indicator).toBe("gem");
    expect(result.message).toContain("Verify this business");
  });

  it("shows verified-business access as the reason full depth is active", () => {
    const result = describeWorkspaceEntitlement({
      authenticated: true,
      businessVerification: "verified",
      feature: "readiness",
      tier: "explore"
    });
    expect(result.displayAccess).toBe("full");
    expect(result.indicator).toBe("shield");
    expect(result.category).toBe("Your premium access · Verified business");
  });

  it("does not badge standard full-access modules", () => {
    const result = describeWorkspaceEntitlement({
      authenticated: true,
      businessVerification: "unverified",
      feature: "home",
      tier: "explore"
    });
    expect(result.indicator).toBeNull();
    expect(result.premium).toBe(false);
  });
});
