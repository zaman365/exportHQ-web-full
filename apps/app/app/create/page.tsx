import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import CreateClient from "./create-client";
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
  return <WorkspaceShell active="create" session={session}><CreateClient canManage={canManage} /></WorkspaceShell>;
}
