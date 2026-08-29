import { describe, expect, it } from "vitest";
import {
  AuthorizationError,
  authorizeOrganization,
  canAccessOrganization,
  emailAccountLimitForTier,
  featuresForTier,
  isPaidTier,
  minimumTierForFeature,
  permissionsForOrganizationRole,
  permissionsForTier,
  resolveMarketIntelligenceAccess,
  resolveReadinessAccess,
  resolveWorkspaceFeatureAccess,
  scopeRows,
  tierHasFeature,
  workspaceFeatureEntitlement,
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

  it("does not let a platform administrator bypass an organization grant", () => {
    const administrator: StaffPrincipal = {
      kind: "staff",
      userId: "staff_admin",
      globalPermissions: new Set(["customers:view", "customers:manage", "platform:admin"]),
      grants: []
    };
    expect(canAccessOrganization(administrator, "org_a", "company:view")).toBe(false);
  });
});

describe("subscription entitlements", () => {
  it("keeps the public preview read-only and progressively expands paid access", () => {
    expect(featuresForTier("preview")).toEqual([
      "home",
      "learning",
      "plans",
      "readiness",
      "markets",
      "opportunities",
      "export-studio"
    ]);
    expect(tierHasFeature("explore", "onboarding")).toBe(true);
    expect(tierHasFeature("explore", "settings")).toBe(true);
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

  it("enforces the organization position hierarchy inside the plan ceiling", () => {
    const ownerPermissions = permissionsForOrganizationRole({ tier: "scale", role: "org:owner" });
    const leadPermissions = permissionsForOrganizationRole({ tier: "scale", role: "org:department_lead" });
    const managerPermissions = permissionsForOrganizationRole({ tier: "scale", role: "org:manager" });
    const viewerPermissions = permissionsForOrganizationRole({ tier: "scale", role: "org:viewer" });
    const externalPermissions = permissionsForOrganizationRole({ tier: "managed", role: "org:external" });

    expect(ownerPermissions.has("team:manage")).toBe(true);
    expect(ownerPermissions.has("team:message")).toBe(true);
    expect(ownerPermissions.has("subscription:self_service")).toBe(true);
    expect(ownerPermissions.has("billing:admin")).toBe(true);
    expect(ownerPermissions.has("invoice:view")).toBe(true);
    expect(ownerPermissions.has("payment:manage")).toBe(true);
    expect(ownerPermissions.has("data:export")).toBe(true);
    expect(leadPermissions.has("tasks:manage")).toBe(true);
    expect(leadPermissions.has("company:manage")).toBe(false);
    expect(leadPermissions.has("team:manage")).toBe(false);
    expect(leadPermissions.has("billing:view")).toBe(true);
    expect(leadPermissions.has("subscription:self_service")).toBe(false);
    expect(managerPermissions.has("documents:manage")).toBe(true);
    expect(managerPermissions.has("team:message")).toBe(true);
    expect(managerPermissions.has("email:send")).toBe(true);
    expect(managerPermissions.has("email:manage")).toBe(false);
    expect(managerPermissions.has("products:manage")).toBe(false);
    expect([...viewerPermissions].every((permission) => permission.endsWith(":view"))).toBe(true);
    expect(externalPermissions.size).toBe(0);
  });

  it("allows explicit exceptional grants but never above the subscription ceiling", () => {
    const granted = permissionsForOrganizationRole({
      tier: "scale",
      role: "org:external",
      explicitPermissions: ["org:company:view", "org:team:manage", "org:not-real"]
    });
    const basic = permissionsForOrganizationRole({
      tier: "explore",
      role: "org:executive",
      explicitPermissions: ["org:company:view", "org:team:manage"]
    });

    expect(granted).toEqual(new Set(["company:view", "team:manage"]));
    expect(basic).toEqual(new Set(["company:view"]));
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
    expect(resolveReadinessAccess({ authenticated: false, businessVerification: "unverified", tier: "preview" })).toBe("public");
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
    expect(permissionsForTier("scale").has("team:view")).toBe(true);
    expect(permissionsForTier("scale").has("team:message")).toBe(true);
    expect(permissionsForTier("launch").has("email:send")).toBe(true);
    expect(permissionsForTier("launch").has("subscription:self_service")).toBe(true);
    expect(permissionsForTier("launch").has("invoice:view")).toBe(true);
    expect(permissionsForTier("launch").has("payment:manage")).toBe(false);
    expect(emailAccountLimitForTier("explore")).toBe(0);
    expect(emailAccountLimitForTier("launch")).toBe(1);
    expect(emailAccountLimitForTier("scale")).toBe(5);
    expect(emailAccountLimitForTier("managed")).toBe(12);
  });

  it("keeps premium features discoverable through safe progressive previews", () => {
    expect(resolveWorkspaceFeatureAccess({ authenticated: false, feature: "inbox", tier: "preview" })).toBe("preview");
    expect(resolveWorkspaceFeatureAccess({ authenticated: false, feature: "team", tier: "preview" })).toBe("locked");
    expect(resolveWorkspaceFeatureAccess({ authenticated: true, feature: "team", tier: "explore" })).toBe("preview");
    expect(resolveWorkspaceFeatureAccess({ authenticated: true, feature: "documents", tier: "explore" })).toBe("locked");
    expect(resolveWorkspaceFeatureAccess({ authenticated: true, feature: "inbox", tier: "launch" })).toBe("full");
    expect(resolveWorkspaceFeatureAccess({ authenticated: true, feature: "attention", tier: "scale" })).toBe("full");
    expect(minimumTierForFeature("inbox")).toBe("launch");
    expect(minimumTierForFeature("attention")).toBe("scale");
  });

  it("keeps premium and verified-business entitlement metadata visible after unlock", () => {
    expect(workspaceFeatureEntitlement("home")).toBeNull();
    expect(workspaceFeatureEntitlement("inbox")).toEqual({ kind: "subscription", minimumTier: "launch" });
    expect(workspaceFeatureEntitlement("attention")).toEqual({ kind: "subscription", minimumTier: "scale" });
    expect(workspaceFeatureEntitlement("managed-services")).toEqual({ kind: "subscription", minimumTier: "managed" });
    expect(workspaceFeatureEntitlement("opportunities")).toEqual({
      kind: "trust",
      minimumTier: "launch",
      verificationAlternative: true
    });
    expect(workspaceFeatureEntitlement("readiness")).toEqual({
      kind: "trust",
      minimumTier: "launch",
      verificationAlternative: true
    });
  });
});
