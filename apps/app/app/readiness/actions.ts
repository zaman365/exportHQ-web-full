"use server";

import { getClerkClient } from "@exporthq/auth";
import { resolveReadinessAccess } from "@exporthq/authorization";
import {
  readinessProgressSchema,
  readinessReferralRequestSchema
} from "@exporthq/validation";
import { getWorkspaceSession } from "../_lib/session";

export type ReadinessActionResult = {
  ok: boolean;
  message: string;
  savedAt?: string;
};

type TrevvMetadata = { trevv?: Record<string, unknown> };

export async function saveReadinessProgress(payload: string): Promise<ReadinessActionResult> {
  const session = await getWorkspaceSession();
  if (!session.userId || !session.organizationId || !session.principal?.permissions.has("readiness:manage")) {
    return { ok: false, message: "Sign in to an authorized business workspace before saving." };
  }

  let input: unknown;
  try {
    input = JSON.parse(payload);
  } catch {
    return { ok: false, message: "TREVV could not read this assessment draft." };
  }
  const parsed = readinessProgressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Review the assessment fields and evidence list before saving." };
  }

  const savedAt = new Date().toISOString();
  if (session.isDemo) {
    return { ok: true, message: "Draft saved in this preview session.", savedAt };
  }

  const client = getClerkClient();
  const organization = await client.organizations.getOrganization({ organizationId: session.organizationId });
  const privateMetadata = organization.privateMetadata as TrevvMetadata;
  await client.organizations.updateOrganizationMetadata(session.organizationId, {
    privateMetadata: {
      ...privateMetadata,
      trevv: {
        ...(privateMetadata.trevv ?? {}),
        readinessAssessment: {
          ...parsed.data,
          savedAt,
          savedBy: session.userId
        }
      }
    }
  });

  return { ok: true, message: "Assessment saved to your business workspace.", savedAt };
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
    return { ok: false, message: "TREVV could not read this match request." };
  }
  const parsed = readinessReferralRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Choose a provider category and accept the referral disclosure." };
  }

  const savedAt = new Date().toISOString();
  if (session.isDemo) {
    return { ok: true, message: "Match request recorded for this preview.", savedAt };
  }

  const client = getClerkClient();
  const organization = await client.organizations.getOrganization({ organizationId: session.organizationId });
  const privateMetadata = organization.privateMetadata as TrevvMetadata;
  const trevv = privateMetadata.trevv ?? {};
  const existing = Array.isArray(trevv.readinessReferrals) ? trevv.readinessReferrals.slice(-19) : [];
  await client.organizations.updateOrganizationMetadata(session.organizationId, {
    privateMetadata: {
      ...privateMetadata,
      trevv: {
        ...trevv,
        readinessReferrals: [
          ...existing,
          {
            ...parsed.data,
            id: `ref_${crypto.randomUUID()}`,
            status: "requested",
            requestedAt: savedAt,
            requestedBy: session.userId
          }
        ]
      }
    }
  });

  return { ok: true, message: "Request received. TREVV will shortlist qualified matches.", savedAt };
}
