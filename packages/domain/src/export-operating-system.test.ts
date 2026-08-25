import { describe, expect, it } from "vitest";
import {
  buyerProspects,
  calculateCommercialScenario,
  commercialReadiness,
  dealMilestones,
  defaultCommercialScenario,
  exportClusters,
  exportLaneCatalog,
  exportLaneProgress,
  financePaths,
  operatingSystemView,
  policySignals,
  qualifiedProviders,
  shipmentCheckpoints
} from "./export-operating-system";

describe("export operating system", () => {
  it("calculates a finite commercial scenario and includes the destination estimate", () => {
    const result = calculateCommercialScenario(defaultCommercialScenario);
    expect(result.sellValueUsd).toBe(38_250);
    expect(result.costBaseUsd).toBe(28_000);
    expect(result.sellerCostUsd).toBeGreaterThan(result.costBaseUsd);
    expect(result.grossMarginPercent).toBeGreaterThan(0);
    expect(result.estimatedLandedValueUsd).toBeGreaterThan(result.customsValueUsd);
    expect(Number.isFinite(result.breakEvenUnitUsd)).toBe(true);
  });

  it("warns without producing NaN for invalid commercial input", () => {
    const result = calculateCommercialScenario({ ...defaultCommercialScenario, units: 0, quoteUnitUsd: Number.NaN });
    expect(result.sellValueUsd).toBe(0);
    expect(result.breakEvenUnitUsd).toBe(0);
    expect(result.grossMarginPercent).toBe(0);
    expect(result.warnings).toContain("Add a positive sellable quantity.");
  });

  it("bounds commercial readiness and names the gaps", () => {
    const result = commercialReadiness({
      scenario: { ...defaultCommercialScenario, quoteUnitUsd: 2 },
      hsCodeConfirmed: false,
      capacityConfirmed: false,
      paymentRouteConfirmed: false,
      buyerVerified: false
    });
    expect(result.score).toBe(0);
    expect(result.gaps.length).toBe(5);
  });

  it("calculates lifecycle progress", () => {
    expect(exportLaneProgress(exportLaneCatalog[0]!)).toEqual({ completed: 2, total: 9, percent: 22 });
  });

  it("redacts private commercial and contact fields by access", () => {
    const publicView = operatingSystemView("public");
    const memberView = operatingSystemView("member");
    const fullView = operatingSystemView("full");
    expect(publicView.scenario).toBeUndefined();
    expect(publicView.passport).toBeUndefined();
    expect(publicView.buyers[0]?.decisionMaker).toBeUndefined();
    expect(memberView.providers[0]?.contactRoute).toBeUndefined();
    expect(fullView.buyers[0]?.decisionMaker).toBeTruthy();
    expect(fullView.providers[0]?.contactRoute).toBeTruthy();
    expect(fullView.passport?.shareId).toBeTruthy();
  });

  it("keeps every operating fixture attached to one tenant lane", () => {
    const lane = exportLaneCatalog[0]!;
    const records = [buyerProspects, dealMilestones, qualifiedProviders, financePaths, shipmentCheckpoints, policySignals, exportClusters];
    expect(records.flat().every((record) => record.laneId === lane.id)).toBe(true);
    expect(lane.organizationId).toBe("org_abc_textiles");
  });
});
