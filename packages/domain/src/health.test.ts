import { describe, expect, it } from "vitest";
import { calculateExportHealth, demoSnapshot } from "./index";

describe("calculateExportHealth", () => {
  it("calculates the weighted score used by the command center", () => {
    expect(calculateExportHealth(demoSnapshot.health.dimensions)).toBe(82);
  });

  it("bounds invalid scores and handles an empty model", () => {
    expect(calculateExportHealth([])).toBe(0);
    expect(calculateExportHealth([{ area: "company", label: "Company", score: 140, weight: 1 }])).toBe(100);
  });
});
