import { and, eq, lte } from "drizzle-orm";
import { recordAuditEvent } from "../audit";
import { enqueueOutboxEvent } from "../outbox";
import { legalDocuments, organizationLegalAcceptances } from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export interface EffectiveLegalDocumentRecord {
  readonly id: string;
  readonly slug: string;
  readonly version: string;
  readonly title: string;
  readonly summary: string;
  readonly contentHashSha256: string;
  readonly effectiveAt: Date;
  readonly reviewReference: string;
}

export interface LegalAcceptanceRecord {
  readonly id: string;
  readonly legalDocumentId: string;
  readonly acceptedBy: string;
  readonly acceptedVersion: string;
  readonly acceptedHashSha256: string;
  readonly acceptedAt: Date;
}

export async function listEffectiveLegalDocuments(
  tx: ExportHqTransaction,
  now = new Date()
): Promise<readonly EffectiveLegalDocumentRecord[]> {
  const rows = await tx.select({
    id: legalDocuments.id,
    slug: legalDocuments.slug,
    version: legalDocuments.version,
    title: legalDocuments.title,
    summary: legalDocuments.summary,
    contentHashSha256: legalDocuments.contentHashSha256,
    effectiveAt: legalDocuments.effectiveAt,
    reviewReference: legalDocuments.reviewReference
  }).from(legalDocuments).where(and(
    eq(legalDocuments.status, "published"),
    lte(legalDocuments.effectiveAt, now)
  )).orderBy(legalDocuments.slug, legalDocuments.effectiveAt);
  return rows.map((row) => {
    if (!row.effectiveAt || !row.reviewReference) throw new Error("Published legal document metadata is incomplete.");
    return { ...row, effectiveAt: row.effectiveAt, reviewReference: row.reviewReference };
  });
}

export async function listActorLegalAcceptances(
  tx: ExportHqTransaction,
  context: TenantContext
): Promise<readonly LegalAcceptanceRecord[]> {
  return tx.select({
    id: organizationLegalAcceptances.id,
    legalDocumentId: organizationLegalAcceptances.legalDocumentId,
    acceptedBy: organizationLegalAcceptances.acceptedBy,
    acceptedVersion: organizationLegalAcceptances.acceptedVersion,
    acceptedHashSha256: organizationLegalAcceptances.acceptedHashSha256,
    acceptedAt: organizationLegalAcceptances.acceptedAt
  }).from(organizationLegalAcceptances).where(and(
    eq(organizationLegalAcceptances.organizationId, context.organizationId),
    eq(organizationLegalAcceptances.acceptedBy, context.actorId)
  )).orderBy(organizationLegalAcceptances.acceptedAt);
}

export async function acceptLegalDocument(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly legalDocumentId: string;
    readonly version: string;
    readonly contentHashSha256: string;
    readonly acceptanceSource?: "workspace" | "signup" | "api";
  },
  now = new Date()
): Promise<{ readonly acceptance: LegalAcceptanceRecord; readonly duplicate: boolean }> {
  if (context.actorType !== "customer") throw new Error("Only the represented customer actor may accept customer legal terms.");
  const hash = input.contentHashSha256.trim().toLowerCase();
  const [document] = await tx.select().from(legalDocuments).where(and(
    eq(legalDocuments.id, input.legalDocumentId),
    eq(legalDocuments.version, input.version.trim()),
    eq(legalDocuments.contentHashSha256, hash),
    eq(legalDocuments.status, "published"),
    lte(legalDocuments.effectiveAt, now)
  )).limit(1);
  if (!document) throw new Error("The requested legal document version is not effective and cannot be accepted.");

  const [created] = await tx.insert(organizationLegalAcceptances).values({
    organizationId: context.organizationId,
    legalDocumentId: document.id,
    acceptedBy: context.actorId,
    acceptedVersion: document.version,
    acceptedHashSha256: document.contentHashSha256,
    acceptanceSource: input.acceptanceSource ?? "workspace",
    acceptedAt: now
  }).onConflictDoNothing().returning({
    id: organizationLegalAcceptances.id,
    legalDocumentId: organizationLegalAcceptances.legalDocumentId,
    acceptedBy: organizationLegalAcceptances.acceptedBy,
    acceptedVersion: organizationLegalAcceptances.acceptedVersion,
    acceptedHashSha256: organizationLegalAcceptances.acceptedHashSha256,
    acceptedAt: organizationLegalAcceptances.acceptedAt
  });

  if (created) {
    await recordAuditEvent(tx, context, {
      action: "legal.accepted",
      entityType: "legal_document",
      entityId: document.id,
      metadata: { slug: document.slug, version: document.version, source: input.acceptanceSource ?? "workspace" }
    });
    await enqueueOutboxEvent(tx, context, {
      topic: "legal.accepted",
      aggregateType: "legal_acceptance",
      aggregateId: created.id,
      dedupeKey: `legal-acceptance:${context.organizationId}:${context.actorId}:${document.id}`,
      payload: { legalDocumentId: document.id, slug: document.slug, version: document.version }
    });
    return { acceptance: created, duplicate: false };
  }

  const [existing] = await tx.select({
    id: organizationLegalAcceptances.id,
    legalDocumentId: organizationLegalAcceptances.legalDocumentId,
    acceptedBy: organizationLegalAcceptances.acceptedBy,
    acceptedVersion: organizationLegalAcceptances.acceptedVersion,
    acceptedHashSha256: organizationLegalAcceptances.acceptedHashSha256,
    acceptedAt: organizationLegalAcceptances.acceptedAt
  }).from(organizationLegalAcceptances).where(and(
    eq(organizationLegalAcceptances.organizationId, context.organizationId),
    eq(organizationLegalAcceptances.acceptedBy, context.actorId),
    eq(organizationLegalAcceptances.legalDocumentId, document.id)
  )).limit(1);
  if (!existing) throw new Error("Legal acceptance was not created and no existing record was found.");
  return { acceptance: existing, duplicate: true };
}
