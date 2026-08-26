"use server";

import { redirect } from "next/navigation";
import { getClerkClient } from "@exporthq/auth";
import { getWorkspaceSession } from "../_lib/session";

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
        onboardingVersion: 3,
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
  redirect("/?welcome=1");
}
