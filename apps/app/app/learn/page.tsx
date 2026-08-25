import type { Metadata } from "next";
import { authorizeOrganization } from "@exporthq/authorization";
import { WorkspaceShell } from "../_components/workspace-shell";
import LearningCenterClient from "./learning-center-client";
import { requireWorkspaceFeature } from "../_lib/session";

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
  const session = await requireWorkspaceFeature("learning");
  const principal = session.principal;
  authorizeOrganization(principal, principal.organizationId, "company:view");
  const topicValue = (await searchParams).topic;
  const topic = Array.isArray(topicValue) ? topicValue[0] : topicValue;

  return <WorkspaceShell active="learning" session={session}><LearningCenterClient initialTopic={topic} /></WorkspaceShell>;
}
