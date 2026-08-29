import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { TenantSurfacePending } from "../_components/tenant-surface-pending";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getWorkspaceFeatureSession } from "../_lib/session";

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
  if (session.userId && !session.isDemo) return <WorkspaceShell active="buyers" session={session}><TenantSurfacePending phase="R3" title="Buyer records are not active" description="The buyer pipeline remains hidden until source rights, provenance, correction, opt-out and lane-scoped outreach controls are implemented." /></WorkspaceShell>;
  const [{ default: BuyersClient }, { illustrativeBuyerPipeline }] = await Promise.all([
    import("./buyers-client"),
    import("./buyers-data")
  ]);
  return <WorkspaceShell active="buyers" session={session}><BuyersClient canManage={canManage} initialBuyers={illustrativeBuyerPipeline} /></WorkspaceShell>;
}
