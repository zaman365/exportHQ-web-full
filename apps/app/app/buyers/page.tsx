import type { Metadata } from "next";
import { authorizeOrganization, canAccessOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getWorkspaceFeatureSession } from "../_lib/session";
import BuyersClient from "./buyers-client";
import { illustrativeBuyerPipeline } from "./buyers-data";

export const metadata: Metadata = {
  title: "Buyers — Export HQ",
  description: "Qualify buyers, control outreach, and connect each commercial relationship to an Export Lane."
};

export const dynamic = "force-dynamic";

export default async function BuyersPage() {
  const session = await getWorkspaceFeatureSession("buyers");
  const principal = session.principal;
  if (principal) authorizeOrganization(principal, principal.organizationId, "company:view");
  const canManage = Boolean(principal && canAccessOrganization(principal, principal.organizationId, "company:manage"));
  return <WorkspaceShell active="buyers" session={session}><BuyersClient canManage={canManage} initialBuyers={illustrativeBuyerPipeline} /></WorkspaceShell>;
}
