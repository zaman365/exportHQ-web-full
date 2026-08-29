import { describe, expect, it } from "vitest";
import {
  assertGeneralAvailabilityEvidence,
  assessGeneralAvailabilityEvidence,
  type GeneralAvailabilityEvidence
} from "./general-availability";

const sourceSha = "a".repeat(40);
const reference = "evidence/immutable-record.json";

function completeEvidence(): GeneralAvailabilityEvidence {
  const approval = (name: string) => ({
    reviewerName: name,
    reviewerOrganization: `${name} Assurance Ltd`,
    independent: true as const,
    signedAt: "2027-04-05T12:00:00.000Z",
    evidenceReference: reference
  });
  return {
    schemaVersion: 1,
    status: "approved",
    founderName: "Founder Operator",
    generatedAt: "2027-04-05T12:00:00.000Z",
    sourceSha,
    releaseTag: "v1.0.0",
    releaseCandidate: {
      startedAt: "2027-03-29T11:59:59.000Z",
      endedAt: "2027-04-05T12:00:00.000Z",
      productionLike: true,
      sameRuntime: true,
      sameBindings: true,
      sameMigrations: true,
      sameIntegrations: true,
      loadPassed: true,
      syntheticMonitoringPassed: true,
      materialChangesRestartedWindow: true,
      observationReferences: Array.from({ length: 7 }, (_, index) => `evidence/soak-day-${index + 1}.json`)
    },
    independentApprovals: {
      security: approval("Security Reviewer"),
      privacy_legal: approval("Privacy Reviewer"),
      business: approval("Business Reviewer"),
      recovery: approval("Recovery Reviewer"),
      rollback: approval("Rollback Reviewer")
    },
    assuranceEvidence: {
      application_security: reference,
      api_security: reference,
      tenant_isolation: reference,
      privacy_legal: reference,
      incident_tabletop: reference,
      business_continuity: reference,
      billing: reference,
      refund: reference,
      cancellation: reference,
      data_export: reference,
      data_deletion: reference
    },
    recovery: {
      observedRpoMinutes: 15,
      observedRtoMinutes: 240,
      backupReference: reference,
      pitrReference: reference,
      independentExportReference: reference,
      restoreReference: reference,
      rlsVerificationReference: reference
    },
    releaseEvidence: {
      tag_signature: reference,
      artifact: reference,
      sbom: reference,
      provenance: reference,
      migration_report: reference,
      backfill_report: reference,
      capability_status: reference,
      test_report: reference,
      security_report: reference,
      recovery_report: reference,
      release_notes: reference,
      accepted_risks: reference,
      rollback_artifact: reference,
      rollback_commands: reference,
      artifactSha256: "b".repeat(64),
      rollbackOwner: "Release Operator"
    },
    outcomes: {
      completedLanes: 5,
      exportersWithMatchedRealizedProceeds: 3,
      handledExceptionsOrDiscrepancies: 1,
      repeatUsesOrOrders: 1,
      crossTenantExposureCount: 0,
      unresolvedCriticalOrHighVulnerabilities: 0,
      sustainableSupportAndManagedWorkEconomics: true,
      evidenceReference: reference
    }
  };
}

describe("General Availability evidence", () => {
  it("accepts a complete seven-day, independently reviewed release record", () => {
    const evidence = completeEvidence();
    expect(assessGeneralAvailabilityEvidence(evidence, { sourceSha, releaseTag: "v1.0.0" })).toEqual([]);
    expect(() => assertGeneralAvailabilityEvidence(evidence)).not.toThrow();
  });

  it("does not treat founder risk acceptance as independent approval", () => {
    const complete = completeEvidence();
    const evidence: GeneralAvailabilityEvidence = {
      ...complete,
      independentApprovals: {
        ...complete.independentApprovals,
        security: {
          ...complete.independentApprovals.security,
          reviewerName: complete.founderName
        }
      }
    };
    expect(assessGeneralAvailabilityEvidence(evidence)).toContain(
      "independentApprovals.security:founder-cannot-self-approve"
    );
  });

  it("rejects a short or materially changed soak window", () => {
    const complete = completeEvidence();
    const evidence: GeneralAvailabilityEvidence = {
      ...complete,
      releaseCandidate: {
        ...complete.releaseCandidate,
        endedAt: "2027-04-01T12:00:00.000Z",
        materialChangesRestartedWindow: false
      }
    };
    expect(assessGeneralAvailabilityEvidence(evidence)).toEqual(expect.arrayContaining([
      "releaseCandidate:less-than-seven-days",
      "releaseCandidate.materialChangesRestartedWindow:not-proven"
    ]));
  });

  it("rejects placeholder evidence and missed recovery objectives", () => {
    const complete = completeEvidence();
    const evidence: GeneralAvailabilityEvidence = {
      ...complete,
      assuranceEvidence: { ...complete.assuranceEvidence, privacy_legal: "will-do-later" },
      recovery: { ...complete.recovery, observedRpoMinutes: 16, observedRtoMinutes: 241 }
    };
    expect(assessGeneralAvailabilityEvidence(evidence)).toEqual(expect.arrayContaining([
      "assuranceEvidence.privacy_legal:missing-or-placeholder",
      "recovery.observedRpoMinutes:exceeds-15",
      "recovery.observedRtoMinutes:exceeds-240"
    ]));
  });

  it("enforces the GA outcome floor regardless of target date", () => {
    const complete = completeEvidence();
    const evidence: GeneralAvailabilityEvidence = {
      ...complete,
      outcomes: {
        ...complete.outcomes,
        completedLanes: 4,
        exportersWithMatchedRealizedProceeds: 2,
        crossTenantExposureCount: 1
      }
    };
    expect(assessGeneralAvailabilityEvidence(evidence)).toEqual(expect.arrayContaining([
      "outcomes.completedLanes:need-five",
      "outcomes.exportersWithMatchedRealizedProceeds:need-three",
      "outcomes.crossTenantExposureCount:must-be-zero"
    ]));
  });

  it("binds the evidence to the exact signed tag and source commit", () => {
    const evidence = completeEvidence();
    expect(assessGeneralAvailabilityEvidence(evidence, {
      sourceSha: "c".repeat(40),
      releaseTag: "v1.0.1",
      artifactSha256: "d".repeat(64)
    })).toEqual(expect.arrayContaining([
      "sourceSha:mismatch",
      "releaseTag:mismatch",
      "releaseEvidence.artifactSha256:mismatch"
    ]));
  });
});
