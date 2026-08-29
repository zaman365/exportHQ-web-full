import { and, eq } from "drizzle-orm";
import { recordAuditEvent } from "../audit";
import { enqueueOutboxEvent } from "../outbox";
import { taskStatusHistory, tasks } from "../schema";
import type { ExportHqTransaction, TenantContext } from "../tenant";

export class TaskVersionConflictError extends Error {
  constructor(readonly expectedVersion: number, readonly actualVersion: number) {
    super(`Task version conflict: expected ${expectedVersion}, found ${actualVersion}.`);
    this.name = "TaskVersionConflictError";
  }
}

export async function transitionTaskStatus(
  tx: ExportHqTransaction,
  context: TenantContext,
  input: {
    readonly taskId: string;
    readonly expectedVersion: number;
    readonly status: "todo" | "in_progress" | "completed" | "blocked";
    readonly rationale: string;
  },
  now = new Date()
): Promise<{ readonly id: string; readonly version: number; readonly status: typeof tasks.$inferSelect.status }> {
  const [current] = await tx.select().from(tasks).where(and(
    eq(tasks.organizationId, context.organizationId),
    eq(tasks.id, input.taskId)
  )).limit(1);
  if (!current) throw new Error("Task was not found in this organization.");
  if (current.version !== input.expectedVersion) throw new TaskVersionConflictError(input.expectedVersion, current.version);
  if (context.actorType === "customer" && current.responsibility !== "customer") {
    throw new Error("A customer cannot change work owned by Export HQ or a third party.");
  }
  if (!allowedTransition(current.status, input.status)) {
    throw new Error(`Task cannot move from ${current.status} to ${input.status}.`);
  }
  const rationale = input.rationale.trim();
  if (!rationale) throw new Error("Task status changes require a rationale.");
  const nextVersion = current.version + 1;
  const [updated] = await tx.update(tasks).set({
    status: input.status,
    version: nextVersion,
    updatedAt: now
  }).where(and(
    eq(tasks.organizationId, context.organizationId),
    eq(tasks.id, current.id),
    eq(tasks.version, current.version)
  )).returning({ id: tasks.id, version: tasks.version, status: tasks.status });
  if (!updated) throw new TaskVersionConflictError(input.expectedVersion, nextVersion);
  await tx.insert(taskStatusHistory).values({
    organizationId: context.organizationId,
    taskId: current.id,
    fromStatus: current.status,
    toStatus: input.status,
    taskVersion: nextVersion,
    rationale,
    changedBy: context.actorId,
    createdAt: now
  });
  await recordAuditEvent(tx, context, {
    action: "task.status_changed",
    entityType: "task",
    entityId: current.id,
    metadata: { fromStatus: current.status, toStatus: input.status, version: nextVersion, rationaleProvided: Boolean(rationale) }
  });
  await enqueueOutboxEvent(tx, context, {
    topic: "task.status_changed",
    aggregateType: "task",
    aggregateId: current.id,
    dedupeKey: `task:${current.id}:v${nextVersion}`,
    payload: { fromStatus: current.status, toStatus: input.status, version: nextVersion }
  });
  return updated;
}

function allowedTransition(current: typeof tasks.$inferSelect.status, next: "todo" | "in_progress" | "completed" | "blocked"): boolean {
  if (current === next || current === "cancelled") return false;
  if (next === "todo") return current === "in_progress" || current === "blocked";
  if (next === "in_progress") return current === "todo" || current === "waiting_customer" || current === "blocked";
  if (next === "completed") return current === "todo" || current === "in_progress" || current === "waiting_customer";
  return current !== "completed";
}
