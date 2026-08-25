import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import TeamClient from "./team-client";
import { requireWorkspaceFeature } from "../_lib/session";

export const metadata: Metadata = {
  title: "Team — Export HQ",
  description: "Ownership, capacity, specialists, and partners in ExportPanel."
};

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await requireWorkspaceFeature("team");
  const principal = session.principal;
  authorizeOrganization(principal, principal.organizationId, "company:view");
  const canManageAccess = canAccessOrganization(principal, principal.organizationId, "team:manage");
  return <WorkspaceShell active="team" session={session}><TeamClient canManageAccess={canManageAccess} /></WorkspaceShell>;
}
