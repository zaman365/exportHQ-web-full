import { describe, expect, it } from "vitest";
import {
  assessNativeMobileNeed,
  assertPartnershipRights,
  assertPostGaCommercialBoundary,
  assertProgrammeAggregateAccess,
  assertShipmentLearningAutomation,
  prohibitedPostGaBusinessModels
} from "./post-ga";

const reference = "evidence/immutable-record.json";

describe("post-GA product boundaries", () => {
  it("refuses every explicitly prohibited business-model drift", () => {
    for (const model of prohibitedPostGaBusinessModels) {
      expect(() => assertPostGaCommercialBoundary(model)).toThrow(/Post-GA scope/);
    }
    expect(() => assertPostGaCommercialBoundary("programme_dashboard")).not.toThrow();
  });

  it("requires current, use-specific partnership rights and subject controls", () => {
    const evidence = {
      rightsHolder: "Reviewed Data Partner Ltd",
      evidenceReference: reference,
      permittedUses: ["buyer_match"],
      requestedUse: "buyer_match",
      expiresAt: new Date("2028-01-01"),
      correctionChannel: "https://partner.example/correction",
      optOutMechanism: "https://partner.example/opt-out",
      now: new Date("2027-01-01")
    };
    expect(() => assertPartnershipRights(evidence)).not.toThrow();
    expect(() => assertPartnershipRights({ ...evidence, requestedUse: "benchmark_resale" })).toThrow(/not licensed/);
    expect(() => assertPartnershipRights({ ...evidence, expiresAt: new Date("2026-01-01") })).toThrow(/expired/);
  });

  it("allows only sufficiently sized, consented programme aggregates", () => {
    const request = {
      grantStatus: "active" as const,
      grantedProgrammeId: "programme-1",
      requestedProgrammeId: "programme-1",
      participantCount: 5,
      minimumCohortSize: 5,
      requestedMetrics: ["completed_lane_rate"],
      consentedMetrics: ["completed_lane_rate"],
      consentEvidenceReferences: Array.from({ length: 5 }, (_, index) => `${reference}#${index}`),
      containsDirectIdentifiers: false,
      aggregateOnly: true
    };
    expect(() => assertProgrammeAggregateAccess(request)).not.toThrow();
    expect(() => assertProgrammeAggregateAccess({ ...request, participantCount: 4 })).toThrow(/too small/);
    expect(() => assertProgrammeAggregateAccess({ ...request, containsDirectIdentifiers: true })).toThrow(/aggregates only/);
    expect(() => assertProgrammeAggregateAccess({ ...request, requestedMetrics: ["revenue"] })).toThrow(/lacks consent/);
  });

  it("keeps shipment learning tenant-local and repeat orders reviewable", () => {
    const request = {
      sourceOrganizationId: "org-1",
      targetOrganizationId: "org-1",
      completedLaneEvidenceReference: reference,
      customerConsentReference: reference,
      output: "repeat_order_draft" as const,
      externalAction: "draft_only" as const
    };
    expect(() => assertShipmentLearningAutomation(request)).not.toThrow();
    expect(() => assertShipmentLearningAutomation({ ...request, targetOrganizationId: "org-2" })).toThrow(/tenant/);
    expect(() => assertShipmentLearningAutomation({ ...request, externalAction: "automatic_order" })).toThrow(/cannot commit/);
  });

  it("requires observed PWA gaps before native mobile can be considered", () => {
    expect(assessNativeMobileNeed({
      pwaEvaluated: true,
      observedUnmetWorkflowCount: 2,
      affectedUserCount: 7,
      evidenceReference: reference,
      productApprovalReference: reference
    })).toEqual([]);
    expect(assessNativeMobileNeed({
      pwaEvaluated: false,
      observedUnmetWorkflowCount: 0,
      affectedUserCount: 0,
      evidenceReference: "pending",
      productApprovalReference: "pending"
    })).toEqual(expect.arrayContaining([
      "pwa:not-evaluated",
      "unmet-workflows:not-observed",
      "affected-users:not-observed",
      "usage-evidence:missing",
      "product-approval:missing"
    ]));
  });
});
