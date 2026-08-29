"use server";

import { redirect } from "next/navigation";
import { createBusinessVerificationCase } from "@exporthq/db";
import { businessVerificationSchema } from "@exporthq/validation";
import { checkRateLimit } from "../_lib/activation";
import { getWorkspaceSession } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";

export type VerificationActionState = { error?: string };

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
    declaration: formData.get("declaration")
  });
  if (!parsed.success) {
    return { error: "Check every field, use the official business details, and accept the declaration before continuing." };
  }

  if (session.isDemo) redirect("/verify-business?draft=1&synthetic=1");

  const persisted = await runTenantCommand(session, (tx, context) =>
    createBusinessVerificationCase(tx, context, {
      legalName: parsed.data.legalName,
      countryCode: parsed.data.originCountry,
      registrationAuthority: parsed.data.registrationAuthority,
      registrationNumber: parsed.data.registrationNumber,
      registrationType: "company_registration",
      website: parsed.data.website,
      businessEmail: parsed.data.businessEmail
    })
  );
  if (!persisted.ran) {
    return { error: "Verification case storage is not activated. Nothing was submitted; you can continue preparing your details." };
  }
  redirect(`/verify-business?draft=1&case=${encodeURIComponent(persisted.value.id)}`);
}
