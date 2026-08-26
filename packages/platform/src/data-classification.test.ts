import { describe, expect, it } from "vitest";
import { assertTelemetryPermitted, dataClassPolicies, decideRetention } from "./data-classification";

const now = new Date("2026-08-26T00:00:00.000Z");

describe("retention decisions", () => {
  it("holds everything under a legal hold", () => {
    expect(
      decideRetention({
        dataClass: "customer-confidential",
        createdAt: new Date("2020-01-01T00:00:00.000Z"),
        now,
        legalHold: true,
        customerRequestedDeletion: true
      }).action
    ).toBe("hold");
  });

  it("deletes customer evidence on request", () => {
    expect(
      decideRetention({
        dataClass: "customer-confidential",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        now,
        legalHold: false,
        customerRequestedDeletion: true
      }).action
    ).toBe("delete");
  });

  it("holds an audit deletion request until the retention floor passes", () => {
    expect(
      decideRetention({
        dataClass: "audit",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        now,
        legalHold: false,
        customerRequestedDeletion: true
      }).action
    ).toBe("hold");
  });

  it("never deletes audit records on request even after the floor", () => {
    expect(
      decideRetention({
        dataClass: "audit",
        createdAt: new Date("2010-01-01T00:00:00.000Z"),
        now,
        legalHold: false,
        customerRequestedDeletion: true
      }).action
    ).toBe("retain");
  });

  it("retains tenant-lifetime data when nobody asked for deletion", () => {
    expect(
      decideRetention({
        dataClass: "operational",
        createdAt: new Date("2020-01-01T00:00:00.000Z"),
        now,
        legalHold: false,
        customerRequestedDeletion: false
      }).action
    ).toBe("retain");
  });
});

describe("telemetry permission", () => {
  it("permits only public data", () => {
    expect(() => assertTelemetryPermitted("public")).not.toThrow();
    for (const dataClass of ["operational", "customer-business", "customer-confidential", "credential", "audit"] as const) {
      expect(() => assertTelemetryPermitted(dataClass)).toThrow();
    }
  });

  it("encrypts confidential and credential classes in the application layer", () => {
    expect(dataClassPolicies["customer-confidential"].encryptionAtRest).toBe("application");
    expect(dataClassPolicies.credential.encryptionAtRest).toBe("application");
  });
});
