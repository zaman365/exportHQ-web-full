import type { Metadata } from "next";
import { resolveTrustGatedAccess, subscriptionCatalog } from "@exporthq/authorization";
import { readTenantExportLane } from "@exporthq/db";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getWorkspaceFeatureSession } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";
import { TenantExportStudio, TenantExportStudioEmpty } from "./tenant-studio";

export const metadata: Metadata = {
  title: "Export Studio — ExportPanel",
  description: "Connect one export opportunity to readiness, economics, buyers, providers, shipment, finance and payment."
};

export const dynamic = "force-dynamic";

export default async function ExportStudioPage({ searchParams }: { searchParams: Promise<{ access?: string; lane?: string }> }) {
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

  if (session.userId && !session.isDemo) {
    const persisted = await runTenantCommand(session, (tx, context) => readTenantExportLane(tx, context, params.lane));
    return <WorkspaceShell active="studio" session={session}>
      {persisted.ran && persisted.value
        ? <TenantExportStudio lane={persisted.value} />
        : <TenantExportStudioEmpty persistenceAvailable={persisted.ran} />}
    </WorkspaceShell>;
  }
  const [{ operatingSystemView }, { default: ExportStudioClient }] = await Promise.all([
    import("@exporthq/domain"),
    import("./studio-client")
  ]);

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
