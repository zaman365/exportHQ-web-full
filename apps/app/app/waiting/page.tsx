import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { readWorkspaceDashboard } from "@exporthq/db";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getProgressiveWorkspaceFeatureSession } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";
import { TenantWaiting, TenantWaitingUnavailable } from "./tenant-waiting";

export const metadata: Metadata = {
  title: "Waiting — Export HQ",
  description: "An ownership-first queue for ExportPanel handoffs, blockers, and follow-ups."
};

export const dynamic = "force-dynamic";

export default async function WaitingPage() {
  const session = await getProgressiveWorkspaceFeatureSession("waiting");
  const principal = session.principal;
  const fullAccess = session.features.includes("waiting");
  if (fullAccess && principal) authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = Boolean(fullAccess && principal && canAccessOrganization(principal, principal.organizationId, "tasks:manage"));
  if (session.userId && !session.isDemo) {
    const persisted = await runTenantCommand(session, (tx, context) => readWorkspaceDashboard(tx, context, { taskLimit: 100 }));
    return <WorkspaceShell active="waiting" session={session}>{persisted.ran
      ? <TenantWaiting tasks={persisted.value.tasks} canManage={canManage} />
      : <TenantWaitingUnavailable />}</WorkspaceShell>;
  }
  const { PreviewWaiting } = await import("./preview-waiting");
  return <WorkspaceShell active="waiting" session={session}><PreviewWaiting canManage={canManage} /></WorkspaceShell>;
}
