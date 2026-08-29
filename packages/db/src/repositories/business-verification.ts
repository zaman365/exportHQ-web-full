import { and, eq, sql } from "drizzle-orm";
import { recordAuditEvent } from "../audit";
import { enqueueOutboxEvent } from "../outbox";
import {
  businessVerificationCases,
  businessVerificationEvidence,
  businessVerificationStatusHistory,
  companyContactFacts,
  companyProfiles,
  companyRegistrationFacts,
  documentStorageObjects
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export type BusinessVerificationCaseStatus = "draft" | "submitted" | "under_review" | "verified" | "rejected" | "withdrawn";

export interface BusinessVerificationCaseRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly status: BusinessVerificationCaseStatus;
  readonly version: number;
  readonly subjectLegalName: string;
  readonly subjectCountryCode: string;
  readonly submittedBy: string | null;
  readonly submittedAt: Date | null;
  readonly assignedReviewer: string | null;
  readonly reviewDueAt: Date | null;
  readonly closedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const allowedCaseTransitions: Readonly<Record<BusinessVerificationCaseStatus, readonly BusinessVerificationCaseStatus[]>> = {
  draft: ["submitted", "withdrawn"],
  submitted: ["under_review", "withdrawn"],
  under_review: ["verified", "rejected"],
  verified: [],
  rejected: ["submitted", "withdrawn"],
  withdrawn: []
};

export async function createBusinessVerificationCase(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly legalName: string;
    readonly countryCode: string;
    readonly registrationAuthority: string;
    readonly registrationNumber: string;
    readonly registrationType: string;
    readonly website: string;
    readonly businessEmail: string;
  }
): Promise<BusinessVerificationCaseRecord> {
  const [created] = await tx.insert(businessVerificationCases).values({
    organizationId: context.organizationId,
    subjectLegalName: requiredText(input.legalName, "Legal name"),
    subjectCountryCode: countryCode(input.countryCode)
  }).returning();
  if (!created) throw new Error("Business verification case creation did not return a row.");
  await tx.insert(companyRegistrationFacts).values({
    organizationId: context.organizationId,
    jurisdictionCountryCode: countryCode(input.countryCode),
    registrationAuthority: requiredText(input.registrationAuthority, "Registration authority"),
    registrationNumber: requiredText(input.registrationNumber, "Registration number"),
    registrationType: requiredText(input.registrationType, "Registration type")
  }).onConflictDoNothing();
  await tx.insert(companyContactFacts).values([
    {
      organizationId: context.organizationId,
      contactType: "website",
      label: "Official website",
      value: requiredText(input.website, "Official website"),
      primary: true
    },
    {
      organizationId: context.organizationId,
      contactType: "email",
      label: "Business email",
      value: requiredText(input.businessEmail, "Business email"),
      primary: true
    }
  ]);
  await recordAuditEvent(tx, context, {
    action: "passport.fact_created",
    entityType: "business_passport",
    entityId: context.organizationId,
    metadata: { factTypes: ["registration", "website", "business_email"] }
  });
  await recordAuditEvent(tx, context, {
    action: "verification.requested",
    entityType: "business_verification_case",
    entityId: created.id,
    metadata: { status: created.status, version: created.version }
  });
  return created;
}

export async function addBusinessVerificationEvidence(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly caseId: string;
    readonly documentVersionId: string;
    readonly evidenceType: string;
  }
): Promise<string> {
  const [verificationCase] = await tx.select({ id: businessVerificationCases.id }).from(businessVerificationCases).where(and(
    eq(businessVerificationCases.organizationId, context.organizationId),
    eq(businessVerificationCases.id, input.caseId)
  )).limit(1);
  if (!verificationCase) throw new Error("Business verification case was not found in this organization.");
  const [stored] = await tx.select({ state: documentStorageObjects.state }).from(documentStorageObjects).where(and(
    eq(documentStorageObjects.organizationId, context.organizationId),
    eq(documentStorageObjects.documentVersionId, input.documentVersionId)
  )).limit(1);
  if (stored?.state !== "clean") throw new Error("Business verification accepts only clean evidence versions.");
  const [created] = await tx.insert(businessVerificationEvidence).values({
    organizationId: context.organizationId,
    caseId: input.caseId,
    documentVersionId: input.documentVersionId,
    evidenceType: requiredText(input.evidenceType, "Evidence type"),
    addedBy: context.actorId
  }).returning({ id: businessVerificationEvidence.id });
  if (!created) throw new Error("Business verification evidence creation did not return a row.");
  await recordAuditEvent(tx, context, {
    action: "verification.evidence_added",
    entityType: "business_verification_case",
    entityId: input.caseId,
    metadata: { evidenceRecordId: created.id, evidenceType: input.evidenceType }
  });
  return created.id;
}

export async function transitionBusinessVerificationCase(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly caseId: string;
    readonly expectedVersion: number;
    readonly status: BusinessVerificationCaseStatus;
    readonly rationale: string;
    readonly reviewDueAt?: Date;
  },
  now = new Date()
): Promise<BusinessVerificationCaseRecord> {
  const [current] = await tx.select().from(businessVerificationCases).where(and(
    eq(businessVerificationCases.organizationId, context.organizationId),
    eq(businessVerificationCases.id, input.caseId)
  )).limit(1);
  if (!current) throw new Error("Business verification case was not found in this organization.");
  if (current.version !== input.expectedVersion) {
    throw new Error(`Business verification version conflict: expected ${input.expectedVersion}, found ${current.version}.`);
  }
  if (!allowedCaseTransitions[current.status].includes(input.status)) {
    throw new Error(`Cannot transition business verification from ${current.status} to ${input.status}.`);
  }
  if (["under_review", "verified", "rejected"].includes(input.status) && context.actorType === "customer") {
    throw new Error("Only an authorized reviewer may review or close a business verification case.");
  }
  if (input.status === "submitted") {
    const [count] = await tx.select({ total: sql<number>`count(*)::int` }).from(businessVerificationEvidence).where(and(
      eq(businessVerificationEvidence.organizationId, context.organizationId),
      eq(businessVerificationEvidence.caseId, input.caseId)
    ));
    if (!count?.total) throw new Error("At least one clean evidence version is required before submission.");
  }
  if (input.status === "under_review" && (!input.reviewDueAt || input.reviewDueAt <= now)) {
    throw new Error("A future review due date is required when review starts.");
  }

  const nextVersion = current.version + 1;
  const terminal = ["verified", "rejected", "withdrawn"].includes(input.status);
  const [updated] = await tx.update(businessVerificationCases).set({
    status: input.status,
    version: nextVersion,
    submittedBy: input.status === "submitted" ? context.actorId : current.submittedBy,
    submittedAt: input.status === "submitted" ? now : current.submittedAt,
    assignedReviewer: input.status === "under_review" ? context.actorId : current.assignedReviewer,
    reviewDueAt: input.status === "under_review" ? input.reviewDueAt : current.reviewDueAt,
    closedAt: terminal ? now : null,
    updatedAt: now
  }).where(and(
    eq(businessVerificationCases.organizationId, context.organizationId),
    eq(businessVerificationCases.id, input.caseId),
    eq(businessVerificationCases.version, input.expectedVersion)
  )).returning();
  if (!updated) throw new Error("Business verification case changed concurrently.");
  await tx.insert(businessVerificationStatusHistory).values({
    organizationId: context.organizationId,
    caseId: input.caseId,
    fromStatus: current.status,
    toStatus: updated.status,
    caseVersion: updated.version,
    rationale: requiredText(input.rationale, "Transition rationale"),
    changedBy: context.actorId
  });

  if (updated.status === "verified" || updated.status === "rejected") {
    await tx.update(companyProfiles).set({
      verificationStatus: updated.status,
      verifiedAt: updated.status === "verified" ? now : null,
      verifiedBy: updated.status === "verified" ? context.actorId : null,
      updatedAt: now
    }).where(eq(companyProfiles.organizationId, context.organizationId));
  } else if (updated.status === "submitted") {
    await tx.update(companyProfiles).set({
      verificationStatus: "pending",
      verificationSubmittedAt: now,
      updatedAt: now
    }).where(eq(companyProfiles.organizationId, context.organizationId));
  }

  const auditAction = updated.status === "verified"
    ? "verification.approved"
    : updated.status === "rejected"
      ? "verification.rejected"
      : "verification.status_changed";
  await recordAuditEvent(tx, context, {
    action: auditAction,
    entityType: "business_verification_case",
    entityId: updated.id,
    metadata: { fromStatus: current.status, toStatus: updated.status, version: updated.version }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: "business_verification.status_changed",
    aggregateType: "business_verification_case",
    aggregateId: updated.id,
    dedupeKey: `business-verification:${updated.id}:v${updated.version}`,
    payload: { status: updated.status, version: updated.version }
  });
  return updated;
}

export async function readBusinessVerificationCase(
  tx: ExportHqTransaction,
  context: TenantContext,
  caseId: string
): Promise<BusinessVerificationCaseRecord | null> {
  const [record] = await tx.select().from(businessVerificationCases).where(and(
    eq(businessVerificationCases.organizationId, context.organizationId),
    eq(businessVerificationCases.id, caseId)
  )).limit(1);
  return record ?? null;
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function countryCode(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) throw new Error("Country must be an ISO 3166-1 alpha-2 code.");
  return normalized;
}
