import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { TenantSurfacePending } from "../_components/tenant-surface-pending";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getProgressiveWorkspaceFeatureSession } from "../_lib/session";

export const metadata: Metadata = {
  title: "Create — Export HQ",
  description: "Create the right ExportPanel workflow record from one place."
};

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const session = await getProgressiveWorkspaceFeatureSession("create");
  const principal = session.principal;
  const fullAccess = session.features.includes("create");
  if (fullAccess && principal) authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = Boolean(fullAccess && principal && canAccessOrganization(principal, principal.organizationId, "tasks:manage"));
  if (session.userId && !session.isDemo) return <WorkspaceShell active="create" session={session}><TenantSurfacePending phase="R1 migration" title="Use the authoritative profile, lane and readiness flows" description="The broad create palette remains preview-only until each target record has a tenant command, validation, audit and rollback path." /></WorkspaceShell>;
  const { default: CreateClient } = await import("./create-client");
  return <WorkspaceShell active="create" session={session}><CreateClient canManage={canManage} /></WorkspaceShell>;
}
