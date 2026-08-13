import { describe, expect, it } from "vitest";
import {
  AuthorizationError,
  authorizeOrganization,
  canAccessOrganization,
  scopeRows,
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
