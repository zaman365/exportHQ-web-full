import { describe, expect, it } from "vitest";
import { requirementRegisterRecords, requirementRegisterSummary, requirementSectionOptions } from "./requirements-data";

describe("requirements register", () => {
  it("keeps each requirement source-aware and connected to an evidence path", () => {
    expect(requirementRegisterRecords.length).toBeGreaterThan(15);
    expect(requirementRegisterRecords.every((item) => item.sources.length > 0)).toBe(true);
    expect(requirementRegisterRecords.every((item) => item.fullResolution?.evidence.length)).toBe(true);
  });

  it("covers every readiness area and highlights unresolved blockers", () => {
    expect(requirementSectionOptions).toHaveLength(9);
    const summary = requirementRegisterSummary(requirementRegisterRecords);
    expect(summary.total).toBe(requirementRegisterRecords.length);
    expect(summary.blockers).toBeGreaterThan(0);
    expect(summary.inReview).toBeGreaterThan(0);
    expect(summary.compliant).toBeGreaterThan(0);
  });
});
