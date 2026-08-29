import { describe, expect, it } from "vitest";
import { parseClerkEvent } from "./clerk-events";

describe("Clerk event projection parsing", () => {
  it("maps organization and membership events without trusting client fields", () => {
    expect(parseClerkEvent({ type: "organization.created", data: { id: "org_abcdefgh", name: "Acme", slug: "acme" } }).command)
      .toEqual({ kind: "organization-upsert", clerkOrganizationId: "org_abcdefgh", slug: "acme", legalName: "Acme", tradingName: "Acme" });

    expect(parseClerkEvent({
      type: "organizationMembership.updated",
      data: { organization: { id: "org_abcdefgh" }, public_user_data: { user_id: "user_1" }, role: "org:admin" }
    }).command).toEqual({
      kind: "membership-upsert",
      clerkOrganizationId: "org_abcdefgh",
      clerkUserId: "user_1",
      role: "org:admin",
      active: true
    });
  });

  it("turns provider plan events into reconciliation, not permissions", () => {
    expect(parseClerkEvent({ type: "subscription.updated", data: { organization_id: "org_abcdefgh" } }).command)
      .toEqual({ kind: "reconciliation-request", scope: "subscription", clerkOrganizationId: "org_abcdefgh" });
  });

  it("marks unreviewed events ignored and rejects malformed handled events", () => {
    expect(parseClerkEvent({ type: "session.created", data: {} }).handled).toBe(false);
    expect(() => parseClerkEvent({ type: "organization.created", data: {} })).toThrow(/missing organization id/);
  });
});
