import type { Metadata } from "next";
import {
  authorizeOrganization,
  canAccessOrganization,
} from "@exporthq/authorization";
import { TenantSurfacePending } from "../_components/tenant-surface-pending";
import { WorkspaceShell } from "../_components/workspace-shell";
import { getProgressiveWorkspaceFeatureSession } from "../_lib/session";

export const metadata: Metadata = {
  title: "Attention Center — Export HQ",
  description: "ExportPanel's project-aware operational signal and action center.",
};

export const dynamic = "force-dynamic";

export default async function AttentionPage() {
  const session = await getProgressiveWorkspaceFeatureSession("attention");
  const principal = session.principal;
  const fullAccess = session.features.includes("attention");
  if (fullAccess && principal) authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = Boolean(fullAccess && principal && canAccessOrganization(principal, principal.organizationId, "tasks:manage"));
  if (session.userId && !session.isDemo) return <WorkspaceShell active="attention" session={session}><TenantSurfacePending phase="R1 migration" title="Attention uses the tenant task spine next" description="The authoritative Waiting queue is active; cross-module signals remain hidden until their source read models and audited actions are connected." /></WorkspaceShell>;
  const { default: AttentionClient } = await import("./attention-client");
  return (
    <WorkspaceShell active="attention" session={session}>
      <AttentionClient canManage={canManage} />
    </WorkspaceShell>
  );
}
