import { afterEach, describe, expect, it, vi } from "vitest";
import { isPlatformAdministratorEmail, resolveCustomerSession } from "./index";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("production authentication boundary", () => {
  it("never enables the demo identity in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EXPORTHQ_DEMO_MODE", "true");
    vi.stubEnv("CLERK_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");

    const session = await resolveCustomerSession(new Request("https://export-hq.com/ExportPanel/"));

    expect(session.status).toBe("misconfigured");
    expect(session.isDemo).toBe(false);
    expect(session.isPlatformAdmin).toBe(false);
    expect(session.principal).toBeNull();
    expect(session.features).toEqual([
      "home",
      "learning",
      "plans",
      "readiness",
      "markets",
      "opportunities",
      "export-studio"
    ]);
  });

  it("keeps the realistic demo adapter available for local development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("EXPORTHQ_DEMO_MODE", "true");

    const session = await resolveCustomerSession(new Request("http://localhost:3001/"));

    expect(session.status).toBe("active");
    expect(session.isDemo).toBe(true);
    expect(session.isPlatformAdmin).toBe(true);
    expect(session.tier).toBe("managed");
    expect(session.principal?.organizationId).toBe("org_abc_textiles");
  });

  it("recognizes only explicitly allowlisted administrator emails", () => {
    vi.stubEnv("EXPORTHQ_PLATFORM_ADMIN_EMAILS", "owner@example.com, Admin@Export-HQ.com ");

    expect(isPlatformAdministratorEmail("OWNER@example.com")).toBe(true);
    expect(isPlatformAdministratorEmail("admin@export-hq.com")).toBe(true);
    expect(isPlatformAdministratorEmail("member@example.com")).toBe(false);
    expect(isPlatformAdministratorEmail(null)).toBe(false);
  });
});
