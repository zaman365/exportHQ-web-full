"use server";

import { redirect } from "next/navigation";
import { getClerkClient } from "@exporthq/auth";
import { completeOnboarding as completeOnboardingRecord } from "@exporthq/db";
import { structuredLogLine } from "@exporthq/platform";
import { getWorkspaceSession } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";

const onboardingVersion = 3;

export type OnboardingActionState = { error?: string };

export async function completeOnboarding(
  _state: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const session = await getWorkspaceSession();
  if (!session.userId || !session.organizationId) return { error: "Create or select a business workspace before continuing." };
  const role = session.organizationRole?.replace(/^org:/, "");
  if (role !== "admin" && role !== "owner") return { error: "An organization owner or admin must activate this workspace." };

  if (session.isDemo) {
    const businessName = String(formData.get("demoBusinessName") ?? session.organizationName ?? "New business").slice(0, 100);
    redirect(`/?access=basic&business=${encodeURIComponent(businessName)}&welcome=1`);
  }

  /* Authoritative path: the workspace is activated in PostgreSQL, with the
     audit event committing in the same transaction. Identity metadata is only
     mirrored afterwards so the session can still read completion before the
     first database round trip. */
  const persisted = await runTenantCommand(session, (tx, context) =>
    completeOnboardingRecord(tx, context, onboardingVersion)
  );
  if (!persisted.ran) {
    return { error: "Workspace activation is temporarily unavailable. Nothing was changed; please try again shortly." };
  }

  /* This is a best-effort mirror after the authoritative transaction. The
     durable outbox event written with onboarding remains pending if Clerk is
     unavailable, so a worker can retry without reporting false failure. */
  try {
    const client = getClerkClient();
    const organization = await client.organizations.getOrganization({ organizationId: session.organizationId });
    const currentPublic = organization.publicMetadata as { exportPanel?: Record<string, unknown> };
    const currentPrivate = organization.privateMetadata as { exportPanel?: Record<string, unknown> };
    await client.organizations.updateOrganizationMetadata(session.organizationId, {
      publicMetadata: {
        ...currentPublic,
        exportPanel: {
          ...(currentPublic.exportPanel ?? {}),
          onboardingComplete: true,
          onboardingVersion,
          persistedToTenantDatabase: true,
          productSetupComplete: currentPublic.exportPanel?.productSetupComplete === true
        }
      },
      privateMetadata: {
        ...currentPrivate,
        exportPanel: {
          ...(currentPrivate.exportPanel ?? {}),
          activatedBy: session.userId,
          activatedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.warn(structuredLogLine("onboarding.identity_mirror_deferred", {
      outcome: "outbox_retry",
      error: error instanceof Error ? error.name : "UnknownError"
    }));
  }
  redirect("/?welcome=1");
}
