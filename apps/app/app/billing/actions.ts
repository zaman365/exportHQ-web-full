"use server";

import { revalidatePath } from "next/cache";
import { authorizeOrganization } from "@exporthq/authorization";
import { requestSubscriptionCancellation } from "@exporthq/db";
import { requireWorkspaceFeature } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";

export async function requestCurrentSubscriptionCancellation(formData: FormData): Promise<void> {
  const session = await requireWorkspaceFeature("billing");
  authorizeOrganization(session.principal, session.principal.organizationId, "subscription:self_service");
  const subscriptionId = formData.get("subscriptionId");
  const reason = formData.get("reason");
  if (typeof subscriptionId !== "string" || !/^[0-9a-f-]{36}$/.test(subscriptionId)) throw new Error("A valid subscription is required.");
  if (typeof reason !== "string" || reason.trim().length < 10) throw new Error("Cancellation reason must contain at least 10 characters.");
  const result = await runTenantCommand(session, (tx, context) => requestSubscriptionCancellation(tx, context, { subscriptionId, reason }));
  if (!result.ran) throw new Error("Billing persistence is unavailable; cancellation was not recorded.");
  revalidatePath("/billing");
}
