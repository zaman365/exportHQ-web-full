import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { demoSnapshot } from "@exporthq/domain";
import { WorkspaceShell } from "../_components/workspace-shell";
import WaitingClient from "./waiting-client";
import { requireWorkspaceFeature } from "../_lib/session";

export const metadata: Metadata = {
  title: "Waiting — Export HQ",
  description: "An ownership-first queue for ExportPanel handoffs, blockers, and follow-ups."
};

export const dynamic = "force-dynamic";

export default async function WaitingPage() {
  const session = await requireWorkspaceFeature("waiting");
  const principal = session.principal;
  authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = canAccessOrganization(principal, principal.organizationId, "tasks:manage");
  return <WorkspaceShell active="waiting" session={session}><WaitingClient initialTasks={[...demoSnapshot.tasks]} canManage={canManage} /></WorkspaceShell>;
}
