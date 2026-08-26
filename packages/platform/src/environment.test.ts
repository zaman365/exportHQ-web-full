import { describe, expect, it } from "vitest";
import { isDemoModeEnabled, previewAdaptersPermitted, runtimeEnvironment } from "./environment";

describe("runtime environment", () => {
  it("prefers the explicit Export HQ environment label", () => {
    expect(runtimeEnvironment({ EXPORTHQ_ENVIRONMENT: "production", NODE_ENV: "development" })).toBe("production");
  });

  it("falls back to NODE_ENV so an unlabelled production build fails closed", () => {
    expect(runtimeEnvironment({ NODE_ENV: "production" })).toBe("production");
  });

  it("defaults to development when nothing is set", () => {
    expect(runtimeEnvironment({})).toBe("development");
  });
});

describe("preview adapters", () => {
  it("are never permitted in production", () => {
    expect(previewAdaptersPermitted({ EXPORTHQ_ENVIRONMENT: "production" })).toBe(false);
    expect(previewAdaptersPermitted({ NODE_ENV: "production" })).toBe(false);
  });

  it("are permitted in development, test and preview", () => {
    for (const environment of ["development", "test", "preview"]) {
      expect(previewAdaptersPermitted({ EXPORTHQ_ENVIRONMENT: environment })).toBe(true);
    }
  });
});

describe("demo identity", () => {
  it("cannot be enabled in production however it is configured", () => {
    expect(isDemoModeEnabled({ EXPORTHQ_ENVIRONMENT: "production", EXPORTHQ_DEMO_MODE: "true" })).toBe(false);
    expect(isDemoModeEnabled({ NODE_ENV: "production", EXPORTHQ_DEMO_MODE: "true" })).toBe(false);
  });

  it("is opt-out outside production", () => {
    expect(isDemoModeEnabled({ EXPORTHQ_ENVIRONMENT: "development" })).toBe(true);
    expect(isDemoModeEnabled({ EXPORTHQ_ENVIRONMENT: "development", EXPORTHQ_DEMO_MODE: "false" })).toBe(false);
  });
});
