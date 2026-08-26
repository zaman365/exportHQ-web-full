"use server";

import { redirect } from "next/navigation";
import { getClerkClient } from "@exporthq/auth";
import { companyOnboardingSchema, productSchema } from "@exporthq/validation";
import { getWorkspaceSession } from "../_lib/session";

export type OnboardingField =
  | "legalName" | "tradingName" | "originCountry" | "industry" | "website"
  | "productName" | "sku" | "category" | "hsCode" | "composition"
  | "targetMarketCode" | "salesChannel" | "fobPrice" | "currency" | "stage";

export type OnboardingActionState = {
  error?: string;
  fieldErrors?: Partial<Record<OnboardingField, string>>;
  step?: 0 | 1 | 2;
};

const fieldMessages: Record<OnboardingField, string> = {
  legalName: "Enter the registered legal name (at least 2 characters).",
  tradingName: "Enter the customer-facing name, or repeat the legal name.",
  originCountry: "Select the country where the business is registered.",
  industry: "Select the sector that best describes the business.",
  website: "Use a complete website address beginning with https://, or leave it blank.",
  productName: "Name the product or service you want to export first.",
  sku: "Add a short internal product or service reference.",
  category: "Select the closest product category.",
  hsCode: "Use 4 digits or a detailed HS code such as 6205.20.",
  composition: "Describe the material, specification, or service deliverable.",
  targetMarketCode: "Choose the first market ExportPanel should assess.",
  salesChannel: "Choose how the offer will reach buyers.",
  fobPrice: "Enter an indicative export price greater than 0.",
  currency: "Select the currency used for the indicative price.",
  stage: "Select the business's current export stage."
};

function validationStep(errors: Partial<Record<OnboardingField, string>>): 0 | 1 | 2 {
  if (["legalName", "tradingName", "originCountry", "industry", "website"].some((field) => errors[field as OnboardingField])) return 0;
  if (["productName", "sku", "category", "hsCode", "composition"].some((field) => errors[field as OnboardingField])) return 1;
  return 2;
}

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
  const priceText = String(formData.get("fobPrice") ?? "").trim();
  const price = priceText ? Number(priceText) : Number.NaN;
  const product = productSchema.safeParse({
    name: formData.get("productName"), sku: formData.get("sku"), category: formData.get("category"), composition: formData.get("composition"), hsCode: formData.get("hsCode"), targetMarketCode: formData.get("targetMarketCode"), currency: formData.get("currency"), fobPriceMinor: Number.isFinite(price) ? Math.round(price * 100) : Number.NaN
  });
  const stage = String(formData.get("stage") ?? "").trim();
  const salesChannel = String(formData.get("salesChannel") ?? "").trim();
  const targetMarketCode = String(formData.get("targetMarketCode") ?? "").trim();
  const currency = String(formData.get("currency") ?? "").trim();
  const fieldErrors: Partial<Record<OnboardingField, string>> = {};
  if (!company.success) {
    for (const issue of company.error.issues) {
      const field = String(issue.path[0]) as OnboardingField;
      if (field in fieldMessages) fieldErrors[field] ??= fieldMessages[field];
    }
  }
  if (!product.success) {
    for (const issue of product.error.issues) {
      const schemaField = String(issue.path[0]);
      const field = (schemaField === "name" ? "productName" : schemaField === "fobPriceMinor" ? "fobPrice" : schemaField) as OnboardingField;
      if (field in fieldMessages) fieldErrors[field] ??= fieldMessages[field];
    }
  }
  if (!priceText || !Number.isFinite(price) || price <= 0) fieldErrors.fobPrice = fieldMessages.fobPrice;
  if (!new Set(["exploring", "preparing", "exporting", "scaling"]).has(stage)) fieldErrors.stage = fieldMessages.stage;
  if (!new Set(["wholesale", "retail", "marketplace", "services"]).has(salesChannel)) fieldErrors.salesChannel = fieldMessages.salesChannel;
  if (!new Set(["DE", "NL", "GB", "JP", "SA", "AE"]).has(targetMarketCode)) fieldErrors.targetMarketCode = fieldMessages.targetMarketCode;
  if (!new Set(["USD", "EUR", "GBP", "JPY", "SAR", "AED", "BDT"]).has(currency)) fieldErrors.currency = fieldMessages.currency;
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, step: validationStep(fieldErrors) };
  if (!company.success || !product.success) return { fieldErrors, step: validationStep(fieldErrors) };

  if (session.isDemo) {
    const businessName = String(formData.get("demoBusinessName") ?? company.data.tradingName).slice(0, 100);
    redirect(`/readiness?access=basic&business=${encodeURIComponent(businessName)}&productName=${encodeURIComponent(product.data.name)}&market=${encodeURIComponent(product.data.targetMarketCode)}`);
  }

  const client = getClerkClient();
  const organization = await client.organizations.getOrganization({ organizationId: session.organizationId });
  const currentPublic = organization.publicMetadata as { exportPanel?: Record<string, unknown> };
  const currentPrivate = organization.privateMetadata as { exportPanel?: Record<string, unknown> };
  await client.organizations.updateOrganization(session.organizationId, { name: company.data.tradingName });
  await client.organizations.updateOrganizationMetadata(session.organizationId, {
    publicMetadata: { ...currentPublic, exportPanel: { ...(currentPublic.exportPanel ?? {}), onboardingComplete: true, onboardingVersion: 1, originCountry: company.data.originCountry, industry: company.data.industry, targetMarketCode: product.data.targetMarketCode } },
    privateMetadata: { ...currentPrivate, exportPanel: { ...(currentPrivate.exportPanel ?? {}), company: company.data, firstProduct: product.data, stage, salesChannel, completedBy: session.userId, completedAt: new Date().toISOString() } }
  });
  redirect("/readiness?onboarding=complete");
}
