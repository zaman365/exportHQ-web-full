"use server";

import { redirect } from "next/navigation";
import { getClerkClient } from "@exporthq/auth";
import { companyOnboardingSchema, productSchema } from "@exporthq/validation";
import { getWorkspaceSession } from "../_lib/session";

export type OnboardingActionState = { error?: string };

export async function completeOnboarding(
  _state: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const session = await getWorkspaceSession();
  if (!session.userId || !session.organizationId) return { error: "Create or select an organization before completing onboarding." };
  const role = session.organizationRole?.replace(/^org:/, "");
  if (role !== "admin" && role !== "owner") return { error: "An organization owner or admin must complete onboarding." };

  const company = companyOnboardingSchema.safeParse({
    legalName: formData.get("legalName"), tradingName: formData.get("tradingName"), originCountry: formData.get("originCountry"), industry: formData.get("industry"), website: formData.get("website")
  });
  const price = Number(formData.get("fobPrice"));
  const product = productSchema.safeParse({
    name: formData.get("productName"), sku: formData.get("sku"), category: formData.get("category"), composition: formData.get("composition"), hsCode: formData.get("hsCode"), targetMarketCode: formData.get("targetMarketCode"), currency: formData.get("currency"), fobPriceMinor: Number.isFinite(price) ? Math.round(price * 100) : Number.NaN
  });
  if (!company.success || !product.success) return { error: "Review the company, product, and market fields. Every required value must be valid before TREVV can create the workspace." };

  const stage = String(formData.get("stage") ?? "").trim();
  const salesChannel = String(formData.get("salesChannel") ?? "").trim();
  if (!stage || !salesChannel) return { error: "Choose your export stage and intended sales channel." };

  if (session.isDemo) {
    const businessName = String(formData.get("demoBusinessName") ?? company.data.tradingName).slice(0, 100);
    redirect(`/?onboarding=complete&access=basic&business=${encodeURIComponent(businessName)}`);
  }

  const client = getClerkClient();
  const organization = await client.organizations.getOrganization({ organizationId: session.organizationId });
  const currentPublic = organization.publicMetadata as { trevv?: Record<string, unknown> };
  const currentPrivate = organization.privateMetadata as { trevv?: Record<string, unknown> };
  await client.organizations.updateOrganization(session.organizationId, { name: company.data.tradingName });
  await client.organizations.updateOrganizationMetadata(session.organizationId, {
    publicMetadata: { ...currentPublic, trevv: { ...(currentPublic.trevv ?? {}), onboardingComplete: true, onboardingVersion: 1, originCountry: company.data.originCountry, industry: company.data.industry, targetMarketCode: product.data.targetMarketCode } },
    privateMetadata: { ...currentPrivate, trevv: { ...(currentPrivate.trevv ?? {}), company: company.data, firstProduct: product.data, stage, salesChannel, completedBy: session.userId, completedAt: new Date().toISOString() } }
  });
  redirect("/plans?onboarding=complete");
}
