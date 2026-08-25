import { describe, expect, it } from "vitest";
import {
  marketCountries,
  marketOpportunityCatalog,
  marketOpportunityViews,
  opportunityScoreBand
} from "./market-opportunities";

describe("market opportunity intelligence", () => {
  it("keeps the starter catalog traceable and country-product specific", () => {
    expect(marketOpportunityCatalog.length).toBeGreaterThanOrEqual(10);
    expect(marketCountries()).toHaveLength(6);
    for (const opportunity of marketOpportunityCatalog) {
      expect(opportunity.product.hsCodes.length).toBeGreaterThan(0);
      expect(opportunity.evidence.length).toBeGreaterThan(0);
      expect(opportunity.evidence[0]?.url).toMatch(/^https:\/\//);
      expect(opportunity.opportunityScore).toBeGreaterThanOrEqual(0);
      expect(opportunity.opportunityScore).toBeLessThanOrEqual(100);
    }
  });

  it("redacts member and full intelligence from the public view", () => {
    const [publicView] = marketOpportunityViews("public");
    const [memberView] = marketOpportunityViews("member");
    const [fullView] = marketOpportunityViews("full");

    expect(publicView?.opportunityScore).toBeUndefined();
    expect(publicView?.memberInsight).toBeUndefined();
    expect(publicView?.fullAnalysis).toBeUndefined();
    expect(memberView?.opportunityScore).toBeTypeOf("number");
    expect(memberView?.fullAnalysis).toBeUndefined();
    expect(fullView?.fullAnalysis?.evidence.length).toBeGreaterThan(0);
  });

  it("uses stable score bands for public communication", () => {
    expect(opportunityScoreBand(93)).toBe("Priority");
    expect(opportunityScoreBand(82)).toBe("Promising");
    expect(opportunityScoreBand(75)).toBe("Watch");
  });
});
