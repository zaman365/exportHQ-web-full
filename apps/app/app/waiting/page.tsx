import type { Metadata } from "next";
import { getCustomerPrincipal } from "@exporthq/auth";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { demoSnapshot } from "@exporthq/domain";
import { WorkspaceShell } from "../_components/workspace-shell";
import WaitingClient from "./waiting-client";

export const metadata: Metadata = {
  title: "Waiting — Export HQ",
  description: "An ownership-first queue for TREVV handoffs, blockers, and follow-ups."
};

export const dynamic = "force-dynamic";

export default async function WaitingPage() {
  const principal = await getCustomerPrincipal();
  authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = canAccessOrganization(principal, principal.organizationId, "tasks:manage");
  return <WorkspaceShell active="waiting"><WaitingClient initialTasks={[...demoSnapshot.tasks]} canManage={canManage} /></WorkspaceShell>;
}
