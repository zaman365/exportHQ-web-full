import type { Metadata } from "next";
import { resolveTrustGatedAccess, subscriptionCatalog } from "@exporthq/authorization";
import { operatingSystemView } from "@exporthq/domain";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getWorkspaceFeatureSession } from "../_lib/session";
import ExportStudioClient from "./studio-client";

export const metadata: Metadata = {
  title: "Export Studio — ExportPanel",
  description: "Connect one export opportunity to readiness, economics, buyers, providers, shipment, finance and payment."
};

export const dynamic = "force-dynamic";

export default async function ExportStudioPage({ searchParams }: { searchParams: Promise<{ access?: string }> }) {
  const params = await searchParams;
  const session = await getWorkspaceFeatureSession("export-studio", {
    allowPublicPreview: true,
    forcePublicPreview: params.access === "public"
  });
  const access = resolveTrustGatedAccess({
    authenticated: Boolean(session.userId),
    businessVerification: session.businessVerification,
    tier: session.tier
  });

  return (
    <WorkspaceShell active="studio" session={session}>
      <ExportStudioClient
        tierName={subscriptionCatalog[session.tier].name}
        verification={session.businessVerification}
        view={operatingSystemView(access)}
      />
    </WorkspaceShell>
  );
}
