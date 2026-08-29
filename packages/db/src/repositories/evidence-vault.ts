import { and, eq, gt, isNull } from "drizzle-orm";
import {
  buildEvidenceObjectKey,
  validateEvidenceUpload,
  type ApprovedEvidenceType,
  type EvidenceObjectMetadata
} from "@exporthq/platform";
import { recordAuditEvent } from "../audit";
import { enqueueOutboxEvent } from "../outbox";
import {
  documentEvidenceLinks,
  documentExternalShares,
  documents,
  documentScanEvents,
  documentStorageObjects,
  documentUploadIntents,
  documentVersions,
  legalHolds
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";
import { recordPilotMilestoneEvent } from "./pilot";

export interface EvidenceUploadIntentRecord {
  readonly id: string;
  readonly documentId: string;
  readonly documentVersionId: string;
  readonly objectKey: string;
  readonly mimeType: ApprovedEvidenceType;
  readonly byteSize: number;
  readonly checksumSha256: string;
  readonly expiresAt: Date;
}

export async function createEvidenceUploadIntent(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly name: string;
    readonly category: string;
    readonly linkedEntityType: string;
    readonly linkedEntityId: string;
    readonly mimeType: string;
    readonly byteSize: number;
    readonly checksumSha256: string;
    readonly expiresAt: Date;
  },
  now = new Date()
): Promise<EvidenceUploadIntentRecord> {
  const upload = { mimeType: input.mimeType, byteSize: input.byteSize, sha256: input.checksumSha256.toLowerCase() };
  validateEvidenceUpload(upload);
  if (input.expiresAt <= now || input.expiresAt.getTime() - now.getTime() > 15 * 60_000) {
    throw new Error("Evidence upload intent must expire within 15 minutes.");
  }
  const documentId = crypto.randomUUID();
  const documentVersionId = crypto.randomUUID();
  const intentId = crypto.randomUUID();
  const objectKey = buildEvidenceObjectKey({ organizationId: context.organizationId, documentId, documentVersionId });

  await tx.insert(documents).values({
    id: documentId,
    organizationId: context.organizationId,
    name: requiredText(input.name, "Document name"),
    category: requiredText(input.category, "Document category"),
    status: "quarantine",
    ownerId: context.actorId,
    linkedEntityType: requiredText(input.linkedEntityType, "Linked entity type"),
    linkedEntityId: input.linkedEntityId
  });
  await tx.insert(documentVersions).values({
    id: documentVersionId,
    organizationId: context.organizationId,
    documentId,
    version: 1,
    objectKey,
    mimeType: upload.mimeType,
    byteSize: upload.byteSize,
    checksumSha256: upload.sha256,
    uploadedBy: context.actorId,
    scanStatus: "pending"
  });
  await tx.insert(documentUploadIntents).values({
    id: intentId,
    organizationId: context.organizationId,
    documentId,
    documentVersionId,
    objectKey,
    expectedMimeType: upload.mimeType,
    expectedByteSize: upload.byteSize,
    expectedChecksumSha256: upload.sha256,
    createdBy: context.actorId,
    expiresAt: input.expiresAt
  });
  await recordAuditEvent(tx, context, {
    action: "document.upload_intent_created",
    entityType: "document_version",
    entityId: documentVersionId,
    metadata: { category: input.category, mimeType: upload.mimeType, byteSize: upload.byteSize }
  });
  await recordPilotMilestoneEvent(tx, context, {
    eventName: "upload_requested",
    quantity: upload.byteSize,
    success: true,
    fieldType: upload.mimeType,
    dedupeKey: `upload-requested:${intentId}`,
    occurredAt: now
  });
  return {
    id: intentId,
    documentId,
    documentVersionId,
    objectKey,
    mimeType: upload.mimeType,
    byteSize: upload.byteSize,
    checksumSha256: upload.sha256,
    expiresAt: input.expiresAt
  };
}

export async function consumeEvidenceUploadIntent(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly intentId: string;
    readonly object: EvidenceObjectMetadata;
    readonly checksumSha256: string;
  },
  now = new Date()
): Promise<string> {
  const [intent] = await tx.select().from(documentUploadIntents).where(and(
    eq(documentUploadIntents.organizationId, context.organizationId),
    eq(documentUploadIntents.id, input.intentId)
  )).limit(1);
  if (!intent || intent.status !== "pending") throw new Error("Evidence upload intent is missing or no longer pending.");
  if (intent.expiresAt <= now) throw new Error("Evidence upload intent has expired.");
  if (
    input.object.key !== intent.objectKey
    || input.object.size !== intent.expectedByteSize
    || input.checksumSha256.toLowerCase() !== intent.expectedChecksumSha256
  ) throw new Error("Stored evidence does not match the authorized upload intent.");

  const [consumed] = await tx.update(documentUploadIntents).set({
    status: "consumed",
    consumedAt: now,
    updatedAt: now
  }).where(and(
    eq(documentUploadIntents.organizationId, context.organizationId),
    eq(documentUploadIntents.id, input.intentId),
    eq(documentUploadIntents.status, "pending"),
    gt(documentUploadIntents.expiresAt, now)
  )).returning({ id: documentUploadIntents.id });
  if (!consumed) throw new Error("Evidence upload intent was consumed concurrently or expired.");

  await tx.insert(documentStorageObjects).values({
    organizationId: context.organizationId,
    documentVersionId: intent.documentVersionId,
    state: "quarantine",
    objectKey: intent.objectKey,
    providerVersion: input.object.version,
    etag: input.object.etag,
    byteSize: input.object.size,
    checksumSha256: input.checksumSha256.toLowerCase()
  });
  await tx.update(documentVersions).set({ scanStatus: "queued" }).where(and(
    eq(documentVersions.organizationId, context.organizationId),
    eq(documentVersions.id, intent.documentVersionId)
  ));
  await tx.insert(documentScanEvents).values({
    organizationId: context.organizationId,
    documentVersionId: intent.documentVersionId,
    state: "queued",
    attempt: 1,
    recordedBy: context.actorId
  });
  await recordAuditEvent(tx, context, {
    action: "document.staged",
    entityType: "document_version",
    entityId: intent.documentVersionId,
    metadata: { byteSize: input.object.size, scanState: "queued" }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: "document.scan_requested",
    aggregateType: "document_version",
    aggregateId: intent.documentVersionId,
    dedupeKey: `document-scan:${intent.documentVersionId}:attempt:1`,
    payload: { documentVersionId: intent.documentVersionId, attempt: 1 }
  });
  return intent.documentVersionId;
}

export async function recordEvidenceScanResult(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly documentVersionId: string;
    readonly state: "scanning" | "clean" | "rejected" | "retryable_failure" | "dead_letter";
    readonly attempt: number;
    readonly scannerReference?: string;
    readonly safeReasonCode?: string;
    readonly promotedObject?: EvidenceObjectMetadata;
  }
): Promise<void> {
  if (context.actorType === "customer") throw new Error("Only the scan pipeline may record scan results.");
  if (!Number.isInteger(input.attempt) || input.attempt < 1 || input.attempt > 5) throw new Error("Scan attempt must be from 1 to 5.");
  const [version] = await tx.select({
    documentId: documentVersions.documentId,
    objectKey: documentVersions.objectKey,
    byteSize: documentVersions.byteSize
  }).from(documentVersions).where(and(
    eq(documentVersions.organizationId, context.organizationId),
    eq(documentVersions.id, input.documentVersionId)
  )).limit(1);
  if (!version) throw new Error("Document version was not found in this organization.");

  if ((input.state === "clean" || input.state === "rejected") && !input.promotedObject) {
    throw new Error("A terminal scan result requires confirmed destination object metadata.");
  }
  if (input.promotedObject && input.promotedObject.key !== version.objectKey) {
    throw new Error("Promoted object does not match the document version.");
  }
  if (input.promotedObject && input.promotedObject.size !== version.byteSize) {
    throw new Error("Promoted object size does not match the document version.");
  }
  await tx.insert(documentScanEvents).values({
    organizationId: context.organizationId,
    documentVersionId: input.documentVersionId,
    state: input.state,
    attempt: input.attempt,
    scannerReference: input.scannerReference ?? null,
    safeReasonCode: input.safeReasonCode ?? null,
    recordedBy: context.actorId
  });

  if (input.state === "clean" || input.state === "rejected") {
    const promotedObject = input.promotedObject as EvidenceObjectMetadata;
    const [stored] = await tx.update(documentStorageObjects).set({
      state: input.state,
      providerVersion: promotedObject.version,
      etag: promotedObject.etag,
      byteSize: promotedObject.size,
      updatedAt: new Date()
    }).where(and(
      eq(documentStorageObjects.organizationId, context.organizationId),
      eq(documentStorageObjects.documentVersionId, input.documentVersionId),
      eq(documentStorageObjects.state, "quarantine")
    )).returning({ id: documentStorageObjects.id });
    if (!stored) throw new Error("Quarantined evidence was not available for the confirmed promotion.");
    await tx.update(documents).set({
      status: input.state === "clean" ? "under_review" : "rejected",
      updatedAt: new Date()
    }).where(and(eq(documents.organizationId, context.organizationId), eq(documents.id, version.documentId)));
  } else if (input.state === "dead_letter") {
    await tx.update(documents).set({ status: "rejected", updatedAt: new Date() }).where(and(
      eq(documents.organizationId, context.organizationId),
      eq(documents.id, version.documentId)
    ));
  }
  await tx.update(documentVersions).set({ scanStatus: input.state }).where(and(
    eq(documentVersions.organizationId, context.organizationId),
    eq(documentVersions.id, input.documentVersionId)
  ));

  await recordAuditEvent(tx, context, {
    action: "document.scan_completed",
    entityType: "document_version",
    entityId: input.documentVersionId,
    metadata: { state: input.state, attempt: input.attempt, safeReasonCode: input.safeReasonCode ?? null }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: `document.scan_${input.state}`,
    aggregateType: "document_version",
    aggregateId: input.documentVersionId,
    dedupeKey: `document-scan:${input.documentVersionId}:attempt:${input.attempt}:${input.state}`,
    payload: { documentVersionId: input.documentVersionId, state: input.state, attempt: input.attempt }
  });
  if (input.state !== "scanning") await recordPilotMilestoneEvent(tx, context, {
    eventName: input.state === "clean" ? "scan_completed" : "scan_failed",
    quantity: input.attempt,
    success: input.state === "clean",
    outcomeCode: input.safeReasonCode ?? input.state,
    dedupeKey: `scan-result:${input.documentVersionId}:attempt:${input.attempt}:${input.state}`
  });
}

export async function linkCleanEvidence(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly documentVersionId: string;
    readonly entityType: string;
    readonly entityId: string;
    readonly purpose: string;
  }
): Promise<string> {
  const [stored] = await tx.select({ state: documentStorageObjects.state }).from(documentStorageObjects).where(and(
    eq(documentStorageObjects.organizationId, context.organizationId),
    eq(documentStorageObjects.documentVersionId, input.documentVersionId)
  )).limit(1);
  if (stored?.state !== "clean") throw new Error("Only clean evidence may be linked to a business record.");
  const [link] = await tx.insert(documentEvidenceLinks).values({
    organizationId: context.organizationId,
    documentVersionId: input.documentVersionId,
    entityType: requiredText(input.entityType, "Evidence entity type"),
    entityId: input.entityId,
    purpose: requiredText(input.purpose, "Evidence purpose"),
    linkedBy: context.actorId
  }).returning({ id: documentEvidenceLinks.id });
  if (!link) throw new Error("Evidence link creation did not return a row.");
  return link.id;
}

export async function authorizeEvidenceDownload(
  tx: ExportHqTransaction,
  context: TenantContext,
  documentVersionId: string
): Promise<{ readonly objectKey: string; readonly mimeType: string; readonly checksumSha256: string }> {
  const [record] = await tx.select({
    objectKey: documentStorageObjects.objectKey,
    state: documentStorageObjects.state,
    checksumSha256: documentStorageObjects.checksumSha256,
    mimeType: documentVersions.mimeType,
    documentStatus: documents.status
  }).from(documentStorageObjects)
    .innerJoin(documentVersions, eq(documentVersions.id, documentStorageObjects.documentVersionId))
    .innerJoin(documents, eq(documents.id, documentVersions.documentId))
    .where(and(
      eq(documentStorageObjects.organizationId, context.organizationId),
      eq(documentStorageObjects.documentVersionId, documentVersionId)
    )).limit(1);
  const staffReview = context.actorType !== "customer" && record?.documentStatus === "under_review";
  if (!record || record.state !== "clean" || (record.documentStatus !== "approved" && !staffReview)) {
    throw new Error("Evidence is not authorized for download.");
  }
  await recordAuditEvent(tx, context, {
    action: "document.downloaded",
    entityType: "document_version",
    entityId: documentVersionId,
    metadata: { access: staffReview ? "staff_review" : "approved_evidence" }
  });
  return { objectKey: record.objectKey, mimeType: record.mimeType, checksumSha256: record.checksumSha256 };
}

export async function recordEvidenceReviewDecision(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly documentVersionId: string;
    readonly decision: "approved" | "rejected";
    readonly rationaleCode: string;
  }
): Promise<void> {
  if (context.actorType === "customer") throw new Error("Only reviewed operations may decide evidence.");
  const [record] = await tx.select({ documentId: documentVersions.documentId, storageState: documentStorageObjects.state })
    .from(documentVersions)
    .innerJoin(documentStorageObjects, eq(documentStorageObjects.documentVersionId, documentVersions.id))
    .where(and(
      eq(documentVersions.organizationId, context.organizationId),
      eq(documentVersions.id, input.documentVersionId)
    )).limit(1);
  if (!record || record.storageState !== "clean") throw new Error("Only clean evidence may receive a review decision.");
  const rationaleCode = requiredText(input.rationaleCode, "Evidence decision rationale code");
  const [updated] = await tx.update(documents).set({ status: input.decision, updatedAt: new Date() }).where(and(
    eq(documents.organizationId, context.organizationId),
    eq(documents.id, record.documentId),
    eq(documents.status, "under_review")
  )).returning({ id: documents.id });
  if (!updated) throw new Error("Evidence is not awaiting a review decision.");
  await recordAuditEvent(tx, context, {
    action: input.decision === "approved" ? "document.accepted" : "document.rejected",
    entityType: "document_version",
    entityId: input.documentVersionId,
    metadata: { rationaleCode }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: `document.review_${input.decision}`,
    aggregateType: "document_version",
    aggregateId: input.documentVersionId,
    dedupeKey: `document-review:${input.documentVersionId}:${input.decision}`,
    payload: { documentVersionId: input.documentVersionId, decision: input.decision }
  });
  await recordPilotMilestoneEvent(tx, context, {
    eventName: input.decision === "approved" ? "review_completed" : "review_failed",
    success: input.decision === "approved",
    outcomeCode: rationaleCode,
    dedupeKey: `review-result:${input.documentVersionId}:${input.decision}`
  });
}

export async function createEvidenceExternalShare(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly documentVersionId: string;
    readonly tokenHashSha256: string;
    readonly purpose: string;
    readonly recipientReference: string;
    readonly expiresAt: Date;
    readonly maximumDownloads?: number;
  },
  now = new Date()
): Promise<string> {
  const maximumDownloads = input.maximumDownloads ?? 1;
  if (!Number.isInteger(maximumDownloads) || maximumDownloads < 1 || maximumDownloads > 100) {
    throw new Error("External evidence share download limit must be from 1 to 100.");
  }
  if (input.expiresAt <= now || input.expiresAt.getTime() - now.getTime() > 7 * 24 * 60 * 60_000) {
    throw new Error("External evidence shares must expire within seven days.");
  }
  const tokenHash = input.tokenHashSha256.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(tokenHash)) throw new Error("External evidence shares require a token SHA-256 hash.");
  const [record] = await tx.select({ storageState: documentStorageObjects.state, documentStatus: documents.status })
    .from(documentVersions)
    .innerJoin(documentStorageObjects, eq(documentStorageObjects.documentVersionId, documentVersions.id))
    .innerJoin(documents, eq(documents.id, documentVersions.documentId))
    .where(and(
      eq(documentVersions.organizationId, context.organizationId),
      eq(documentVersions.id, input.documentVersionId)
    )).limit(1);
  if (!record || record.storageState !== "clean" || record.documentStatus !== "approved") {
    throw new Error("Only approved clean evidence may be shared externally.");
  }
  const [share] = await tx.insert(documentExternalShares).values({
    organizationId: context.organizationId,
    documentVersionId: input.documentVersionId,
    tokenHash,
    purpose: requiredText(input.purpose, "Share purpose"),
    recipientReference: requiredText(input.recipientReference, "Share recipient reference"),
    createdBy: context.actorId,
    expiresAt: input.expiresAt,
    maximumDownloads
  }).returning({ id: documentExternalShares.id });
  if (!share) throw new Error("External evidence share creation did not return a row.");
  await recordAuditEvent(tx, context, {
    action: "document.shared",
    entityType: "document_version",
    entityId: input.documentVersionId,
    metadata: { purpose: input.purpose, maximumDownloads, expiresAt: input.expiresAt.toISOString() }
  });
  return share.id;
}

export async function revokeEvidenceExternalShare(
  tx: ExportHqTransaction,
  context: TenantContext,
  shareId: string,
  now = new Date()
): Promise<void> {
  const [share] = await tx.update(documentExternalShares).set({
    status: "revoked",
    revokedAt: now,
    revokedBy: context.actorId,
    updatedAt: now
  }).where(and(
    eq(documentExternalShares.organizationId, context.organizationId),
    eq(documentExternalShares.id, shareId),
    eq(documentExternalShares.status, "active")
  )).returning({ documentVersionId: documentExternalShares.documentVersionId });
  if (!share) throw new Error("Active external evidence share was not found.");
  await recordAuditEvent(tx, context, {
    action: "document.share_revoked",
    entityType: "document_version",
    entityId: share.documentVersionId,
    metadata: { shareId }
  });
}

export async function applyEvidenceLegalHold(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly documentVersionId: string; readonly reason: string; readonly authorityReference: string }
): Promise<string> {
  if (context.actorType === "customer") throw new Error("Only reviewed operations may apply a legal hold.");
  const [version] = await tx.select({ id: documentVersions.id }).from(documentVersions).where(and(
    eq(documentVersions.organizationId, context.organizationId),
    eq(documentVersions.id, input.documentVersionId)
  )).limit(1);
  if (!version) throw new Error("Document version was not found in this organization.");
  const [hold] = await tx.insert(legalHolds).values({
    organizationId: context.organizationId,
    entityType: "document_version",
    entityId: input.documentVersionId,
    reason: requiredText(input.reason, "Legal hold reason"),
    authorityReference: requiredText(input.authorityReference, "Legal hold authority reference"),
    appliedBy: context.actorId
  }).returning({ id: legalHolds.id });
  if (!hold) throw new Error("Legal hold creation did not return a row.");
  await recordAuditEvent(tx, context, {
    action: "legal_hold.applied",
    entityType: "document_version",
    entityId: input.documentVersionId,
    metadata: { holdId: hold.id, authorityReference: input.authorityReference }
  });
  return hold.id;
}

export async function releaseEvidenceLegalHold(
  tx: ExportHqTransaction,
  context: TenantContext,
  holdId: string,
  now = new Date()
): Promise<void> {
  if (context.actorType === "customer") throw new Error("Only reviewed operations may release a legal hold.");
  const [released] = await tx.update(legalHolds).set({ releasedBy: context.actorId, releasedAt: now, updatedAt: now }).where(and(
    eq(legalHolds.organizationId, context.organizationId),
    eq(legalHolds.id, holdId),
    isNull(legalHolds.releasedAt)
  )).returning({ entityId: legalHolds.entityId });
  if (!released) throw new Error("Active legal hold was not found.");
  await recordAuditEvent(tx, context, {
    action: "legal_hold.released",
    entityType: "document_version",
    entityId: released.entityId,
    metadata: { holdId }
  });
}

export async function deleteEvidenceVersion(
  tx: ExportHqTransaction,
  context: TenantContext,
  documentVersionId: string,
  now = new Date()
): Promise<void> {
  if (context.actorType !== "system") throw new Error("Only the retention pipeline may delete evidence storage.");
  const [hold] = await tx.select({ id: legalHolds.id }).from(legalHolds).where(and(
    eq(legalHolds.organizationId, context.organizationId),
    eq(legalHolds.entityType, "document_version"),
    eq(legalHolds.entityId, documentVersionId),
    isNull(legalHolds.releasedAt)
  )).limit(1);
  if (hold) throw new Error("Evidence under an active legal hold cannot be deleted.");
  const [record] = await tx.select({ documentId: documentVersions.documentId }).from(documentVersions).where(and(
    eq(documentVersions.organizationId, context.organizationId),
    eq(documentVersions.id, documentVersionId)
  )).limit(1);
  if (!record) throw new Error("Document version was not found in this organization.");
  const [deleted] = await tx.update(documentStorageObjects).set({ state: "deleted", deletedAt: now, updatedAt: now }).where(and(
    eq(documentStorageObjects.organizationId, context.organizationId),
    eq(documentStorageObjects.documentVersionId, documentVersionId),
    isNull(documentStorageObjects.deletedAt)
  )).returning({ objectKey: documentStorageObjects.objectKey });
  if (!deleted) throw new Error("Evidence storage was not available for deletion.");
  await tx.update(documents).set({ status: "expired", updatedAt: now }).where(and(
    eq(documents.organizationId, context.organizationId),
    eq(documents.id, record.documentId)
  ));
  await tx.update(documentExternalShares).set({ status: "revoked", revokedAt: now, revokedBy: context.actorId, updatedAt: now }).where(and(
    eq(documentExternalShares.organizationId, context.organizationId),
    eq(documentExternalShares.documentVersionId, documentVersionId),
    eq(documentExternalShares.status, "active")
  ));
  await recordAuditEvent(tx, context, {
    action: "document.deleted",
    entityType: "document_version",
    entityId: documentVersionId,
    metadata: { retainedDatabaseRecord: true }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: "document.storage_delete_requested",
    aggregateType: "document_version",
    aggregateId: documentVersionId,
    dedupeKey: `document-storage-delete:${documentVersionId}`,
    payload: { documentVersionId }
  });
}

export async function requestCustomerDataExport(
  tx: ExportHqTransaction,
  context: TenantContext
): Promise<void> {
  await recordAuditEvent(tx, context, {
    action: "data_export.requested",
    entityType: "organization",
    entityId: context.organizationId,
    metadata: { requestedByActorType: context.actorType }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: "organization.data_export_requested",
    aggregateType: "organization",
    aggregateId: context.organizationId,
    dedupeKey: `organization-data-export:${context.organizationId}:${crypto.randomUUID()}`,
    payload: { organizationId: context.organizationId, requestedBy: context.actorId }
  });
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}
