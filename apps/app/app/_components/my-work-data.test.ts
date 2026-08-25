import { describe, expect, it } from "vitest";
import { groupWorkItems, recommendFocus, workSeeds } from "./my-work-data";

describe("ExportPanel My Work", () => {
  it("keeps every seeded work item uniquely addressable and actionable", () => {
    expect(new Set(workSeeds.map((item) => item.id)).size).toBe(
      workSeeds.length,
    );
    expect(
      workSeeds.every(
        (item) => item.nextStep.length > 0 && item.href.startsWith("/"),
      ),
    ).toBe(true);
  });

  it("groups work by time without losing records", () => {
    const groups = groupWorkItems(
      workSeeds,
      new Date("2026-08-25T10:00:00.000Z"),
    );
    expect(
      groups.find((group) => group.id === "overdue")?.items.length,
    ).toBeGreaterThan(0);
    expect(
      groups.find((group) => group.id === "today")?.items.length,
    ).toBeGreaterThan(0);
    expect(groups.flatMap((group) => group.items)).toHaveLength(
      workSeeds.length,
    );
  });

  it("builds a focus plan from actionable, high-value work", () => {
    const focus = recommendFocus(workSeeds);
    expect(focus).toHaveLength(3);
    expect(
      focus.every(
        (item) => item.status !== "done" && item.status !== "blocked",
      ),
    ).toBe(true);
    expect(focus.some((item) => item.priority === "urgent")).toBe(true);
  });
});
