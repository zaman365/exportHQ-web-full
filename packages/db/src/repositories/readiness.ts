import { and, desc, eq, ne, sql } from "drizzle-orm";
import {
  EXPORT_READINESS_METHOD_VERSION,
  calculateReadinessScore,
  readinessRequirementViews,
  type ReadinessProfile,
  type ReadinessProviderCategory,
  type ReadinessSectionId,
  type ReadinessStatus
} from "@exporthq/domain";
import { recordAuditEvent } from "../audit";
import { enqueueOutboxEvent } from "../outbox";
import {
  documents,
  documentVersions,
  exportLanes,
  products,
  readinessAssessments,
  readinessEvidenceReviews,
  readinessProviderReferrals,
  readinessResponses,
  taskStatusHistory,
  tasks
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export interface ReadinessEvidenceRecord {
  readonly id: string;
  readonly requirementId: string;
  readonly documentVersionId: string;
  readonly fileName: string;
  readonly mimeType: "application/pdf" | "image/jpeg" | "image/png";
  readonly byteSize: number;
  readonly status: "staged" | "under_review" | "needs_action" | "accepted" | "rejected";
  readonly feedback: string;
  readonly addedAt: string;
}

export interface ReadinessAssessmentRecord {
  readonly version: 1;
  readonly assessmentId: string;
  readonly assessmentVersion: number;
  readonly exportLaneId: string;
  readonly currentSection: ReadinessSectionId;
  readonly profile: ReadinessProfile;
  readonly responses: Readonly<Record<string, ReadinessStatus>>;
  readonly notes: Readonly<Record<string, string>>;
  readonly evidence: readonly ReadinessEvidenceRecord[];
  readonly score: number;
  readonly savedAt: string;
}

export interface ReadinessLaneOption {
  readonly id: string;
  readonly label: string;
  readonly productName: string;
  readonly productCategory: string;
  readonly hsCode: string;
  readonly destinationCountryCode: string;
  readonly salesChannel: string;
}

export class ReadinessVersionConflictError extends Error {
  constructor(readonly expectedVersion: number, readonly actualVersion: number) {
    super(`Readiness assessment version conflict: expected ${expectedVersion}, found ${actualVersion}.`);
    this.name = "ReadinessVersionConflictError";
  }
}

export async function listReadinessLaneOptions(
  tx: ExportHqTransaction,
  context: TenantContext
): Promise<readonly ReadinessLaneOption[]> {
  return tx.select({
    id: exportLanes.id,
    productName: products.name,
    productCategory: products.category,
    hsCode: products.hsCode,
    destinationCountryCode: exportLanes.destinationCountryCode,
    salesChannel: exportLanes.salesChannel
  }).from(exportLanes)
    .innerJoin(products, and(
      eq(products.organizationId, context.organizationId),
      eq(products.id, exportLanes.productId)
    ))
    .where(and(
      eq(exportLanes.organizationId, context.organizationId),
      ne(exportLanes.status, "archived")
    ))
    .orderBy(desc(exportLanes.updatedAt), desc(exportLanes.id))
    .then((rows) => rows.map((row) => ({
      id: row.id,
      label: `${row.productName} → ${row.destinationCountryCode}`,
      productName: row.productName,
      productCategory: row.productCategory,
      hsCode: row.hsCode ?? "",
      destinationCountryCode: row.destinationCountryCode,
      salesChannel: row.salesChannel
    })));
}

export async function readLatestReadinessAssessment(
  tx: ExportHqTransaction,
  context: TenantContext,
  exportLaneId?: string
): Promise<ReadinessAssessmentRecord | null> {
  const predicates = [
    eq(readinessAssessments.organizationId, context.organizationId),
    ne(readinessAssessments.status, "archived")
  ];
  if (exportLaneId) predicates.push(eq(readinessAssessments.exportLaneId, exportLaneId));
  const [row] = await tx.select({ id: readinessAssessments.id })
    .from(readinessAssessments)
    .where(and(...predicates))
    .orderBy(desc(readinessAssessments.updatedAt), desc(readinessAssessments.id))
    .limit(1);
  return row ? readReadinessAssessment(tx, context, row.id) : null;
}

export async function readReadinessAssessment(
  tx: ExportHqTransaction,
  context: TenantContext,
  assessmentId: string
): Promise<ReadinessAssessmentRecord | null> {
  const [assessment] = await tx.select().from(readinessAssessments).where(and(
    eq(readinessAssessments.organizationId, context.organizationId),
    eq(readinessAssessments.id, assessmentId)
  )).limit(1);
  if (!assessment?.exportLaneId) return null;

  const responseRows = await tx.select().from(readinessResponses).where(and(
    eq(readinessResponses.organizationId, context.organizationId),
    eq(readinessResponses.assessmentId, assessment.id)
  ));
  const evidenceRows = await tx.select({
    id: readinessEvidenceReviews.id,
    requirementId: readinessResponses.requirementKey,
    documentVersionId: documentVersions.id,
    fileName: documents.name,
    mimeType: documentVersions.mimeType,
    byteSize: documentVersions.byteSize,
    status: readinessEvidenceReviews.status,
    feedback: readinessEvidenceReviews.feedback,
    addedAt: readinessEvidenceReviews.createdAt
  }).from(readinessEvidenceReviews)
    .innerJoin(readinessResponses, and(
      eq(readinessResponses.organizationId, context.organizationId),
      eq(readinessResponses.id, readinessEvidenceReviews.readinessResponseId)
    ))
    .innerJoin(documentVersions, and(
      eq(documentVersions.organizationId, context.organizationId),
      eq(documentVersions.id, readinessEvidenceReviews.documentVersionId)
    ))
    .innerJoin(documents, and(
      eq(documents.organizationId, context.organizationId),
      eq(documents.id, documentVersions.documentId)
    ))
    .where(and(
      eq(readinessEvidenceReviews.organizationId, context.organizationId),
      eq(readinessEvidenceReviews.assessmentId, assessment.id)
    ));

  return {
    version: 1,
    assessmentId: assessment.id,
    assessmentVersion: assessment.version,
    exportLaneId: assessment.exportLaneId,
    currentSection: assessment.currentSection as ReadinessSectionId,
    profile: assessmentProfile(assessment),
    responses: Object.fromEntries(responseRows.map((row) => [row.requirementKey, row.status])),
    notes: Object.fromEntries(responseRows.filter((row) => row.note).map((row) => [row.requirementKey, row.note as string])),
    evidence: evidenceRows.map((row) => ({
      id: row.id,
      requirementId: row.requirementId,
      documentVersionId: row.documentVersionId,
      fileName: row.fileName,
      mimeType: row.mimeType as ReadinessEvidenceRecord["mimeType"],
      byteSize: row.byteSize,
      status: row.status,
      feedback: row.feedback ?? "",
      addedAt: row.addedAt.toISOString()
    })),
    score: assessment.score,
    savedAt: assessment.lastSavedAt.toISOString()
  };
}

export async function saveReadinessAssessment(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly assessmentId?: string;
    readonly expectedVersion?: number;
    readonly exportLaneId: string;
    readonly currentSection: ReadinessSectionId;
    readonly profile: ReadinessProfile;
    readonly responses: Readonly<Record<string, ReadinessStatus>>;
    readonly notes: Readonly<Record<string, string>>;
  },
  now = new Date()
): Promise<ReadinessAssessmentRecord> {
  const [lane] = await tx.select({
    id: exportLanes.id,
    destinationCountryCode: exportLanes.destinationCountryCode,
    salesChannel: exportLanes.salesChannel
  }).from(exportLanes).where(and(
    eq(exportLanes.organizationId, context.organizationId),
    eq(exportLanes.id, input.exportLaneId),
    ne(exportLanes.status, "archived")
  )).limit(1);
  if (!lane) throw new Error("Select an active Export Lane before saving readiness.");
  if (lane.destinationCountryCode !== input.profile.targetMarketCode || lane.salesChannel !== input.profile.salesChannel) {
    throw new Error("Readiness context must match the selected Export Lane destination and sales route.");
  }

  const requirements = readinessRequirementViews("full", input.profile);
  const requirementById = new Map(requirements.map((requirement) => [requirement.id, requirement]));
  for (const requirementId of [...Object.keys(input.responses), ...Object.keys(input.notes)]) {
    if (!requirementById.has(requirementId)) throw new Error(`Readiness requirement ${requirementId} is not applicable to this lane.`);
  }
  const score = calculateReadinessScore(requirements, input.responses).overall;
  let assessmentId: string;
  let nextVersion: number;

  if (input.assessmentId) {
    if (!input.expectedVersion) throw new Error("An existing readiness assessment requires its expected version.");
    const [current] = await tx.select().from(readinessAssessments).where(and(
      eq(readinessAssessments.organizationId, context.organizationId),
      eq(readinessAssessments.id, input.assessmentId),
      eq(readinessAssessments.exportLaneId, input.exportLaneId)
    )).limit(1);
    if (!current) throw new Error("Readiness assessment was not found for this Export Lane.");
    if (current.version !== input.expectedVersion) throw new ReadinessVersionConflictError(input.expectedVersion, current.version);
    nextVersion = current.version + 1;
    const [updated] = await tx.update(readinessAssessments).set({
      version: nextVersion,
      currentSection: input.currentSection,
      businessModel: input.profile.businessModel,
      productCategory: input.profile.productCategory,
      productName: requiredText(input.profile.productName, "Product name"),
      hsCode: input.profile.hsCode.trim() || null,
      targetMarketCode: input.profile.targetMarketCode,
      salesChannel: input.profile.salesChannel,
      score,
      lastSavedAt: now,
      updatedAt: now
    }).where(and(
      eq(readinessAssessments.organizationId, context.organizationId),
      eq(readinessAssessments.id, input.assessmentId),
      eq(readinessAssessments.version, input.expectedVersion)
    )).returning({ id: readinessAssessments.id });
    if (!updated) throw new ReadinessVersionConflictError(input.expectedVersion, nextVersion);
    assessmentId = updated.id;
  } else {
    if (input.expectedVersion) throw new Error("A new readiness assessment cannot have an expected version.");
    const [existing] = await tx.select({ id: readinessAssessments.id, version: readinessAssessments.version })
      .from(readinessAssessments)
      .where(and(
        eq(readinessAssessments.organizationId, context.organizationId),
        eq(readinessAssessments.exportLaneId, input.exportLaneId),
        ne(readinessAssessments.status, "archived")
      )).limit(1);
    if (existing) throw new ReadinessVersionConflictError(0, existing.version);
    const [created] = await tx.insert(readinessAssessments).values({
      organizationId: context.organizationId,
      exportLaneId: input.exportLaneId,
      createdBy: context.actorId,
      methodVersion: EXPORT_READINESS_METHOD_VERSION,
      businessModel: input.profile.businessModel,
      productCategory: input.profile.productCategory,
      productName: requiredText(input.profile.productName, "Product name"),
      hsCode: input.profile.hsCode.trim() || null,
      targetMarketCode: input.profile.targetMarketCode,
      salesChannel: input.profile.salesChannel,
      currentSection: input.currentSection,
      score,
      lastSavedAt: now
    }).returning({ id: readinessAssessments.id, version: readinessAssessments.version });
    if (!created) throw new Error("Readiness assessment creation did not return a row.");
    assessmentId = created.id;
    nextVersion = created.version;
  }

  const currentResponses = await tx.select().from(readinessResponses).where(and(
    eq(readinessResponses.organizationId, context.organizationId),
    eq(readinessResponses.assessmentId, assessmentId)
  ));
  const currentByKey = new Map(currentResponses.map((response) => [response.requirementKey, response]));
  for (const [requirementId, status] of Object.entries(input.responses)) {
    const current = currentByKey.get(requirementId);
    if (
      context.actorType === "customer"
      && (status === "verified" || status === "evidence_added" || status === "not_applicable")
      && current?.status !== status
    ) {
      throw new Error("Evidence, verification and applicability status can only be set by the controlled evidence/review workflow.");
    }
    const [response] = await tx.insert(readinessResponses).values({
      organizationId: context.organizationId,
      assessmentId,
      requirementKey: requirementId,
      status,
      note: normalizedNote(input.notes[requirementId]),
      ownerId: current?.ownerId ?? context.actorId
    }).onConflictDoUpdate({
      target: [readinessResponses.assessmentId, readinessResponses.requirementKey],
      set: { status, note: normalizedNote(input.notes[requirementId]), updatedAt: now }
    }).returning({ id: readinessResponses.id });
    if (!response) throw new Error("Readiness response save did not return a row.");
    await upsertDerivedTask(tx, context, {
      responseId: response.id,
      exportLaneId: input.exportLaneId,
      title: requirementById.get(requirementId)?.title ?? requirementId,
      status
    }, now);
  }

  await recordAuditEvent(tx, context, {
    action: "readiness.saved",
    entityType: "readiness_assessment",
    entityId: assessmentId,
    metadata: { exportLaneId: input.exportLaneId, version: nextVersion, score, responseCount: Object.keys(input.responses).length }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: "readiness.saved",
    aggregateType: "readiness_assessment",
    aggregateId: assessmentId,
    dedupeKey: `readiness:${assessmentId}:v${nextVersion}`,
    payload: { exportLaneId: input.exportLaneId, version: nextVersion, score }
  });
  const saved = await readReadinessAssessment(tx, context, assessmentId);
  if (!saved) throw new Error("Saved readiness assessment could not be read back.");
  return saved;
}

export async function requestReadinessProviderSupport(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly requestId: string;
    readonly assessmentId: string;
    readonly requirementId: string;
    readonly providerCategory: ReadinessProviderCategory;
    readonly mode: "support_request" | "governed_referral";
    readonly governanceEvidenceReference?: string;
  },
  now = new Date()
): Promise<{ readonly id: string; readonly mode: "support_request" | "governed_referral" }> {
  const [assessment] = await tx.select().from(readinessAssessments).where(and(
    eq(readinessAssessments.organizationId, context.organizationId),
    eq(readinessAssessments.id, input.assessmentId),
    ne(readinessAssessments.status, "archived")
  )).limit(1);
  if (!assessment?.exportLaneId) throw new Error("Save a lane-scoped readiness assessment before requesting help.");
  const profile = assessmentProfile(assessment);
  const requirement = readinessRequirementViews("full", profile).find((candidate) => candidate.id === input.requirementId);
  if (!requirement?.fullResolution?.providerCategories.includes(input.providerCategory)) {
    throw new Error("The requested provider category is not applicable to this readiness requirement.");
  }
  const [response] = await tx.select({ id: readinessResponses.id }).from(readinessResponses).where(and(
    eq(readinessResponses.organizationId, context.organizationId),
    eq(readinessResponses.assessmentId, assessment.id),
    eq(readinessResponses.requirementKey, input.requirementId)
  )).limit(1);
  if (!response) throw new Error("Save this readiness checkpoint before requesting help.");
  if (input.mode === "governed_referral" && !input.governanceEvidenceReference?.trim()) {
    throw new Error("A governed referral requires its activation evidence reference.");
  }

  const disclosure = input.mode === "governed_referral"
    ? "Export HQ may receive a disclosed referral commission. The customer chooses and contracts with the provider."
    : "This is a support request only. No provider match, introduction, availability or outcome is promised.";
  const [created] = await tx.insert(readinessProviderReferrals).values({
    requestKey: input.requestId,
    organizationId: context.organizationId,
    exportLaneId: assessment.exportLaneId,
    assessmentId: assessment.id,
    requirementKey: input.requirementId,
    providerCategory: input.providerCategory,
    requestMode: input.mode,
    governanceEvidenceReference: input.governanceEvidenceReference?.trim() || null,
    requestedBy: context.actorId,
    commissionDisclosure: disclosure,
    disclosureAcceptedAt: now
  }).onConflictDoNothing({ target: readinessProviderReferrals.requestKey }).returning({
    id: readinessProviderReferrals.id,
    mode: readinessProviderReferrals.requestMode,
    organizationId: readinessProviderReferrals.organizationId,
    assessmentId: readinessProviderReferrals.assessmentId,
    requirementKey: readinessProviderReferrals.requirementKey,
    providerCategory: readinessProviderReferrals.providerCategory
  });
  const record = created ?? (await tx.select({
    id: readinessProviderReferrals.id,
    mode: readinessProviderReferrals.requestMode,
    organizationId: readinessProviderReferrals.organizationId,
    assessmentId: readinessProviderReferrals.assessmentId,
    requirementKey: readinessProviderReferrals.requirementKey,
    providerCategory: readinessProviderReferrals.providerCategory
  }).from(readinessProviderReferrals).where(and(
    eq(readinessProviderReferrals.organizationId, context.organizationId),
    eq(readinessProviderReferrals.requestKey, input.requestId)
  )).limit(1))[0];
  if (!record) throw new Error("Readiness support request could not be recorded.");
  if (
    record.organizationId !== context.organizationId
    || record.assessmentId !== input.assessmentId
    || record.requirementKey !== input.requirementId
    || record.providerCategory !== input.providerCategory
    || record.mode !== input.mode
  ) throw new Error("Readiness support request key was reused with different content.");

  if (created) {
    await recordAuditEvent(tx, context, {
      action: "provider.referral_requested",
      entityType: "readiness_support_request",
      entityId: created.id,
      metadata: { assessmentId: assessment.id, exportLaneId: assessment.exportLaneId, requirementId: input.requirementId, mode: input.mode }
    });
    await enqueueOutboxEvent(tx, context, {
      topic: "readiness.support_requested",
      aggregateType: "readiness_assessment",
      aggregateId: assessment.id,
      dedupeKey: `readiness-support:${input.requestId}`,
      payload: { requestId: created.id, requirementId: input.requirementId, mode: input.mode }
    });
  }
  return { id: record.id, mode: record.mode as "support_request" | "governed_referral" };
}

function assessmentProfile(assessment: typeof readinessAssessments.$inferSelect): ReadinessProfile {
  return {
    businessModel: assessment.businessModel as ReadinessProfile["businessModel"],
    productCategory: assessment.productCategory as ReadinessProfile["productCategory"],
    productName: assessment.productName,
    hsCode: assessment.hsCode ?? "",
    targetMarketCode: assessment.targetMarketCode as ReadinessProfile["targetMarketCode"],
    salesChannel: assessment.salesChannel as ReadinessProfile["salesChannel"]
  };
}

async function upsertDerivedTask(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly responseId: string;
    readonly exportLaneId: string;
    readonly title: string;
    readonly status: ReadinessStatus;
  },
  now: Date
): Promise<void> {
  const [existing] = await tx.select().from(tasks).where(and(
    eq(tasks.organizationId, context.organizationId),
    eq(tasks.relatedEntityType, "readiness_response"),
    eq(tasks.relatedEntityId, input.responseId)
  )).limit(1);
  const taskStatus = input.status === "blocked"
    ? "blocked"
    : input.status === "verified" || input.status === "not_applicable"
      ? "completed"
      : input.status === "evidence_added"
        ? "waiting_export_hq"
        : input.status === "in_progress"
          ? "in_progress"
          : "todo";
  const dueAt = existing?.dueAt ?? new Date(now.getTime() + 14 * 24 * 60 * 60_000);
  if (existing) {
    const [updated] = await tx.update(tasks).set({
      exportLaneId: input.exportLaneId,
      title: `Resolve: ${input.title}`,
      description: "Close this lane readiness checkpoint and attach approved evidence when required.",
      status: taskStatus,
      dueAt: taskStatus === "completed" ? existing.dueAt : dueAt,
      version: sql`${tasks.version} + 1`,
      updatedAt: now
    }).where(and(eq(tasks.organizationId, context.organizationId), eq(tasks.id, existing.id)))
      .returning({ id: tasks.id, version: tasks.version });
    if (!updated) throw new Error("Derived readiness task update did not return a row.");
    if (existing.status !== taskStatus) {
      await tx.insert(taskStatusHistory).values({
        organizationId: context.organizationId,
        taskId: existing.id,
        fromStatus: existing.status,
        toStatus: taskStatus,
        taskVersion: updated.version,
        rationale: "Derived from the reviewed readiness response state.",
        changedBy: context.actorId,
        createdAt: now
      });
      await recordAuditEvent(tx, context, {
        action: "task.status_changed",
        entityType: "task",
        entityId: existing.id,
        metadata: { fromStatus: existing.status, toStatus: taskStatus, version: updated.version, authority: "readiness_response" }
      });
      await enqueueOutboxEvent(tx, context, {
        topic: "task.status_changed",
        aggregateType: "task",
        aggregateId: existing.id,
        dedupeKey: `task:${existing.id}:v${updated.version}`,
        payload: { fromStatus: existing.status, toStatus: taskStatus, version: updated.version }
      });
    }
    return;
  }
  const [created] = await tx.insert(tasks).values({
    organizationId: context.organizationId,
    exportLaneId: input.exportLaneId,
    title: `Resolve: ${input.title}`,
    description: "Close this lane readiness checkpoint and attach approved evidence when required.",
    ownerId: context.actorId,
    responsibility: "customer",
    priority: input.status === "blocked" ? "high" : "normal",
    dueAt,
    status: taskStatus,
    relatedEntityType: "readiness_response",
    relatedEntityId: input.responseId
  }).returning({ id: tasks.id });
  if (!created) throw new Error("Derived readiness task creation did not return a row.");
  await recordAuditEvent(tx, context, {
    action: "task.created",
    entityType: "task",
    entityId: created.id,
    metadata: { authority: "readiness_response", exportLaneId: input.exportLaneId }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: "task.created",
    aggregateType: "task",
    aggregateId: created.id,
    dedupeKey: `task:${created.id}:v1`,
    payload: { status: taskStatus, version: 1 }
  });
}

function normalizedNote(value: string | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}
