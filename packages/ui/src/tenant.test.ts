import { describe, expect, it } from "vitest";
import { tenantInitials, tenantTheme } from "./tenant";

const PAPER = [255, 255, 255] as const;

function channels(hex: string): [number, number, number] {
  const raw = hex.replace("#", "");
  return [0, 2, 4].map((i) => Number.parseInt(raw.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: readonly [number, number, number]): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.04045 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: readonly [number, number, number], b: readonly [number, number, number]): number {
  const high = Math.max(luminance(a), luminance(b));
  const low = Math.min(luminance(a), luminance(b));
  return (high + 0.05) / (low + 0.05);
}

describe("tenantTheme", () => {
  it("emits exactly the four permitted custom properties", () => {
    const theme = tenantTheme({ name: "ABC Textiles", accent: "#1e5aa8" });
    expect(Object.keys(theme).sort()).toEqual([
      "--tenant-accent",
      "--tenant-accent-on",
      "--tenant-accent-wash",
      "--tenant-mark"
    ]);
  });

  it("clamps every accent to at least AA against paper", () => {
    const candidates = ["#ffee00", "#ffffff", "#00ff00", "#c0c0c0", "#1e5aa8", "#000000"];
    for (const accent of candidates) {
      const { "--tenant-accent": value } = tenantTheme({ name: "Test", accent });
      expect(contrast(channels(value), PAPER)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("picks a readable foreground for the clamped accent", () => {
    for (const accent of ["#ffee00", "#1e5aa8", "#00ff00"]) {
      const theme = tenantTheme({ name: "Test", accent });
      const ratio = contrast(channels(theme["--tenant-accent"]), channels(theme["--tenant-accent-on"]));
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("falls back to Export HQ defaults for a missing or unparseable brand", () => {
    const none = tenantTheme(undefined);
    const broken = tenantTheme({ name: "Test", accent: "not-a-colour" });
    expect(none["--tenant-accent"]).toBe(broken["--tenant-accent"]);
    expect(none["--tenant-mark"]).toBe("none");
  });

  it("derives initials when the tenant supplies none", () => {
    expect(tenantInitials({ name: "ABC Textiles" })).toBe("AT");
    expect(tenantInitials({ name: "Delta Foods", initials: "df" })).toBe("DF");
    expect(tenantInitials({ name: "   " })).toBe("EH");
  });
});
