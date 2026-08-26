import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import BlueprintsClient from "./blueprints-client";
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
  return <WorkspaceShell active="blueprints" session={session}><BlueprintsClient canManage={canManage} /></WorkspaceShell>;
}
