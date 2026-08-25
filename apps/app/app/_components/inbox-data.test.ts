import { describe, expect, it } from "vitest";
import { inboxRequestSeeds, resolveCaptureDue, suggestCaptureDate, suggestCaptureType } from "./inbox-data";

describe("TREVV Inbox", () => {
  it("keeps seeded requests uniquely addressable and actionable", () => {
    expect(new Set(inboxRequestSeeds.map((item) => item.id)).size).toBe(inboxRequestSeeds.length);
    expect(inboxRequestSeeds.every((item) => item.href.startsWith("/") && item.summary.length > 0)).toBe(true);
  });

  it("suggests useful capture types without hiding the user's choice", () => {
    expect(suggestCaptureType("https://example.com/evidence")).toBe("link");
    expect(suggestCaptureType("Idea: reusable care labels")).toBe("idea");
    expect(suggestCaptureType("Please review the quotation")).toBe("task");
    expect(suggestCaptureType("An ambiguous thought")).toBeUndefined();
  });

  it("recognizes lightweight date intent", () => {
    expect(suggestCaptureDate("Follow up tomorrow")).toBe("tomorrow");
    expect(suggestCaptureDate("Review next week")).toBe("next-week");
    expect(resolveCaptureDue("none", new Date("2026-08-25T08:00:00.000Z"))).toBeUndefined();
    expect(resolveCaptureDue("tomorrow", new Date("2026-08-25T08:00:00.000Z"))).toContain("2026-08-26");
  });
});
