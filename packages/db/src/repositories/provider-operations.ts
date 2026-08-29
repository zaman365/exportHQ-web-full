import { and, eq, gt, isNull } from "drizzle-orm";
import {
  assertProviderCaseTransition,
  assertProviderDisclosure,
  type ProviderCaseStatus
} from "@exporthq/domain";
import { recordAuditEvent } from "../audit";
import {
  documents,
  documentStorageObjects,
  documentVersions,
  providerCaseEvidenceShares,
  providerCaseIssues,
  providerCases,
  serviceProviderProfiles,
  serviceProviderVerificationEvidence
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export async function createProviderCase(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly providerId: string;
    readonly referralId?: string | null;
    readonly exportLaneId?: string | null;
    readonly category: string;
    readonly scope: string;
    readonly feeDisclosure: string;
    readonly commissionDisclosure: string;
    readonly commercialRelationship: string;
    readonly rankingBasis: string;
    readonly responseDueAt: Date;
    readonly expiresAt: Date;
  },
  now = new Date()
): Promise<string> {
  assertProviderDisclosure({
    feeDisclosure: input.feeDisclosure,
    commissionDisclosure: input.commissionDisclosure,
    commercialRelationship: input.commercialRelationship,
    rankingBasis: input.rankingBasis
  });
  if (input.responseDueAt <= now || input.expiresAt <= input.responseDueAt) throw new Error("Provider response and case expiry must define a future ordered window.");
  const [provider] = await tx.select({
    category: serviceProviderProfiles.categories,
    active: serviceProviderProfiles.active,
    verificationStatus: serviceProviderProfiles.verificationStatus,
    verificationExpiresAt: serviceProviderProfiles.verificationExpiresAt
  }).from(serviceProviderProfiles).where(and(
    eq(serviceProviderProfiles.id, input.providerId),
    eq(serviceProviderProfiles.active, true),
    eq(serviceProviderProfiles.verificationStatus, "verified"),
    gt(serviceProviderProfiles.verificationExpiresAt, now)
  )).limit(1);
  if (!provider || !provider.category.includes(input.category)) throw new Error("Provider is not currently verified and active for this category.");
  const [evidence] = await tx.select({ id: serviceProviderVerificationEvidence.id }).from(serviceProviderVerificationEvidence).where(and(
    eq(serviceProviderVerificationEvidence.providerId, input.providerId),
    eq(serviceProviderVerificationEvidence.status, "current"),
    gt(serviceProviderVerificationEvidence.expiresAt, now)
  )).limit(1);
  if (!evidence) throw new Error("Provider has no current reviewed verification evidence.");
  const [row] = await tx.insert(providerCases).values({
    organizationId: context.organizationId,
    providerId: input.providerId,
    referralId: input.referralId ?? null,
    exportLaneId: input.exportLaneId ?? null,
    category: requiredText(input.category, "Provider category"),
    scope: requiredText(input.scope, "Provider case scope"),
    feeDisclosure: input.feeDisclosure.trim(),
    commissionDisclosure: input.commissionDisclosure.trim(),
    commercialRelationship: input.commercialRelationship.trim(),
    rankingBasis: input.rankingBasis.trim(),
    responseDueAt: input.responseDueAt,
    expiresAt: input.expiresAt,
    createdBy: context.actorId
  }).returning({ id: providerCases.id });
  if (!row) throw new Error("Provider case was not created.");
  await recordAuditEvent(tx, context, { action: "provider.case_created", entityType: "provider_case", entityId: row.id, metadata: { providerId: input.providerId, category: input.category } });
  return row.id;
}

export async function requestProviderCaseAcceptance(
  tx: ExportHqTransaction,
  context: TenantContext,
  providerCaseId: string,
  now = new Date()
): Promise<void> {
  requireOperations(context, "request provider-case acceptance");
  await transitionCase(tx, context, providerCaseId, "awaiting_acceptance", {}, now);
}

export async function acceptProviderCase(
  tx: ExportHqTransaction,
  context: TenantContext,
  providerCaseId: string,
  now = new Date()
): Promise<void> {
  if (context.actorType !== "customer") throw new Error("The customer must accept disclosed provider terms.");
  await transitionCase(tx, context, providerCaseId, "accepted", { acceptedBy: context.actorId, acceptedAt: now }, now);
}

export async function transitionProviderCase(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly providerCaseId: string; readonly toStatus: Exclude<ProviderCaseStatus, "accepted" | "awaiting_acceptance">; readonly outcomeReview?: string | null },
  now = new Date()
): Promise<void> {
  requireOperations(context, "transition a provider case");
  const values = input.toStatus === "introduced"
    ? { introducedAt: now }
    : input.toStatus === "completed"
      ? { completedAt: now, outcomeReview: requiredText(input.outcomeReview ?? "", "Provider outcome review") }
      : {};
  await transitionCase(tx, context, input.providerCaseId, input.toStatus, values, now);
}

export async function shareProviderCaseEvidence(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly providerCaseId: string; readonly documentVersionId: string; readonly purpose: string; readonly expiresAt: Date },
  now = new Date()
): Promise<string> {
  if (context.actorType !== "customer") throw new Error("A customer must authorize the exact evidence shared with a provider.");
  if (input.expiresAt <= now) throw new Error("Provider evidence share expiry must be in the future.");
  const [authority] = await tx.select({ caseStatus: providerCases.status, documentStatus: documents.status, storageState: documentStorageObjects.state }).from(providerCases)
    .innerJoin(documentVersions, and(eq(documentVersions.organizationId, context.organizationId), eq(documentVersions.id, input.documentVersionId)))
    .innerJoin(documents, and(eq(documents.organizationId, context.organizationId), eq(documents.id, documentVersions.documentId)))
    .innerJoin(documentStorageObjects, and(eq(documentStorageObjects.organizationId, context.organizationId), eq(documentStorageObjects.documentVersionId, documentVersions.id)))
    .where(and(eq(providerCases.organizationId, context.organizationId), eq(providerCases.id, input.providerCaseId))).limit(1);
  if (!authority || !["accepted", "introduced", "in_progress", "disputed"].includes(authority.caseStatus)) throw new Error("Provider case has not been accepted for evidence sharing.");
  if (authority.documentStatus !== "approved" || authority.storageState !== "clean") throw new Error("Only approved, clean evidence may be shared with a provider.");
  const [row] = await tx.insert(providerCaseEvidenceShares).values({
    organizationId: context.organizationId,
    providerCaseId: input.providerCaseId,
    documentVersionId: input.documentVersionId,
    purpose: requiredText(input.purpose, "Evidence-sharing purpose"),
    expiresAt: input.expiresAt,
    approvedByCustomer: context.actorId,
    approvedAt: now
  }).returning({ id: providerCaseEvidenceShares.id });
  if (!row) throw new Error("Provider evidence share was not created.");
  await recordAuditEvent(tx, context, { action: "provider.evidence_shared", entityType: "provider_case_evidence_share", entityId: row.id, metadata: { providerCaseId: input.providerCaseId, documentVersionId: input.documentVersionId, purpose: input.purpose } });
  return row.id;
}

export async function revokeProviderCaseEvidence(
  tx: ExportHqTransaction,
  context: TenantContext,
  shareId: string,
  now = new Date()
): Promise<void> {
  const [row] = await tx.update(providerCaseEvidenceShares).set({ revokedBy: context.actorId, revokedAt: now }).where(and(
    eq(providerCaseEvidenceShares.organizationId, context.organizationId),
    eq(providerCaseEvidenceShares.id, shareId),
    isNull(providerCaseEvidenceShares.revokedAt)
  )).returning({ id: providerCaseEvidenceShares.id });
  if (!row) throw new Error("Active provider evidence share was not found.");
  await recordAuditEvent(tx, context, { action: "provider.evidence_revoked", entityType: "provider_case_evidence_share", entityId: shareId });
}

export async function openProviderCaseIssue(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly providerCaseId: string;
    readonly issueType: "complaint" | "dispute" | "suspension" | "reverification" | "outcome_review";
    readonly severity: "low" | "medium" | "high" | "critical";
    readonly summary: string;
    readonly evidenceReference: string;
    readonly ownerActorId: string;
  },
  now = new Date()
): Promise<string> {
  const [row] = await tx.insert(providerCaseIssues).values({
    organizationId: context.organizationId,
    providerCaseId: input.providerCaseId,
    issueType: input.issueType,
    severity: input.severity,
    summary: requiredText(input.summary, "Provider issue summary"),
    evidenceReference: requiredText(input.evidenceReference, "Provider issue evidence"),
    ownerActorId: requiredText(input.ownerActorId, "Provider issue owner"),
    openedBy: context.actorId,
    openedAt: now
  }).returning({ id: providerCaseIssues.id });
  if (!row) throw new Error("Provider issue was not created.");
  await recordAuditEvent(tx, context, { action: "provider.issue_opened", entityType: "provider_case_issue", entityId: row.id, metadata: { providerCaseId: input.providerCaseId, issueType: input.issueType, severity: input.severity } });
  return row.id;
}

export async function resolveProviderCaseIssue(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly issueId: string; readonly status: "resolved" | "dismissed"; readonly resolution: string },
  now = new Date()
): Promise<void> {
  requireOperations(context, "resolve a provider issue");
  const [row] = await tx.update(providerCaseIssues).set({ status: input.status, resolution: requiredText(input.resolution, "Provider issue resolution"), resolvedBy: context.actorId, resolvedAt: now }).where(and(
    eq(providerCaseIssues.organizationId, context.organizationId), eq(providerCaseIssues.id, input.issueId), isNull(providerCaseIssues.resolvedAt)
  )).returning({ id: providerCaseIssues.id });
  if (!row) throw new Error("Open provider issue was not found.");
  await recordAuditEvent(tx, context, { action: "provider.issue_resolved", entityType: "provider_case_issue", entityId: input.issueId, metadata: { status: input.status } });
}

async function transitionCase(
  tx: ExportHqTransaction,
  context: TenantContext,
  providerCaseId: string,
  toStatus: ProviderCaseStatus,
  values: Partial<typeof providerCases.$inferInsert>,
  now: Date
): Promise<void> {
  const [current] = await tx.select({ status: providerCases.status, expiresAt: providerCases.expiresAt }).from(providerCases).where(and(
    eq(providerCases.organizationId, context.organizationId), eq(providerCases.id, providerCaseId)
  )).for("update").limit(1);
  if (!current) throw new Error("Provider case was not found.");
  if (current.expiresAt <= now && toStatus !== "cancelled") throw new Error("Provider case has expired.");
  assertProviderCaseTransition(current.status as ProviderCaseStatus, toStatus);
  await tx.update(providerCases).set({ ...values, status: toStatus, updatedAt: now }).where(and(
    eq(providerCases.organizationId, context.organizationId), eq(providerCases.id, providerCaseId), eq(providerCases.status, current.status)
  ));
  await recordAuditEvent(tx, context, { action: "provider.case_transitioned", entityType: "provider_case", entityId: providerCaseId, metadata: { fromStatus: current.status, toStatus } });
}

function requireOperations(context: TenantContext, action: string): void {
  if (context.actorType === "customer") throw new Error(`Only reviewed operations may ${action}.`);
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}
