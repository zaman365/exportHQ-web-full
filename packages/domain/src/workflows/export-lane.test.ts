import { describe, expect, it } from "vitest";
import {
  ExportLaneVersionConflictError,
  InvalidExportLaneTransitionError,
  transitionExportLane
} from "./export-lane";

describe("Export Lane workflow", () => {
  it("activates a draft and advances one lifecycle gate at a time", () => {
    const active = transitionExportLane(
      { status: "draft", stage: "opportunity", version: 3 },
      { expectedVersion: 3, status: "active" }
    );
    expect(active).toEqual({ status: "active", stage: "opportunity", version: 4 });
    expect(transitionExportLane(active, { expectedVersion: 4, stage: "readiness" })).toEqual({
      status: "active",
      stage: "readiness",
      version: 5
    });
  });

  it("rejects skipped gates", () => {
    expect(() => transitionExportLane(
      { status: "active", stage: "opportunity", version: 1 },
      { expectedVersion: 1, stage: "evidence" }
    )).toThrow(InvalidExportLaneTransitionError);
  });

  it("rejects stale commands", () => {
    expect(() => transitionExportLane(
      { status: "active", stage: "readiness", version: 7 },
      { expectedVersion: 6, stage: "evidence" }
    )).toThrow(ExportLaneVersionConflictError);
  });

  it("requires the repeat stage before completion", () => {
    expect(() => transitionExportLane(
      { status: "active", stage: "payment", version: 8 },
      { expectedVersion: 8, status: "completed" }
    )).toThrow(InvalidExportLaneTransitionError);
  });
});
