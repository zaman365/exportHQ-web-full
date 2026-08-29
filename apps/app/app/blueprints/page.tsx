import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { TenantSurfacePending } from "../_components/tenant-surface-pending";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getProgressiveWorkspaceFeatureSession } from "../_lib/session";

export const metadata: Metadata = {
  title: "Blueprints — Export HQ",
  description: "Reusable ExportPanel workflows for repeatable export operations."
};

export const dynamic = "force-dynamic";

export default async function BlueprintsPage() {
  const session = await getProgressiveWorkspaceFeatureSession("blueprints");
  const principal = session.principal;
  const fullAccess = session.features.includes("blueprints");
  if (fullAccess && principal) authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = Boolean(fullAccess && principal && canAccessOrganization(principal, principal.organizationId, "tasks:manage"));
  if (session.userId && !session.isDemo) return <WorkspaceShell active="blueprints" session={session}><TenantSurfacePending phase="Planned" title="Tenant workflow blueprints are not active" description="Reusable runs remain preview-only until blueprint definitions, versions, tasks and run history have tenant repositories." /></WorkspaceShell>;
  const { default: BlueprintsClient } = await import("./blueprints-client");
  return <WorkspaceShell active="blueprints" session={session}><BlueprintsClient canManage={canManage} /></WorkspaceShell>;
}
