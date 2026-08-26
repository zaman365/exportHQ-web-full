"use server";

import { redirect } from "next/navigation";
import { getClerkClient } from "@exporthq/auth";
import { businessVerificationSchema } from "@exporthq/validation";
import { checkRateLimit } from "../_lib/activation";
import { getWorkspaceSession } from "../_lib/session";

export type VerificationActionState = { error?: string };

type ExportPanelMetadata = { exportPanel?: Record<string, unknown> };

export async function requestBusinessVerification(
  _state: VerificationActionState,
  formData: FormData
): Promise<VerificationActionState> {
  const session = await getWorkspaceSession();
  if (!session.userId || !session.organizationId) {
    return { error: "Create or select a business before requesting verification." };
  }
  const role = session.organizationRole?.replace(/^org:/, "");
  if (role !== "admin" && role !== "owner") {
    return { error: "A business owner or admin must submit the verification request." };
  }
  if (session.businessVerification === "verified") {
    redirect("/verify-business?verified=1");
  }

  /* Verification submissions reach a human reviewer, so the limit protects the
     operations queue as well as the platform. It is keyed on the organization
     rather than the person so one workspace cannot flood the queue by
     rotating submitters. */
  const withinLimit = await checkRateLimit("verification-submission", session.organizationId);
  if (!withinLimit.ok) return { error: withinLimit.message };

  const parsed = businessVerificationSchema.safeParse({
    legalName: formData.get("legalName"),
    registrationNumber: formData.get("registrationNumber"),
    registrationAuthority: formData.get("registrationAuthority"),
    originCountry: formData.get("originCountry"),
    website: formData.get("website"),
    businessEmail: formData.get("businessEmail"),
    evidenceUrl: formData.get("evidenceUrl"),
    declaration: formData.get("declaration")
  });
  if (!parsed.success) {
    return { error: "Check every field, use full https:// links, and accept the declaration before submitting." };
  }

  if (session.isDemo) redirect("/verify-business?submitted=1");

  const client = getClerkClient();
  const organization = await client.organizations.getOrganization({ organizationId: session.organizationId });
  const publicMetadata = organization.publicMetadata as ExportPanelMetadata;
  const privateMetadata = organization.privateMetadata as ExportPanelMetadata;
  const submittedAt = new Date().toISOString();

  await client.organizations.updateOrganizationMetadata(session.organizationId, {
    publicMetadata: {
      ...publicMetadata,
      exportPanel: {
        ...(publicMetadata.exportPanel ?? {}),
        businessVerification: "pending",
        verificationSubmittedAt: submittedAt
      }
    },
    privateMetadata: {
      ...privateMetadata,
      exportPanel: {
        ...(privateMetadata.exportPanel ?? {}),
        verificationRequest: {
          ...parsed.data,
          submittedAt,
          submittedBy: session.userId
        }
      }
    }
  });

  redirect("/verify-business?submitted=1");
}
