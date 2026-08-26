import "server-only";
import type { CustomerSession } from "@exporthq/auth";
import {
  resolveOrganizationId,
  withPlatformTransaction,
  withTenantTransaction,
  type ExportHqTransaction,
  type TenantContext
} from "@exporthq/db";
import { getDatabase } from "./database";

/**
 * Runs a tenant-scoped command for the signed-in session.
 *
 * Returns `null` when tenant persistence is not activated, so a caller can fall
 * back to its documented preview adapter rather than failing. Callers must
 * treat `null` as "not written" and say so — never as "written".
 */
export async function runTenantCommand<T>(
  session: CustomerSession,
  work: (tx: ExportHqTransaction, context: TenantContext) => Promise<T>
): Promise<{ ran: true; value: T } | { ran: false }> {
  const database = getDatabase();
  if (!database || !session.organizationId || !session.userId) return { ran: false };

  const organizationId = await withPlatformTransaction(
    database,
    { actorId: session.userId, actorType: "system" },
    (tx) => resolveOrganizationId(tx, session.organizationId as string)
  );
  if (!organizationId) return { ran: false };

  const value = await withTenantTransaction(
    database,
    { organizationId, actorId: session.userId, actorType: "customer" },
    work
  );
  return { ran: true, value };
}
