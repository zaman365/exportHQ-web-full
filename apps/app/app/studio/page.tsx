import type { Metadata } from "next";
import { resolveTrustGatedAccess, subscriptionCatalog } from "@exporthq/authorization";
import { operatingSystemView } from "@exporthq/domain";
import { WorkspaceShell } from "../_components/workspace-shell";
import { requireWorkspaceFeature } from "../_lib/session";
import ExportStudioClient from "./studio-client";

export const metadata: Metadata = {
  title: "Export Studio — ExportPanel",
  description: "Connect one export opportunity to readiness, economics, buyers, providers, shipment, finance and payment."
};

export const dynamic = "force-dynamic";

export default async function ExportStudioPage() {
  const session = await requireWorkspaceFeature("export-studio");
  const access = resolveTrustGatedAccess({
    authenticated: true,
    businessVerification: session.businessVerification,
    tier: session.tier
  });

  return (
    <WorkspaceShell active="studio" session={session}>
      <ExportStudioClient
        tierName={subscriptionCatalog[session.tier].name}
        verification={session.businessVerification}
        view={operatingSystemView(access === "full" ? "full" : "member")}
      />
    </WorkspaceShell>
  );
}
