import { describe, expect, it } from "vitest";
import { buyerPipelineSummary, buyerStageCatalog, illustrativeBuyerPipeline } from "./buyers-data";

describe("illustrative buyer pipeline", () => {
  it("keeps every buyer tied to a lane, owner, next action and due checkpoint", () => {
    expect(new Set(illustrativeBuyerPipeline.map((buyer) => buyer.id)).size).toBe(illustrativeBuyerPipeline.length);
    expect(illustrativeBuyerPipeline.every((buyer) => buyer.lane && buyer.owner && buyer.nextAction && buyer.dueLabel)).toBe(true);
  });

  it("supports every pipeline stage and risk-aware summary counts", () => {
    expect(new Set(illustrativeBuyerPipeline.map((buyer) => buyer.stage))).toEqual(new Set(buyerStageCatalog.map((stage) => stage.id)));
    const summary = buyerPipelineSummary(illustrativeBuyerPipeline);
    expect(summary.total).toBe(6);
    expect(summary.qualified).toBeGreaterThan(summary.activeSamples);
    expect(summary.needsRiskReview).toBe(1);
  });
});
