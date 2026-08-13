import { describe, expect, it } from "vitest";
import { ExportReadinessJourney, type JourneyStage } from "./index";

describe("critical customer journey", () => {
  it("connects account setup through internal review to the customer dashboard", () => {
    const journey = new ExportReadinessJourney("org_a");
    const stages: JourneyStage[] = [
      "account_created", "organization_created", "onboarding_completed", "product_created",
      "market_selected", "readiness_generated", "action_created", "document_uploaded",
      "staff_reviewed", "customer_notified"
    ];
    stages.forEach((stage) => journey.complete(stage));
    expect(journey.isComplete).toBe(true);
    expect(journey.nextStage).toBeUndefined();
  });

  it("refuses disconnected or out-of-order work", () => {
    const journey = new ExportReadinessJourney("org_a");
    expect(() => journey.complete("product_created")).toThrow("expected account_created");
  });
});
