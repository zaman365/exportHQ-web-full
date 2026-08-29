import { describe, expect, it } from "vitest";
import { structuredLogLine } from "./observability";

describe("structuredLogLine", () => {
  it("emits one searchable JSON record with central redaction", () => {
    expect(JSON.parse(structuredLogLine("webhook.failed", {
      outcome: "retry",
      authorization: "Bearer secret-value",
      error: new Error("contact ops@example.com")
    }))).toEqual({
      event: "webhook.failed",
      outcome: "retry",
      authorization: "[redacted]",
      error: { name: "Error", message: "contact [redacted]@example.com" }
    });
  });
});
