"use server";

import { saveCompanyProfile, savePrimaryProduct } from "@exporthq/db";
import { organizationProfileSchema } from "@exporthq/validation";
import { getWorkspaceSession } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";

export type OrganizationProfileActionResult = { ok: boolean; message: string };

const countryCodes: Record<string, string> = {
  Bangladesh: "BD",
  Germany: "DE",
  India: "IN",
  Netherlands: "NL",
  "United Kingdom": "GB"
};

export async function saveOrganizationProfile(payload: string): Promise<OrganizationProfileActionResult> {
  const session = await getWorkspaceSession();
  if (!session.userId || !session.organizationId) return { ok: false, message: "Sign in to a business workspace before saving." };
  const role = session.organizationRole?.replace(/^org:/, "");
  if (role !== "admin" && role !== "owner") return { ok: false, message: "Only an organization owner or admin can save this profile." };

  let input: unknown;
  try {
    input = JSON.parse(payload);
  } catch {
    return { ok: false, message: "ExportPanel could not read the profile changes." };
  }
  const parsed = organizationProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Review the profile values. HS classification may stay blank; primary market and channel choices cannot also be secondary." };
  if (session.isDemo) return { ok: true, message: "Organization profile saved for this preview." };

  const { organization: profile, primaryOffer, marketStrategy } = parsed.data;

  /* Authoritative path: the profile and its audit event commit together in the
     tenant database. The identity-provider metadata below is the documented
     preview adapter and is mirrored only until Gate 3 removes it. */
  const persisted = await runTenantCommand(session, async (tx, context) => {
    await saveCompanyProfile(tx, context, {
      legalName: profile.legalName,
      tradingName: profile.tradingName,
      originCountryCode: countryCodes[profile.country] ?? "BD",
      industry: primaryOffer.category || "Unspecified",
      website: profile.website || null,
      supportEmail: profile.supportEmail,
      defaultCurrency: profile.defaultCurrency,
      defaultTimezone: profile.timezone,
      exportStage: marketStrategy.currentExportStage || null,
      primarySalesChannel: marketStrategy.primarySalesChannel || null,
      marketStrategy
    });
    return savePrimaryProduct(tx, context, {
      ...(primaryOffer.id ? { id: primaryOffer.id } : {}),
      name: primaryOffer.name,
      category: primaryOffer.category || "Other",
      internalReference: primaryOffer.internalReference,
      hsCode: primaryOffer.hsCode,
      specification: primaryOffer.specification,
      countryOfOrigin: countryCodes[profile.country] ?? "BD",
      currency: profile.defaultCurrency
    });
  });
  if (!persisted.ran) {
    return { ok: false, message: "Protected workspace storage is not activated. Nothing was saved." };
  }
  return { ok: true, message: "Organization, offer, and market direction saved." };
}
