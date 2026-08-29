import { and, desc, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { firstShipmentPassHypothesis, privateAlphaAgreement } from "@exporthq/domain";
import { recordAuditEvent } from "../audit";
import { grantOrganizationEntitlement } from "../entitlements";
import { enqueueOutboxEvent } from "../outbox";
import {
  organizationEntitlements,
  organizations,
  pilotMetricEvents,
  pilotObservations,
  pilotParticipations,
  pilotPassEditors,
  pilotPassGrants,
  pilotSupportCases,
  pilotWorkLogs
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

const alphaDestinationCountries = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB",
  "GR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE",
  "SI", "SK"
]);

export type PilotExporterStage = "established" | "first_shipment" | "second_shipment";
export type PilotMetricName = typeof pilotMetricEvents.$inferInsert.eventName;

export interface PilotParticipationRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly cohortCode: string;
  readonly exporterStage: string;
  readonly sectors: readonly string[];
  readonly destinationCountryCodes: readonly string[];
  readonly status: typeof pilotParticipations.$inferSelect.status;
  readonly agreementVersion: string | null;
  readonly agreementHashSha256: string | null;
  readonly agreementAcceptedAt: Date | null;
  readonly dataHandlingVersion: string;
  readonly supportOwnerActorId: string | null;
  readonly supportHours: string;
  readonly startedAt: Date | null;
  readonly endedAt: Date | null;
}

export interface ActivePilotPassLimits {
  readonly id: string;
  readonly expiresAt: Date;
  readonly laneLimit: number;
  readonly editorLimit: number;
  readonly launchCreditBps: number;
}

export interface PilotPassRecord extends ActivePilotPassLimits {
  readonly status: typeof pilotPassGrants.$inferSelect.status;
  readonly startsAt: Date;
  readonly priceHypothesisMinor: number;
  readonly currency: string;
  readonly extensionCount: number;
  readonly convertedAt: Date | null;
  readonly conversionReference: string | null;
}

export interface PilotSupportCaseRecord {
  readonly id: string;
  readonly title: string;
  readonly scope: string;
  readonly responsibility: typeof pilotSupportCases.$inferSelect.responsibility;
  readonly ownerActorId: string;
  readonly slaResponseMinutes: number;
  readonly responseDueAt: Date;
  readonly resolutionDueAt: Date | null;
  readonly status: typeof pilotSupportCases.$inferSelect.status;
  readonly supportMinutes: number;
}

export interface PilotWorkspaceReadModel {
  readonly participation: PilotParticipationRecord;
  readonly pass: PilotPassRecord | null;
  readonly supportCases: readonly PilotSupportCaseRecord[];
}

export interface PilotOutcomeMetrics {
  readonly firstValueSeconds: number | null;
  readonly createdLaneOrActionPlan: boolean;
  readonly canonicalFieldsReused: number;
  readonly canonicalFieldsReentered: number;
  readonly canonicalReuseRate: number | null;
  readonly supportInterventions: number;
  readonly supportMinutes: number;
  readonly specialistCostMinor: number;
  readonly automationUnits: number;
  readonly correctionCount: number;
  readonly trustResponses: number;
  readonly willingnessToPayResponses: number;
  readonly burdenReplacementConfirmed: boolean;
}

export async function invitePilotOrganization(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly cohortCode: string;
    readonly exporterStage: PilotExporterStage;
    readonly sectors: readonly string[];
    readonly destinationCountryCodes: readonly string[];
    readonly agreementVersion: string;
    readonly agreementHashSha256: string;
    readonly dataHandlingVersion: string;
    readonly supportHours: string;
  }
): Promise<string> {
  requireOperations(context, "invite a pilot organization");
  const sectors = normalizedList(input.sectors, "Pilot sector");
  const destinations = normalizedCountryCodes(input.destinationCountryCodes);
  if (!destinations.some((country) => alphaDestinationCountries.has(country))) {
    throw new Error("Private Alpha requires at least one EU or UK destination focus.");
  }
  const agreementHash = sha256(input.agreementHashSha256, "Pilot agreement");
  if (input.agreementVersion !== privateAlphaAgreement.version || agreementHash !== privateAlphaAgreement.contentHashSha256) {
    throw new Error("Pilot invitation must use the current hash-locked internal agreement.");
  }
  const [participation] = await tx.insert(pilotParticipations).values({
    organizationId: context.organizationId,
    cohortCode: requiredText(input.cohortCode, "Pilot cohort code"),
    exporterStage: input.exporterStage,
    sectors,
    destinationCountryCodes: destinations,
    agreementVersion: requiredText(input.agreementVersion, "Pilot agreement version"),
    agreementHashSha256: agreementHash,
    dataHandlingVersion: requiredText(input.dataHandlingVersion, "Pilot data-handling version"),
    supportHours: requiredText(input.supportHours, "Pilot support hours"),
    invitedBy: context.actorId
  }).returning({ id: pilotParticipations.id });
  if (!participation) throw new Error("Pilot invitation did not return an identifier.");
  await recordAuditEvent(tx, context, {
    action: "pilot.invited",
    entityType: "pilot_participation",
    entityId: participation.id,
    metadata: { cohortCode: input.cohortCode, exporterStage: input.exporterStage, agreementVersion: input.agreementVersion }
  });
  await recordPilotMilestoneEvent(tx, context, {
    eventName: "invite_sent",
    success: true,
    dedupeKey: `invite-sent:${participation.id}`
  });
  const [organization] = await tx.select({ createdAt: organizations.createdAt }).from(organizations)
    .where(eq(organizations.id, context.organizationId)).limit(1);
  if (organization) await recordPilotMilestoneEvent(tx, context, {
    eventName: "organization_created",
    success: true,
    dedupeKey: `organization-created:${context.organizationId}`,
    occurredAt: organization.createdAt
  });
  return participation.id;
}

export async function readPilotParticipation(
  tx: ExportHqTransaction,
  context: TenantContext
): Promise<PilotParticipationRecord | null> {
  const [row] = await tx.select({
    id: pilotParticipations.id,
    organizationId: pilotParticipations.organizationId,
    cohortCode: pilotParticipations.cohortCode,
    exporterStage: pilotParticipations.exporterStage,
    sectors: pilotParticipations.sectors,
    destinationCountryCodes: pilotParticipations.destinationCountryCodes,
    status: pilotParticipations.status,
    agreementVersion: pilotParticipations.agreementVersion,
    agreementHashSha256: pilotParticipations.agreementHashSha256,
    agreementAcceptedAt: pilotParticipations.agreementAcceptedAt,
    dataHandlingVersion: pilotParticipations.dataHandlingVersion,
    supportOwnerActorId: pilotParticipations.supportOwnerActorId,
    supportHours: pilotParticipations.supportHours,
    startedAt: pilotParticipations.startedAt,
    endedAt: pilotParticipations.endedAt
  }).from(pilotParticipations).where(eq(pilotParticipations.organizationId, context.organizationId)).limit(1);
  return row ?? null;
}

export async function readPilotWorkspace(
  tx: ExportHqTransaction,
  context: TenantContext
): Promise<PilotWorkspaceReadModel | null> {
  const participation = await readPilotParticipation(tx, context);
  if (!participation) return null;

  const [pass] = await tx.select({
    id: pilotPassGrants.id,
    status: pilotPassGrants.status,
    startsAt: pilotPassGrants.startsAt,
    expiresAt: pilotPassGrants.expiresAt,
    priceHypothesisMinor: pilotPassGrants.priceHypothesisMinor,
    currency: pilotPassGrants.currency,
    laneLimit: pilotPassGrants.laneLimit,
    editorLimit: pilotPassGrants.editorLimit,
    launchCreditBps: pilotPassGrants.launchCreditBps,
    extensionCount: pilotPassGrants.extensionCount,
    convertedAt: pilotPassGrants.convertedAt,
    conversionReference: pilotPassGrants.conversionReference
  }).from(pilotPassGrants).where(eq(pilotPassGrants.organizationId, context.organizationId))
    .orderBy(desc(pilotPassGrants.createdAt)).limit(1);

  const cases = await tx.select({
    id: pilotSupportCases.id,
    title: pilotSupportCases.title,
    scope: pilotSupportCases.scope,
    responsibility: pilotSupportCases.responsibility,
    ownerActorId: pilotSupportCases.ownerActorId,
    slaResponseMinutes: pilotSupportCases.slaResponseMinutes,
    responseDueAt: pilotSupportCases.responseDueAt,
    resolutionDueAt: pilotSupportCases.resolutionDueAt,
    status: pilotSupportCases.status
  }).from(pilotSupportCases).where(eq(pilotSupportCases.organizationId, context.organizationId))
    .orderBy(desc(pilotSupportCases.createdAt));
  const work = await tx.select({
    supportCaseId: pilotWorkLogs.supportCaseId,
    supportMinutes: pilotWorkLogs.supportMinutes
  }).from(pilotWorkLogs).where(eq(pilotWorkLogs.organizationId, context.organizationId));
  const minutesByCase = new Map<string, number>();
  for (const row of work) {
    minutesByCase.set(row.supportCaseId, (minutesByCase.get(row.supportCaseId) ?? 0) + row.supportMinutes);
  }

  return {
    participation,
    pass: pass ?? null,
    supportCases: cases.map((supportCase) => ({
      ...supportCase,
      supportMinutes: minutesByCase.get(supportCase.id) ?? 0
    }))
  };
}

export async function readPilotOutcomeMetrics(
  tx: ExportHqTransaction,
  context: TenantContext
): Promise<PilotOutcomeMetrics | null> {
  requireOperations(context, "read internal pilot outcome metrics");
  const participation = await readPilotParticipation(tx, context);
  if (!participation) return null;
  const events = await tx.select({
    eventName: pilotMetricEvents.eventName,
    durationSeconds: pilotMetricEvents.durationSeconds,
    quantity: pilotMetricEvents.quantity,
    success: pilotMetricEvents.success
  }).from(pilotMetricEvents).where(eq(pilotMetricEvents.organizationId, context.organizationId));
  const work = await tx.select({
    supportMinutes: pilotWorkLogs.supportMinutes,
    specialistCostMinor: pilotWorkLogs.specialistCostMinor,
    automationUnits: pilotWorkLogs.automationUnits,
    correctionCount: pilotWorkLogs.correctionCount
  }).from(pilotWorkLogs).where(eq(pilotWorkLogs.organizationId, context.organizationId));
  const observations = await tx.select({
    replacedBurden: pilotObservations.replacedBurden,
    trustScore: pilotObservations.trustScore,
    willingnessToPayMinor: pilotObservations.willingnessToPayMinor
  }).from(pilotObservations).where(eq(pilotObservations.organizationId, context.organizationId));
  const firstValueDurations = events
    .filter((event) => event.eventName === "action_plan_ready" && event.success !== false && event.durationSeconds != null)
    .map((event) => event.durationSeconds as number);
  const canonicalFieldsReused = eventQuantity(events, "canonical_field_reused");
  const canonicalFieldsReentered = eventQuantity(events, "canonical_field_reentered");
  const canonicalTotal = canonicalFieldsReused + canonicalFieldsReentered;
  return {
    firstValueSeconds: firstValueDurations.length ? Math.min(...firstValueDurations) : null,
    createdLaneOrActionPlan: events.some((event) => (event.eventName === "lane_created" || event.eventName === "action_plan_ready") && event.success !== false),
    canonicalFieldsReused,
    canonicalFieldsReentered,
    canonicalReuseRate: canonicalTotal ? canonicalFieldsReused / canonicalTotal : null,
    supportInterventions: events.filter((event) => event.eventName === "support_intervention").length,
    supportMinutes: work.reduce((total, row) => total + row.supportMinutes, 0),
    specialistCostMinor: work.reduce((total, row) => total + row.specialistCostMinor, 0),
    automationUnits: work.reduce((total, row) => total + row.automationUnits, 0),
    correctionCount: work.reduce((total, row) => total + row.correctionCount, 0),
    trustResponses: observations.filter((row) => row.trustScore != null).length,
    willingnessToPayResponses: observations.filter((row) => row.willingnessToPayMinor != null).length,
    burdenReplacementConfirmed: observations.some((row) => row.replacedBurden !== "none")
  };
}

export async function acceptPilotAgreement(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly agreementVersion: string; readonly agreementHashSha256: string },
  now = new Date()
): Promise<void> {
  if (context.actorType !== "customer") throw new Error("The represented customer must accept the pilot agreement.");
  const [accepted] = await tx.update(pilotParticipations).set({
    status: "accepted",
    agreementAcceptedBy: context.actorId,
    agreementAcceptedAt: now,
    updatedAt: now
  }).where(and(
    eq(pilotParticipations.organizationId, context.organizationId),
    eq(pilotParticipations.status, "invited"),
    eq(pilotParticipations.agreementVersion, requiredText(input.agreementVersion, "Pilot agreement version")),
    eq(pilotParticipations.agreementHashSha256, sha256(input.agreementHashSha256, "Pilot agreement"))
  )).returning({ id: pilotParticipations.id });
  if (!accepted) throw new Error("The offered pilot agreement version does not match or is no longer awaiting acceptance.");
  await recordAuditEvent(tx, context, {
    action: "pilot.agreement_accepted",
    entityType: "pilot_participation",
    entityId: accepted.id,
    metadata: { agreementVersion: input.agreementVersion }
  });
}

export async function activatePilotParticipation(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly supportOwnerActorId: string },
  now = new Date()
): Promise<void> {
  requireOperations(context, "activate a pilot organization");
  const [activated] = await tx.update(pilotParticipations).set({
    status: "active",
    supportOwnerActorId: requiredText(input.supportOwnerActorId, "Pilot support owner"),
    startedAt: now,
    updatedAt: now
  }).where(and(
    eq(pilotParticipations.organizationId, context.organizationId),
    eq(pilotParticipations.status, "accepted")
  )).returning({ id: pilotParticipations.id });
  if (!activated) throw new Error("An accepted pilot participation was not found.");
  await recordAuditEvent(tx, context, {
    action: "pilot.activated",
    entityType: "pilot_participation",
    entityId: activated.id,
    metadata: { ownerAssigned: true }
  });
}

export async function grantFirstShipmentPass(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly editorActorIds: readonly string[] },
  now = new Date()
): Promise<string> {
  requireOperations(context, "grant First Shipment Pass");
  const editorActorIds = normalizedList(input.editorActorIds, "First Shipment Pass editor");
  if (editorActorIds.length > firstShipmentPassHypothesis.editorLimit) {
    throw new Error(`First Shipment Pass permits ${firstShipmentPassHypothesis.editorLimit} editors.`);
  }
  const [participation] = await tx.select({ id: pilotParticipations.id }).from(pilotParticipations).where(and(
    eq(pilotParticipations.organizationId, context.organizationId),
    eq(pilotParticipations.status, "active")
  )).limit(1);
  if (!participation) throw new Error("First Shipment Pass requires an active accepted pilot participation.");
  const existing = await readActivePilotPassLimits(tx, context, now);
  if (existing) throw new Error("This organization already has an active First Shipment Pass.");
  const expiresAt = new Date(now.getTime() + firstShipmentPassHypothesis.durationDays * 24 * 60 * 60_000);
  const entitlementId = await grantOrganizationEntitlement(tx, context, {
    tier: "launch",
    source: "pilot",
    reason: "First Shipment Pass manual Alpha grant",
    effectiveFrom: now,
    effectiveTo: expiresAt
  });
  const [grant] = await tx.insert(pilotPassGrants).values({
    organizationId: context.organizationId,
    participationId: participation.id,
    entitlementId,
    startsAt: now,
    expiresAt,
    grantedBy: context.actorId
  }).returning({ id: pilotPassGrants.id });
  if (!grant) throw new Error("First Shipment Pass grant did not return an identifier.");
  await tx.insert(pilotPassEditors).values(editorActorIds.map((actorId) => ({
    organizationId: context.organizationId,
    pilotPassGrantId: grant.id,
    actorId,
    assignedBy: context.actorId,
    assignedAt: now
  })));
  await recordAuditEvent(tx, context, {
    action: "pilot.pass_granted",
    entityType: "pilot_pass_grant",
    entityId: grant.id,
    metadata: {
      productKey: firstShipmentPassHypothesis.productKey,
      durationDays: firstShipmentPassHypothesis.durationDays,
      laneLimit: firstShipmentPassHypothesis.activeLaneLimit,
      editorLimit: firstShipmentPassHypothesis.editorLimit,
      assignedEditorCount: editorActorIds.length,
      launchCreditBps: firstShipmentPassHypothesis.annualLaunchCreditBps
    }
  });
  return grant.id;
}

export async function assignFirstShipmentPassEditor(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly grantId: string; readonly actorId: string },
  now = new Date()
): Promise<void> {
  requireOperations(context, "assign a First Shipment Pass editor");
  const actorId = requiredText(input.actorId, "First Shipment Pass editor");
  const [locked] = await tx.select({ id: pilotPassGrants.id }).from(pilotPassGrants).where(and(
    eq(pilotPassGrants.id, input.grantId),
    eq(pilotPassGrants.organizationId, context.organizationId),
    inArray(pilotPassGrants.status, ["active", "extended"]),
    gt(pilotPassGrants.expiresAt, now)
  )).for("update").limit(1);
  if (!locked) throw new Error("Active First Shipment Pass was not found.");
  const activeEditors = await tx.select({ id: pilotPassEditors.id, actorId: pilotPassEditors.actorId })
    .from(pilotPassEditors).where(and(
      eq(pilotPassEditors.organizationId, context.organizationId),
      eq(pilotPassEditors.pilotPassGrantId, input.grantId),
      isNull(pilotPassEditors.revokedAt)
    ));
  if (activeEditors.some((editor) => editor.actorId === actorId)) return;
  if (activeEditors.length >= firstShipmentPassHypothesis.editorLimit) {
    throw new Error(`First Shipment Pass permits ${firstShipmentPassHypothesis.editorLimit} editors.`);
  }
  const [assignment] = await tx.insert(pilotPassEditors).values({
    organizationId: context.organizationId,
    pilotPassGrantId: input.grantId,
    actorId,
    assignedBy: context.actorId,
    assignedAt: now,
    revokedAt: null
  }).onConflictDoUpdate({
    target: [pilotPassEditors.pilotPassGrantId, pilotPassEditors.actorId],
    set: { assignedBy: context.actorId, assignedAt: now, revokedAt: null }
  }).returning({ id: pilotPassEditors.id });
  if (!assignment) throw new Error("First Shipment Pass editor assignment was not recorded.");
  await recordAuditEvent(tx, context, {
    action: "pilot.pass_editor_assigned",
    entityType: "pilot_pass_editor",
    entityId: assignment.id,
    metadata: { grantId: input.grantId, editorActorId: actorId }
  });
}

export async function revokeFirstShipmentPassEditor(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly grantId: string; readonly actorId: string; readonly reason: string },
  now = new Date()
): Promise<void> {
  requireOperations(context, "revoke a First Shipment Pass editor");
  const [revoked] = await tx.update(pilotPassEditors).set({ revokedAt: now }).where(and(
    eq(pilotPassEditors.organizationId, context.organizationId),
    eq(pilotPassEditors.pilotPassGrantId, input.grantId),
    eq(pilotPassEditors.actorId, requiredText(input.actorId, "First Shipment Pass editor")),
    isNull(pilotPassEditors.revokedAt)
  )).returning({ id: pilotPassEditors.id });
  if (!revoked) throw new Error("Active First Shipment Pass editor assignment was not found.");
  await recordAuditEvent(tx, context, {
    action: "pilot.pass_editor_revoked",
    entityType: "pilot_pass_editor",
    entityId: revoked.id,
    metadata: { grantId: input.grantId, reason: requiredText(input.reason, "Editor revocation reason") }
  });
}

export async function readActivePilotPassLimits(
  tx: ExportHqTransaction,
  context: TenantContext,
  now = new Date()
): Promise<ActivePilotPassLimits | null> {
  const [row] = await tx.select({
    id: pilotPassGrants.id,
    expiresAt: pilotPassGrants.expiresAt,
    laneLimit: pilotPassGrants.laneLimit,
    editorLimit: pilotPassGrants.editorLimit,
    launchCreditBps: pilotPassGrants.launchCreditBps
  }).from(pilotPassGrants).where(and(
    eq(pilotPassGrants.organizationId, context.organizationId),
    inArray(pilotPassGrants.status, ["active", "extended"]),
    gt(pilotPassGrants.expiresAt, now)
  )).orderBy(pilotPassGrants.expiresAt).limit(1);
  return row ?? null;
}

export async function extendFirstShipmentPass(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly grantId: string; readonly additionalDays: number; readonly reason: string },
  now = new Date()
): Promise<void> {
  requireOperations(context, "extend First Shipment Pass");
  if (!Number.isInteger(input.additionalDays) || input.additionalDays < 1 || input.additionalDays > 30) {
    throw new Error("A First Shipment Pass extension must be from 1 to 30 days.");
  }
  const [current] = await tx.select().from(pilotPassGrants).where(and(
    eq(pilotPassGrants.organizationId, context.organizationId),
    eq(pilotPassGrants.id, input.grantId),
    inArray(pilotPassGrants.status, ["active", "extended"]),
    gt(pilotPassGrants.expiresAt, now)
  )).limit(1);
  if (!current) throw new Error("Active First Shipment Pass was not found.");
  const expiresAt = new Date(current.expiresAt.getTime() + input.additionalDays * 24 * 60 * 60_000);
  await tx.update(pilotPassGrants).set({
    status: "extended",
    expiresAt,
    extensionCount: current.extensionCount + 1,
    updatedAt: now
  }).where(eq(pilotPassGrants.id, current.id));
  await tx.update(organizationEntitlements).set({ effectiveTo: expiresAt, updatedAt: now }).where(and(
    eq(organizationEntitlements.organizationId, context.organizationId),
    eq(organizationEntitlements.id, current.entitlementId),
    isNull(organizationEntitlements.revokedAt)
  ));
  await recordAuditEvent(tx, context, {
    action: "pilot.pass_extended",
    entityType: "pilot_pass_grant",
    entityId: current.id,
    metadata: { additionalDays: input.additionalDays, reason: requiredText(input.reason, "Pilot extension reason") }
  });
}

export async function convertFirstShipmentPass(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly grantId: string; readonly annualLaunchReference: string },
  now = new Date()
): Promise<void> {
  requireOperations(context, "convert First Shipment Pass");
  const [converted] = await tx.update(pilotPassGrants).set({
    status: "converted",
    convertedAt: now,
    conversionReference: requiredText(input.annualLaunchReference, "Annual Launch conversion reference"),
    updatedAt: now
  }).where(and(
    eq(pilotPassGrants.organizationId, context.organizationId),
    eq(pilotPassGrants.id, input.grantId),
    inArray(pilotPassGrants.status, ["active", "extended"])
  )).returning({ id: pilotPassGrants.id });
  if (!converted) throw new Error("Convertible First Shipment Pass was not found.");
  await recordAuditEvent(tx, context, {
    action: "pilot.pass_converted",
    entityType: "pilot_pass_grant",
    entityId: converted.id,
    metadata: { launchCreditBps: 10000, annualLaunchReference: input.annualLaunchReference }
  });
}

export async function createPilotSupportCase(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly exportLaneId?: string | null;
    readonly title: string;
    readonly scope: string;
    readonly responsibility: "customer" | "export_hq" | "third_party";
    readonly ownerActorId: string;
    readonly slaResponseMinutes: number;
    readonly resolutionDueAt?: Date | null;
  },
  now = new Date()
): Promise<string> {
  requireOperations(context, "create a pilot support case");
  if (!Number.isInteger(input.slaResponseMinutes) || input.slaResponseMinutes < 15 || input.slaResponseMinutes > 10080) {
    throw new Error("Pilot support response SLA must be from 15 minutes to seven days.");
  }
  const [participation] = await tx.select({ id: pilotParticipations.id }).from(pilotParticipations).where(and(
    eq(pilotParticipations.organizationId, context.organizationId),
    inArray(pilotParticipations.status, ["active", "paused"])
  )).limit(1);
  if (!participation) throw new Error("Pilot support cases require an active or paused participation.");
  const [supportCase] = await tx.insert(pilotSupportCases).values({
    organizationId: context.organizationId,
    participationId: participation.id,
    exportLaneId: input.exportLaneId ?? null,
    title: requiredText(input.title, "Support case title"),
    scope: requiredText(input.scope, "Support case scope"),
    responsibility: input.responsibility,
    ownerActorId: requiredText(input.ownerActorId, "Support case owner"),
    slaResponseMinutes: input.slaResponseMinutes,
    responseDueAt: new Date(now.getTime() + input.slaResponseMinutes * 60_000),
    resolutionDueAt: input.resolutionDueAt ?? null,
    createdBy: context.actorId
  }).returning({ id: pilotSupportCases.id });
  if (!supportCase) throw new Error("Pilot support case did not return an identifier.");
  await recordAuditEvent(tx, context, {
    action: "pilot.support_case_created",
    entityType: "pilot_support_case",
    entityId: supportCase.id,
    metadata: { responsibility: input.responsibility, slaResponseMinutes: input.slaResponseMinutes, ownerAssigned: true }
  });
  await recordPilotMilestoneEvent(tx, context, {
    eventName: "support_intervention",
    exportLaneId: input.exportLaneId ?? null,
    quantity: 1,
    success: true,
    outcomeCode: "case_created",
    dedupeKey: `support-case-created:${supportCase.id}`,
    occurredAt: now
  });
  return supportCase.id;
}

export async function recordPilotSupportWork(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly supportCaseId: string;
    readonly supportMinutes: number;
    readonly specialistCostMinor?: number;
    readonly automationUnits?: number;
    readonly correctionCount?: number;
    readonly outcomeCode: string;
    readonly occurredAt: Date;
  }
): Promise<string> {
  requireOperations(context, "record pilot support work");
  const [supportCase] = await tx.select({ id: pilotSupportCases.id }).from(pilotSupportCases).where(and(
    eq(pilotSupportCases.organizationId, context.organizationId),
    eq(pilotSupportCases.id, input.supportCaseId),
    or(isNull(pilotSupportCases.resolvedAt), inArray(pilotSupportCases.status, ["resolved"]))
  )).limit(1);
  if (!supportCase) throw new Error("Pilot support case was not found.");
  const [log] = await tx.insert(pilotWorkLogs).values({
    organizationId: context.organizationId,
    supportCaseId: supportCase.id,
    supportMinutes: input.supportMinutes,
    specialistCostMinor: input.specialistCostMinor ?? 0,
    automationUnits: input.automationUnits ?? 0,
    correctionCount: input.correctionCount ?? 0,
    outcomeCode: requiredText(input.outcomeCode, "Pilot work outcome code"),
    recordedBy: context.actorId,
    occurredAt: input.occurredAt
  }).returning({ id: pilotWorkLogs.id });
  if (!log) throw new Error("Pilot support work log did not return an identifier.");
  await recordAuditEvent(tx, context, {
    action: "pilot.support_work_logged",
    entityType: "pilot_support_case",
    entityId: supportCase.id,
    metadata: {
      supportMinutes: input.supportMinutes,
      specialistCostMinor: input.specialistCostMinor ?? 0,
      automationUnits: input.automationUnits ?? 0,
      correctionCount: input.correctionCount ?? 0,
      outcomeCode: input.outcomeCode
    }
  });
  await recordPilotMilestoneEvent(tx, context, {
    eventName: "support_intervention",
    durationSeconds: input.supportMinutes * 60,
    quantity: input.automationUnits ?? 0,
    success: true,
    outcomeCode: input.outcomeCode,
    dedupeKey: `support-work:${log.id}`,
    occurredAt: input.occurredAt
  });
  return log.id;
}

export async function recordPilotObservation(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly observationType: "customer_observation" | "workaround" | "pricing" | "trust" | "burden_replacement" | "outcome";
    readonly summary: string;
    readonly workaround?: string | null;
    readonly replacedBurden?: "none" | "spreadsheet" | "email" | "whatsapp" | "multiple";
    readonly trustScore?: number | null;
    readonly willingnessToPayMinor?: number | null;
    readonly observedAt: Date;
  }
): Promise<string> {
  requireOperations(context, "record a pilot observation");
  const [participation] = await tx.select({ id: pilotParticipations.id }).from(pilotParticipations).where(and(
    eq(pilotParticipations.organizationId, context.organizationId),
    inArray(pilotParticipations.status, ["active", "paused", "completed"])
  )).limit(1);
  if (!participation) throw new Error("Pilot observation requires an active, paused or completed participation.");
  const [observation] = await tx.insert(pilotObservations).values({
    organizationId: context.organizationId,
    participationId: participation.id,
    observationType: input.observationType,
    summary: requiredText(input.summary, "Pilot observation summary"),
    workaround: input.workaround?.trim() || null,
    replacedBurden: input.replacedBurden ?? "none",
    trustScore: input.trustScore ?? null,
    willingnessToPayMinor: input.willingnessToPayMinor ?? null,
    observedBy: context.actorId,
    observedAt: input.observedAt
  }).returning({ id: pilotObservations.id });
  if (!observation) throw new Error("Pilot observation did not return an identifier.");
  await recordAuditEvent(tx, context, {
    action: "pilot.observation_recorded",
    entityType: "pilot_observation",
    entityId: observation.id,
    metadata: {
      observationType: input.observationType,
      replacedBurden: input.replacedBurden ?? "none",
      trustScoreRecorded: input.trustScore != null,
      willingnessToPayRecorded: input.willingnessToPayMinor != null
    }
  });
  if (input.trustScore != null) await recordPilotMilestoneEvent(tx, context, {
    eventName: "trust_surveyed",
    quantity: input.trustScore,
    success: true,
    dedupeKey: `trust-survey:${observation.id}`,
    occurredAt: input.observedAt
  });
  if (input.willingnessToPayMinor != null) await recordPilotMilestoneEvent(tx, context, {
    eventName: "willingness_to_pay_recorded",
    quantity: input.willingnessToPayMinor,
    success: true,
    dedupeKey: `willingness-to-pay:${observation.id}`,
    occurredAt: input.observedAt
  });
  if (input.replacedBurden && input.replacedBurden !== "none") await recordPilotMilestoneEvent(tx, context, {
    eventName: "coordination_burden_replaced",
    quantity: 1,
    success: true,
    outcomeCode: input.replacedBurden,
    dedupeKey: `burden-replaced:${observation.id}`,
    occurredAt: input.observedAt
  });
  return observation.id;
}

export async function recordPilotMetricEvent(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly participationId?: string | null;
    readonly exportLaneId?: string | null;
    readonly eventName: PilotMetricName;
    readonly actorHashSha256: string;
    readonly durationSeconds?: number | null;
    readonly quantity?: number | null;
    readonly success?: boolean | null;
    readonly fieldType?: string | null;
    readonly outcomeCode?: string | null;
    readonly dedupeKey: string;
    readonly occurredAt: Date;
  }
): Promise<string> {
  const [event] = await tx.insert(pilotMetricEvents).values({
    organizationId: context.organizationId,
    participationId: input.participationId ?? null,
    exportLaneId: input.exportLaneId ?? null,
    eventName: input.eventName,
    actorHashSha256: sha256(input.actorHashSha256, "Pilot metric actor"),
    durationSeconds: input.durationSeconds ?? null,
    quantity: input.quantity ?? null,
    success: input.success ?? null,
    fieldType: input.fieldType?.trim() || null,
    outcomeCode: input.outcomeCode?.trim() || null,
    dedupeKey: requiredText(input.dedupeKey, "Pilot metric dedupe key"),
    occurredAt: input.occurredAt
  }).onConflictDoNothing().returning({ id: pilotMetricEvents.id });
  if (event) {
    await enqueueOutboxEvent(tx, context, {
      topic: "pilot.metric_recorded",
      aggregateType: "pilot_metric_event",
      aggregateId: event.id,
      dedupeKey: `pilot-metric:${context.organizationId}:${input.dedupeKey}`,
      payload: { eventName: input.eventName, success: input.success ?? null }
    });
    return event.id;
  }
  const [existing] = await tx.select({ id: pilotMetricEvents.id }).from(pilotMetricEvents).where(and(
    eq(pilotMetricEvents.organizationId, context.organizationId),
    eq(pilotMetricEvents.dedupeKey, input.dedupeKey)
  )).limit(1);
  if (!existing) throw new Error("Pilot metric event was not created and no existing event was found.");
  return existing.id;
}

/** Records a minimized milestone only when this tenant belongs to the Alpha.
 * Callers provide normalized counts/outcomes, never document contents, names,
 * message bodies or credentials. Actor identifiers are tenant-scoped hashes. */
export async function recordPilotMilestoneEvent(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly eventName: PilotMetricName;
    readonly exportLaneId?: string | null;
    readonly durationSeconds?: number | null;
    readonly quantity?: number | null;
    readonly success?: boolean | null;
    readonly fieldType?: string | null;
    readonly outcomeCode?: string | null;
    readonly dedupeKey: string;
    readonly occurredAt?: Date;
    readonly measureFromParticipationStart?: boolean;
  }
): Promise<string | null> {
  const [participation] = await tx.select({
    id: pilotParticipations.id,
    invitedAt: pilotParticipations.invitedAt,
    startedAt: pilotParticipations.startedAt
  }).from(pilotParticipations).where(eq(pilotParticipations.organizationId, context.organizationId)).limit(1);
  if (!participation) return null;
  const occurredAt = input.occurredAt ?? new Date();
  const startedAt = participation.startedAt ?? participation.invitedAt;
  const measuredDuration = input.measureFromParticipationStart
    ? Math.max(0, Math.floor((occurredAt.getTime() - startedAt.getTime()) / 1000))
    : input.durationSeconds ?? null;
  const actorHashSha256 = await digestSha256(`${context.organizationId}:${context.actorId}`);
  return recordPilotMetricEvent(tx, context, {
    participationId: participation.id,
    exportLaneId: input.exportLaneId ?? null,
    eventName: input.eventName,
    actorHashSha256,
    durationSeconds: measuredDuration,
    quantity: input.quantity ?? null,
    success: input.success ?? null,
    fieldType: metricText(input.fieldType),
    outcomeCode: metricText(input.outcomeCode),
    dedupeKey: requiredMetricKey(input.dedupeKey),
    occurredAt
  });
}

function requireOperations(context: TenantContext, action: string): void {
  if (context.actorType === "customer") throw new Error(`Only reviewed operations may ${action}.`);
}

function eventQuantity(
  events: readonly { readonly eventName: PilotMetricName; readonly quantity: number | null }[],
  eventName: PilotMetricName
): number {
  return events.filter((event) => event.eventName === eventName)
    .reduce((total, event) => total + (event.quantity ?? 1), 0);
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function normalizedList(values: readonly string[], label: string): string[] {
  const normalized = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  if (!normalized.length) throw new Error(`${label} requires at least one value.`);
  return normalized;
}

function normalizedCountryCodes(values: readonly string[]): string[] {
  const countries = normalizedList(values, "Pilot destination").map((country) => country.toUpperCase());
  if (countries.some((country) => !/^[A-Z]{2}$/.test(country))) throw new Error("Pilot destinations require ISO alpha-2 country codes.");
  return countries;
}

function sha256(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) throw new Error(`${label} requires a SHA-256 hash.`);
  return normalized;
}

async function digestSha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function metricText(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized.slice(0, 100) : null;
}

function requiredMetricKey(value: string): string {
  const normalized = requiredText(value, "Pilot metric dedupe key");
  if (normalized.length > 200) throw new Error("Pilot metric dedupe key must not exceed 200 characters.");
  return normalized;
}
