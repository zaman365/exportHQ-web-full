import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import BlueprintsClient from "./blueprints-client";
import { requireWorkspaceFeature } from "../_lib/session";

export const metadata: Metadata = {
  title: "Blueprints — Export HQ",
  description: "Reusable ExportPanel workflows for repeatable export operations."
};

export const dynamic = "force-dynamic";

export default async function BlueprintsPage() {
  const session = await requireWorkspaceFeature("blueprints");
  const principal = session.principal;
  authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = canAccessOrganization(principal, principal.organizationId, "tasks:manage");
  return <WorkspaceShell active="blueprints" session={session}><BlueprintsClient canManage={canManage} /></WorkspaceShell>;
}
