import { describe, expect, it } from "vitest";
import { learningCatalog, learningCategories } from "./learning-catalog";
import { blueprintCatalog } from "./workflow-data";

describe("TREVV learning catalog", () => {
  it("uses unique resource identifiers", () => {
    const ids = learningCatalog.map((resource) => resource.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every managed category", () => {
    for (const category of learningCategories) {
      expect(learningCatalog.some((resource) => resource.category === category.id)).toBe(true);
    }
  });

  it("provides actionable tutorials", () => {
    const tutorials = learningCatalog.filter((resource) => resource.kind === "tutorial");
    expect(tutorials.length).toBeGreaterThanOrEqual(5);
    expect(tutorials.every((resource) => resource.steps && resource.steps.length >= 3)).toBe(true);
  });

  it("covers every workflow destination with contextual guidance", () => {
    const requiredTopics = [
      "decisions-overview",
      "decision-lifecycle",
      "ideas-overview",
      "idea-promote",
      "team-overview",
      "team-capacity",
      "create-overview",
      "create-right-record",
      "inbox-overview",
      "inbox-quick-capture",
      "inbox-actionable",
      "inbox-triage",
      "inbox-capture-tray",
      "inbox-zero",
      "my-work-overview",
      "my-work-views",
      "my-work-risk",
      "my-work-focus",
      "my-work-complete",
      "attention-overview",
      "attention-ranking",
      "attention-actions",
      "attention-evidence"
    ];
    expect(requiredTopics.every((topic) => learningCatalog.some((resource) => resource.id === topic))).toBe(true);
  });
});

describe("Blueprint catalog", () => {
  it("keeps every built-in workflow actionable", () => {
    expect(blueprintCatalog.every((blueprint) => blueprint.steps.length >= 5)).toBe(true);
    expect(new Set(blueprintCatalog.map((blueprint) => blueprint.id)).size).toBe(blueprintCatalog.length);
  });
});
