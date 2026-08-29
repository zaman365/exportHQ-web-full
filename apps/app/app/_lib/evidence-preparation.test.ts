import { describe, expect, it } from "vitest";
import { shouldPrepareLowDataImage } from "./evidence-preparation";

describe("low-data evidence preparation", () => {
  it("re-encodes only meaningful image uploads in low-data mode", () => {
    expect(shouldPrepareLowDataImage({ mimeType: "image/jpeg", byteSize: 800_000, lowDataMode: true })).toBe(true);
    expect(shouldPrepareLowDataImage({ mimeType: "application/pdf", byteSize: 800_000, lowDataMode: true })).toBe(false);
    expect(shouldPrepareLowDataImage({ mimeType: "image/png", byteSize: 100_000, lowDataMode: true })).toBe(false);
    expect(shouldPrepareLowDataImage({ mimeType: "image/jpeg", byteSize: 800_000, lowDataMode: false })).toBe(false);
  });
});
