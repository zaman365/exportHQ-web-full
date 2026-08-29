"use server";

import { resolveReadinessAccess } from "@exporthq/authorization";
import {
  ReadinessVersionConflictError,
  requestReadinessProviderSupport,
  saveReadinessAssessment
} from "@exporthq/db";
import { resolveActivationState, resolveCapability } from "@exporthq/platform";
import {
  readinessProgressSchema,
  readinessReferralRequestSchema
} from "@exporthq/validation";
import { getWorkspaceSession } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";

export type ReadinessActionResult = {
  ok: boolean;
  message: string;
  savedAt?: string;
  assessmentId?: string;
  assessmentVersion?: number;
};

export async function saveReadinessProgress(payload: string): Promise<ReadinessActionResult> {
  const session = await getWorkspaceSession();
  if (!session.userId || !session.organizationId || !session.principal?.permissions.has("readiness:manage")) {
    return { ok: false, message: "Sign in to an authorized business workspace before saving." };
  }

  let input: unknown;
  try {
    input = JSON.parse(payload);
  } catch {
    return { ok: false, message: "ExportPanel could not read this assessment draft." };
  }
  const parsed = readinessProgressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Review the assessment fields and evidence list before saving." };
  }

  const savedAt = new Date().toISOString();
  if (session.isDemo) {
    return { ok: true, message: "Draft saved in this preview session.", savedAt };
  }
  if (!parsed.data.exportLaneId) {
    return { ok: false, message: "Create or select an Export Lane before saving readiness." };
  }
  try {
    const persisted = await runTenantCommand(session, (tx, context) => saveReadinessAssessment(tx, context, {
      ...(parsed.data.assessmentId ? { assessmentId: parsed.data.assessmentId } : {}),
      ...(parsed.data.assessmentVersion ? { expectedVersion: parsed.data.assessmentVersion } : {}),
      exportLaneId: parsed.data.exportLaneId as string,
      currentSection: parsed.data.currentSection,
      profile: parsed.data.profile,
      responses: parsed.data.responses,
      notes: parsed.data.notes
    }));
    if (!persisted.ran) {
      return { ok: false, message: "Readiness storage is not activated. Nothing was saved to your business workspace." };
    }
    return {
      ok: true,
      message: "Assessment saved to your protected business workspace.",
      savedAt: persisted.value.savedAt,
      assessmentId: persisted.value.assessmentId,
      assessmentVersion: persisted.value.assessmentVersion
    };
  } catch (error) {
    if (error instanceof ReadinessVersionConflictError) {
      return { ok: false, message: "This assessment changed in another session. Reload it before saving again." };
    }
    return { ok: false, message: error instanceof Error ? error.message : "The readiness assessment could not be saved." };
  }
}

export async function requestReadinessProviderMatch(payload: string): Promise<ReadinessActionResult> {
  const session = await getWorkspaceSession();
  if (!session.userId || !session.organizationId || !session.principal?.permissions.has("readiness:manage")) {
    return { ok: false, message: "Sign in to an authorized business workspace before requesting a match." };
  }
  if (resolveReadinessAccess({
    authenticated: true,
    businessVerification: session.businessVerification,
    tier: session.tier
  }) !== "full") {
    return { ok: false, message: "Verify the business or activate a paid plan to request verified provider matches." };
  }

  let input: unknown;
  try {
    input = JSON.parse(payload);
  } catch {
    return { ok: false, message: "ExportPanel could not read this match request." };
  }
  const parsed = readinessReferralRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Choose a provider category and accept the referral disclosure." };
  }

  const savedAt = new Date().toISOString();
  if (session.isDemo) {
    return { ok: true, message: "Support request recorded for this preview; no provider match is promised.", savedAt };
  }
  const referral = resolveCapability("provider-referral");
  const governanceReference = resolveActivationState().recorded.find(
    (record) => record.gate === "gate-4-trust-and-integrations"
  )?.evidenceReference;
  const governed = referral.enabled && referral.mode === "production" && Boolean(governanceReference);
  try {
    const persisted = await runTenantCommand(session, (tx, context) => requestReadinessProviderSupport(tx, context, {
      requestId: parsed.data.requestId,
      assessmentId: parsed.data.assessmentId,
      requirementId: parsed.data.requirementId,
      providerCategory: parsed.data.providerCategory,
      mode: governed ? "governed_referral" : "support_request",
      ...(governed ? { governanceEvidenceReference: governanceReference as string } : {})
    }));
    if (!persisted.ran) {
      return { ok: false, message: "Readiness storage is not activated. No support request was recorded." };
    }
    return persisted.value.mode === "governed_referral"
      ? { ok: true, message: "Referral request recorded for the governed operations queue.", savedAt }
      : { ok: true, message: "Support request recorded. Provider matching is not activated, so no introduction or outcome is promised.", savedAt };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "The support request could not be recorded." };
  }
}
