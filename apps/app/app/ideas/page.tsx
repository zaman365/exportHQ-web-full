import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import IdeasClient from "./ideas-client";
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
  return <WorkspaceShell active="ideas" session={session}><IdeasClient canManage={canManage} /></WorkspaceShell>;
}
