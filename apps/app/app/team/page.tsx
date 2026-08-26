import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import TeamClient from "./team-client";
import { getProgressiveWorkspaceFeatureSession } from "../_lib/session";

export const metadata: Metadata = {
  title: "Team — Export HQ",
  description: "Ownership, capacity, specialists, and partners in ExportPanel."
};

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getProgressiveWorkspaceFeatureSession("team");
  const principal = session.principal;
  const fullAccess = session.features.includes("team");
  if (fullAccess && principal) authorizeOrganization(principal, principal.organizationId, "company:view");
  const canManageAccess = Boolean(fullAccess && principal && canAccessOrganization(principal, principal.organizationId, "team:manage"));
  return <WorkspaceShell active="team" session={session}><TeamClient canManageAccess={canManageAccess} /></WorkspaceShell>;
}
