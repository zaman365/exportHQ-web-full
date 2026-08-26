"use server";

import { getClerkClient } from "@exporthq/auth";
import { organizationProfileSchema } from "@exporthq/validation";
import { getWorkspaceSession } from "../_lib/session";

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

  const client = getClerkClient();
  const organization = await client.organizations.getOrganization({ organizationId: session.organizationId });
  const privateMetadata = organization.privateMetadata as { exportPanel?: Record<string, unknown> };
  const exportPanel = privateMetadata.exportPanel ?? {};
  const existingCompany = typeof exportPanel.company === "object" && exportPanel.company ? exportPanel.company as Record<string, unknown> : {};
  const existingProduct = typeof exportPanel.firstProduct === "object" && exportPanel.firstProduct ? exportPanel.firstProduct as Record<string, unknown> : {};
  const { organization: profile, primaryOffer, marketStrategy } = parsed.data;

  await client.organizations.updateOrganization(session.organizationId, { name: profile.tradingName });
  await client.organizations.updateOrganizationMetadata(session.organizationId, {
    privateMetadata: {
      ...privateMetadata,
      exportPanel: {
        ...exportPanel,
        profileSettings: profile,
        company: {
          ...existingCompany,
          legalName: profile.legalName,
          tradingName: profile.tradingName,
          originCountry: countryCodes[profile.country],
          website: profile.website
        },
        firstProduct: {
          ...existingProduct,
          name: primaryOffer.name,
          category: primaryOffer.category,
          sku: primaryOffer.internalReference || null,
          hsCode: primaryOffer.hsCode || null,
          composition: primaryOffer.specification,
          targetMarketCode: marketStrategy.primaryMarket || null,
          profileDetailsComplete: Boolean(primaryOffer.hsCode && primaryOffer.specification)
        },
        marketStrategy,
        stage: marketStrategy.currentExportStage || null,
        salesChannel: marketStrategy.primarySalesChannel || null,
        profileUpdatedAt: new Date().toISOString(),
        profileUpdatedBy: session.userId
      }
    }
  });
  return { ok: true, message: "Organization, offer, and market direction saved." };
}
