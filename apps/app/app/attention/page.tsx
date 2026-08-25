import type { Metadata } from "next";
import { getCustomerPrincipal } from "@exporthq/auth";
import {
  authorizeOrganization,
  canAccessOrganization,
} from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import AttentionClient from "./attention-client";

export const metadata: Metadata = {
  title: "Attention Center — Export HQ",
  description: "TREVV's project-aware operational signal and action center.",
};

export const dynamic = "force-dynamic";

export default async function AttentionPage() {
  const principal = await getCustomerPrincipal();
  authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = canAccessOrganization(
    principal,
    principal.organizationId,
    "tasks:manage",
  );
  return (
    <WorkspaceShell active="attention">
      <AttentionClient canManage={canManage} />
    </WorkspaceShell>
  );
}
