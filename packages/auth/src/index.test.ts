import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveCustomerSession } from "./index";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("production authentication boundary", () => {
  it("never enables the demo identity in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EXPORTHQ_DEMO_MODE", "true");
    vi.stubEnv("CLERK_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");

    const session = await resolveCustomerSession(new Request("https://trevv.export-hq.com/"));

    expect(session.status).toBe("misconfigured");
    expect(session.isDemo).toBe(false);
    expect(session.principal).toBeNull();
    expect(session.features).toEqual(["home", "learning"]);
  });

  it("keeps the realistic demo adapter available for local development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("EXPORTHQ_DEMO_MODE", "true");

    const session = await resolveCustomerSession(new Request("http://localhost:3001/"));

    expect(session.status).toBe("active");
    expect(session.isDemo).toBe(true);
    expect(session.tier).toBe("managed");
    expect(session.principal?.organizationId).toBe("org_abc_textiles");
  });
});
