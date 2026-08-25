import type { Metadata } from "next";
import { getCustomerPrincipal } from "@exporthq/auth";
import { authorizeOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import LearningCenterClient from "./learning-center-client";

export const metadata: Metadata = {
  title: "TREVV Learning Center — Export HQ",
  description: "Hints, tutorials, references, and practical tips for the TREVV workspace."
};

export const dynamic = "force-dynamic";

export default async function LearningCenterPage({
  searchParams
}: {
  searchParams: Promise<{ topic?: string | string[] }>;
}) {
  const principal = await getCustomerPrincipal();
  authorizeOrganization(principal, principal.organizationId, "company:view");
  const topicValue = (await searchParams).topic;
  const topic = Array.isArray(topicValue) ? topicValue[0] : topicValue;

  return <WorkspaceShell active="learning"><LearningCenterClient initialTopic={topic} /></WorkspaceShell>;
}
