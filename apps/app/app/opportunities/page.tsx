import type { Metadata } from "next";
import {
  featuresForTier,
  permissionsForTier,
  resolveMarketIntelligenceAccess,
  subscriptionCatalog
} from "@exporthq/authorization";
import { TenantSurfacePending } from "../_components/tenant-surface-pending";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getWorkspaceFeatureSession } from "../_lib/session";

export const metadata: Metadata = {
  title: "Market opportunities — ExportPanel",
  description: "Country-by-product export opportunity intelligence with evidence, routes, barriers, and next actions."
};

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage({ searchParams }: { searchParams: Promise<{ view?: string; business?: string; access?: string }> }) {
  const params = await searchParams;
  const baseSession = await getWorkspaceFeatureSession("opportunities", {
    allowPublicPreview: true,
    forcePublicPreview: params.access === "public"
  });
  const demoBasicBusiness = baseSession.isDemo && baseSession.principal && params.access === "basic" ? params.business?.slice(0, 100) || "New business" : undefined;
  const session = demoBasicBusiness ? {
    ...baseSession,
    organizationName: demoBasicBusiness,
    tier: "explore" as const,
    businessVerification: "unverified" as const,
    isPlatformAdmin: false,
    features: featuresForTier("explore"),
    principal: baseSession.principal
      ? { ...baseSession.principal, permissions: permissionsForTier("explore") }
      : null
  } : baseSession;
  const intelligenceAccess = resolveMarketIntelligenceAccess({
    authenticated: Boolean(session.userId),
    businessVerification: session.businessVerification,
    tier: session.tier
  });
  if (session.userId && !session.isDemo) return <WorkspaceShell active={params.view === "countries" ? "markets" : "opportunities"} session={session}><TenantSurfacePending phase="Reviewed catalog pending" title="Tenant market intelligence is not published" description="The versioned catalog tables exist, but no reviewed production starter catalog has been activated for customer decisions." /></WorkspaceShell>;
  const [{ marketOpportunityViews }, { default: OpportunitiesClient }] = await Promise.all([
    import("@exporthq/domain"),
    import("./opportunities-client")
  ]);

  return (
    <WorkspaceShell active={params.view === "countries" ? "markets" : "opportunities"} session={session}>
      <OpportunitiesClient
        access={intelligenceAccess}
        opportunities={marketOpportunityViews(intelligenceAccess)}
        tierName={subscriptionCatalog[session.tier].name}
        verification={session.businessVerification}
      />
    </WorkspaceShell>
  );
}
