export const prohibitedPostGaBusinessModels = [
  "generic_crm",
  "opaque_broker",
  "unmanaged_marketplace",
  "custom_agency"
] as const;

export type ProhibitedPostGaBusinessModel = (typeof prohibitedPostGaBusinessModels)[number];

export function assertPostGaCommercialBoundary(model: string): void {
  if ((prohibitedPostGaBusinessModels as readonly string[]).includes(model)) {
    throw new Error(`Post-GA scope cannot become ${model.replaceAll("_", " ")}.`);
  }
}

export interface PartnershipRightsEvidence {
  readonly rightsHolder: string;
  readonly evidenceReference: string;
  readonly permittedUses: readonly string[];
  readonly requestedUse: string;
  readonly expiresAt: Date;
  readonly correctionChannel: string;
  readonly optOutMechanism: string;
  readonly now?: Date;
}

function meaningful(value: string): boolean {
  return value.trim().length >= 8 && !/(?:^|[\s/_-])(pending|todo|tbd|placeholder|later|none|n\/a)(?:$|[\s/_-])/i.test(value.trim());
}

export function assertPartnershipRights(evidence: PartnershipRightsEvidence): void {
  const now = evidence.now ?? new Date();
  if (!meaningful(evidence.rightsHolder) || !meaningful(evidence.evidenceReference)) {
    throw new Error("Named rights holder and immutable rights evidence are required.");
  }
  if (evidence.expiresAt.getTime() <= now.getTime()) throw new Error("Partnership rights have expired.");
  if (!evidence.permittedUses.includes(evidence.requestedUse)) throw new Error("Requested partnership use is not licensed.");
  if (!meaningful(evidence.correctionChannel) || !meaningful(evidence.optOutMechanism)) {
    throw new Error("Partnership data requires correction and opt-out controls.");
  }
}

export interface ProgrammeAggregateRequest {
  readonly grantStatus: "pending" | "active" | "revoked" | "expired";
  readonly grantedProgrammeId: string;
  readonly requestedProgrammeId: string;
  readonly participantCount: number;
  readonly minimumCohortSize: number;
  readonly requestedMetrics: readonly string[];
  readonly consentedMetrics: readonly string[];
  readonly consentEvidenceReferences: readonly string[];
  readonly containsDirectIdentifiers: boolean;
  readonly aggregateOnly: boolean;
}

/** Institution views are programme-scoped aggregate projections, never a new
 * route around tenant authorization or a source of identifiable benchmarks. */
export function assertProgrammeAggregateAccess(request: ProgrammeAggregateRequest): void {
  if (request.grantStatus !== "active" || request.grantedProgrammeId !== request.requestedProgrammeId) {
    throw new Error("Programme grant does not cover this aggregate.");
  }
  if (!Number.isSafeInteger(request.minimumCohortSize) || request.minimumCohortSize < 5) {
    throw new Error("Programme aggregate minimum cohort must be at least five.");
  }
  if (!Number.isSafeInteger(request.participantCount) || request.participantCount < request.minimumCohortSize) {
    throw new Error("Programme cohort is too small to disclose.");
  }
  if (!request.aggregateOnly || request.containsDirectIdentifiers) {
    throw new Error("Programme dashboards may expose consented aggregates only.");
  }
  if (!request.requestedMetrics.length || request.requestedMetrics.some((metric) => !request.consentedMetrics.includes(metric))) {
    throw new Error("A requested programme metric lacks consent.");
  }
  if (request.consentEvidenceReferences.length < request.participantCount || request.consentEvidenceReferences.some((reference) => !meaningful(reference))) {
    throw new Error("Every programme contributor requires immutable consent evidence.");
  }
}

export interface ShipmentLearningRequest {
  readonly sourceOrganizationId: string;
  readonly targetOrganizationId: string;
  readonly completedLaneEvidenceReference: string;
  readonly customerConsentReference: string;
  readonly output: "shipment_autopsy" | "repeat_order_draft";
  readonly externalAction: "none" | "draft_only" | "automatic_send" | "automatic_order";
}

export function assertShipmentLearningAutomation(request: ShipmentLearningRequest): void {
  if (request.sourceOrganizationId !== request.targetOrganizationId) {
    throw new Error("Shipment learning cannot cross a tenant boundary.");
  }
  if (!meaningful(request.completedLaneEvidenceReference) || !meaningful(request.customerConsentReference)) {
    throw new Error("Completed-lane and customer-consent evidence are required.");
  }
  if (request.externalAction === "automatic_send" || request.externalAction === "automatic_order") {
    throw new Error("Shipment learning may prepare work but cannot commit an external action.");
  }
  if (request.output === "repeat_order_draft" && request.externalAction !== "draft_only") {
    throw new Error("Repeat-order automation must remain an explicitly reviewed draft.");
  }
}

export interface NativeMobileNeedEvidence {
  readonly pwaEvaluated: boolean;
  readonly observedUnmetWorkflowCount: number;
  readonly affectedUserCount: number;
  readonly evidenceReference: string;
  readonly productApprovalReference: string;
}

export function assessNativeMobileNeed(evidence: NativeMobileNeedEvidence): string[] {
  const violations: string[] = [];
  if (!evidence.pwaEvaluated) violations.push("pwa:not-evaluated");
  if (!Number.isSafeInteger(evidence.observedUnmetWorkflowCount) || evidence.observedUnmetWorkflowCount < 1) {
    violations.push("unmet-workflows:not-observed");
  }
  if (!Number.isSafeInteger(evidence.affectedUserCount) || evidence.affectedUserCount < 1) {
    violations.push("affected-users:not-observed");
  }
  if (!meaningful(evidence.evidenceReference)) violations.push("usage-evidence:missing");
  if (!meaningful(evidence.productApprovalReference)) violations.push("product-approval:missing");
  return violations;
}
