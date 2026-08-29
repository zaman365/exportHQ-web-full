import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { TenantSurfacePending } from "../_components/tenant-surface-pending";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getProgressiveWorkspaceFeatureSession } from "../_lib/session";

export const metadata: Metadata = {
  title: "Ideas — Export HQ",
  description: "Capture, triage, and promote ExportPanel opportunities."
};

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const session = await getProgressiveWorkspaceFeatureSession("ideas");
  const principal = session.principal;
  const fullAccess = session.features.includes("ideas");
  if (fullAccess && principal) authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = Boolean(fullAccess && principal && canAccessOrganization(principal, principal.organizationId, "tasks:manage"));
  if (session.userId && !session.isDemo) return <WorkspaceShell active="ideas" session={session}><TenantSurfacePending phase="Planned" title="Tenant idea capture is not active" description="Ideas remain outside the trusted R1 slice until they have a tenant repository and a controlled promotion path into opportunities or tasks." /></WorkspaceShell>;
  const { default: IdeasClient } = await import("./ideas-client");
  return <WorkspaceShell active="ideas" session={session}><IdeasClient canManage={canManage} /></WorkspaceShell>;
}
