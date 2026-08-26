import { sql } from "drizzle-orm";
import { recordPlatformAuditEvent } from "../audit";
import type { ExportHqTransaction } from "../tenant";

/**
 * Identity projection.
 *
 * Clerk owns who a person is. Export HQ owns what an organization may do. This
 * module is the only bridge: it turns a verified identity-provider id into the
 * `organizations.id` UUID that every tenant-scoped query is keyed on.
 *
 * Resolution and provisioning go through `SECURITY DEFINER` functions rather
 * than direct table access, because the caller does not yet have a tenant
 * context — by definition, it is trying to find one. The functions return an
 * identifier and nothing else, so this cannot become a way to read tenant data
 * without a context.
 */

export interface OrganizationIdentity {
  readonly clerkOrganizationId: string;
  readonly slug: string;
  readonly legalName: string;
  readonly tradingName: string;
}

function assertClerkOrganizationId(value: string): string {
  if (!/^org_[A-Za-z0-9]{8,}$/.test(value)) {
    throw new Error("A Clerk organization id is required to resolve a tenant.");
  }
  return value;
}

export async function resolveOrganizationId(
  tx: ExportHqTransaction,
  clerkOrganizationId: string
): Promise<string | null> {
  const rows = (await tx.execute(
    sql`select app_resolve_organization(${assertClerkOrganizationId(clerkOrganizationId)}) as id`
  )) as unknown as Array<{ id: string | null }>;
  return rows[0]?.id ?? null;
}

/**
 * Creates or refreshes the tenant row for a verified organization. Called only
 * from the signature-verified webhook path and from first sign-in, never from
 * user-supplied input.
 */
export async function provisionOrganization(
  tx: ExportHqTransaction,
  identity: OrganizationIdentity,
  actor: { readonly actorId: string; readonly actorType: "staff" | "system" }
): Promise<{ organizationId: string; created: boolean }> {
  const rows = (await tx.execute(sql`select organization_id, created from app_upsert_organization(
    ${assertClerkOrganizationId(identity.clerkOrganizationId)},
    ${identity.slug},
    ${identity.legalName},
    ${identity.tradingName}
  )`)) as unknown as Array<{ organization_id: string; created: boolean }>;

  const row = rows[0];
  if (!row) throw new Error("Organization provisioning did not return an identifier.");

  await recordPlatformAuditEvent(tx, actor, {
    action: row.created ? "organization.created" : "organization.updated",
    entityType: "organization",
    entityId: row.organization_id,
    metadata: { clerkOrganizationId: identity.clerkOrganizationId, slug: identity.slug }
  });

  return { organizationId: row.organization_id, created: row.created };
}

export interface MembershipIdentity {
  readonly clerkUserId: string;
  readonly role: string;
  readonly active: boolean;
}

/**
 * Membership mirrors the identity provider. Permissions are *not* stored from
 * the provider: they are derived from the role and intersected with the plan
 * ceiling at request time, so a stale mirrored permission cannot widen access.
 */
export async function projectMembership(
  tx: ExportHqTransaction,
  organizationId: string,
  membership: MembershipIdentity,
  actor: { readonly actorId: string; readonly actorType: "staff" | "system" }
): Promise<void> {
  const rows = (await tx.execute(sql`select app_project_membership(
    ${organizationId}::uuid,
    ${membership.clerkUserId},
    ${membership.role},
    ${membership.active}
  ) as membership_id`)) as unknown as Array<{ membership_id: string }>;

  const membershipId = rows[0]?.membership_id;
  if (!membershipId) throw new Error("Membership projection did not return an identifier.");

  await recordPlatformAuditEvent(tx, actor, {
    action: membership.active ? "membership.created" : "membership.removed",
    entityType: "organization_membership",
    entityId: membershipId,
    metadata: { organizationId, role: membership.role }
  });
}
