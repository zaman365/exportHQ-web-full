import { and, eq, inArray } from "drizzle-orm";
import {
  consistencyFieldKeys,
  detectDocumentMismatches,
  type ConsistencyFieldKey,
  type GeneratedDocumentType,
  type TraceableDocumentField
} from "@exporthq/domain";
import { recordAuditEvent } from "../audit";
import {
  documentConsistencyIssues,
  generatedDocumentFields,
  generatedDocuments,
  generatedDocumentSets,
  salesOrders,
  salesOrderVersions
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

const baseDocumentTypes = [
  "pro_forma_invoice",
  "commercial_invoice",
  "packing_list",
  "shipping_instruction",
  "certificate_origin_checklist",
  "exp_ad_bank_checklist"
] as const satisfies readonly GeneratedDocumentType[];

export interface GeneratedFieldInput {
  readonly fieldKey: ConsistencyFieldKey;
  readonly normalizedValue: string;
  readonly displayValue: string;
  readonly sourceEntityType: string;
  readonly sourceEntityId: string;
  readonly sourceField: string;
  readonly approvedValueHashSha256: string;
  readonly sourceApprovedBy: string;
  readonly sourceApprovedAt: Date;
}

export interface GeneratedDocumentInput {
  readonly documentType: GeneratedDocumentType;
  readonly fields: readonly GeneratedFieldInput[];
}

export async function generateTradeDocumentSet(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly salesOrderId: string;
    readonly expectedOrderVersion: number;
    readonly generationPolicyVersion: string;
    readonly documents: readonly GeneratedDocumentInput[];
  },
  now = new Date()
): Promise<{ readonly documentSetId: string; readonly blockingIssueCount: number }> {
  const types = new Set(input.documents.map((document) => document.documentType));
  for (const required of baseDocumentTypes) {
    if (!types.has(required)) throw new Error(`Trade document set requires ${required}.`);
  }
  if (types.size !== input.documents.length) throw new Error("Trade document set cannot contain duplicate document types.");
  const [order] = await tx.select({
    exportLaneId: salesOrders.exportLaneId,
    salesOrderVersionId: salesOrderVersions.id,
    currentVersion: salesOrders.currentVersion
  }).from(salesOrders).innerJoin(salesOrderVersions, and(
    eq(salesOrderVersions.organizationId, context.organizationId),
    eq(salesOrderVersions.salesOrderId, salesOrders.id),
    eq(salesOrderVersions.version, salesOrders.currentVersion)
  )).where(and(
    eq(salesOrders.organizationId, context.organizationId),
    eq(salesOrders.id, input.salesOrderId),
    eq(salesOrders.currentVersion, input.expectedOrderVersion)
  )).limit(1);
  if (!order) throw new Error("Current sales order version was not found.");
  const existing = await tx.select({ version: generatedDocumentSets.version }).from(generatedDocumentSets).where(and(
    eq(generatedDocumentSets.organizationId, context.organizationId),
    eq(generatedDocumentSets.salesOrderId, input.salesOrderId)
  ));
  const version = Math.max(0, ...existing.map((row) => row.version)) + 1;
  const [set] = await tx.insert(generatedDocumentSets).values({
    organizationId: context.organizationId,
    exportLaneId: order.exportLaneId,
    salesOrderId: input.salesOrderId,
    salesOrderVersionId: order.salesOrderVersionId,
    version,
    status: "draft",
    generationPolicyVersion: requiredText(input.generationPolicyVersion, "Document generation policy version"),
    createdBy: context.actorId
  }).returning({ id: generatedDocumentSets.id });
  if (!set) throw new Error("Generated document set did not return an identifier.");

  const comparable: TraceableDocumentField[] = [];
  for (const documentInput of input.documents) {
    if (!documentInput.fields.length) throw new Error(`${documentInput.documentType} requires traced fields.`);
    const keys = new Set(documentInput.fields.map((field) => field.fieldKey));
    if (keys.size !== documentInput.fields.length) throw new Error(`${documentInput.documentType} contains duplicate field keys.`);
    const [document] = await tx.insert(generatedDocuments).values({
      organizationId: context.organizationId,
      documentSetId: set.id,
      documentType: documentInput.documentType,
      status: "draft"
    }).returning({ id: generatedDocuments.id });
    if (!document) throw new Error("Generated document did not return an identifier.");
    for (const field of documentInput.fields) {
      if (!consistencyFieldKeys.includes(field.fieldKey)) throw new Error(`Unsupported consistency field ${field.fieldKey}.`);
      const normalizedValue = requiredText(field.normalizedValue, `${field.fieldKey} normalized value`);
      const expectedHash = await digestSha256(normalizedValue);
      if (expectedHash !== sha256(field.approvedValueHashSha256, `${field.fieldKey} approved value`)) {
        throw new Error(`Generated field ${field.fieldKey} does not match its approved value hash.`);
      }
      comparable.push({
        documentId: document.id,
        documentType: documentInput.documentType,
        fieldKey: field.fieldKey,
        normalizedValue,
        sourceEntityType: requiredText(field.sourceEntityType, "Field source entity type"),
        sourceEntityId: requiredText(field.sourceEntityId, "Field source entity identifier"),
        sourceField: requiredText(field.sourceField, "Field source name"),
        approvedValueHashSha256: expectedHash
      });
      await tx.insert(generatedDocumentFields).values({
        organizationId: context.organizationId,
        generatedDocumentId: document.id,
        fieldKey: field.fieldKey,
        normalizedValue,
        displayValue: requiredText(field.displayValue, `${field.fieldKey} display value`),
        sourceEntityType: field.sourceEntityType,
        sourceEntityId: field.sourceEntityId,
        sourceField: field.sourceField,
        approvedValueHashSha256: expectedHash,
        sourceApprovedBy: requiredText(field.sourceApprovedBy, "Field source approver"),
        sourceApprovedAt: field.sourceApprovedAt
      });
    }
  }
  const mismatches = detectDocumentMismatches(comparable);
  if (mismatches.length) {
    await tx.insert(documentConsistencyIssues).values(mismatches.map((mismatch) => ({
      organizationId: context.organizationId,
      documentSetId: set.id,
      fieldKey: mismatch.fieldKey,
      mismatchSnapshot: mismatch.values,
      status: "open" as const,
      detectedAt: now
    })));
  }
  await recordAuditEvent(tx, context, {
    action: "document_set.generated",
    entityType: "generated_document_set",
    entityId: set.id,
    metadata: { salesOrderId: input.salesOrderId, salesOrderVersion: order.currentVersion, documentCount: input.documents.length, blockingIssueCount: mismatches.length, policyVersion: input.generationPolicyVersion }
  });
  return { documentSetId: set.id, blockingIssueCount: mismatches.length };
}

export async function resolveDocumentConsistencyIssue(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly issueId: string; readonly resolution: string; readonly waived: boolean },
  now = new Date()
): Promise<void> {
  if (context.actorType === "customer") throw new Error("A reviewed trade-operations actor must resolve document consistency issues.");
  const [updated] = await tx.update(documentConsistencyIssues).set({
    status: input.waived ? "waived" : "resolved",
    resolvedBy: context.actorId,
    resolvedAt: now,
    resolution: requiredText(input.resolution, "Consistency resolution"),
    updatedAt: now
  }).where(and(
    eq(documentConsistencyIssues.organizationId, context.organizationId),
    eq(documentConsistencyIssues.id, input.issueId),
    eq(documentConsistencyIssues.status, "open")
  )).returning({ id: documentConsistencyIssues.id });
  if (!updated) throw new Error("Open document consistency issue was not found.");
}

export async function approveTradeDocumentSet(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly documentSetId: string; readonly reviewerReference: string },
  now = new Date()
): Promise<void> {
  if (context.actorType === "customer") throw new Error("A reviewed trade-operations actor must approve generated trade documents.");
  const [set] = await tx.select({ status: generatedDocumentSets.status }).from(generatedDocumentSets).where(and(
    eq(generatedDocumentSets.organizationId, context.organizationId),
    eq(generatedDocumentSets.id, input.documentSetId)
  )).for("update").limit(1);
  if (!set || !["draft", "under_review"].includes(set.status)) throw new Error("Reviewable document set was not found.");
  const openIssues = await tx.select({ id: documentConsistencyIssues.id }).from(documentConsistencyIssues).where(and(
    eq(documentConsistencyIssues.organizationId, context.organizationId),
    eq(documentConsistencyIssues.documentSetId, input.documentSetId),
    eq(documentConsistencyIssues.status, "open")
  )).limit(1);
  if (openIssues.length) throw new Error("Blocking document consistency issues must be resolved before approval.");
  const documents = await tx.select({ id: generatedDocuments.id, type: generatedDocuments.documentType }).from(generatedDocuments).where(and(
    eq(generatedDocuments.organizationId, context.organizationId),
    eq(generatedDocuments.documentSetId, input.documentSetId)
  ));
  if (baseDocumentTypes.some((type) => !documents.some((document) => document.type === type))) {
    throw new Error("Generated trade document set is incomplete.");
  }
  await tx.update(generatedDocuments).set({ status: "approved", reviewedBy: context.actorId, reviewedAt: now, updatedAt: now }).where(and(
    eq(generatedDocuments.organizationId, context.organizationId),
    eq(generatedDocuments.documentSetId, input.documentSetId),
    inArray(generatedDocuments.status, ["draft", "under_review"])
  ));
  const [approved] = await tx.update(generatedDocumentSets).set({
    status: "approved",
    approvedBy: context.actorId,
    approvedAt: now,
    updatedAt: now
  }).where(and(
    eq(generatedDocumentSets.organizationId, context.organizationId),
    eq(generatedDocumentSets.id, input.documentSetId),
    inArray(generatedDocumentSets.status, ["draft", "under_review"])
  )).returning({ id: generatedDocumentSets.id });
  if (!approved) throw new Error("Document set changed concurrently.");
  await recordAuditEvent(tx, context, {
    action: "document_set.reviewed",
    entityType: "generated_document_set",
    entityId: input.documentSetId,
    metadata: { reviewerReference: requiredText(input.reviewerReference, "Trade-operations reviewer reference"), documentCount: documents.length, blockingIssueCount: 0 }
  });
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function sha256(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) throw new Error(`${label} requires a SHA-256 hash.`);
  return normalized;
}

async function digestSha256(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
