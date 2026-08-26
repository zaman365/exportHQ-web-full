import { beforeEach, describe, expect, it } from "vitest";
import {
  consumeRateLimit,
  enforceRateLimit,
  hashClientAddress,
  MemoryRateLimitStore,
  rateLimitHeaders,
  RateLimitedError
} from "./rate-limit";

const store = new MemoryRateLimitStore();

beforeEach(() => store.clear());

describe("rate limiting", () => {
  it("allows the steady rate plus the burst allowance, then refuses", async () => {
    const now = new Date("2026-08-26T09:00:00.000Z");
    let last = await consumeRateLimit({ action: "authentication", subject: "user_1", store, now });
    for (let attempt = 1; attempt < 15; attempt += 1) {
      last = await consumeRateLimit({ action: "authentication", subject: "user_1", store, now });
    }
    expect(last.allowed).toBe(true);
    expect(last.remaining).toBe(0);

    const refused = await consumeRateLimit({ action: "authentication", subject: "user_1", store, now });
    expect(refused.allowed).toBe(false);
    expect(refused.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps subjects independent so one tenant cannot exhaust another", async () => {
    const now = new Date("2026-08-26T09:00:00.000Z");
    for (let attempt = 0; attempt < 16; attempt += 1) {
      await consumeRateLimit({ action: "document-upload-intent", subject: "org_a", store, now });
    }
    const other = await consumeRateLimit({ action: "document-upload-intent", subject: "org_b", store, now });
    expect(other.allowed).toBe(true);
  });

  it("keeps actions independent so uploads cannot lock out sign-in", async () => {
    const now = new Date("2026-08-26T09:00:00.000Z");
    for (let attempt = 0; attempt < 45; attempt += 1) {
      await consumeRateLimit({ action: "document-upload-intent", subject: "org_a", store, now });
    }
    expect((await consumeRateLimit({ action: "authentication", subject: "org_a", store, now })).allowed).toBe(true);
  });

  it("refills after the window closes", async () => {
    const start = new Date("2026-08-26T09:00:00.000Z");
    for (let attempt = 0; attempt < 16; attempt += 1) {
      await consumeRateLimit({ action: "authentication", subject: "user_1", store, now: start });
    }
    const later = new Date("2026-08-26T09:06:00.000Z");
    expect((await consumeRateLimit({ action: "authentication", subject: "user_1", store, now: later })).allowed).toBe(true);
  });

  it("throws a safe error carrying Retry-After", async () => {
    const now = new Date("2026-08-26T09:00:00.000Z");
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await consumeRateLimit({ action: "customer-export", subject: "org_a", store, now });
    }
    await expect(enforceRateLimit({ action: "customer-export", subject: "org_a", store, now })).rejects.toBeInstanceOf(
      RateLimitedError
    );
  });

  it("renders standard rate-limit headers", () => {
    const headers = rateLimitHeaders({
      allowed: false,
      remaining: 0,
      limit: 4,
      resetAt: new Date(Date.now() + 60_000),
      retryAfterSeconds: 60
    });
    expect(headers["Retry-After"]).toBe("60");
    expect(headers["RateLimit-Limit"]).toBe("4");
  });
});

describe("client address hashing", () => {
  it("never returns the address and changes with the salt", async () => {
    const first = await hashClientAddress("203.0.113.7", "salt-a");
    const second = await hashClientAddress("203.0.113.7", "salt-b");
    expect(first).not.toContain("203.0.113.7");
    expect(first).not.toBe(second);
    expect(first).toHaveLength(32);
  });
});
