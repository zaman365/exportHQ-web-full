import { describe, expect, it } from "vitest";
import { readinessProgressSchema, readinessReferralRequestSchema } from "./index";

const assessmentId = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const exportLaneId = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";

describe("readiness commands", () => {
  it("accepts optimistic lane-scoped progress metadata", () => {
    expect(readinessProgressSchema.safeParse({
      version: 1,
      assessmentId,
      assessmentVersion: 3,
      exportLaneId,
      currentSection: "business",
      profile: {
        businessModel: "manufacturer",
        productCategory: "apparel",
        productName: "Synthetic product",
        hsCode: "620520",
        targetMarketCode: "DE",
        salesChannel: "wholesale"
      },
      responses: { "bd-entity-registration": "blocked" },
      notes: { "bd-entity-registration": "Resolve the synthetic mismatch" },
      evidence: []
    }).success).toBe(true);
  });

  it("requires a stable request and assessment identifier for support", () => {
    expect(readinessReferralRequestSchema.safeParse({
      requirementId: "bd-entity-registration",
      providerCategory: "corporate-legal",
      consentToReferralDisclosure: true
    }).success).toBe(false);
    expect(readinessReferralRequestSchema.safeParse({
      requestId: exportLaneId,
      assessmentId,
      requirementId: "bd-entity-registration",
      providerCategory: "corporate-legal",
      consentToReferralDisclosure: true
    }).success).toBe(true);
  });
});
