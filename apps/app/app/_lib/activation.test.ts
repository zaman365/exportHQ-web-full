import { describe, expect, it } from "vitest";
import type { CustomerSession } from "@exporthq/auth";
import { workspaceProjectionKind } from "./activation";

function session(overrides: Partial<CustomerSession>): CustomerSession {
  return {
    status: "active",
    userId: "user_1",
    organizationId: "org_1",
    organizationName: "ABC Textiles",
    organizationRole: "org:admin",
    userName: "Member",
    userEmail: null,
    tier: "managed",
    businessVerification: "verified",
    features: [],
    principal: null,
    isDemo: false,
    isPlatformAdmin: false,
    ...overrides
  };
}

describe("workspace projection", () => {
  it("labels a signed-in production workspace as illustrative until tenant records are activated", () => {
    expect(workspaceProjectionKind(session({}))).toBe("illustrative");
  });

  it("labels a platform administrator's workspace the same way", () => {
    expect(workspaceProjectionKind(session({ isPlatformAdmin: true }))).toBe("illustrative");
  });

  it("labels demo identity distinctly", () => {
    expect(workspaceProjectionKind(session({ isDemo: true }))).toBe("demo-identity");
  });

  it("does not label the signed-out public sample, which already says what it is", () => {
    expect(workspaceProjectionKind(session({ userId: null, principal: null }))).toBe("customer-records");
  });
});
