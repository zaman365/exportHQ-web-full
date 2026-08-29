import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { TenantSurfacePending } from "../_components/tenant-surface-pending";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getProgressiveWorkspaceFeatureSession } from "../_lib/session";

export const metadata: Metadata = {
  title: "Decisions — Export HQ",
  description: "An explainable decision register for ExportPanel work."
};

export const dynamic = "force-dynamic";

export default async function DecisionsPage() {
  const session = await getProgressiveWorkspaceFeatureSession("decisions");
  const principal = session.principal;
  const fullAccess = session.features.includes("decisions");
  if (fullAccess && principal) authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = Boolean(fullAccess && principal && canAccessOrganization(principal, principal.organizationId, "tasks:manage"));
  if (session.userId && !session.isDemo) return <WorkspaceShell active="decisions" session={session}><TenantSurfacePending phase="R1 migration" title="Lane decisions are stored with their lane" description="A consolidated tenant decision register remains hidden until its read model covers lane, verification, evidence and approval records without synthetic entries." /></WorkspaceShell>;
  const { default: DecisionsClient } = await import("./decisions-client");
  return <WorkspaceShell active="decisions" session={session}><DecisionsClient canManage={canManage} /></WorkspaceShell>;
}
