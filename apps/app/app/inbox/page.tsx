import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import InboxClient from "./inbox-client";
import { getProgressiveWorkspaceFeatureSession } from "../_lib/session";

export const metadata: Metadata = {
  title: "Inbox — Export HQ",
  description: "Capture thoughts and triage actionable ExportPanel requests."
};

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const session = await getProgressiveWorkspaceFeatureSession("inbox");
  const principal = session.principal;
  const fullAccess = session.features.includes("inbox");
  if (fullAccess && principal) authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = Boolean(fullAccess && principal && canAccessOrganization(principal, principal.organizationId, "tasks:manage"));
  return <WorkspaceShell active="inbox" session={session}><InboxClient canManage={canManage} /></WorkspaceShell>;
}
