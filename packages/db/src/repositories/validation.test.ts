import { describe, expect, it } from "vitest";
import { normalizeEmailAddress } from "./validation";

describe("repository input validation", () => {
  it("normalizes a bounded email address", () => {
    expect(normalizeEmailAddress(" Finance@Example.COM ", "invalid")).toBe("finance@example.com");
  });

  it.each([
    "missing-at.example.com",
    "two@@example.com",
    "missing-dot@example",
    "missing-label@.example",
    "missing-suffix@example.",
    "space in-address@example.com",
    `${"a".repeat(65)}@example.com`,
    `a@${"b".repeat(250)}.com`
  ])("refuses malformed or oversized input without a complex regular expression", (value) => {
    expect(() => normalizeEmailAddress(value, "invalid address")).toThrow("invalid address");
  });
});
