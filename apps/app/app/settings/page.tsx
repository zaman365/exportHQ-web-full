import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { subscriptionCatalog } from "@exporthq/authorization";
import { readCompanyProfile, readPrimaryProduct } from "@exporthq/db";
import SettingsClient from "./settings-client";
import type {
  ExportStageCode,
  MarketStrategySettings,
  OrganizationSettings,
  PrimaryOfferSettings,
  SalesChannelCode,
  TargetMarketCode
} from "./settings-data";
import { requireWorkspaceFeature } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";

export const metadata: Metadata = {
  title: "Settings — Export HQ",
  description: "Manage your Export HQ workspace settings."
};

export const dynamic = "force-dynamic";

const countryNames: Record<string, string> = { BD: "Bangladesh", DE: "Germany", IN: "India", NL: "Netherlands", GB: "United Kingdom" };

const marketCodes = new Set<TargetMarketCode>(["DE", "NL", "GB", "JP", "SA", "AE"]);
const salesChannelCodes = new Set<SalesChannelCode>(["wholesale", "retail", "marketplace", "services"]);
const exportStageCodes = new Set<ExportStageCode>(["exploring", "preparing", "exporting", "scaling"]);

function choice<T extends string>(value: unknown, allowed: ReadonlySet<T>): T | undefined {
  return typeof value === "string" && allowed.has(value as T) ? value as T : undefined;
}

function choices<T extends string>(value: unknown, allowed: ReadonlySet<T>): T[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry): entry is T => typeof entry === "string" && allowed.has(entry as T)) as T[])];
}

export default async function SettingsPage() {
  const session = await requireWorkspaceFeature("home");
  const principal = session.principal;
  authorizeOrganization(principal, principal.organizationId, "company:view");

  const canManageOrganization = canAccessOrganization(
    principal,
    principal.organizationId,
    "company:manage"
  );
  const canManageTeam = canAccessOrganization(
    principal,
    principal.organizationId,
    "team:manage"
  );
  let initialOrganization: Partial<OrganizationSettings> = {
    tradingName: session.organizationName ?? "Your business",
    legalName: session.organizationName ?? "Your business",
    supportEmail: session.userEmail ?? ""
  };
  let initialPrimaryOffer: Partial<PrimaryOfferSettings> = {};
  let initialMarketStrategy: Partial<MarketStrategySettings> = {};
  if (!session.isDemo && session.organizationId) {
    const persisted = await runTenantCommand(session, async (tx, context) => ({
      profile: await readCompanyProfile(tx, context),
      product: await readPrimaryProduct(tx, context)
    }));
    const profile = persisted.ran ? persisted.value.profile : null;
    const product = persisted.ran ? persisted.value.product : null;
    const marketStrategy = profile?.marketStrategy ?? {};
    const fallbackName = session.organizationName ?? "Your business";
    const fallbackEmail = session.userEmail ?? "";
    initialOrganization = {
      legalName: profile?.legalName ?? fallbackName,
      tradingName: profile?.tradingName ?? fallbackName,
      website: profile?.website ?? "",
      country: countryNames[profile?.originCountryCode ?? ""] ?? "Bangladesh",
      timezone: profile?.defaultTimezone ?? "Asia/Dhaka",
      language: profile?.defaultLocale ?? "bn",
      defaultCurrency: profile?.defaultCurrency ?? "BDT",
      supportEmail: profile?.supportEmail ?? fallbackEmail
    };
    initialPrimaryOffer = {
      ...(product ? { id: product.id } : {}),
      name: product?.name ?? "",
      category: product?.category ?? "Other",
      internalReference: product?.sku.startsWith("EXPORTHQ-PRIMARY-") ? "" : product?.sku ?? "",
      hsCode: product?.hsCode ?? "",
      specification: product?.composition ?? ""
    };
    initialMarketStrategy = {
      primaryMarket: choice(marketStrategy.primaryMarket, marketCodes) ?? "",
      secondaryMarkets: choices(marketStrategy.secondaryMarkets, marketCodes),
      primarySalesChannel: choice(marketStrategy.primarySalesChannel, salesChannelCodes) ?? choice(profile?.primarySalesChannel, salesChannelCodes) ?? "",
      secondarySalesChannels: choices(marketStrategy.secondarySalesChannels, salesChannelCodes),
      currentExportStage: choice(marketStrategy.currentExportStage, exportStageCodes) ?? choice(profile?.exportStage, exportStageCodes) ?? ""
    };
  }

  return (
    <SettingsClient
      canManageOrganization={canManageOrganization}
      canManageTeam={canManageTeam}
      features={session.features}
      authEnabled={!session.isDemo}
      userName={session.userName ?? "ExportPanel member"}
      organizationName={session.organizationName ?? "Your business"}
      tierName={subscriptionCatalog[session.tier].name}
      businessVerification={session.businessVerification}
      authoritativeTenantMode={!session.isDemo}
      initialOrganization={initialOrganization}
      initialPrimaryOffer={initialPrimaryOffer}
      initialMarketStrategy={initialMarketStrategy}
    />
  );
}
