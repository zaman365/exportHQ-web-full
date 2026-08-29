import { describe, expect, it } from "vitest";
import { assertApprovedMailboxSend, assertMailboxProviderReviewed } from "./index";

describe("mailbox provider boundary", () => {
  it("requires matching, current scope/legal/security review", () => {
    const adapter = { provider: "selected-mail", requiredScopes: ["mail.read", "mail.send"] };
    const evidence = {
      provider: "selected-mail",
      reviewedScopes: ["mail.read", "mail.send"],
      oauthScopeReviewReference: "SEC-101",
      legalReviewReference: "LEGAL-101",
      securityReviewReference: "SEC-102",
      reviewedAt: new Date("2026-08-01"),
      expiresAt: new Date("2027-08-01")
    };
    expect(() => assertMailboxProviderReviewed(adapter, evidence, new Date("2026-08-29"))).not.toThrow();
    expect(() => assertMailboxProviderReviewed({ ...adapter, requiredScopes: [...adapter.requiredScopes, "contacts.read"] }, evidence, new Date("2026-08-29"))).toThrow(/contacts.read/);
  });

  it("rejects an unapproved send request", () => {
    expect(() => assertApprovedMailboxSend({
      connectionReference: "connection",
      draftReference: "draft",
      approvalReference: "",
      bodyStorageRef: "vault/body",
      bodyHashSha256: "a".repeat(64),
      toAddresses: ["buyer@example.test"],
      ccAddresses: [],
      subject: "Quote",
      idempotencyKey: "send-1"
    })).toThrow(/approval/);
  });
});
