import type { Metadata } from "next";
import { getClerkClient } from "@exporthq/auth";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { subscriptionCatalog } from "@exporthq/authorization";
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

export const metadata: Metadata = {
  title: "Settings — Export HQ",
  description: "Manage your Export HQ workspace settings."
};

export const dynamic = "force-dynamic";

const countryNames: Record<string, string> = { BD: "Bangladesh", DE: "Germany", IN: "India", NL: "Netherlands", GB: "United Kingdom" };

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

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
    const client = getClerkClient();
    const organization = await client.organizations.getOrganization({ organizationId: session.organizationId });
    const metadata = organization.privateMetadata as { exportPanel?: { profileSettings?: Record<string, unknown>; company?: Record<string, unknown>; firstProduct?: Record<string, unknown>; marketStrategy?: Record<string, unknown>; stage?: unknown; salesChannel?: unknown } };
    const exportPanel = metadata.exportPanel ?? {};
    const saved = exportPanel.profileSettings ?? {};
    const company = exportPanel.company ?? {};
    const product = exportPanel.firstProduct ?? {};
    const marketStrategy = exportPanel.marketStrategy ?? {};
    const fallbackName = session.organizationName ?? "Your business";
    const fallbackEmail = session.userEmail ?? "";
    initialOrganization = {
      legalName: text(saved.legalName) ?? text(company.legalName) ?? fallbackName,
      tradingName: text(saved.tradingName) ?? text(company.tradingName) ?? fallbackName,
      website: text(saved.website) ?? text(company.website) ?? "",
      country: text(saved.country) ?? countryNames[text(company.originCountry) ?? ""] ?? "Bangladesh",
      timezone: text(saved.timezone) ?? "Asia/Dhaka",
      defaultCurrency: text(saved.defaultCurrency) ?? "USD",
      supportEmail: text(saved.supportEmail) ?? fallbackEmail
    };
    initialPrimaryOffer = {
      name: text(product.name) ?? "",
      category: text(product.category) ?? "Other",
      internalReference: text(product.sku) ?? "",
      hsCode: text(product.hsCode) ?? "",
      specification: text(product.composition) ?? text(product.description) ?? ""
    };
    initialMarketStrategy = {
      primaryMarket: choice(marketStrategy.primaryMarket, marketCodes) ?? choice(product.targetMarketCode, marketCodes) ?? "",
      secondaryMarkets: choices(marketStrategy.secondaryMarkets, marketCodes),
      primarySalesChannel: choice(marketStrategy.primarySalesChannel, salesChannelCodes) ?? choice(exportPanel.salesChannel, salesChannelCodes) ?? "",
      secondarySalesChannels: choices(marketStrategy.secondarySalesChannels, salesChannelCodes),
      currentExportStage: choice(marketStrategy.currentExportStage, exportStageCodes) ?? choice(exportPanel.stage, exportStageCodes) ?? ""
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
      initialOrganization={initialOrganization}
      initialPrimaryOffer={initialPrimaryOffer}
      initialMarketStrategy={initialMarketStrategy}
    />
  );
}
