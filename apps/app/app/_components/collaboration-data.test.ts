import { describe, expect, it } from "vitest";
import { createBlueprintFromIdea, createDecisionFromIdea, decisionSeeds, ideaSeeds, teamProfiles } from "./collaboration-data";

describe("collaboration catalogs", () => {
  it("keeps seeded records and team profiles uniquely addressable", () => {
    for (const records of [decisionSeeds, ideaSeeds, teamProfiles]) {
      expect(new Set(records.map((record) => record.id)).size).toBe(records.length);
    }
  });

  it("keeps decisions explainable", () => {
    expect(decisionSeeds.every((decision) => decision.options.length > 0 && decision.rationale.length > 0)).toBe(true);
    expect(decisionSeeds.filter((decision) => decision.status === "approved").every((decision) => decision.options.some((option) => option.selected))).toBe(true);
  });

  it("promotes an idea into actionable workflow records", () => {
    const idea = ideaSeeds[0]!;
    const decision = createDecisionFromIdea(idea);
    const blueprint = createBlueprintFromIdea(idea);
    expect(decision.status).toBe("draft");
    expect(decision.options.length).toBeGreaterThanOrEqual(2);
    expect(blueprint.steps.length).toBeGreaterThanOrEqual(5);
  });
});
