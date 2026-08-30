import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization, emailAccountLimitForTier } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getProgressiveWorkspaceFeatureSession } from "../_lib/session";

export const metadata: Metadata = {
  title: "Inbox — Export HQ",
  description: "Read business email, capture thoughts, and triage actionable ExportPanel requests."
};

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const session = await getProgressiveWorkspaceFeatureSession("inbox");
  const principal = session.principal;
  const fullAccess = session.features.includes("inbox");
  if (fullAccess && principal) authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = Boolean(fullAccess && principal && canAccessOrganization(principal, principal.organizationId, "tasks:manage"));
  const canSendEmail = Boolean(fullAccess && principal && canAccessOrganization(principal, principal.organizationId, "email:send"));
  const canManageEmail = Boolean(fullAccess && principal && canAccessOrganization(principal, principal.organizationId, "email:manage"));
  const { default: InboxClient } = await import("./inbox-client");
  return <WorkspaceShell active="inbox" session={session}><InboxClient
    canManage={canManage}
    canSendEmail={canSendEmail}
    canManageEmail={canManageEmail}
    emailAccountLimit={emailAccountLimitForTier(session.tier)}
  /></WorkspaceShell>;
}
