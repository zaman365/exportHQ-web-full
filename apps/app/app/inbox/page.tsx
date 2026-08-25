import type { Metadata } from "next";
import { getCustomerPrincipal } from "@exporthq/auth";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import InboxClient from "./inbox-client";

export const metadata: Metadata = {
  title: "Inbox — Export HQ",
  description: "Capture thoughts and triage actionable TREVV requests."
};

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const principal = await getCustomerPrincipal();
  authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = canAccessOrganization(principal, principal.organizationId, "tasks:manage");
  return <WorkspaceShell active="inbox"><InboxClient canManage={canManage} /></WorkspaceShell>;
}
