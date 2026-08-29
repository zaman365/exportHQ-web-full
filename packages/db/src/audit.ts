import { auditEvents } from "./schema";
import type { ExportHqTransaction, TenantContext } from "./tenant";

/**
 * Append-only audit.
 *
 * An audit event is written by the same transaction as the change it records.
 * If the change rolls back, so does its audit event; if the audit write fails,
 * the change does not commit. That is the only arrangement under which the
 * audit trail can be trusted as evidence.
 */

export const auditableActions = [
  "organization.created",
  "organization.updated",
  "organization.deactivated",
  "membership.created",
  "membership.role_changed",
  "membership.removed",
  "entitlement.granted",
  "entitlement.revoked",
  "onboarding.completed",
  "company_profile.updated",
  "export_lane.created",
  "export_lane.transitioned",
  "export_lane.participant_added",
  "export_lane.decision_recorded",
  "product.created",
  "product.updated",
  "product.deleted",
  "task.created",
  "task.status_changed",
  "readiness.saved",
  "readiness.submitted",
  "verification.requested",
  "verification.approved",
  "verification.rejected",
  "document.upload_intent_created",
  "document.staged",
  "document.scan_completed",
  "document.accepted",
  "document.rejected",
  "document.viewed",
  "document.downloaded",
  "document.shared",
  "document.share_revoked",
  "document.deleted",
  "verification.evidence_added",
  "verification.status_changed",
  "passport.fact_created",
  "passport.fact_verified",
  "regulatory.impact_detected",
  "regulatory.impact_acknowledged",
  "regulatory.impact_resolved",
  "ai.extraction_proposed",
  "ai.extraction_reviewed",
  "ai.extraction_used",
  "staff_grant.created",
  "staff_grant.revoked",
  "staff_grant.used",
  "mailbox.connected",
  "mailbox.disconnected",
  "provider.referral_requested",
  "data_export.requested",
  "legal_hold.applied",
  "legal_hold.released",
  "legal.accepted",
  "pilot.invited",
  "pilot.agreement_accepted",
  "pilot.activated",
  "pilot.pass_granted",
  "pilot.pass_editor_assigned",
  "pilot.pass_editor_revoked",
  "pilot.pass_extended",
  "pilot.pass_converted",
  "pilot.support_case_created",
  "pilot.support_work_logged",
  "pilot.observation_recorded",
  "buyer.created",
  "buyer.corrected",
  "buyer.consent_recorded",
  "opportunity.created",
  "opportunity.transitioned",
  "rfq.created",
  "rfq.transitioned",
  "quotation.created",
  "quotation.version_created",
  "quotation.approved",
  "quotation.delivery_queued",
  "quotation.accepted",
  "sales_order.created",
  "sales_order.change_confirmed",
  "document_set.generated",
  "document_set.reviewed",
  "mailbox.thread_mapped",
  "mailbox.draft_approved",
  "mailbox.delivery_queued",
  "mailbox.deletion_requested",
  "production.batch_created",
  "shipment.created",
  "shipment.transitioned",
  "shipment.exception_recorded",
  "shipment.exception_resolved",
  "trade_invoice.issued",
  "payment.receipt_recorded",
  "payment.allocated",
  "proceeds.confirmed",
  "companion_workflow.created",
  "companion_workflow.submission_recorded",
  "billing.account_created",
  "billing.subscription_created",
  "billing.subscription_transitioned",
  "billing.invoice_issued",
  "billing.reconciled",
  "identity.reconciliation_requested"
] as const;

export type AuditableAction = (typeof auditableActions)[number];

export interface AuditEventInput {
  readonly action: AuditableAction;
  readonly entityType: string;
  readonly entityId: string;
  /**
   * Never put document contents, message bodies, credentials or signed URLs
   * here. Metadata answers "what changed and under what authority", not "what
   * was in it" — see docs/data-classification.md.
   */
  readonly metadata?: Record<string, unknown>;
  /** A salted hash, never a raw address. */
  readonly ipHash?: string | undefined;
}

const forbiddenMetadataKey =
  /(password|secret|token|credential|authorization|cookie|api[-_]?key|signed[-_]?url|body|content|attachment)/i;

/**
 * Metadata is checked rather than trusted. A confidential value reaching the
 * audit table would make the table itself unsafe to read widely, which would
 * defeat its purpose.
 */
export function assertSafeAuditMetadata(metadata: Record<string, unknown>): void {
  for (const key of Object.keys(metadata)) {
    if (forbiddenMetadataKey.test(key)) {
      throw new Error(`Audit metadata may not carry "${key}".`);
    }
  }
}

export async function recordAuditEvent(
  tx: ExportHqTransaction,
  context: TenantContext,
  event: AuditEventInput
): Promise<void> {
  const metadata = event.metadata ?? {};
  assertSafeAuditMetadata(metadata);
  await tx.insert(auditEvents).values({
    organizationId: context.organizationId,
    actorId: context.actorId,
    actorType: context.actorType,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    metadata,
    ipHash: event.ipHash ?? null
  });
}

/**
 * Platform-level audit: staff and system actions that are not scoped to one
 * organization. `organization_id` is null, which the tenant read policy
 * excludes, so these are visible only to platform operations.
 */
export async function recordPlatformAuditEvent(
  tx: ExportHqTransaction,
  actor: { readonly actorId: string; readonly actorType: "staff" | "system" },
  event: AuditEventInput
): Promise<void> {
  const metadata = event.metadata ?? {};
  assertSafeAuditMetadata(metadata);
  await tx.insert(auditEvents).values({
    organizationId: null,
    actorId: actor.actorId,
    actorType: actor.actorType,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    metadata,
    ipHash: event.ipHash ?? null
  });
}
