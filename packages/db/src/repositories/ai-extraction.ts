import { and, desc, eq } from "drizzle-orm";
import { recordAuditEvent } from "../audit";
import { enqueueOutboxEvent } from "../outbox";
import {
  aiExtractionFieldDecisions,
  aiExtractionFields,
  aiExtractionRuns,
  aiExtractionSourceSpans,
  aiExtractionUsages,
  documentStorageObjects,
  documentVersions,
  tasks
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export interface ExtractionSourceSpanInput {
  readonly pageNumber?: number;
  readonly startOffset?: number;
  readonly endOffset?: number;
  readonly locator: string;
  readonly quoteHashSha256: string;
}

export interface ExtractionFieldProposalInput {
  readonly fieldPath: string;
  readonly proposedValue: unknown;
  readonly confidenceBps: number;
  readonly sourceSpans: readonly ExtractionSourceSpanInput[];
}

export async function createExtractionProposal(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly documentVersionId: string;
    readonly provider: string;
    readonly model: string;
    readonly modelVersion: string;
    readonly extractionSchema: string;
    readonly extractionSchemaVersion: string;
    readonly promptVersion: string;
    readonly ruleVersion: string;
    readonly fields: readonly ExtractionFieldProposalInput[];
    readonly lowConfidenceThresholdBps?: number;
  },
  now = new Date()
): Promise<string> {
  if (context.actorType === "customer") throw new Error("Only the controlled extraction pipeline may create AI proposals.");
  if (!input.fields.length) throw new Error("An extraction proposal requires at least one field.");
  const threshold = input.lowConfidenceThresholdBps ?? 8000;
  confidenceBps(threshold, "Low-confidence threshold");
  const [document] = await tx.select({
    id: documentVersions.id,
    storageState: documentStorageObjects.state
  }).from(documentVersions)
    .innerJoin(documentStorageObjects, and(
      eq(documentStorageObjects.organizationId, context.organizationId),
      eq(documentStorageObjects.documentVersionId, documentVersions.id)
    ))
    .where(and(
      eq(documentVersions.organizationId, context.organizationId),
      eq(documentVersions.id, input.documentVersionId)
    )).limit(1);
  if (!document || document.storageState !== "clean") {
    throw new Error("AI extraction requires a clean, tenant-authorized document version.");
  }

  const [run] = await tx.insert(aiExtractionRuns).values({
    organizationId: context.organizationId,
    documentVersionId: input.documentVersionId,
    state: "under_review",
    provider: requiredText(input.provider, "AI provider"),
    model: requiredText(input.model, "AI model"),
    modelVersion: requiredText(input.modelVersion, "AI model version"),
    extractionSchema: requiredText(input.extractionSchema, "Extraction schema"),
    extractionSchemaVersion: requiredText(input.extractionSchemaVersion, "Extraction schema version"),
    promptVersion: requiredText(input.promptVersion, "Prompt version"),
    ruleVersion: requiredText(input.ruleVersion, "Rule version"),
    createdBy: context.actorId,
    completedAt: now
  }).returning({ id: aiExtractionRuns.id });
  if (!run) throw new Error("Extraction run creation did not return a row.");

  let lowConfidence = false;
  const seen = new Set<string>();
  for (const proposal of input.fields) {
    const fieldPath = requiredText(proposal.fieldPath, "Extraction field path");
    if (seen.has(fieldPath)) throw new Error(`Extraction field ${fieldPath} was proposed more than once.`);
    seen.add(fieldPath);
    if (proposal.proposedValue === undefined) throw new Error(`Extraction field ${fieldPath} requires a proposed value.`);
    confidenceBps(proposal.confidenceBps, `Confidence for ${fieldPath}`);
    if (!proposal.sourceSpans.length) throw new Error(`Extraction field ${fieldPath} requires a source span.`);
    lowConfidence ||= proposal.confidenceBps < threshold;
    const [field] = await tx.insert(aiExtractionFields).values({
      organizationId: context.organizationId,
      extractionRunId: run.id,
      fieldPath,
      proposedValue: proposal.proposedValue,
      confidenceBps: proposal.confidenceBps
    }).returning({ id: aiExtractionFields.id });
    if (!field) throw new Error("Extraction field creation did not return a row.");
    for (const span of proposal.sourceSpans) {
      const offsets = [span.startOffset, span.endOffset].filter((value) => value !== undefined);
      if (offsets.length === 1) throw new Error("Extraction source offsets must be supplied together.");
      await tx.insert(aiExtractionSourceSpans).values({
        organizationId: context.organizationId,
        extractionFieldId: field.id,
        documentVersionId: input.documentVersionId,
        pageNumber: span.pageNumber ?? null,
        startOffset: span.startOffset ?? null,
        endOffset: span.endOffset ?? null,
        locator: requiredText(span.locator, "Extraction source locator"),
        quoteHashSha256: sha256(span.quoteHashSha256)
      });
    }
  }

  await tx.insert(tasks).values({
    organizationId: context.organizationId,
    title: lowConfidence ? "Review low-confidence extracted fields" : "Review extracted document fields",
    description: "Compare each proposed value with its source span. Accept, correct or reject every field before using it downstream.",
    ownerId: context.actorId,
    responsibility: context.actorType === "staff" ? "export_hq" : "customer",
    priority: lowConfidence ? "high" : "normal",
    dueAt: new Date(now.getTime() + (lowConfidence ? 2 : 5) * 24 * 60 * 60_000),
    status: "waiting_customer",
    relatedEntityType: "ai_extraction_run",
    relatedEntityId: run.id
  });
  await recordAuditEvent(tx, context, {
    action: "ai.extraction_proposed",
    entityType: "ai_extraction_run",
    entityId: run.id,
    metadata: {
      documentVersionId: input.documentVersionId,
      model: input.model,
      modelVersion: input.modelVersion,
      extractionSchemaVersion: input.extractionSchemaVersion,
      promptVersion: input.promptVersion,
      ruleVersion: input.ruleVersion,
      fieldCount: input.fields.length,
      lowConfidence
    }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: "ai.extraction_review_requested",
    aggregateType: "ai_extraction_run",
    aggregateId: run.id,
    dedupeKey: `ai-extraction:${run.id}:review`,
    payload: { documentVersionId: input.documentVersionId, fieldCount: input.fields.length, lowConfidence }
  });
  return run.id;
}

export async function reviewExtractionField(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly extractionFieldId: string;
    readonly decision: "accepted" | "rejected" | "corrected";
    readonly acceptedValue?: unknown;
    readonly rationale: string;
  },
  now = new Date()
): Promise<string> {
  const [field] = await tx.select({
    id: aiExtractionFields.id,
    runId: aiExtractionFields.extractionRunId
  }).from(aiExtractionFields).where(and(
    eq(aiExtractionFields.organizationId, context.organizationId),
    eq(aiExtractionFields.id, input.extractionFieldId)
  )).limit(1);
  if (!field) throw new Error("Extraction field was not found in this organization.");
  if (input.decision !== "rejected" && input.acceptedValue === undefined) {
    throw new Error("Accepted or corrected extraction fields require an explicit value.");
  }
  if (input.decision === "rejected" && input.acceptedValue !== undefined) {
    throw new Error("A rejected extraction field cannot carry an accepted value.");
  }
  const [previous] = await tx.select({ id: aiExtractionFieldDecisions.id })
    .from(aiExtractionFieldDecisions)
    .where(and(
      eq(aiExtractionFieldDecisions.organizationId, context.organizationId),
      eq(aiExtractionFieldDecisions.extractionFieldId, field.id)
    ))
    .orderBy(desc(aiExtractionFieldDecisions.createdAt), desc(aiExtractionFieldDecisions.id))
    .limit(1);
  const [decision] = await tx.insert(aiExtractionFieldDecisions).values({
    organizationId: context.organizationId,
    extractionFieldId: field.id,
    decision: input.decision,
    acceptedValue: input.decision === "rejected" ? null : input.acceptedValue,
    rationale: requiredText(input.rationale, "Extraction review rationale"),
    reviewerId: context.actorId,
    supersedesDecisionId: previous?.id ?? null,
    createdAt: now
  }).returning({ id: aiExtractionFieldDecisions.id });
  if (!decision) throw new Error("Extraction decision creation did not return a row.");

  const runFields = await tx.select({ id: aiExtractionFields.id }).from(aiExtractionFields).where(and(
    eq(aiExtractionFields.organizationId, context.organizationId),
    eq(aiExtractionFields.extractionRunId, field.runId)
  ));
  const allDecisions = await tx.select({
    id: aiExtractionFieldDecisions.id,
    fieldId: aiExtractionFieldDecisions.extractionFieldId,
    decision: aiExtractionFieldDecisions.decision
  }).from(aiExtractionFieldDecisions)
    .where(eq(aiExtractionFieldDecisions.organizationId, context.organizationId))
    .orderBy(desc(aiExtractionFieldDecisions.createdAt), desc(aiExtractionFieldDecisions.id));
  const latestByField = new Map<string, typeof allDecisions[number]>();
  for (const candidate of allDecisions) {
    if (!latestByField.has(candidate.fieldId)) latestByField.set(candidate.fieldId, candidate);
  }
  const complete = runFields.every((candidate) => latestByField.has(candidate.id));
  const rejected = complete && runFields.some((candidate) => latestByField.get(candidate.id)?.decision === "rejected");
  await tx.update(aiExtractionRuns).set({
    state: complete ? (rejected ? "rejected" : "accepted") : "under_review",
    updatedAt: now
  }).where(and(
    eq(aiExtractionRuns.organizationId, context.organizationId),
    eq(aiExtractionRuns.id, field.runId)
  ));
  if (complete) {
    await tx.update(tasks).set({
      status: "completed",
      updatedAt: now
    }).where(and(
      eq(tasks.organizationId, context.organizationId),
      eq(tasks.relatedEntityType, "ai_extraction_run"),
      eq(tasks.relatedEntityId, field.runId)
    ));
  }
  await recordAuditEvent(tx, context, {
    action: "ai.extraction_reviewed",
    entityType: "ai_extraction_field",
    entityId: field.id,
    metadata: { extractionRunId: field.runId, decisionId: decision.id, decision: input.decision }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: "ai.extraction_field_reviewed",
    aggregateType: "ai_extraction_run",
    aggregateId: field.runId,
    dedupeKey: `ai-extraction-decision:${decision.id}`,
    payload: { fieldId: field.id, decisionId: decision.id, decision: input.decision }
  });
  return decision.id;
}

export async function recordAcceptedExtractionUsage(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly extractionFieldId: string;
    readonly downstreamEntityType: string;
    readonly downstreamEntityId: string;
  }
): Promise<string> {
  const [field] = await tx.select({ id: aiExtractionFields.id, runId: aiExtractionFields.extractionRunId })
    .from(aiExtractionFields)
    .where(and(
      eq(aiExtractionFields.organizationId, context.organizationId),
      eq(aiExtractionFields.id, input.extractionFieldId)
    )).limit(1);
  if (!field) throw new Error("Extraction field was not found in this organization.");
  const [decision] = await tx.select().from(aiExtractionFieldDecisions).where(and(
    eq(aiExtractionFieldDecisions.organizationId, context.organizationId),
    eq(aiExtractionFieldDecisions.extractionFieldId, field.id)
  )).orderBy(desc(aiExtractionFieldDecisions.createdAt), desc(aiExtractionFieldDecisions.id)).limit(1);
  if (!decision || decision.decision === "rejected" || decision.acceptedValue === null) {
    throw new Error("Only a human-accepted or corrected extraction value may be used downstream.");
  }
  const entityType = requiredText(input.downstreamEntityType, "Downstream entity type");
  const [created] = await tx.insert(aiExtractionUsages).values({
    organizationId: context.organizationId,
    extractionFieldId: field.id,
    decisionId: decision.id,
    downstreamEntityType: entityType,
    downstreamEntityId: input.downstreamEntityId,
    usedBy: context.actorId
  }).onConflictDoNothing({
    target: [aiExtractionUsages.extractionFieldId, aiExtractionUsages.downstreamEntityType, aiExtractionUsages.downstreamEntityId]
  }).returning({ id: aiExtractionUsages.id });
  const usage = created ?? (await tx.select({ id: aiExtractionUsages.id, decisionId: aiExtractionUsages.decisionId })
    .from(aiExtractionUsages)
    .where(and(
      eq(aiExtractionUsages.organizationId, context.organizationId),
      eq(aiExtractionUsages.extractionFieldId, field.id),
      eq(aiExtractionUsages.downstreamEntityType, entityType),
      eq(aiExtractionUsages.downstreamEntityId, input.downstreamEntityId)
    )).limit(1))[0];
  if (!usage || ("decisionId" in usage && usage.decisionId !== decision.id)) {
    throw new Error("Extraction usage conflicts with a different review decision.");
  }
  if (created) {
    await recordAuditEvent(tx, context, {
      action: "ai.extraction_used",
      entityType: entityType,
      entityId: input.downstreamEntityId,
      metadata: { extractionRunId: field.runId, extractionFieldId: field.id, decisionId: decision.id }
    });
    await enqueueOutboxEvent(tx, context, {
      topic: "ai.extraction_value_used",
      aggregateType: entityType,
      aggregateId: input.downstreamEntityId,
      dedupeKey: `ai-extraction-usage:${created.id}`,
      payload: { extractionRunId: field.runId, extractionFieldId: field.id, decisionId: decision.id }
    });
  }
  return usage.id;
}

function confidenceBps(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0 || value > 10_000) throw new Error(`${label} must be from 0 to 10,000 basis points.`);
  return value;
}

function sha256(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) throw new Error("Source quote hash must be a SHA-256 hex digest.");
  return normalized;
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}
