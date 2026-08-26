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
  "membership.created",
  "membership.role_changed",
  "membership.removed",
  "entitlement.granted",
  "entitlement.revoked",
  "onboarding.completed",
  "company_profile.updated",
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
  "staff_grant.created",
  "staff_grant.revoked",
  "staff_grant.used",
  "mailbox.connected",
  "mailbox.disconnected",
  "provider.referral_requested",
  "data_export.requested",
  "legal_hold.applied",
  "legal_hold.released"
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
