import { describe, expect, it } from "vitest";
import { assessPerformanceBudget, authorizeGuestResource, projectPlanUsage, publicBetaPerformanceBudgets } from "./public-beta";

describe("public beta controls", () => {
  it("shows exact limits and projected charges without an unlimited sentinel", () => {
    const result = projectPlanUsage([
      { capability: "active_lane", included: 2, overageUnitSize: 1, overageUnitPriceMinor: 10000 },
      { capability: "editor", included: 3, overageUnitSize: 1, overageUnitPriceMinor: 5000 },
      { capability: "storage_byte", included: 1_000, overageUnitSize: 500, overageUnitPriceMinor: 100 },
      { capability: "automation_unit", included: 10, overageUnitSize: 10, overageUnitPriceMinor: 250 },
      { capability: "work_pack", included: 0, overageUnitSize: 1, overageUnitPriceMinor: 50000 }
    ], { active_lane: 2, editor: 2, storage_byte: 900, automation_unit: 5, work_pack: 0 }, { active_lane: 3, storage_byte: 1_200 });
    expect(result.find((item) => item.capability === "active_lane")).toMatchObject({ projectedOverage: 1, projectedChargeMinor: 10000 });
    expect(result.find((item) => item.capability === "storage_byte")).toMatchObject({ projectedOverage: 200, projectedChargeMinor: 100 });
  });

  it("authorizes only the exact active guest resource", () => {
    const grant = { grantStatus: "active" as const, expiresAt: new Date("2027-03-01"), grantedResourceType: "shipment", grantedResourceId: "shipment-1", now: new Date("2027-02-01") };
    expect(() => authorizeGuestResource({ ...grant, requestedResourceType: "shipment", requestedResourceId: "shipment-1" })).not.toThrow();
    expect(() => authorizeGuestResource({ ...grant, requestedResourceType: "shipment", requestedResourceId: "shipment-2" })).toThrow(/does not cover/);
  });

  it("fails a performance report when any budget is absent or exceeded", () => {
    expect(assessPerformanceBudget(publicBetaPerformanceBudgets)).toEqual([]);
    expect(assessPerformanceBudget({ initialJavaScriptGzip: 300_000 })).toContain("initialJavaScriptGzip:exceeded");
  });
});
