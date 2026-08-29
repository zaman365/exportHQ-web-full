import { and, desc, eq, gt, inArray, isNull, lte } from "drizzle-orm";
import {
  transitionExportLane,
  type ExportIncoterm,
  type ExportLaneStage,
  type ExportLaneStatus
} from "@exporthq/domain";
import { recordAuditEvent } from "../audit";
import { enqueueOutboxEvent } from "../outbox";
import {
  exportLaneDecisions,
  exportLaneParticipants,
  exportLanes,
  exportLaneStageEvents,
  pilotPassGrants,
  staffAccessGrants
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";
import { recordPilotMilestoneEvent } from "./pilot";

export interface ExportLaneRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly productId: string;
  readonly originCountryCode: string;
  readonly destinationCountryCode: string;
  readonly salesChannel: string;
  readonly buyerSegment: string;
  readonly route: string;
  readonly incoterm: ExportIncoterm;
  readonly status: ExportLaneStatus;
  readonly health: "on_track" | "needs_attention" | "blocked";
  readonly stage: ExportLaneStage;
  readonly targetMarginBps: number;
  readonly currency: string;
  readonly ownerMembershipId: string;
  readonly version: number;
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateExportLaneInput {
  readonly productId: string;
  readonly originCountryCode: string;
  readonly destinationCountryCode: string;
  readonly salesChannel: string;
  readonly buyerSegment: string;
  readonly route: string;
  readonly incoterm: ExportIncoterm;
  readonly targetMarginBps: number;
  readonly currency: string;
  readonly ownerMembershipId: string;
}

export interface ExportLanePage {
  readonly items: readonly ExportLaneRecord[];
  readonly offset: number;
  readonly limit: number;
  readonly hasMore: boolean;
}

export class ExportLaneNotFoundError extends Error {
  constructor(readonly exportLaneId: string) {
    super(`Export Lane ${exportLaneId} was not found in this organization.`);
    this.name = "ExportLaneNotFoundError";
  }
}

export async function createExportLane(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: CreateExportLaneInput
): Promise<ExportLaneRecord> {
  const normalized = normalizeCreateInput(input);
  const now = new Date();
  const [pilotPass] = await tx.select({ laneLimit: pilotPassGrants.laneLimit }).from(pilotPassGrants).where(and(
    eq(pilotPassGrants.organizationId, context.organizationId),
    inArray(pilotPassGrants.status, ["active", "extended"]),
    gt(pilotPassGrants.expiresAt, now)
  )).limit(1);
  if (pilotPass) {
    const activeLanes = await tx.select({ id: exportLanes.id }).from(exportLanes).where(and(
      eq(exportLanes.organizationId, context.organizationId),
      inArray(exportLanes.status, ["draft", "active", "on_hold"])
    )).limit(pilotPass.laneLimit);
    if (activeLanes.length >= pilotPass.laneLimit) {
      throw new Error(`First Shipment Pass permits ${pilotPass.laneLimit} active Export Lane.`);
    }
  }
  const [created] = await tx
    .insert(exportLanes)
    .values({ organizationId: context.organizationId, ...normalized })
    .returning();
  if (!created) throw new Error("Export Lane creation did not return a row.");

  await tx.insert(exportLaneParticipants).values({
    organizationId: context.organizationId,
    exportLaneId: created.id,
    membershipId: normalized.ownerMembershipId,
    role: "owner",
    addedBy: context.actorId
  });
  await recordAuditEvent(tx, context, {
    action: "export_lane.created",
    entityType: "export_lane",
    entityId: created.id,
    metadata: { incoterm: created.incoterm, stage: created.stage, version: created.version }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: "export_lane.created",
    aggregateType: "export_lane",
    aggregateId: created.id,
    dedupeKey: `export-lane:${created.id}:v${created.version}`,
    payload: { version: created.version, stage: created.stage, status: created.status }
  });
  await recordPilotMilestoneEvent(tx, context, {
    eventName: "lane_created",
    exportLaneId: created.id,
    success: true,
    measureFromParticipationStart: true,
    dedupeKey: `lane-created:${created.id}`,
    occurredAt: now
  });
  return created;
}

export async function readExportLane(
  tx: ExportHqTransaction,
  context: TenantContext,
  exportLaneId: string
): Promise<ExportLaneRecord | null> {
  const [row] = await tx
    .select()
    .from(exportLanes)
    .where(and(eq(exportLanes.organizationId, context.organizationId), eq(exportLanes.id, exportLaneId)))
    .limit(1);
  return row ?? null;
}

export async function listExportLanes(
  tx: ExportHqTransaction,
  context: TenantContext,
  options: { readonly offset?: number; readonly limit?: number } = {}
): Promise<ExportLanePage> {
  const offset = Math.max(0, Math.floor(options.offset ?? 0));
  const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 25)));
  const rows = await tx
    .select()
    .from(exportLanes)
    .where(eq(exportLanes.organizationId, context.organizationId))
    .orderBy(desc(exportLanes.updatedAt), desc(exportLanes.id))
    .offset(offset)
    .limit(limit + 1);
  return { items: rows.slice(0, limit), offset, limit, hasMore: rows.length > limit };
}

export async function transitionStoredExportLane(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly exportLaneId: string;
    readonly expectedVersion: number;
    readonly status?: ExportLaneStatus;
    readonly stage?: ExportLaneStage;
    readonly rationale: string;
  }
): Promise<ExportLaneRecord> {
  const rationale = requiredText(input.rationale, "Transition rationale");
  const current = await readExportLane(tx, context, input.exportLaneId);
  if (!current) throw new ExportLaneNotFoundError(input.exportLaneId);
  const next = transitionExportLane(current, {
    expectedVersion: input.expectedVersion,
    ...(input.status ? { status: input.status } : {}),
    ...(input.stage ? { stage: input.stage } : {})
  });
  const now = new Date();
  const [updated] = await tx
    .update(exportLanes)
    .set({
      status: next.status,
      stage: next.stage,
      version: next.version,
      archivedAt: next.status === "archived" ? now : null,
      updatedAt: now
    })
    .where(and(
      eq(exportLanes.organizationId, context.organizationId),
      eq(exportLanes.id, input.exportLaneId),
      eq(exportLanes.version, input.expectedVersion)
    ))
    .returning();
  if (!updated) {
    const latest = await readExportLane(tx, context, input.exportLaneId);
    throw new Error(`Export Lane version conflict: expected ${input.expectedVersion}, found ${latest?.version ?? "missing"}.`);
  }

  await tx.insert(exportLaneStageEvents).values({
    organizationId: context.organizationId,
    exportLaneId: updated.id,
    fromStatus: current.status,
    toStatus: updated.status,
    fromStage: current.stage,
    toStage: updated.stage,
    aggregateVersion: updated.version,
    changedBy: context.actorId,
    rationale
  });
  await recordAuditEvent(tx, context, {
    action: "export_lane.transitioned",
    entityType: "export_lane",
    entityId: updated.id,
    metadata: {
      fromStatus: current.status,
      toStatus: updated.status,
      fromStage: current.stage,
      toStage: updated.stage,
      version: updated.version
    }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: "export_lane.transitioned",
    aggregateType: "export_lane",
    aggregateId: updated.id,
    dedupeKey: `export-lane:${updated.id}:v${updated.version}`,
    payload: { version: updated.version, stage: updated.stage, status: updated.status }
  });
  return updated;
}

export async function addExportLaneParticipant(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly exportLaneId: string;
    readonly role: "owner" | "contributor" | "reviewer" | "observer";
    readonly membershipId?: string;
    readonly staffProfileId?: string;
    readonly externalReference?: string;
  }
): Promise<string> {
  const identities = [input.membershipId, input.staffProfileId, input.externalReference].filter(Boolean);
  if (identities.length !== 1) throw new Error("Exactly one participant identity is required.");
  if ((input.staffProfileId || input.externalReference) && context.actorType === "customer") {
    throw new Error("Only operations may attach staff or external participants.");
  }
  if (input.staffProfileId) {
    const now = new Date();
    const [grant] = await tx.select({ id: staffAccessGrants.id }).from(staffAccessGrants).where(and(
      eq(staffAccessGrants.organizationId, context.organizationId),
      eq(staffAccessGrants.staffProfileId, input.staffProfileId),
      lte(staffAccessGrants.startsAt, now),
      gt(staffAccessGrants.expiresAt, now),
      isNull(staffAccessGrants.revokedAt)
    )).limit(1);
    if (!grant) throw new Error("Staff participation requires an active tenant-scoped access grant.");
  }
  const [created] = await tx.insert(exportLaneParticipants).values({
    organizationId: context.organizationId,
    exportLaneId: input.exportLaneId,
    role: input.role,
    addedBy: context.actorId,
    ...(input.membershipId ? { membershipId: input.membershipId } : {}),
    ...(input.staffProfileId ? { staffProfileId: input.staffProfileId } : {}),
    ...(input.externalReference ? { externalReference: requiredText(input.externalReference, "External reference") } : {})
  }).returning({ id: exportLaneParticipants.id });
  if (!created) throw new Error("Export Lane participant creation did not return a row.");
  await recordAuditEvent(tx, context, {
    action: "export_lane.participant_added",
    entityType: "export_lane",
    entityId: input.exportLaneId,
    metadata: { participantId: created.id, role: input.role }
  });
  return created.id;
}

export async function recordExportLaneDecision(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly exportLaneId: string;
    readonly decisionType: string;
    readonly status: "proposed" | "approved" | "rejected" | "superseded";
    readonly summary: string;
    readonly rationale: string;
    readonly evidenceDocumentVersionId?: string;
    readonly supersedesDecisionId?: string;
  }
): Promise<string> {
  const [created] = await tx.insert(exportLaneDecisions).values({
    organizationId: context.organizationId,
    exportLaneId: input.exportLaneId,
    decisionType: requiredText(input.decisionType, "Decision type"),
    status: input.status,
    summary: requiredText(input.summary, "Decision summary"),
    rationale: requiredText(input.rationale, "Decision rationale"),
    decidedBy: context.actorId,
    ...(input.evidenceDocumentVersionId ? { evidenceDocumentVersionId: input.evidenceDocumentVersionId } : {}),
    ...(input.supersedesDecisionId ? { supersedesDecisionId: input.supersedesDecisionId } : {})
  }).returning({ id: exportLaneDecisions.id });
  if (!created) throw new Error("Export Lane decision creation did not return a row.");
  await recordAuditEvent(tx, context, {
    action: "export_lane.decision_recorded",
    entityType: "export_lane_decision",
    entityId: created.id,
    metadata: { decisionType: input.decisionType, status: input.status, exportLaneId: input.exportLaneId }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: "export_lane.decision_recorded",
    aggregateType: "export_lane",
    aggregateId: input.exportLaneId,
    dedupeKey: `export-lane-decision:${created.id}`,
    payload: { decisionId: created.id, decisionType: input.decisionType, status: input.status }
  });
  return created.id;
}

function normalizeCreateInput(input: CreateExportLaneInput): CreateExportLaneInput {
  if (!Number.isInteger(input.targetMarginBps) || input.targetMarginBps < 0 || input.targetMarginBps > 10_000) {
    throw new Error("Target margin must be an integer from 0 to 10,000 basis points.");
  }
  return {
    ...input,
    originCountryCode: countryCode(input.originCountryCode, "Origin country"),
    destinationCountryCode: countryCode(input.destinationCountryCode, "Destination country"),
    currency: currencyCode(input.currency),
    salesChannel: requiredText(input.salesChannel, "Sales channel"),
    buyerSegment: requiredText(input.buyerSegment, "Buyer segment"),
    route: requiredText(input.route, "Route")
  };
}

function countryCode(value: string, label: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) throw new Error(`${label} must be an ISO 3166-1 alpha-2 code.`);
  return normalized;
}

function currencyCode(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new Error("Currency must be an ISO 4217 code.");
  return normalized;
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}
