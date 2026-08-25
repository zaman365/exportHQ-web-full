import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import InboxClient from "./inbox-client";
import { requireWorkspaceFeature } from "../_lib/session";

export const metadata: Metadata = {
  title: "Inbox — Export HQ",
  description: "Capture thoughts and triage actionable ExportPanel requests."
};

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const session = await requireWorkspaceFeature("inbox");
  const principal = session.principal;
  authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = canAccessOrganization(principal, principal.organizationId, "tasks:manage");
  return <WorkspaceShell active="inbox" session={session}><InboxClient canManage={canManage} /></WorkspaceShell>;
}
