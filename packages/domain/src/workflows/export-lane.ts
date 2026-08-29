export const exportLaneStages = [
  "opportunity",
  "readiness",
  "evidence",
  "buyer",
  "offer",
  "production",
  "shipment",
  "payment",
  "repeat"
] as const;

export type ExportLaneStage = typeof exportLaneStages[number];
export type ExportLaneStatus = "draft" | "active" | "on_hold" | "completed" | "cancelled" | "archived";

export interface ExportLaneWorkflowState {
  readonly status: ExportLaneStatus;
  readonly stage: ExportLaneStage;
  readonly version: number;
}

export interface ExportLaneTransitionCommand {
  readonly expectedVersion: number;
  readonly status?: ExportLaneStatus;
  readonly stage?: ExportLaneStage;
}

export class ExportLaneVersionConflictError extends Error {
  constructor(readonly expectedVersion: number, readonly actualVersion: number) {
    super(`Export Lane version conflict: expected ${expectedVersion}, found ${actualVersion}.`);
    this.name = "ExportLaneVersionConflictError";
  }
}

export class InvalidExportLaneTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidExportLaneTransitionError";
  }
}

const allowedStatuses: Readonly<Record<ExportLaneStatus, readonly ExportLaneStatus[]>> = {
  draft: ["active", "cancelled"],
  active: ["on_hold", "completed", "cancelled"],
  on_hold: ["active", "cancelled"],
  completed: ["archived"],
  cancelled: ["archived"],
  archived: []
};

export function transitionExportLane(
  current: ExportLaneWorkflowState,
  command: ExportLaneTransitionCommand
): ExportLaneWorkflowState {
  if (command.expectedVersion !== current.version) {
    throw new ExportLaneVersionConflictError(command.expectedVersion, current.version);
  }
  if (!command.status && !command.stage) throw new InvalidExportLaneTransitionError("A status or stage transition is required.");

  const nextStatus = command.status ?? current.status;
  const nextStage = command.stage ?? current.stage;
  if (nextStatus !== current.status && !allowedStatuses[current.status].includes(nextStatus)) {
    throw new InvalidExportLaneTransitionError(`Cannot transition Export Lane status from ${current.status} to ${nextStatus}.`);
  }
  if (command.stage && command.stage !== current.stage) validateStageTransition(current, nextStatus, command.stage);
  if (nextStatus === "completed" && nextStage !== "repeat") {
    throw new InvalidExportLaneTransitionError("An Export Lane can only complete from the repeat stage.");
  }
  if (nextStatus === "archived" && nextStage !== current.stage) {
    throw new InvalidExportLaneTransitionError("Archiving cannot also change the Export Lane stage.");
  }

  return { status: nextStatus, stage: nextStage, version: current.version + 1 };
}

function validateStageTransition(
  current: ExportLaneWorkflowState,
  nextStatus: ExportLaneStatus,
  nextStage: ExportLaneStage
): void {
  if (current.status !== "active" || nextStatus !== "active") {
    throw new InvalidExportLaneTransitionError("Stage changes require an active Export Lane.");
  }
  const currentIndex = exportLaneStages.indexOf(current.stage);
  const nextIndex = exportLaneStages.indexOf(nextStage);
  if (nextIndex !== currentIndex + 1) {
    throw new InvalidExportLaneTransitionError(`Cannot move Export Lane stage from ${current.stage} to ${nextStage}; stages advance one gate at a time.`);
  }
}
