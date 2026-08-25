import { describe, expect, it } from "vitest";
import {
  AuthorizationError,
  authorizeOrganization,
  canAccessOrganization,
  featuresForTier,
  isPaidTier,
  permissionsForTier,
  resolveMarketIntelligenceAccess,
  resolveReadinessAccess,
  scopeRows,
  tierHasFeature,
  type CustomerPrincipal,
  type StaffPrincipal
} from "./index";

const owner: CustomerPrincipal = {
  kind: "customer",
  userId: "user_a",
  organizationId: "org_a",
  permissions: new Set(["products:view", "documents:view", "documents:manage"])
};

describe("tenant isolation", () => {
  it("prevents Org A from reading, mutating, or enumerating Org B resources", () => {
    expect(canAccessOrganization(owner, "org_b", "products:view")).toBe(false);
    expect(() => authorizeOrganization(owner, "org_b", "documents:manage")).toThrow(AuthorizationError);
    expect(scopeRows(owner, [
      { id: "a", organizationId: "org_a" },
      { id: "b", organizationId: "org_b" }
    ], "documents:view")).toEqual([{ id: "a", organizationId: "org_a" }]);
  });

  it("requires an explicit active staff grant", () => {
    const staff: StaffPrincipal = {
      kind: "staff",
      userId: "staff_1",
      globalPermissions: new Set(["customers:view"]),
      grants: [{
        organizationId: "org_a",
        permissions: new Set(["compliance:view"]),
        expiresAt: new Date("2026-09-01")
      }]
    };
    const now = new Date("2026-08-13");
    expect(canAccessOrganization(staff, "org_a", "compliance:view", now)).toBe(true);
    expect(canAccessOrganization(staff, "org_b", "compliance:view", now)).toBe(false);
    expect(canAccessOrganization(staff, "org_a", "compliance:manage", now)).toBe(false);
  });
});

describe("subscription entitlements", () => {
  it("keeps the public preview read-only and progressively expands paid access", () => {
    expect(featuresForTier("preview")).toEqual(["home", "learning"]);
    expect(tierHasFeature("explore", "onboarding")).toBe(true);
    expect(tierHasFeature("explore", "opportunities")).toBe(true);
    expect(tierHasFeature("explore", "readiness")).toBe(true);
    expect(tierHasFeature("explore", "export-studio")).toBe(true);
    expect(tierHasFeature("explore", "inbox")).toBe(false);
    expect(tierHasFeature("launch", "decisions")).toBe(true);
    expect(tierHasFeature("launch", "attention")).toBe(false);
    expect(tierHasFeature("scale", "attention")).toBe(true);
    expect(tierHasFeature("scale", "managed-services")).toBe(false);
    expect(tierHasFeature("managed", "managed-services")).toBe(true);
  });

  it("unlocks full market intelligence through verification or a paid plan", () => {
    expect(resolveMarketIntelligenceAccess({ authenticated: false, businessVerification: "unverified", tier: "preview" })).toBe("public");
    expect(resolveMarketIntelligenceAccess({ authenticated: true, businessVerification: "unverified", tier: "explore" })).toBe("member");
    expect(resolveMarketIntelligenceAccess({ authenticated: true, businessVerification: "verified", tier: "explore" })).toBe("full");
    expect(resolveMarketIntelligenceAccess({ authenticated: true, businessVerification: "pending", tier: "launch" })).toBe("full");
    expect(isPaidTier("explore")).toBe(false);
    expect(isPaidTier("scale")).toBe(true);
  });

  it("uses the same verified-business or paid-plan gate for full readiness solutions", () => {
    expect(resolveReadinessAccess({ authenticated: true, businessVerification: "unverified", tier: "explore" })).toBe("member");
    expect(resolveReadinessAccess({ authenticated: true, businessVerification: "verified", tier: "explore" })).toBe("full");
    expect(resolveReadinessAccess({ authenticated: true, businessVerification: "pending", tier: "launch" })).toBe("full");
  });

  it("keeps Basic mutation access limited to its own readiness assessment", () => {
    expect(permissionsForTier("preview").size).toBe(0);
    expect(permissionsForTier("explore")).toEqual(new Set(["company:view", "readiness:view", "readiness:manage"]));
    expect(permissionsForTier("explore").has("documents:manage")).toBe(false);
    expect(permissionsForTier("launch").has("tasks:manage")).toBe(true);
    expect(permissionsForTier("scale").has("team:manage")).toBe(true);
  });
});
