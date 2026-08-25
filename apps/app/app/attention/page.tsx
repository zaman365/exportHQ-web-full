import type { Metadata } from "next";
import {
  authorizeOrganization,
  canAccessOrganization,
} from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import AttentionClient from "./attention-client";
import { requireWorkspaceFeature } from "../_lib/session";

export const metadata: Metadata = {
  title: "Attention Center — Export HQ",
  description: "TREVV's project-aware operational signal and action center.",
};

export const dynamic = "force-dynamic";

export default async function AttentionPage() {
  const session = await requireWorkspaceFeature("attention");
  const principal = session.principal;
  authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = canAccessOrganization(
    principal,
    principal.organizationId,
    "tasks:manage",
  );
  return (
    <WorkspaceShell active="attention" session={session}>
      <AttentionClient canManage={canManage} />
    </WorkspaceShell>
  );
}
