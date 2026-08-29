import type { Metadata } from "next";
import type { CustomerSession } from "@exporthq/auth";
import {
  featuresForTier,
  permissionsForTier,
  resolveReadinessAccess,
  subscriptionCatalog
} from "@exporthq/authorization";
import {
  readinessProviderCatalog,
  readinessRequirementViews,
  type ReadinessBusinessModel,
  type ReadinessProductCategory,
  type ReadinessProfile
} from "@exporthq/domain";
import {
  listReadinessLaneOptions,
  readLatestReadinessAssessment,
  type ReadinessAssessmentRecord,
  type ReadinessLaneOption
} from "@exporthq/db";
import type { ReadinessProgressInput } from "@exporthq/validation";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getWorkspaceFeatureSession } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";
import ReadinessClient from "./readiness-client";

export const metadata: Metadata = {
  title: "Export readiness — ExportPanel",
  description: "A Bangladesh-specific, product-and-market export readiness assessment with evidence, blockers and resolution paths."
};

export const dynamic = "force-dynamic";

type Query = {
  access?: string;
  business?: string;
  businessModel?: string;
  productCategory?: string;
  productName?: string;
  hsCode?: string;
  market?: string;
  salesChannel?: string;
  lane?: string;
};

const businessModels: readonly ReadinessBusinessModel[] = ["manufacturer", "trader", "service"];
const productCategories: readonly ReadinessProductCategory[] = ["apparel", "leather", "jute", "food", "engineering", "software", "other"];
const marketCodes: readonly ReadinessProfile["targetMarketCode"][] = ["DE", "NL", "GB", "JP", "SA", "AE"];
const salesChannels: readonly ReadinessProfile["salesChannel"][] = ["wholesale", "retail", "marketplace", "services"];

function includes<T extends string>(values: readonly T[], value: string | undefined): value is T {
  return Boolean(value && values.includes(value as T));
}

function profileFromQuery(query: Query, saved?: Pick<ReadinessProgressInput, "profile">): ReadinessProfile {
  const baseline: ReadinessProfile = saved?.profile ?? {
    businessModel: "manufacturer",
    productCategory: "apparel",
    productName: "Cotton apparel",
    hsCode: "",
    targetMarketCode: "DE",
    salesChannel: "wholesale"
  };
  return {
    businessModel: includes(businessModels, query.businessModel) ? query.businessModel : baseline.businessModel,
    productCategory: includes(productCategories, query.productCategory) ? query.productCategory : baseline.productCategory,
    productName: query.productName?.trim().slice(0, 180) || baseline.productName,
    hsCode: query.hsCode?.trim().slice(0, 16) || baseline.hsCode,
    targetMarketCode: includes(marketCodes, query.market) ? query.market : baseline.targetMarketCode,
    salesChannel: includes(salesChannels, query.salesChannel) ? query.salesChannel : baseline.salesChannel
  };
}

async function loadTenantWorkspace(
  session: CustomerSession,
  requestedLaneId: string | undefined
): Promise<{ saved?: ReadinessAssessmentRecord; lanes: readonly ReadinessLaneOption[]; selectedLaneId?: string }> {
  if (!session.organizationId || session.isDemo) return { lanes: [] };
  const persisted = await runTenantCommand(session, async (tx, context) => {
    const lanes = await listReadinessLaneOptions(tx, context);
    const requested = requestedLaneId && lanes.some((lane) => lane.id === requestedLaneId) ? requestedLaneId : undefined;
    const saved = await readLatestReadinessAssessment(tx, context, requested);
    const selectedLaneId = saved?.exportLaneId ?? requested ?? lanes[0]?.id;
    return {
      ...(saved ? { saved } : {}),
      lanes,
      ...(selectedLaneId ? { selectedLaneId } : {})
    };
  });
  return persisted.ran ? persisted.value : { lanes: [] };
}

export default async function ReadinessPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const returnQuery = new URLSearchParams(Object.entries(query).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const returnTo = returnQuery.size ? `/readiness?${returnQuery.toString()}` : "/readiness";
  const baseSession = await getWorkspaceFeatureSession("readiness", {
    allowPublicPreview: true,
    forcePublicPreview: query.access === "public",
    signedOutRedirectTo: returnTo
  });
  const basicBusiness = baseSession.isDemo && baseSession.principal && query.access === "basic"
    ? query.business?.slice(0, 100) || "New business"
    : undefined;
  const session = basicBusiness ? {
    ...baseSession,
    organizationName: basicBusiness,
    tier: "explore" as const,
    businessVerification: "unverified" as const,
    isPlatformAdmin: false,
    features: featuresForTier("explore"),
    principal: baseSession.principal
      ? { ...baseSession.principal, permissions: permissionsForTier("explore") }
      : null
  } : baseSession;
  const access = resolveReadinessAccess({
    authenticated: Boolean(session.userId),
    businessVerification: session.businessVerification,
    tier: session.tier
  });
  const tenantWorkspace = session.userId ? await loadTenantWorkspace(session, query.lane) : { lanes: [] };
  const selectedLane = tenantWorkspace.lanes.find((lane) => lane.id === tenantWorkspace.selectedLaneId);
  const laneBaseline = selectedLane && includes(marketCodes, selectedLane.destinationCountryCode)
    && includes(salesChannels, selectedLane.salesChannel)
    ? {
        version: 1 as const,
        currentSection: "business" as const,
        profile: {
          businessModel: "manufacturer" as const,
          productCategory: includes(productCategories, selectedLane.productCategory.toLowerCase())
            ? selectedLane.productCategory.toLowerCase() as ReadinessProductCategory
            : "other" as const,
          productName: selectedLane.productName,
          hsCode: selectedLane.hsCode,
          targetMarketCode: selectedLane.destinationCountryCode,
          salesChannel: selectedLane.salesChannel
        },
        responses: {},
        notes: {},
        evidence: []
      } satisfies ReadinessProgressInput
    : undefined;
  const saved = tenantWorkspace.saved;
  const profile = profileFromQuery(query, saved ?? laneBaseline);
  const requirements = readinessRequirementViews(access, profile);
  const providerCatalog = access === "full" ? readinessProviderCatalog : {};

  return (
    <WorkspaceShell active="readiness" session={session}>
      <ReadinessClient
        access={access}
        businessName={session.organizationName ?? `${profile.productName} export preview`}
        initialProgress={saved}
        laneOptions={tenantWorkspace.lanes}
        persistenceMode={session.isDemo || !session.userId ? "preview" : "tenant"}
        profile={profile}
        providerCatalog={providerCatalog}
        requirements={requirements}
        tierName={subscriptionCatalog[session.tier].name}
        verification={session.businessVerification}
        selectedLaneId={tenantWorkspace.selectedLaneId}
      />
    </WorkspaceShell>
  );
}
