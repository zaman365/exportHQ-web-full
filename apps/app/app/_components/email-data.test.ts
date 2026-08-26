import { describe, expect, it } from "vitest";
import { emailThreadSeeds, emailThreadToInboxRequest } from "./email-data";

describe("email triage", () => {
  it("turns a mailbox conversation into linked actionable work", () => {
    const thread = emailThreadSeeds[0]!;
    const action = emailThreadToInboxRequest(thread, new Date("2026-08-26T09:00:00.000Z"));

    expect(action.source).toBe("Email Inbox");
    expect(action.relatedEntity).toBe(thread.relatedEntity);
    expect(action.href).toBe(thread.relatedHref);
    expect(action.status).toBe("open");
  });

  it("routes commercial payment terms to a durable decision", () => {
    const thread = emailThreadSeeds.find((item) => item.category === "finance")!;
    expect(emailThreadToInboxRequest(thread).kind).toBe("decision_request");
  });
});
