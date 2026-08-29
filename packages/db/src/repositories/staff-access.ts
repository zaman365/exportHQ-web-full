import { and, eq, gt, isNull, lte } from "drizzle-orm";
import type { Permission, StaffPrincipal } from "@exporthq/authorization";
import { staffAccessGrants, staffProfiles } from "../schema";
import type { ExportHqTransaction } from "../tenant";

const organizationPermissions = new Set<Permission>([
  "company:view", "company:manage", "products:view", "products:manage",
  "compliance:view", "compliance:manage", "documents:view", "documents:manage",
  "readiness:view", "readiness:manage", "tasks:view", "tasks:manage",
  "email:view", "email:send", "email:manage", "team:view", "team:message",
  "team:manage", "billing:manage"
]);

function permissions(values: readonly string[]): ReadonlySet<Permission> {
  return new Set(values.filter((value): value is Permission => organizationPermissions.has(value as Permission)));
}

export async function readStaffAccess(
  tx: ExportHqTransaction,
  clerkUserId: string,
  now = new Date()
): Promise<StaffPrincipal | null> {
  const [profile] = await tx.select().from(staffProfiles)
    .where(and(eq(staffProfiles.clerkUserId, clerkUserId), eq(staffProfiles.active, true)))
    .limit(1);
  if (!profile) return null;

  const grants = await tx.select().from(staffAccessGrants).where(and(
    eq(staffAccessGrants.staffProfileId, profile.id),
    lte(staffAccessGrants.startsAt, now),
    gt(staffAccessGrants.expiresAt, now),
    isNull(staffAccessGrants.revokedAt)
  ));

  const globalPermissions = new Set<"customers:view" | "customers:manage" | "platform:admin">();
  for (const permission of profile.globalPermissions) {
    if (permission === "customers:view" || permission === "customers:manage" || permission === "platform:admin") {
      globalPermissions.add(permission);
    }
  }

  return {
    kind: "staff",
    userId: clerkUserId,
    globalPermissions,
    grants: grants.map((grant) => ({
      grantId: grant.id,
      organizationId: grant.organizationId,
      permissions: permissions(grant.permissions),
      caseReference: grant.caseReference,
      reason: grant.reason,
      startsAt: grant.startsAt,
      expiresAt: grant.expiresAt,
      ...(grant.revokedAt ? { revokedAt: grant.revokedAt } : {}),
      breakGlass: grant.breakGlass
    }))
  };
}
