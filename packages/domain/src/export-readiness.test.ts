import { describe, expect, it } from "vitest";
import {
  applicableReadinessRequirements,
  calculateReadinessScore,
  readinessRequirementViews,
  type ReadinessProfile
} from "./export-readiness";

const profile: ReadinessProfile = {
  businessModel: "manufacturer",
  productCategory: "apparel",
  productName: "Cotton shirts",
  hsCode: "6205.20",
  targetMarketCode: "DE",
  salesChannel: "wholesale"
};

describe("export readiness catalog", () => {
  it("selects Bangladesh factory and EU requirements for a manufacturer", () => {
    const ids = applicableReadinessRequirements(profile).map((item) => item.id);
    expect(ids).toContain("bd-factory-license");
    expect(ids).toContain("market-eu");
    expect(ids).not.toContain("market-saudi");
    expect(ids).not.toContain("bd-bsti-screen");
  });

  it("selects sector and Saudi rules without factory rules for a food trader", () => {
    const ids = applicableReadinessRequirements({
      ...profile,
      businessModel: "trader",
      productCategory: "food",
      targetMarketCode: "SA"
    }).map((item) => item.id);
    expect(ids).toContain("bd-sector-registration");
    expect(ids).toContain("bd-bsti-screen");
    expect(ids).toContain("market-saudi");
    expect(ids).not.toContain("bd-factory-license");
  });

  it("removes solution, evidence and provider details from member views", () => {
    const member = readinessRequirementViews("member", profile);
    const full = readinessRequirementViews("full", profile);
    expect(member.every((item) => item.fullResolution === undefined)).toBe(true);
    expect(full.every((item) => item.fullResolution !== undefined)).toBe(true);
    expect(JSON.stringify(member)).not.toContain("Board resolution or power of attorney");
  });

  it("calculates weighted progress and keeps unresolved blockers visible", () => {
    const views = readinessRequirementViews("full", profile).slice(0, 3);
    const first = views[0]!;
    const second = views[1]!;
    const third = views[2]!;
    const result = calculateReadinessScore(views, {
      [first.id]: "verified",
      [second.id]: "not_applicable",
      [third.id]: "in_progress"
    });
    expect(result.overall).toBeGreaterThan(0);
    expect(result.overall).toBeLessThan(100);
    expect(result.blockers.some((item) => item.id === third.id)).toBe(true);
  });
});
