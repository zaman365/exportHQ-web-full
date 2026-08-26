import { describe, expect, it } from "vitest";
import {
  executeIdempotently,
  hashRequestBody,
  IdempotencyConflictError,
  MemoryIdempotencyStore,
  retryDelaySeconds,
  shouldDeadLetter
} from "./idempotency";

describe("idempotent execution", () => {
  it("executes once and replays the recorded outcome", async () => {
    const store = new MemoryIdempotencyStore();
    let executions = 0;
    const run = () =>
      executeIdempotently({
        key: "evt_1",
        requestHash: "hash_1",
        store,
        execute: async () => {
          executions += 1;
          return { value: "created", resultReference: "org_1" };
        }
      });

    expect(await run()).toEqual({ status: "executed", value: "created" });
    expect(await run()).toEqual({ status: "replayed", resultReference: "org_1" });
    expect(executions).toBe(1);
  });

  it("refuses a reused key carrying a different body", async () => {
    const store = new MemoryIdempotencyStore();
    await executeIdempotently({
      key: "evt_1",
      requestHash: "hash_1",
      store,
      execute: async () => ({ value: 1, resultReference: null })
    });
    await expect(
      executeIdempotently({
        key: "evt_1",
        requestHash: "hash_2",
        store,
        execute: async () => ({ value: 2, resultReference: null })
      })
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
  });

  it("records a failure so the sender may retry", async () => {
    const store = new MemoryIdempotencyStore();
    await expect(
      executeIdempotently({
        key: "evt_2",
        requestHash: "hash",
        store,
        execute: async () => {
          throw new Error("downstream unavailable");
        }
      })
    ).rejects.toThrow("downstream unavailable");

    let retried = false;
    const outcome = await executeIdempotently({
      key: "evt_2",
      requestHash: "hash",
      store,
      execute: async () => {
        retried = true;
        return { value: "ok", resultReference: null };
      }
    });
    expect(retried).toBe(true);
    expect(outcome.status).toBe("executed");
  });

  it("hashes bodies stably and distinctly", async () => {
    expect(await hashRequestBody("{}")).toBe(await hashRequestBody("{}"));
    expect(await hashRequestBody("{}")).not.toBe(await hashRequestBody("{ }"));
  });
});

describe("bounded retries", () => {
  it("backs off and then dead-letters", () => {
    expect(retryDelaySeconds(1)).toBe(30);
    expect(retryDelaySeconds(4)).toBe(240);
    expect(shouldDeadLetter(5)).toBe(false);
    expect(shouldDeadLetter(6)).toBe(true);
    expect(retryDelaySeconds(6)).toBe(-1);
  });
});
