import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { TenantSurfacePending } from "../_components/tenant-surface-pending";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getProgressiveWorkspaceFeatureSession } from "../_lib/session";

export const metadata: Metadata = {
  title: "Team — Export HQ",
  description: "Ownership, capacity, specialists, and partners in ExportPanel."
};

export const dynamic = "force-dynamic";

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const params = await searchParams;
  const session = await getProgressiveWorkspaceFeatureSession("team");
  const principal = session.principal;
  const fullAccess = session.features.includes("team");
  if (fullAccess && principal) authorizeOrganization(principal, principal.organizationId, "team:view");
  const canMessage = Boolean(fullAccess && principal && canAccessOrganization(principal, principal.organizationId, "team:message"));
  const canManageAccess = Boolean(fullAccess && principal && canAccessOrganization(principal, principal.organizationId, "team:manage"));
  if (session.userId && !session.isDemo) return <WorkspaceShell active="team" session={session}><TenantSurfacePending phase="R1 migration" title="Tenant collaboration projection is not active" description="Clerk membership projection exists, but team directories, conversations and messages remain hidden until their scoped read models and actions replace preview records." /></WorkspaceShell>;
  const { default: TeamClient } = await import("./team-client");
  const initialView = params.view === "directory" || params.view === "teams" ? params.view : "messages";
  return <WorkspaceShell active="team" session={session}><TeamClient canManageAccess={canManageAccess} canMessage={canMessage} initialView={initialView} /></WorkspaceShell>;
}
