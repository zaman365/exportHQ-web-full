import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { listBuyerPipeline, readPilotParticipation } from "@exporthq/db";
import { TenantSurfacePending } from "../_components/tenant-surface-pending";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getWorkspaceFeatureSession } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";
import { TenantBuyers } from "./tenant-buyers";

export const metadata: Metadata = {
  title: "Buyers — Export HQ",
  description: "Qualify buyers, control outreach, and connect each commercial relationship to an Export Lane."
};

export const dynamic = "force-dynamic";

export default async function BuyersPage() {
  const session = await getWorkspaceFeatureSession("buyers");
  const principal = session.principal;
  if (principal) authorizeOrganization(principal, principal.organizationId, "company:view");
  const canManage = Boolean(principal && canAccessOrganization(principal, principal.organizationId, "company:manage"));
  if (session.userId && !session.isDemo) {
    const result = await runTenantCommand(session, async (tx, context) => ({
      participation: await readPilotParticipation(tx, context),
      buyers: await listBuyerPipeline(tx, context)
    }));
    if (!result.ran) return <WorkspaceShell active="buyers" session={session}><TenantSurfacePending phase="R3" title="Buyer storage is unavailable" description="The buyer register fails closed until tenant PostgreSQL persistence is active." /></WorkspaceShell>;
    if (result.value.participation?.status !== "active") return <WorkspaceShell active="buyers" session={session}><TenantSurfacePending phase="R3 Private Beta" title="Private Beta enrollment required" description="Real buyer and shipment work is limited to an accepted, operations-activated cohort with named support ownership." /></WorkspaceShell>;
    return <WorkspaceShell active="buyers" session={session}><TenantBuyers buyers={result.value.buyers} /></WorkspaceShell>;
  }
  const [{ default: BuyersClient }, { illustrativeBuyerPipeline }] = await Promise.all([
    import("./buyers-client"),
    import("./buyers-data")
  ]);
  return <WorkspaceShell active="buyers" session={session}><BuyersClient canManage={canManage} initialBuyers={illustrativeBuyerPipeline} /></WorkspaceShell>;
}
