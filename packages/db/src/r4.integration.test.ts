import { beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { createDatabase, type ExportHqDatabase } from "./index";
import { withTenantTransaction } from "./tenant";
import {
  createBillingAccount,
  createManualSubscriptionGrant,
  issueCustomerBillingInvoice,
  readBillingCatalog
} from "./repositories/billing";
import { createSelfServiceCheckout, readPublicBetaUsage } from "./repositories/public-beta-billing";
import {
  acceptExternalGuestGrant,
  authorizeExternalGuest,
  createCustomerApiClient,
  createCustomerWebhookSubscription,
  createExternalGuestGrant,
  queueCustomerWebhookDelivery,
  verifyCustomerWebhookSubscription
} from "./repositories/external-collaboration";
import { createProviderCase } from "./repositories/provider-operations";
import {
  billingProviderConfigurations,
  customerWebhookDeliveries,
  customerWebhookSubscriptions
} from "./schema";

const databaseUrl = process.env.EXPORTHQ_TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("R4 public beta controls", () => {
  let database: ExportHqDatabase;
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    database = createDatabase(databaseUrl as string);
    const suffix = crypto.randomUUID().slice(0, 8);
    const rowsA = (await database.execute(sql`select organization_id from app_upsert_organization(
      ${`org_r4a_${suffix}`}, ${`r4-a-${suffix}`}, 'R4 Synthetic A Ltd', 'R4 Synthetic A'
    )`)) as unknown as Array<{ organization_id: string }>;
    const rowsB = (await database.execute(sql`select organization_id from app_upsert_organization(
      ${`org_r4b_${suffix}`}, ${`r4-b-${suffix}`}, 'R4 Synthetic B Ltd', 'R4 Synthetic B'
    )`)) as unknown as Array<{ organization_id: string }>;
    tenantA = rowsA[0]?.organization_id ?? "";
    tenantB = rowsB[0]?.organization_id ?? "";
    expect(tenantA).toMatch(/^[0-9a-f-]{36}$/);
    expect(tenantB).toMatch(/^[0-9a-f-]{36}$/);
  });

  const customer = (organizationId: string, actorId = "user_r4_owner") => ({ organizationId, actorId, actorType: "customer" as const });
  const operations = (organizationId: string) => ({ organizationId, actorId: "staff_r4_operations", actorType: "staff" as const });

  it("keeps the technical billing provider candidate inactive and checkout closed", async () => {
    const [candidate] = await database.select({
      id: billingProviderConfigurations.id,
      status: billingProviderConfigurations.status
    }).from(billingProviderConfigurations).where(eq(billingProviderConfigurations.providerKey, "sslcommerz"));
    expect(candidate).toMatchObject({ status: "candidate" });
    await expect(database.update(billingProviderConfigurations).set({ status: "active" }).where(eq(billingProviderConfigurations.id, candidate?.id ?? crypto.randomUUID()))).rejects.toThrow();

    const catalog = await database.transaction((tx) => readBillingCatalog(tx));
    const launch = catalog.find((price) => price.productKey === "launch");
    if (!launch || !candidate) throw new Error("Synthetic R4 billing prerequisites were not seeded.");
    const accountId = await withTenantTransaction(database, customer(tenantA), (tx, scoped) => createBillingAccount(tx, scoped, {
      legalName: "R4 Synthetic A Ltd",
      billingEmail: "billing-r4-a@synthetic.invalid",
      billingAddress: { city: "Dhaka", country: "BD" }
    }));
    const invoiceId = await withTenantTransaction(database, operations(tenantA), (tx, scoped) => issueCustomerBillingInvoice(tx, scoped, {
      billingAccountId: accountId,
      invoiceNumber: `R4-${crypto.randomUUID().slice(0, 8)}`,
      subtotalMinor: launch.amountMinor,
      taxMinor: 0,
      creditAppliedMinor: 0,
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60_000),
      documentStorageRef: "private-storage://synthetic/r4/invoice.pdf"
    }));
    await expect(withTenantTransaction(database, customer(tenantA), (tx, scoped) => createSelfServiceCheckout(tx, scoped, {
      billingAccountId: accountId,
      invoiceId,
      planPriceId: launch.id,
      providerKey: "sslcommerz",
      merchantTransactionId: `r4-${crypto.randomUUID()}`,
      idempotencyKey: `r4-${crypto.randomUUID()}`,
      returnStateHashSha256: "a".repeat(64),
      expiresAt: new Date(Date.now() + 15 * 60_000)
    }))).rejects.toThrow("not activated");
  });

  it("returns all exact usage limits and projected BDT charges from the internal ledger", async () => {
    const catalog = await database.transaction((tx) => readBillingCatalog(tx));
    const scale = catalog.find((price) => price.productKey === "scale");
    if (!scale) throw new Error("Synthetic Scale price was not seeded.");
    const accountId = await withTenantTransaction(database, customer(tenantB), (tx, scoped) => createBillingAccount(tx, scoped, {
      legalName: "R4 Synthetic B Ltd",
      billingEmail: "billing-r4-b@synthetic.invalid",
      billingAddress: { city: "Dhaka", country: "BD" }
    }));
    await withTenantTransaction(database, operations(tenantB), (tx, scoped) => createManualSubscriptionGrant(tx, scoped, {
      billingAccountId: accountId,
      planPriceId: scale.id,
      currentPeriodStart: new Date(Date.now() - 60_000),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60_000),
      manualGrantReference: "synthetic-r4-scale-contract"
    }));
    const usage = await withTenantTransaction(database, customer(tenantB), (tx, scoped) => readPublicBetaUsage(tx, scoped, {
      active_lane: 8,
      editor: 15,
      storage_byte: 30 * 1_073_741_824,
      automation_unit: 2_250,
      work_pack: 1
    }));
    expect(usage?.currency).toBe("BDT");
    expect(usage?.usage.map((item) => item.capability)).toEqual(["active_lane", "editor", "storage_byte", "automation_unit", "work_pack"]);
    expect(usage?.usage.every((item) => Number.isSafeInteger(item.included) && item.included >= 0)).toBe(true);
    expect(usage?.projectedChargeMinor).toBeGreaterThan(0);
  });

  it("limits guests to one exact resource and rejects broad customer API export scope", async () => {
    const resourceId = crypto.randomUUID();
    const grantId = await withTenantTransaction(database, customer(tenantA), (tx, scoped) => createExternalGuestGrant(tx, scoped, {
      guestActorId: "guest_r4_buyer",
      guestType: "buyer",
      purpose: "buyer_review",
      resourceType: "quotation",
      resourceId,
      permissions: ["read", "comment"],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000)
    }));
    await withTenantTransaction(database, customer(tenantA, "guest_r4_buyer"), (tx, scoped) => acceptExternalGuestGrant(tx, scoped, { grantId, guestActorId: "guest_r4_buyer" }));
    await withTenantTransaction(database, customer(tenantA, "guest_r4_buyer"), (tx, scoped) => authorizeExternalGuest(tx, scoped, { guestActorId: "guest_r4_buyer", resourceType: "quotation", resourceId, permission: "read" }));
    await expect(withTenantTransaction(database, customer(tenantA, "guest_r4_buyer"), (tx, scoped) => authorizeExternalGuest(tx, scoped, { guestActorId: "guest_r4_buyer", resourceType: "quotation", resourceId: crypto.randomUUID(), permission: "read" }))).rejects.toThrow("exact external guest grant");
    await expect(withTenantTransaction(database, customer(tenantB, "guest_r4_buyer"), (tx, scoped) => authorizeExternalGuest(tx, scoped, { guestActorId: "guest_r4_buyer", resourceType: "quotation", resourceId, permission: "read" }))).rejects.toThrow("exact external guest grant");
    await expect(withTenantTransaction(database, customer(tenantA), (tx, scoped) => createCustomerApiClient(tx, scoped, {
      name: "Forbidden bulk exporter",
      clientKey: `r4-${crypto.randomUUID()}`,
      secretHashSha256: "b".repeat(64),
      scopes: ["export:read"],
      rateLimitPerMinute: 60,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000)
    }))).rejects.toThrow("reviewed allowlist");
  });

  it("requires verification before webhooks activate and operations authority before delivery", async () => {
    const clientId = await withTenantTransaction(database, customer(tenantA), (tx, scoped) => createCustomerApiClient(tx, scoped, {
      name: "Synthetic shipment reader",
      clientKey: `r4-client-${crypto.randomUUID()}`,
      secretHashSha256: "c".repeat(64),
      scopes: ["shipment:read", "shipment:event:read"],
      rateLimitPerMinute: 30,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000)
    }));
    const subscriptionId = await withTenantTransaction(database, customer(tenantA), (tx, scoped) => createCustomerWebhookSubscription(tx, scoped, {
      apiClientId: clientId,
      endpointUrl: "https://webhook.synthetic.invalid/exporthq",
      eventTypes: ["shipment.updated"],
      signingSecretRef: "secret://synthetic/r4/customer-webhook/v1"
    }));
    await expect(withTenantTransaction(database, customer(tenantA), (tx, scoped) => verifyCustomerWebhookSubscription(tx, scoped, subscriptionId))).rejects.toThrow("reviewed operations");
    await withTenantTransaction(database, operations(tenantA), (tx, scoped) => verifyCustomerWebhookSubscription(tx, scoped, subscriptionId));
    const [subscription] = await withTenantTransaction(database, customer(tenantA), (tx) => tx.select().from(customerWebhookSubscriptions).where(eq(customerWebhookSubscriptions.id, subscriptionId)));
    expect(subscription).toMatchObject({ status: "active", secretVersion: 1 });
    await expect(withTenantTransaction(database, customer(tenantA), (tx, scoped) => queueCustomerWebhookDelivery(tx, scoped, {
      subscriptionId,
      eventType: "shipment.updated",
      resourceType: "shipment",
      resourceId: crypto.randomUUID(),
      payloadHashSha256: "d".repeat(64),
      replayNonce: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID()
    }))).rejects.toThrow("reviewed operations");
    await expect(withTenantTransaction(database, customer(tenantA), (tx) => tx.insert(customerWebhookDeliveries).values({
      organizationId: tenantA,
      subscriptionId,
      eventType: "shipment.updated",
      resourceType: "shipment",
      resourceId: crypto.randomUUID(),
      payloadHashSha256: "e".repeat(64),
      secretVersion: 1,
      replayNonce: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      signedAt: new Date()
    }))).rejects.toThrow();
  });

  it("does not create provider cases without current reviewed verification evidence", async () => {
    await expect(withTenantTransaction(database, customer(tenantA), (tx, scoped) => createProviderCase(tx, scoped, {
      providerId: "d4000000-0000-4000-8000-000000000001",
      category: "freight_forwarder",
      scope: "Synthetic Hamburg lane handoff",
      feeDisclosure: "Customer pays the provider's quoted fee directly.",
      commissionDisclosure: "Export HQ receives no commission.",
      commercialRelationship: "No commercial relationship.",
      rankingBasis: "No ranking; customer selected this provider.",
      responseDueAt: new Date(Date.now() + 24 * 60 * 60_000),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000)
    }))).rejects.toThrow("not currently verified");
  });
});
