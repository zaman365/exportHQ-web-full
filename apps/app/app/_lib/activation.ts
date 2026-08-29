import type { CustomerSession } from "@exporthq/auth";
import {
  activationReport,
  enforceRateLimit,
  RateLimitedError,
  resolveCapability,
  type CapabilityDecision,
  type ProductionCapability,
  type RateLimitedAction
} from "@exporthq/platform";
import { getRateLimitStore } from "./platform-runtime";
import { DurablePlatformStoreUnavailableError } from "./platform-runtime";

/**
 * Server-side capability and abuse checks for actions and route handlers.
 *
 * These are deliberately independent of navigation and feature visibility: a
 * customer may see a capability described and still be refused by the server
 * until the relevant activation gate records evidence.
 */

export type CapabilityRefusal = { readonly ok: false; readonly message: string };
export type CapabilityAllowance = { readonly ok: true; readonly decision: CapabilityDecision };
export type CapabilityOutcome = CapabilityAllowance | CapabilityRefusal;

export function checkCapability(capability: ProductionCapability): CapabilityOutcome {
  const decision = resolveCapability(capability);
  if (decision.enabled) return { ok: true, decision };
  return { ok: false, message: decision.userFacingReason ?? "This capability is not available yet." };
}

/**
 * Limits are keyed on the organization where one exists so that abuse is
 * contained to the tenant responsible, and on the user otherwise.
 */
export async function checkRateLimit(
  action: RateLimitedAction,
  subject: string
): Promise<CapabilityRefusal | { readonly ok: true }> {
  try {
    await enforceRateLimit({ action, subject, store: getRateLimitStore() });
    return { ok: true };
  } catch (error) {
    if (error instanceof RateLimitedError) return { ok: false, message: error.userFacingMessage };
    if (error instanceof DurablePlatformStoreUnavailableError) return { ok: false, message: error.userFacingMessage };
    throw error;
  }
}

export function readActivationReport(): ReturnType<typeof activationReport> {
  return activationReport();
}

export type WorkspaceProjectionKind = "demo-identity" | "illustrative" | "customer-records";

/**
 * Describes what is actually behind the workspace a person is looking at.
 *
 * Until `customer-postgres-persistence` is activated, every workspace above the
 * Basic tier renders the curated domain projection rather than the reader's own
 * records. Deriving this from the capability rather than from a flag means the
 * notice disappears on its own when Gate 3 lands, and cannot be forgotten.
 */
export function workspaceProjectionKind(session: CustomerSession): WorkspaceProjectionKind {
  if (session.isDemo) return "demo-identity";
  if (!session.userId) return "customer-records";
  /* `synthetic` mode means the capability runs but the data behind it is not
     real, which is exactly the case the reader needs told. Only a capability
     activated in production stands for the reader's own records. */
  const persistence = resolveCapability("customer-postgres-persistence");
  return persistence.enabled && persistence.mode === "production" ? "customer-records" : "illustrative";
}
