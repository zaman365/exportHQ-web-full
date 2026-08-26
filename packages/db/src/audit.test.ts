import { describe, expect, it } from "vitest";
import { assertSafeAuditMetadata, auditableActions } from "./audit";

describe("audit metadata", () => {
  it("refuses metadata carrying credentials, bodies or signed access", () => {
    for (const key of ["password", "accessToken", "signedUrl", "messageBody", "documentContent", "apiKey"]) {
      expect(() => assertSafeAuditMetadata({ [key]: "x" })).toThrowError(/may not carry/);
    }
  });

  it("permits metadata that answers what changed and under what authority", () => {
    expect(() =>
      assertSafeAuditMetadata({ tier: "scale", reason: "pilot grant", fields: ["industry"], organizationId: "org" })
    ).not.toThrow();
  });
});

describe("auditable actions", () => {
  it("covers privileged, membership, evidence and business decisions", () => {
    for (const action of [
      "membership.role_changed",
      "entitlement.granted",
      "document.accepted",
      "staff_grant.created",
      "verification.approved"
    ]) {
      expect(auditableActions).toContain(action);
    }
  });
});
