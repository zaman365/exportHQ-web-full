"use server";

import { canAccessOrganization } from "@exporthq/authorization";
import { TaskVersionConflictError, transitionTaskStatus } from "@exporthq/db";
import { taskStatusTransitionSchema } from "@exporthq/validation";
import { revalidatePath } from "next/cache";
import { getWorkspaceSession } from "../_lib/session";
import { runTenantCommand } from "../_lib/tenant";

export async function transitionTenantTaskAction(formData: FormData): Promise<void> {
  const session = await getWorkspaceSession();
  if (!session.userId || !session.principal || !canAccessOrganization(
    session.principal,
    session.principal.organizationId,
    "tasks:manage"
  )) throw new Error("You are not authorized to update this task.");
  const parsed = taskStatusTransitionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Review the task status and rationale before saving.");
  try {
    const persisted = await runTenantCommand(session, (tx, context) => transitionTaskStatus(tx, context, parsed.data));
    if (!persisted.ran) throw new Error("Protected task storage is not activated. Nothing was changed.");
  } catch (error) {
    if (error instanceof TaskVersionConflictError) throw new Error("This task changed in another session. Reload before trying again.");
    throw error;
  }
  revalidatePath("/waiting");
  revalidatePath("/");
}
