export const gaIndependentApprovalAreas = [
  "security",
  "privacy_legal",
  "business",
  "recovery",
  "rollback"
] as const;

export type GaIndependentApprovalArea = (typeof gaIndependentApprovalAreas)[number];

export interface GaIndependentApproval {
  readonly reviewerName: string;
  readonly reviewerOrganization: string;
  readonly independent: boolean;
  readonly signedAt: string;
  readonly evidenceReference: string;
}

export const gaAssuranceEvidenceAreas = [
  "application_security",
  "api_security",
  "tenant_isolation",
  "privacy_legal",
  "incident_tabletop",
  "business_continuity",
  "billing",
  "refund",
  "cancellation",
  "data_export",
  "data_deletion"
] as const;

export type GaAssuranceEvidenceArea = (typeof gaAssuranceEvidenceAreas)[number];

export const gaReleaseEvidenceAreas = [
  "tag_signature",
  "artifact",
  "sbom",
  "provenance",
  "migration_report",
  "backfill_report",
  "capability_status",
  "test_report",
  "security_report",
  "recovery_report",
  "release_notes",
  "accepted_risks",
  "rollback_artifact",
  "rollback_commands"
] as const;

export type GaReleaseEvidenceArea = (typeof gaReleaseEvidenceAreas)[number];

export interface GeneralAvailabilityEvidence {
  readonly schemaVersion: 1;
  readonly status: "approved" | "pending";
  readonly founderName: string;
  readonly generatedAt: string;
  readonly sourceSha: string;
  readonly releaseTag: string;
  readonly releaseCandidate: {
    readonly startedAt: string;
    readonly endedAt: string;
    readonly productionLike: boolean;
    readonly sameRuntime: boolean;
    readonly sameBindings: boolean;
    readonly sameMigrations: boolean;
    readonly sameIntegrations: boolean;
    readonly loadPassed: boolean;
    readonly syntheticMonitoringPassed: boolean;
    readonly materialChangesRestartedWindow: boolean;
    readonly observationReferences: readonly string[];
  };
  readonly independentApprovals: Readonly<Record<GaIndependentApprovalArea, GaIndependentApproval>>;
  readonly assuranceEvidence: Readonly<Record<GaAssuranceEvidenceArea, string>>;
  readonly recovery: {
    readonly observedRpoMinutes: number;
    readonly observedRtoMinutes: number;
    readonly backupReference: string;
    readonly pitrReference: string;
    readonly independentExportReference: string;
    readonly restoreReference: string;
    readonly rlsVerificationReference: string;
  };
  readonly releaseEvidence: Readonly<Record<GaReleaseEvidenceArea, string>> & {
    readonly artifactSha256: string;
    readonly rollbackOwner: string;
  };
  readonly outcomes: {
    readonly completedLanes: number;
    readonly exportersWithMatchedRealizedProceeds: number;
    readonly handledExceptionsOrDiscrepancies: number;
    readonly repeatUsesOrOrders: number;
    readonly crossTenantExposureCount: number;
    readonly unresolvedCriticalOrHighVulnerabilities: number;
    readonly sustainableSupportAndManagedWorkEconomics: boolean;
    readonly evidenceReference: string;
  };
}

const referencePlaceholder = /(?:^|[\s/_-])(pending|todo|tbd|placeholder|skip(?:ped)?|waiv(?:e|ed)|later|none|n\/a)(?:$|[\s/_-])/i;

function validReference(value: unknown): value is string {
  return typeof value === "string" && value.trim().length >= 8 && !referencePlaceholder.test(value.trim());
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

function requireReference(violations: string[], path: string, value: unknown): void {
  if (!validReference(value)) violations.push(`${path}:missing-or-placeholder`);
}

/**
 * Checks whether one immutable evidence manifest supports a GA release. It
 * intentionally returns every violation so operators can close the real gaps;
 * it never turns founder risk acceptance into independent assurance.
 */
export function assessGeneralAvailabilityEvidence(
  evidence: GeneralAvailabilityEvidence,
  expected?: {
    readonly sourceSha?: string;
    readonly releaseTag?: string;
    readonly artifactSha256?: string;
  }
): string[] {
  const violations: string[] = [];

  if (evidence.schemaVersion !== 1) violations.push("schemaVersion:unsupported");
  if (evidence.status !== "approved") violations.push("status:not-approved");
  if (!validReference(evidence.founderName)) violations.push("founderName:missing");
  if (!validDate(evidence.generatedAt)) violations.push("generatedAt:invalid");
  if (!/^[0-9a-f]{40}$/i.test(evidence.sourceSha)) violations.push("sourceSha:invalid");
  if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(evidence.releaseTag)) {
    violations.push("releaseTag:not-semver");
  }
  if (expected?.sourceSha && evidence.sourceSha !== expected.sourceSha) violations.push("sourceSha:mismatch");
  if (expected?.releaseTag && evidence.releaseTag !== expected.releaseTag) violations.push("releaseTag:mismatch");
  if (expected?.artifactSha256 && evidence.releaseEvidence.artifactSha256 !== expected.artifactSha256) {
    violations.push("releaseEvidence.artifactSha256:mismatch");
  }

  const soak = evidence.releaseCandidate;
  if (!validDate(soak.startedAt) || !validDate(soak.endedAt)) {
    violations.push("releaseCandidate:invalid-window");
  } else if (Date.parse(soak.endedAt) - Date.parse(soak.startedAt) < 7 * 24 * 60 * 60 * 1_000) {
    violations.push("releaseCandidate:less-than-seven-days");
  }
  for (const [name, passed] of Object.entries({
    productionLike: soak.productionLike,
    sameRuntime: soak.sameRuntime,
    sameBindings: soak.sameBindings,
    sameMigrations: soak.sameMigrations,
    sameIntegrations: soak.sameIntegrations,
    loadPassed: soak.loadPassed,
    syntheticMonitoringPassed: soak.syntheticMonitoringPassed,
    materialChangesRestartedWindow: soak.materialChangesRestartedWindow
  })) {
    if (passed !== true) violations.push(`releaseCandidate.${name}:not-proven`);
  }
  if (!Array.isArray(soak.observationReferences) || soak.observationReferences.length < 7) {
    violations.push("releaseCandidate.observationReferences:need-seven");
  } else {
    soak.observationReferences.forEach((reference, index) =>
      requireReference(violations, `releaseCandidate.observationReferences.${index}`, reference)
    );
  }

  const reviewerNames = new Set<string>();
  for (const area of gaIndependentApprovalAreas) {
    const approval = evidence.independentApprovals[area];
    if (!approval) {
      violations.push(`independentApprovals.${area}:missing`);
      continue;
    }
    if (!validReference(approval.reviewerName)) violations.push(`independentApprovals.${area}.reviewerName:missing`);
    if (!validReference(approval.reviewerOrganization)) violations.push(`independentApprovals.${area}.reviewerOrganization:missing`);
    if (approval.independent !== true) violations.push(`independentApprovals.${area}:not-independent`);
    if (approval.reviewerName.trim().toLowerCase() === evidence.founderName.trim().toLowerCase()) {
      violations.push(`independentApprovals.${area}:founder-cannot-self-approve`);
    }
    if (!validDate(approval.signedAt)) violations.push(`independentApprovals.${area}.signedAt:invalid`);
    requireReference(violations, `independentApprovals.${area}.evidenceReference`, approval.evidenceReference);
    reviewerNames.add(approval.reviewerName.trim().toLowerCase());
  }
  if (reviewerNames.has("") || reviewerNames.size === 0) violations.push("independentApprovals:no-named-reviewer");

  for (const area of gaAssuranceEvidenceAreas) {
    requireReference(violations, `assuranceEvidence.${area}`, evidence.assuranceEvidence[area]);
  }

  if (!Number.isFinite(evidence.recovery.observedRpoMinutes) || evidence.recovery.observedRpoMinutes < 0 || evidence.recovery.observedRpoMinutes > 15) {
    violations.push("recovery.observedRpoMinutes:exceeds-15");
  }
  if (!Number.isFinite(evidence.recovery.observedRtoMinutes) || evidence.recovery.observedRtoMinutes < 0 || evidence.recovery.observedRtoMinutes > 240) {
    violations.push("recovery.observedRtoMinutes:exceeds-240");
  }
  for (const [name, reference] of Object.entries(evidence.recovery).filter(([, value]) => typeof value === "string")) {
    requireReference(violations, `recovery.${name}`, reference);
  }

  for (const area of gaReleaseEvidenceAreas) {
    requireReference(violations, `releaseEvidence.${area}`, evidence.releaseEvidence[area]);
  }
  if (!/^[0-9a-f]{64}$/i.test(evidence.releaseEvidence.artifactSha256)) violations.push("releaseEvidence.artifactSha256:invalid");
  if (!validReference(evidence.releaseEvidence.rollbackOwner)) violations.push("releaseEvidence.rollbackOwner:missing");

  const outcomes = evidence.outcomes;
  for (const [name, value] of Object.entries({
    completedLanes: outcomes.completedLanes,
    exportersWithMatchedRealizedProceeds: outcomes.exportersWithMatchedRealizedProceeds,
    handledExceptionsOrDiscrepancies: outcomes.handledExceptionsOrDiscrepancies,
    repeatUsesOrOrders: outcomes.repeatUsesOrOrders,
    crossTenantExposureCount: outcomes.crossTenantExposureCount,
    unresolvedCriticalOrHighVulnerabilities: outcomes.unresolvedCriticalOrHighVulnerabilities
  })) {
    if (!Number.isSafeInteger(value) || value < 0) violations.push(`outcomes.${name}:invalid`);
  }
  if (outcomes.completedLanes < 5) violations.push("outcomes.completedLanes:need-five");
  if (outcomes.exportersWithMatchedRealizedProceeds < 3) violations.push("outcomes.exportersWithMatchedRealizedProceeds:need-three");
  if (outcomes.handledExceptionsOrDiscrepancies < 1) violations.push("outcomes.handledExceptionsOrDiscrepancies:need-one");
  if (outcomes.repeatUsesOrOrders < 1) violations.push("outcomes.repeatUsesOrOrders:need-one");
  if (outcomes.crossTenantExposureCount !== 0) violations.push("outcomes.crossTenantExposureCount:must-be-zero");
  if (outcomes.unresolvedCriticalOrHighVulnerabilities !== 0) {
    violations.push("outcomes.unresolvedCriticalOrHighVulnerabilities:must-be-zero");
  }
  if (outcomes.sustainableSupportAndManagedWorkEconomics !== true) {
    violations.push("outcomes.sustainableSupportAndManagedWorkEconomics:not-proven");
  }
  requireReference(violations, "outcomes.evidenceReference", outcomes.evidenceReference);

  return violations;
}

export function assertGeneralAvailabilityEvidence(
  evidence: GeneralAvailabilityEvidence,
  expected?: {
    readonly sourceSha?: string;
    readonly releaseTag?: string;
    readonly artifactSha256?: string;
  }
): void {
  const violations = assessGeneralAvailabilityEvidence(evidence, expected);
  if (violations.length) throw new Error(`General Availability evidence is incomplete: ${violations.join(", ")}.`);
}
