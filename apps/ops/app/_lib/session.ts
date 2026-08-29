import "server-only";
import { headers } from "next/headers";
import { authorizeOrganization, type Permission, type StaffPrincipal } from "@exporthq/authorization";
import { getStaffPrincipal } from "@exporthq/auth";
import {
  createDatabase,
  readStaffAccess,
  recordAuditEvent,
  withPlatformTransaction,
  withTenantTransaction,
  type ExportHqDatabase
} from "@exporthq/db";

let databaseHandle: ExportHqDatabase | null = null;

function database(): ExportHqDatabase | null {
  if (!process.env.DATABASE_URL) return null;
  databaseHandle ??= createDatabase(process.env.DATABASE_URL);
  return databaseHandle;
}

async function currentRequest(): Promise<Request> {
  const incoming = new Headers(await headers());
  const protocol = incoming.get("x-forwarded-proto") ?? "https";
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "ops.export-hq.com";
  return new Request(`${protocol}://${host}/`, { headers: incoming });
}

export interface OpsAccessContext {
  readonly principal: StaffPrincipal;
  readonly illustrative: boolean;
}

export async function getOpsAccessContext(): Promise<OpsAccessContext> {
  const identity = await getStaffPrincipal(await currentRequest());
  if (identity.userId === "staff_demo_anna") return { principal: identity, illustrative: true };

  const db = database();
  if (!db) {
    if (identity.globalPermissions.has("platform:admin")) return { principal: identity, illustrative: false };
    throw new Error("Operations persistence is not configured.");
  }

  const projected = await withPlatformTransaction(
    db,
    { actorId: identity.userId, actorType: "staff" },
    (tx) => readStaffAccess(tx, identity.userId)
  );
  if (!projected && !identity.globalPermissions.has("platform:admin")) {
    throw new Error("No active Export HQ staff profile exists for this identity.");
  }
  if (!projected) return { principal: identity, illustrative: false };
  return {
    principal: {
      ...projected,
      globalPermissions: new Set([...identity.globalPermissions, ...projected.globalPermissions])
    },
    illustrative: false
  };
}

export async function auditOpsCaseAccess(
  principal: StaffPrincipal,
  grant: StaffPrincipal["grants"][number],
  permission: Permission
): Promise<void> {
  authorizeOrganization(principal, grant.organizationId, permission);
  const db = database();
  if (!db) throw new Error("Operations persistence is not configured.");
  await withTenantTransaction(db, {
    organizationId: grant.organizationId,
    actorId: principal.userId,
    actorType: "staff"
  }, (tx, context) => recordAuditEvent(tx, context, {
    action: "staff_grant.used",
    entityType: "staff_access_grant",
    entityId: grant.grantId ?? "unknown",
    metadata: {
      caseReference: grant.caseReference ?? "unspecified",
      permission,
      breakGlass: grant.breakGlass === true
    }
  }));
}
