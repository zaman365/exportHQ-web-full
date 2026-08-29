import { describe, expect, it } from "vitest";
import { companionReminderAt, companionWorkflowTemplates, portalCompatibleTwoMegabytes } from "./companion-workflows";

describe("Bangladesh companion workflow contracts", () => {
  it("keeps workflows preparation-only and encodes the ERC portal boundary", () => {
    expect(Object.values(companionWorkflowTemplates).every((template) => template.preparationOnly)).toBe(true);
    expect(companionWorkflowTemplates.erc_olm_renewal.portalMaxBytes).toBe(portalCompatibleTwoMegabytes);
    expect(companionReminderAt("erc_olm_renewal", new Date("2027-01-01"))?.toISOString()).toBe("2026-11-02T00:00:00.000Z");
  });
});
