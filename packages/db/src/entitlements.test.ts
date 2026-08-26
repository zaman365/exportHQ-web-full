import { describe, expect, it } from "vitest";
import { isEntitlementActive, resolveEntitlementTier, type EntitlementRecord } from "./entitlements";

const now = new Date("2026-08-26T12:00:00.000Z");

function record(overrides: Partial<EntitlementRecord>): EntitlementRecord {
  return {
    tier: "launch",
    source: "paid",
    effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    effectiveTo: null,
    revokedAt: null,
    ...overrides
  };
}

describe("entitlement activity", () => {
  it("ignores a revoked entitlement", () => {
    expect(isEntitlementActive(record({ revokedAt: new Date("2026-06-01T00:00:00.000Z") }), now)).toBe(false);
  });

  it("ignores an entitlement that has not started", () => {
    expect(isEntitlementActive(record({ effectiveFrom: new Date("2027-01-01T00:00:00.000Z") }), now)).toBe(false);
  });

  it("ignores an entitlement whose window has closed", () => {
    expect(isEntitlementActive(record({ effectiveTo: new Date("2026-08-01T00:00:00.000Z") }), now)).toBe(false);
  });

  it("keeps an open-ended entitlement active", () => {
    expect(isEntitlementActive(record({}), now)).toBe(true);
  });
});

describe("effective tier", () => {
  it("falls back to Basic when an organization holds nothing", () => {
    expect(resolveEntitlementTier([], now)).toBe("explore");
  });

  it("takes the highest active tier so an expiring trial cannot downgrade a paying customer", () => {
    const tier = resolveEntitlementTier(
      [
        record({ tier: "scale", source: "paid" }),
        record({ tier: "managed", source: "pilot", effectiveTo: new Date("2026-09-30T00:00:00.000Z") })
      ],
      now
    );
    expect(tier).toBe("managed");
  });

  it("drops back to the remaining tier once the higher grant expires", () => {
    const records = [
      record({ tier: "scale", source: "paid" }),
      record({ tier: "managed", source: "pilot", effectiveTo: new Date("2026-09-30T00:00:00.000Z") })
    ];
    expect(resolveEntitlementTier(records, new Date("2026-10-01T00:00:00.000Z"))).toBe("scale");
  });

  it("ignores revoked grants entirely", () => {
    expect(
      resolveEntitlementTier([record({ tier: "managed", revokedAt: new Date("2026-08-01T00:00:00.000Z") })], now)
    ).toBe("explore");
  });
});
