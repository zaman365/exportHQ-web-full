import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createDatabase } from "../index";
import { withTenantTransaction } from "../tenant";
import { processClerkWebhookDelivery, WebhookPayloadConflictError } from "./clerk";

const databaseUrl = process.env.EXPORTHQ_TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("durable Clerk projection", () => {
  const database = createDatabase(databaseUrl as string);
  const organizationEvent = {
    type: "organization.created",
    data: { id: "org_webhooktest01", slug: "webhook-test", name: "Webhook Test Ltd" }
  };

  it("projects a verified organization once and detects delivery-id conflicts", async () => {
    const first = await processClerkWebhookDelivery(database, {
      eventId: "evt_org_projection_01",
      eventType: organizationEvent.type,
      payloadHash: "hash-org-01",
      payload: organizationEvent
    });
    expect(first).toMatchObject({ status: "processed", duplicate: false });
    expect(first.organizationId).toBeTruthy();

    const duplicate = await processClerkWebhookDelivery(database, {
      eventId: "evt_org_projection_01",
      eventType: organizationEvent.type,
      payloadHash: "hash-org-01",
      payload: organizationEvent
    });
    expect(duplicate).toMatchObject({ status: "processed", duplicate: true });

    await expect(processClerkWebhookDelivery(database, {
      eventId: "evt_org_projection_01",
      eventType: organizationEvent.type,
      payloadHash: "different-hash",
      payload: organizationEvent
    })).rejects.toBeInstanceOf(WebhookPayloadConflictError);
  });

  it("projects membership only after the organization bridge resolves", async () => {
    const projected = await processClerkWebhookDelivery(database, {
      eventId: "evt_membership_projection_01",
      eventType: "organizationMembership.created",
      payloadHash: "hash-membership-01",
      payload: {
        type: "organizationMembership.created",
        data: {
          organization: { id: "org_webhooktest01" },
          public_user_data: { user_id: "user_webhooktest01" },
          role: "org:member"
        }
      }
    });
    expect(projected).toMatchObject({ status: "processed", duplicate: false });
    expect(projected.organizationId).toBeTruthy();

    const rows = await withTenantTransaction(database, {
      organizationId: projected.organizationId as string,
      actorId: "user_webhooktest01",
      actorType: "customer"
    }, (tx) => tx.execute(sql`
      select clerk_user_id, role, active from organization_memberships
      where clerk_user_id = 'user_webhooktest01'
    `));
    expect(rows).toEqual([{ clerk_user_id: "user_webhooktest01", role: "org:member", active: true }]);
  });

  it("moves an unprojectable delivery to dead letter after bounded retries", async () => {
    const attempts = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      attempts.push(await processClerkWebhookDelivery(database, {
        eventId: "evt_missing_org_01",
        eventType: "organizationMembership.created",
        payloadHash: "hash-missing-org-01",
        payload: {
          type: "organizationMembership.created",
          data: {
            organization: { id: "org_missingwebhook01" },
            public_user_data: { user_id: "user_missing01" },
            role: "org:member"
          }
        }
      }));
    }

    expect(attempts.slice(0, 5).every((result) => result.status === "failed")).toBe(true);
    expect(attempts[5]?.status).toBe("dead_letter");
  });
});
