import { and, eq, isNull, or, gt } from "drizzle-orm";
import { organizationEntitlements, pilotPassEditors, pilotPassGrants } from "./schema";
import { recordAuditEvent } from "./audit";
import type { ExportHqTransaction, TenantContext } from "./tenant";

/**
 * Plan entitlements, owned by Export HQ rather than by a billing provider.
 *
 * Keeping the ceiling here means: a pilot exporter can be granted Scale
 * without a payment processor existing; a plan change is an audited row in the
 * same transaction as the decision; and authorization does not fail open or
 * closed because a third party is unreachable.
 */

export type EntitlementTier = "preview" | "explore" | "launch" | "scale" | "managed";
export type EntitlementSource = "platform_grant" | "trial" | "paid" | "pilot";

export interface EntitlementRecord {
  readonly tier: EntitlementTier;
  readonly source: EntitlementSource;
  readonly effectiveFrom: Date;
  readonly effectiveTo: Date | null;
  readonly revokedAt: Date | null;
}

const tierRank: Readonly<Record<EntitlementTier, number>> = {
  preview: 0,
  explore: 1,
  launch: 2,
  scale: 3,
  managed: 4
};

export function isEntitlementActive(record: EntitlementRecord, now: Date): boolean {
  if (record.revokedAt && record.revokedAt.getTime() <= now.getTime()) return false;
  if (record.effectiveFrom.getTime() > now.getTime()) return false;
  if (record.effectiveTo && record.effectiveTo.getTime() <= now.getTime()) return false;
  return true;
}

/**
 * The highest active tier wins. An organization holding both a pilot grant and
 * a paid plan keeps the better of the two rather than whichever was written
 * last, so an expiring trial cannot silently downgrade a paying customer.
 *
 * With no active entitlement the answer is `explore`, not `preview`: the
 * organization exists and someone is signed in to it.
 */
export function resolveEntitlementTier(records: readonly EntitlementRecord[], now: Date): EntitlementTier {
  const active = records.filter((record) => isEntitlementActive(record, now));
  if (!active.length) return "explore";
  return active.reduce<EntitlementTier>(
    (best, record) => (tierRank[record.tier] > tierRank[best] ? record.tier : best),
    "explore"
  );
}

export async function readOrganizationEntitlements(
  tx: ExportHqTransaction,
  context: TenantContext,
  now = new Date()
): Promise<EntitlementRecord[]> {
  const rows = await tx
    .select({
      id: organizationEntitlements.id,
      tier: organizationEntitlements.tier,
      source: organizationEntitlements.source,
      effectiveFrom: organizationEntitlements.effectiveFrom,
      effectiveTo: organizationEntitlements.effectiveTo,
      revokedAt: organizationEntitlements.revokedAt
    })
    .from(organizationEntitlements)
    .where(
      and(
        eq(organizationEntitlements.organizationId, context.organizationId),
        isNull(organizationEntitlements.revokedAt),
        or(isNull(organizationEntitlements.effectiveTo), gt(organizationEntitlements.effectiveTo, now))
      )
    );
  if (context.actorType !== "customer") return rows;

  /* A general pilot grant remains organization-wide. A First Shipment Pass is
     different: its Launch ceiling belongs only to the at-most-three explicitly
     assigned editors. The pass remains visible to the tenant, but cannot widen
     an unassigned member's authorization. */
  const passEntitlements = await tx.select({
    entitlementId: pilotPassGrants.entitlementId
  }).from(pilotPassGrants).where(eq(pilotPassGrants.organizationId, context.organizationId));
  const linkedEntitlementIds = new Set(passEntitlements.map((row) => row.entitlementId));
  if (!linkedEntitlementIds.size) return rows;
  const assignments = await tx.select({
    entitlementId: pilotPassGrants.entitlementId
  }).from(pilotPassEditors).innerJoin(
    pilotPassGrants,
    and(
      eq(pilotPassGrants.id, pilotPassEditors.pilotPassGrantId),
      eq(pilotPassGrants.organizationId, pilotPassEditors.organizationId)
    )
  ).where(and(
    eq(pilotPassEditors.organizationId, context.organizationId),
    eq(pilotPassEditors.actorId, context.actorId),
    isNull(pilotPassEditors.revokedAt)
  ));
  const assignedEntitlementIds = new Set(assignments.map((row) => row.entitlementId));
  return rows.filter((row) => row.source !== "pilot"
    || !linkedEntitlementIds.has(row.id)
    || assignedEntitlementIds.has(row.id));
}

export async function readOrganizationTier(
  tx: ExportHqTransaction,
  context: TenantContext,
  now = new Date()
): Promise<EntitlementTier> {
  return resolveEntitlementTier(await readOrganizationEntitlements(tx, context, now), now);
}

export interface GrantEntitlementInput {
  readonly tier: EntitlementTier;
  readonly source: EntitlementSource;
  /** Why this organization holds this tier. Shown to operations, not to customers. */
  readonly reason: string;
  readonly effectiveFrom?: Date;
  readonly effectiveTo?: Date | null;
}

export async function grantOrganizationEntitlement(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: GrantEntitlementInput
): Promise<string> {
  const [row] = await tx
    .insert(organizationEntitlements)
    .values({
      organizationId: context.organizationId,
      tier: input.tier,
      source: input.source,
      reason: input.reason,
      grantedBy: context.actorId,
      effectiveFrom: input.effectiveFrom ?? new Date(),
      effectiveTo: input.effectiveTo ?? null
    })
    .returning({ id: organizationEntitlements.id });

  const entitlementId = row?.id;
  if (!entitlementId) throw new Error("Entitlement grant did not return an identifier.");

  await recordAuditEvent(tx, context, {
    action: "entitlement.granted",
    entityType: "organization_entitlement",
    entityId: entitlementId,
    metadata: { tier: input.tier, source: input.source, reason: input.reason }
  });
  return entitlementId;
}

export async function revokeOrganizationEntitlement(
  tx: ExportHqTransaction,
  context: TenantContext,
  entitlementId: string,
  reason: string,
  now = new Date()
): Promise<void> {
  await tx
    .update(organizationEntitlements)
    .set({ revokedAt: now, updatedAt: now })
    .where(
      and(
        eq(organizationEntitlements.id, entitlementId),
        eq(organizationEntitlements.organizationId, context.organizationId)
      )
    );

  await recordAuditEvent(tx, context, {
    action: "entitlement.revoked",
    entityType: "organization_entitlement",
    entityId: entitlementId,
    metadata: { reason }
  });
}
