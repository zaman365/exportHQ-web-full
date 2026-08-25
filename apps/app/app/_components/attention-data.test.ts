import { describe, expect, it } from "vitest";
import {
  attentionProjects,
  attentionSeeds,
  attentionScore,
  rankAttentionSignals,
} from "./attention-data";

describe("ExportPanel attention signals", () => {
  it("keeps identifiers unique and every signal attached to a real project", () => {
    expect(new Set(attentionSeeds.map((signal) => signal.id)).size).toBe(
      attentionSeeds.length,
    );
    expect(
      attentionSeeds.every((signal) =>
        attentionProjects.some((project) => project.id === signal.projectId),
      ),
    ).toBe(true);
  });

  it("provides evidence, dependencies, and a navigable action for every signal", () => {
    expect(
      attentionSeeds.every(
        (signal) =>
          signal.reasons.length >= 2 &&
          signal.evidence.length >= 2 &&
          signal.dependencies.length >= 2 &&
          signal.recommendedAction.href.startsWith("/"),
      ),
    ).toBe(true);
  });

  it("ranks critical blocked work ahead of medium informational work", () => {
    const ranked = rankAttentionSignals(
      attentionSeeds,
      attentionProjects,
      new Date("2026-08-25T18:00:00.000Z"),
    );
    expect(ranked[0]?.severity).toBe("critical");
    expect(ranked[0]?.facets).toContain("blocked");
    expect(
      attentionScore(
        ranked[0]!,
        attentionProjects.find(
          (project) => project.id === ranked[0]!.projectId,
        )!,
      ),
    ).toBeGreaterThan(
      attentionScore(
        ranked.at(-1)!,
        attentionProjects.find(
          (project) => project.id === ranked.at(-1)!.projectId,
        )!,
      ),
    );
  });
});
