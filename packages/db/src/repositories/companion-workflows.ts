import { and, eq, lte } from "drizzle-orm";
import {
  companionReminderAt,
  companionWorkflowTemplates,
  type CompanionWorkflowType
} from "@exporthq/domain";
import { recordAuditEvent } from "../audit";
import { enqueueOutboxEvent } from "../outbox";
import {
  companionWorkflowCases,
  companionWorkflowEvidence,
  companionWorkflowItems,
  documentVersions,
  regulatoryRuleLaneImpacts,
  regulatoryRules,
  regulatorySources
} from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export async function createCompanionWorkflow(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly exportLaneId?: string | null;
    readonly workflowType: CompanionWorkflowType;
    readonly authorityName: string;
    readonly externalPortalUrl: string;
    readonly dueAt?: Date | null;
    readonly ownerMembershipId: string;
    readonly sourceRuleIds?: Readonly<Record<number, string>>;
  }
): Promise<string> {
  const template = companionWorkflowTemplates[input.workflowType];
  const dueAt = input.dueAt ?? null;
  const reminderAt = companionReminderAt(input.workflowType, dueAt);
  const [workflow] = await tx.insert(companionWorkflowCases).values({
    organizationId: context.organizationId,
    exportLaneId: input.exportLaneId ?? null,
    workflowType: input.workflowType,
    authorityName: requiredText(input.authorityName, "Companion workflow authority"),
    externalPortalUrl: httpsUrl(input.externalPortalUrl),
    status: "in_progress",
    dueAt,
    reminderAt,
    ownerMembershipId: input.ownerMembershipId,
    createdBy: context.actorId
  }).returning({ id: companionWorkflowCases.id });
  if (!workflow) throw new Error("Companion workflow did not return an identifier.");
  await tx.insert(companionWorkflowItems).values(template.itemTitles.map((title, index) => ({
    organizationId: context.organizationId,
    workflowCaseId: workflow.id,
    sequence: index + 1,
    title,
    description: `${title}. Preparation and tracking only; the customer or authorized representative completes external submission.`,
    sourceRuleId: input.sourceRuleIds?.[index + 1] ?? null,
    portalMaxBytes: template.portalMaxBytes,
    responsibility: title.toLowerCase().includes("customer submits") ? "customer" as const : "export_hq" as const
  })));
  await recordAuditEvent(tx, context, { action: "companion_workflow.created", entityType: "companion_workflow_case", entityId: workflow.id, metadata: { workflowType: input.workflowType, exportLaneId: input.exportLaneId ?? null, preparationOnly: true, reminderAt: reminderAt?.toISOString() ?? null, portalMaxBytes: template.portalMaxBytes } });
  return workflow.id;
}

export async function addCompanionWorkflowEvidence(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly workflowCaseId: string; readonly workflowItemId?: string | null; readonly documentVersionId: string; readonly purpose: string; readonly submittedToPortalByCustomer?: boolean },
  now = new Date()
): Promise<string> {
  const [document] = await tx.select({ byteSize: documentVersions.byteSize }).from(documentVersions).where(and(
    eq(documentVersions.organizationId, context.organizationId), eq(documentVersions.id, input.documentVersionId)
  )).limit(1);
  if (!document) throw new Error("Evidence document version was not found.");
  if (input.workflowItemId) {
    const [item] = await tx.select({ portalMaxBytes: companionWorkflowItems.portalMaxBytes }).from(companionWorkflowItems).where(and(
      eq(companionWorkflowItems.organizationId, context.organizationId),
      eq(companionWorkflowItems.id, input.workflowItemId),
      eq(companionWorkflowItems.workflowCaseId, input.workflowCaseId)
    )).limit(1);
    if (!item) throw new Error("Companion workflow item was not found.");
    if (item.portalMaxBytes != null && document.byteSize > item.portalMaxBytes) throw new Error(`Evidence exceeds the external portal limit of ${item.portalMaxBytes} bytes.`);
  }
  const [evidence] = await tx.insert(companionWorkflowEvidence).values({
    organizationId: context.organizationId,
    workflowCaseId: input.workflowCaseId,
    workflowItemId: input.workflowItemId ?? null,
    documentVersionId: input.documentVersionId,
    byteSize: document.byteSize,
    purpose: requiredText(input.purpose, "Companion evidence purpose"),
    submittedToPortalByCustomer: input.submittedToPortalByCustomer ?? false,
    recordedBy: context.actorId,
    recordedAt: now
  }).returning({ id: companionWorkflowEvidence.id });
  if (!evidence) throw new Error("Companion evidence did not return an identifier.");
  return evidence.id;
}

export async function completeCompanionWorkflowItem(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly workflowCaseId: string; readonly workflowItemId: string; readonly notApplicable?: boolean },
  now = new Date()
): Promise<void> {
  const [completed] = await tx.update(companionWorkflowItems).set({
    status: input.notApplicable ? "not_applicable" : "completed",
    completedBy: context.actorId,
    completedAt: now,
    updatedAt: now
  }).where(and(
    eq(companionWorkflowItems.organizationId, context.organizationId),
    eq(companionWorkflowItems.workflowCaseId, input.workflowCaseId),
    eq(companionWorkflowItems.id, input.workflowItemId),
    eq(companionWorkflowItems.status, "open")
  )).returning({ id: companionWorkflowItems.id });
  if (!completed) throw new Error("Open companion workflow item was not found.");
  const remaining = await tx.select({ sequence: companionWorkflowItems.sequence, status: companionWorkflowItems.status }).from(companionWorkflowItems).where(and(
    eq(companionWorkflowItems.organizationId, context.organizationId),
    eq(companionWorkflowItems.workflowCaseId, input.workflowCaseId)
  ));
  if (remaining.filter((item) => item.sequence <= 2).every((item) => ["completed", "not_applicable"].includes(item.status))) {
    await tx.update(companionWorkflowCases).set({ status: "ready_for_submission", updatedAt: now }).where(and(
      eq(companionWorkflowCases.organizationId, context.organizationId),
      eq(companionWorkflowCases.id, input.workflowCaseId),
      eq(companionWorkflowCases.status, "in_progress")
    ));
  }
}

export async function recordExternalCompanionSubmission(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: { readonly workflowCaseId: string; readonly expectedVersion: number; readonly submissionReference: string },
  now = new Date()
): Promise<void> {
  const [updated] = await tx.update(companionWorkflowCases).set({
    status: "submitted",
    submissionReference: requiredText(input.submissionReference, "External submission reference"),
    submittedByActorId: context.actorId,
    submittedAt: now,
    version: input.expectedVersion + 1,
    updatedAt: now
  }).where(and(
    eq(companionWorkflowCases.organizationId, context.organizationId),
    eq(companionWorkflowCases.id, input.workflowCaseId),
    eq(companionWorkflowCases.version, input.expectedVersion),
    eq(companionWorkflowCases.status, "ready_for_submission")
  )).returning({ id: companionWorkflowCases.id });
  if (!updated) throw new Error("Submission-ready companion workflow was not found or changed concurrently.");
  await recordAuditEvent(tx, context, { action: "companion_workflow.submission_recorded", entityType: "companion_workflow_case", entityId: input.workflowCaseId, metadata: { submittedByAuthorizedActor: true, portalAutomationUsed: false } });
}

/** Emits tenant-specific alerts for rules whose reviewed source crossed its
 * freshness deadline. Publication remains global and migration/reviewer-only. */
export async function enqueueStaleRegulatorySourceAlerts(
  tx: ExportHqTransaction,
  context: TenantContext,
  now = new Date()
): Promise<number> {
  const impacted = await tx.select({
    impactId: regulatoryRuleLaneImpacts.id,
    exportLaneId: regulatoryRuleLaneImpacts.exportLaneId,
    sourceId: regulatorySources.id,
    nextReviewAt: regulatorySources.nextReviewAt,
    ruleVersion: regulatoryRules.ruleVersion
  }).from(regulatoryRuleLaneImpacts)
    .innerJoin(regulatoryRules, eq(regulatoryRules.id, regulatoryRuleLaneImpacts.regulatoryRuleId))
    .innerJoin(regulatorySources, eq(regulatorySources.id, regulatoryRules.sourceId))
    .where(and(
      eq(regulatoryRuleLaneImpacts.organizationId, context.organizationId),
      eq(regulatoryRuleLaneImpacts.state, "pending"),
      lte(regulatorySources.nextReviewAt, now)
    ));
  for (const item of impacted) {
    await enqueueOutboxEvent(tx, context, {
      topic: "regulatory.source_stale",
      aggregateType: "export_lane",
      aggregateId: item.exportLaneId,
      dedupeKey: `regulatory-source:${item.sourceId}:lane:${item.exportLaneId}:stale:${item.nextReviewAt.toISOString()}`,
      payload: { impactId: item.impactId, sourceId: item.sourceId, ruleVersion: item.ruleVersion, nextReviewAt: item.nextReviewAt.toISOString() }
    });
  }
  return impacted.length;
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function httpsUrl(value: string): string {
  const normalized = requiredText(value, "External portal URL");
  const url = new URL(normalized);
  if (url.protocol !== "https:") throw new Error("External portal URL must use HTTPS.");
  return url.toString();
}
