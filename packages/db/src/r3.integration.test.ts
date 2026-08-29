import { beforeAll, describe, expect, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { createDatabase, type ExportHqDatabase } from "./index";
import { withTenantTransaction } from "./tenant";
import { createExportLane } from "./repositories/export-lanes";
import {
  createBuyerAccount,
  createBuyerRfq,
  createSalesOpportunity,
  listBuyerPipeline,
  recordBuyerOutreachConsent,
  transitionBuyerRfq,
  transitionSalesOpportunity,
  updateBuyerVerification
} from "./repositories/buyers";
import {
  acceptQuotation,
  convertAcceptedQuotationToSalesOrder,
  createQuotation,
  createQuotationVersion,
  decideQuotationApproval,
  queueQuotationDelivery,
  recordQuotationDelivered
} from "./repositories/commercial";
import {
  createBillingAccount,
  createManualSubscriptionGrant,
  processSubscriptionCancellation,
  readBillingCatalog,
  requestSubscriptionCancellation
} from "./repositories/billing";
import {
  billingCancellationRequests,
  billingSubscriptions,
  buyerAccounts,
  organizationMemberships,
  products,
  quotationDeliveries,
  regulatorySourceCandidates,
  salesOrders
} from "./schema";

const databaseUrl = process.env.EXPORTHQ_TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("R3 private beta controls", () => {
  let database: ExportHqDatabase;
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    database = createDatabase(databaseUrl as string);
    const runSuffix = crypto.randomUUID().slice(0, 8);
    const tenantARows = (await database.execute(sql`
      select organization_id from app_upsert_organization(
        ${`org_r3synthetica_${runSuffix}`}, ${`r3-synthetic-a-${runSuffix}`}, 'R3 Synthetic A Ltd', 'R3 Synthetic A'
      )
    `)) as unknown as Array<{ organization_id: string }>;
    const tenantBRows = (await database.execute(sql`
      select organization_id from app_upsert_organization(
        ${`org_r3syntheticb_${runSuffix}`}, ${`r3-synthetic-b-${runSuffix}`}, 'R3 Synthetic B Ltd', 'R3 Synthetic B'
      )
    `)) as unknown as Array<{ organization_id: string }>;
    tenantA = tenantARows[0]?.organization_id ?? "";
    tenantB = tenantBRows[0]?.organization_id ?? "";
    expect(tenantA).toMatch(/^[0-9a-f-]{36}$/);
    expect(tenantB).toMatch(/^[0-9a-f-]{36}$/);
  });

  const customer = (organizationId: string, actorId = "user_r3_owner") => ({
    organizationId,
    actorId,
    actorType: "customer" as const
  });
  const operations = (organizationId: string) => ({
    organizationId,
    actorId: "staff_r3_operations",
    actorType: "staff" as const
  });

  it("keeps official source discoveries pending and runtime read-only", async () => {
    const candidates = await database.select().from(regulatorySourceCandidates);
    expect(candidates.length).toBeGreaterThanOrEqual(11);
    expect(candidates.every((candidate) => candidate.candidateState === "pending_review")).toBe(true);
    expect(candidates.every((candidate) => candidate.notes.startsWith("Discovery only."))).toBe(true);

    await expect(database.insert(regulatorySourceCandidates).values({
      publisherId: candidates[0]?.publisherId ?? crypto.randomUUID(),
      canonicalUrl: "https://unreviewed.synthetic.invalid",
      title: "Forbidden runtime source candidate",
      jurisdiction: "BD",
      sourceType: "synthetic",
      candidateFor: "permission proof",
      discoveredAt: new Date(),
      lastCheckedAt: new Date()
    })).rejects.toThrow();
  });

  it("enforces provenance, human review, exact quote approval, consent and explicit order conversion", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const setup = await withTenantTransaction(database, customer(tenantA), async (tx, scoped) => {
      const [membership] = await tx.insert(organizationMemberships).values({
        organizationId: tenantA,
        clerkUserId: `user_r3_${suffix}`,
        role: "org:admin"
      }).returning({ id: organizationMemberships.id });
      const [product] = await tx.insert(products).values({
        organizationId: tenantA,
        sku: `R3-${suffix}`,
        name: "Synthetic R3 cotton shirt",
        category: "apparel",
        countryOfOrigin: "BD",
        currency: "USD"
      }).returning({ id: products.id });
      if (!membership || !product) throw new Error("R3 prerequisites were not created.");
      const lane = await createExportLane(tx, scoped, {
        productId: product.id,
        originCountryCode: "BD",
        destinationCountryCode: "DE",
        salesChannel: "wholesale",
        buyerSegment: "synthetic importer",
        route: "Chattogram-Hamburg",
        incoterm: "FOB",
        targetMarginBps: 1800,
        currency: "USD",
        ownerMembershipId: membership.id
      });
      return { membershipId: membership.id, productId: product.id, laneId: lane.id };
    });

    await expect(withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      createBuyerAccount(tx, scoped, {
        legalName: "Unknown rights buyer",
        countryCode: "DE",
        sourceType: "public_business_site",
        sourceReference: "https://buyer.synthetic.invalid",
        rightsBasis: "unknown"
      })
    )).rejects.toThrow("cannot be unknown");

    const buyerId = await withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      createBuyerAccount(tx, scoped, {
        legalName: "Synthetic Buyer GmbH",
        countryCode: "DE",
        sourceType: "buyer_supplied",
        sourceReference: "synthetic-rfq.invalid",
        rightsBasis: "buyer supplied for quotation"
      })
    );
    await expect(withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      updateBuyerVerification(tx, scoped, {
        buyerAccountId: buyerId,
        status: "human_reviewed",
        evidenceLevel: "registry and direct confirmation",
        sourceReference: "synthetic-review.invalid",
        riskStatus: "low",
        riskRationale: "Synthetic integration evidence"
      })
    )).rejects.toThrow("reviewed operations actor");
    await withTenantTransaction(database, operations(tenantA), (tx, scoped) =>
      updateBuyerVerification(tx, scoped, {
        buyerAccountId: buyerId,
        status: "human_reviewed",
        evidenceLevel: "registry and direct confirmation",
        sourceReference: "synthetic-review.invalid",
        riskStatus: "low",
        riskRationale: "Synthetic integration evidence"
      })
    );
    const buyerView = await withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      listBuyerPipeline(tx, scoped)
    );
    expect(buyerView.find((buyer) => buyer.id === buyerId)).toMatchObject({
      verificationLabel: "Human reviewed",
      mayUseVerifiedLanguage: true,
      riskStatus: "low"
    });
    const otherTenantView = await withTenantTransaction(database, customer(tenantB), (tx, scoped) =>
      listBuyerPipeline(tx, scoped)
    );
    expect(otherTenantView.some((buyer) => buyer.id === buyerId)).toBe(false);

    const unreviewedBuyerId = await withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      createBuyerAccount(tx, scoped, {
        legalName: "Synthetic Unreviewed Buyer GmbH",
        countryCode: "DE",
        sourceType: "public_business_site",
        sourceReference: "https://unreviewed-buyer.synthetic.invalid",
        rightsBasis: "public business contact research"
      })
    );
    await expect(withTenantTransaction(database, customer(tenantA), (tx) =>
      tx.update(buyerAccounts).set({
        verificationStatus: "human_reviewed",
        verificationEvidenceLevel: "bypassed",
        verificationSourceRef: "bypassed.invalid",
        verifiedAt: new Date(),
        verifiedBy: "user_r3_owner"
      }).where(and(eq(buyerAccounts.organizationId, tenantA), eq(buyerAccounts.id, unreviewedBuyerId)))
    )).rejects.toThrow();

    const opportunityId = await withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      createSalesOpportunity(tx, scoped, {
        buyerAccountId: buyerId,
        exportLaneId: setup.laneId,
        title: "Synthetic first order",
        ownerMembershipId: setup.membershipId,
        expectedValueMinor: 250000,
        currency: "USD"
      })
    );
    await withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      transitionSalesOpportunity(tx, scoped, { opportunityId, toStatus: "qualified", expectedVersion: 1 })
    );
    const rfqId = await withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      createBuyerRfq(tx, scoped, {
        opportunityId,
        exportLaneId: setup.laneId,
        buyerReference: `SYN-RFQ-${suffix}`,
        requestedCurrency: "USD",
        requestedIncoterm: "FOB",
        deliveryCountryCode: "DE",
        receivedAt: new Date(),
        lines: [{
          productId: setup.productId,
          description: "Synthetic cotton shirts",
          quantity: 100,
          unit: "piece",
          targetUnitPriceMinor: 2400,
          targetCurrency: "USD"
        }]
      })
    );
    await withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      transitionBuyerRfq(tx, scoped, { rfqId, toStatus: "ready_to_quote", expectedVersion: 1 })
    );
    const quotationId = await withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      createQuotation(tx, scoped, { rfqId, ownerMembershipId: setup.membershipId })
    );
    const quotationVersionId = await withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      createQuotationVersion(tx, scoped, {
        quotationId,
        expectedCurrentVersion: 0,
        quote: {
          currency: "USD",
          incoterm: "FOB",
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60_000),
          assumptions: ["Synthetic integration fixture"],
          freightMinor: 1000,
          testingMinor: 500,
          financeMinor: 250,
          commissionMinor: 750,
          fxBufferMinor: 500,
          paymentTerms: "50% advance, 50% before shipment",
          deliveryTerms: "Synthetic delivery window",
          approvalPolicyVersion: "r3-policy-v1",
          generatedOutputRef: `private/quotes/${quotationId}/1.pdf`,
          generatedOutputHashSha256: "a".repeat(64),
          lines: [{
            productId: setup.productId,
            description: "Synthetic cotton shirts",
            quantity: 100,
            unit: "piece",
            unitPriceMinor: 2500
          }]
        }
      })
    );
    await expect(withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      decideQuotationApproval(tx, scoped, {
        quotationId,
        quotationVersionId,
        decision: "approved",
        signatoryRole: "organization_owner",
        policyVersion: "wrong-policy",
        rationale: "Synthetic approval"
      })
    )).rejects.toThrow("policy version does not match");
    const approvalId = await withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      decideQuotationApproval(tx, scoped, {
        quotationId,
        quotationVersionId,
        decision: "approved",
        signatoryRole: "organization_owner",
        policyVersion: "r3-policy-v1",
        rationale: "Synthetic owner approval of exact output"
      })
    );
    await expect(withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      queueQuotationDelivery(tx, scoped, {
        quotationId,
        approvalId,
        consentRecordId: crypto.randomUUID(),
        channel: "email",
        recipient: "buyer@synthetic.invalid",
        idempotencyKey: `quote-${suffix}`
      })
    )).rejects.toThrow("documented outreach permission");
    const consentRecordId = await withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      recordBuyerOutreachConsent(tx, scoped, {
        buyerAccountId: buyerId,
        channel: "email",
        state: "permitted",
        lawfulBasis: "buyer requested quotation",
        evidenceReference: `SYN-RFQ-${suffix}`
      })
    );
    const deliveryId = await withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      queueQuotationDelivery(tx, scoped, {
        quotationId,
        approvalId,
        consentRecordId,
        channel: "email",
        recipient: "buyer@synthetic.invalid",
        idempotencyKey: `quote-${suffix}`
      })
    );
    const replayedDeliveryId = await withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      queueQuotationDelivery(tx, scoped, {
        quotationId,
        approvalId,
        consentRecordId,
        channel: "email",
        recipient: "buyer@synthetic.invalid",
        idempotencyKey: `quote-${suffix}`
      })
    );
    expect(replayedDeliveryId).toBe(deliveryId);
    const invisibleDelivery = await withTenantTransaction(database, customer(tenantB), (tx) =>
      tx.select().from(quotationDeliveries).where(eq(quotationDeliveries.id, deliveryId))
    );
    expect(invisibleDelivery).toEqual([]);
    await expect(withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      recordQuotationDelivered(tx, scoped, { deliveryId, providerReference: "forbidden-customer-confirmation" })
    )).rejects.toThrow("delivery worker");
    await withTenantTransaction(database, operations(tenantA), (tx, scoped) =>
      recordQuotationDelivered(tx, scoped, { deliveryId, providerReference: `synthetic-provider-${suffix}` })
    );
    await expect(withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      acceptQuotation(tx, scoped, { quotationId, quotationVersionId, explicitlyConfirmed: false })
    )).rejects.toThrow("explicit human confirmation");
    await withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      acceptQuotation(tx, scoped, { quotationId, quotationVersionId, explicitlyConfirmed: true })
    );
    await expect(withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      convertAcceptedQuotationToSalesOrder(tx, scoped, {
        quotationId,
        orderNumber: `SYN-ORDER-${suffix}`,
        explicitlyConfirmed: false
      })
    )).rejects.toThrow("explicit human confirmation");
    const orderId = await withTenantTransaction(database, customer(tenantA), (tx, scoped) =>
      convertAcceptedQuotationToSalesOrder(tx, scoped, {
        quotationId,
        orderNumber: `SYN-ORDER-${suffix}`,
        explicitlyConfirmed: true
      })
    );
    const order = await withTenantTransaction(database, customer(tenantA), (tx) =>
      tx.select().from(salesOrders).where(eq(salesOrders.id, orderId))
    );
    expect(order).toHaveLength(1);
    expect(order[0]).toMatchObject({ status: "confirmed", currentVersion: 1 });
  });

  it("keeps R3 billing manual, lets the owner request cancellation, and denies customer ledger writes", async () => {
    const catalog = await database.transaction((tx) => readBillingCatalog(tx));
    expect(catalog.length).toBeGreaterThanOrEqual(5);
    expect(catalog.every((price) => price.selfServiceEnabled === false)).toBe(true);
    const launch = catalog.find((price) => price.productKey === "launch");
    if (!launch) throw new Error("R3 Launch catalog hypothesis was not seeded.");

    const billingAccountId = await withTenantTransaction(database, customer(tenantB), (tx, scoped) =>
      createBillingAccount(tx, scoped, {
        legalName: "Synthetic B Ltd",
        billingEmail: "billing@synthetic.invalid",
        billingAddress: { country: "BD", city: "Dhaka" }
      })
    );
    const periodStart = new Date();
    const periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60_000);
    await expect(withTenantTransaction(database, customer(tenantB), (tx, scoped) =>
      createManualSubscriptionGrant(tx, scoped, {
        billingAccountId,
        planPriceId: launch.id,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        manualGrantReference: "forbidden-self-grant"
      })
    )).rejects.toThrow("reviewed operations");
    const subscriptionId = await withTenantTransaction(database, operations(tenantB), (tx, scoped) =>
      createManualSubscriptionGrant(tx, scoped, {
        billingAccountId,
        planPriceId: launch.id,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        manualGrantReference: "synthetic-manual-contract"
      })
    );
    await expect(withTenantTransaction(database, customer(tenantB), (tx) =>
      tx.insert(billingSubscriptions).values({
        organizationId: tenantB,
        billingAccountId,
        planPriceId: launch.id,
        status: "active",
        source: "manual",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        createdBy: "user_r3_owner"
      })
    )).rejects.toThrow();
    const cancellationRequestId = await withTenantTransaction(database, customer(tenantB), (tx, scoped) =>
      requestSubscriptionCancellation(tx, scoped, {
        subscriptionId,
        reason: "Synthetic owner cancellation exercise"
      })
    );
    await expect(withTenantTransaction(database, customer(tenantB), (tx) =>
      tx.insert(billingCancellationRequests).values({
        organizationId: tenantB,
        subscriptionId,
        requestedBy: "different_actor",
        reason: "Forged actor",
        requestedAt: periodStart,
        effectiveAt: periodEnd
      })
    )).rejects.toThrow();
    await withTenantTransaction(database, operations(tenantB), (tx, scoped) =>
      processSubscriptionCancellation(tx, scoped, {
        cancellationRequestId,
        processingReference: "synthetic-ops-ticket"
      })
    );
    const processed = await withTenantTransaction(database, customer(tenantB), async (tx) => ({
      subscription: await tx.select().from(billingSubscriptions).where(eq(billingSubscriptions.id, subscriptionId)),
      request: await tx.select().from(billingCancellationRequests).where(eq(billingCancellationRequests.id, cancellationRequestId))
    }));
    expect(processed.subscription[0]?.cancelAtPeriodEnd).toBe(true);
    expect(processed.request[0]).toMatchObject({ status: "processed", processedBy: "staff_r3_operations" });
    const invisibleFromA = await withTenantTransaction(database, customer(tenantA), (tx) =>
      tx.select().from(billingCancellationRequests).where(eq(billingCancellationRequests.id, cancellationRequestId))
    );
    expect(invisibleFromA).toEqual([]);
  });
});
