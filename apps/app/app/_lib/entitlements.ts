import "server-only";
import type { CustomerSession } from "@exporthq/auth";
import { featuresForTier, permissionsForOrganizationRole } from "@exporthq/authorization";
import {
  readCompanyProfile,
  readOrganizationTier,
  resolveOrganizationId,
  withTenantTransaction,
  withPlatformTransaction
} from "@exporthq/db";
import { getDatabase } from "./database";

/**
 * Plan entitlements come from Export HQ's own database, not from the identity
 * provider's billing product.
 *
 * That means a pilot exporter can hold Scale without a payment processor
 * existing, a plan change is an audited row, and authorization does not depend
 * on a third party being reachable. Until tenant persistence is activated the
 * session keeps whatever tier the identity provider reported, which today is
 * Basic for everyone.
 */

export interface ResolvedOrganization {
  readonly organizationId: string;
  readonly session: CustomerSession;
}

/**
 * Re-derives features and permissions whenever the tier changes. Returning a
 * session with a new tier but stale permissions would widen or narrow access
 * inconsistently, so the three always move together.
 */
function withTier(session: CustomerSession, tier: CustomerSession["tier"]): CustomerSession {
  if (tier === session.tier) return session;
  return {
    ...session,
    tier,
    features: featuresForTier(tier),
    principal: session.principal
      ? {
          ...session.principal,
          permissions: permissionsForOrganizationRole({
            tier,
            role: session.organizationRole,
            explicitPermissions: null
          })
        }
      : null
  };
}

/**
 * Applies the database-held entitlement to a session. A platform administrator
 * keeps the Managed ceiling regardless, because that access comes from the
 * server-only allowlist rather than from a plan.
 */
export async function applyOrganizationEntitlement(session: CustomerSession): Promise<CustomerSession> {
  if (session.isPlatformAdmin || session.isDemo) return session;
  if (!session.organizationId || !session.principal) return session;

  const database = getDatabase();
  if (!database) return session;

  const organizationId = await withPlatformTransaction(
    database,
    { actorId: session.userId ?? "system", actorType: "system" },
    (tx) => resolveOrganizationId(tx, session.organizationId as string)
  );
  if (!organizationId) return session;

  const tier = await withTenantTransaction(
    database,
    { organizationId, actorId: session.userId ?? "system", actorType: "customer" },
    (tx, context) => readOrganizationTier(tx, context)
  );

  return withTier(session, tier);
}

/** Once Gate 1 is active, onboarding and verification state come from the
 * tenant database even when stale Clerk metadata says otherwise. */
export async function applyOrganizationState(session: CustomerSession): Promise<CustomerSession> {
  if (session.isPlatformAdmin || session.isDemo) return session;
  if (!session.organizationId || !session.principal) return session;
  const database = getDatabase();
  if (!database) return session;

  const organizationId = await withPlatformTransaction(
    database,
    { actorId: session.userId ?? "system", actorType: "system" },
    (tx) => resolveOrganizationId(tx, session.organizationId as string)
  );
  if (!organizationId) return { ...session, status: "needs-onboarding", businessVerification: "unverified" };

  const profile = await withTenantTransaction(
    database,
    { organizationId, actorId: session.userId ?? "system", actorType: "customer" },
    (tx, context) => readCompanyProfile(tx, context)
  );
  return {
    ...session,
    organizationName: profile?.tradingName ?? session.organizationName,
    status: profile?.onboardingComplete ? "active" : "needs-onboarding",
    businessVerification: profile?.verificationStatus === "verified"
      ? "verified"
      : profile?.verificationStatus === "pending"
        ? "pending"
        : "unverified"
  };
}
