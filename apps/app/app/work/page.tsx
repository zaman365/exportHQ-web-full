import type { Metadata } from "next";
import { getCustomerPrincipal } from "@exporthq/auth";
import {
  authorizeOrganization,
  canAccessOrganization,
} from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import MyWorkClient from "./work-client";

export const metadata: Metadata = {
  title: "My Work — Export HQ",
  description: "A risk-aware personal work plan for TREVV.",
};

export const dynamic = "force-dynamic";

export default async function MyWorkPage() {
  const principal = await getCustomerPrincipal();
  authorizeOrganization(principal, principal.organizationId, "tasks:view");
  const canManage = canAccessOrganization(
    principal,
    principal.organizationId,
    "tasks:manage",
  );
  return (
    <WorkspaceShell active="work">
      <MyWorkClient canManage={canManage} />
    </WorkspaceShell>
  );
}
