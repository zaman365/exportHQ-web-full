import { beforeAll, describe, expect, it } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { createDatabase, type ExportHqDatabase } from "./index";
import { readTenantContext, withPlatformTransaction, withTenantTransaction } from "./tenant";
import { recordAuditEvent } from "./audit";
import { grantOrganizationEntitlement, readOrganizationTier } from "./entitlements";
import { saveCompanyProfile, readCompanyProfile } from "./repositories/company-profile";
import { PostgresIdempotencyStore, PostgresRateLimitStore } from "./stores";
import { createExportLane, listExportLanes, transitionStoredExportLane } from "./repositories/export-lanes";
import {
  authorizeEvidenceDownload,
  consumeEvidenceUploadIntent,
  createEvidenceUploadIntent,
  recordEvidenceScanResult
} from "./repositories/evidence-vault";
import {
  addBusinessVerificationEvidence,
  createBusinessVerificationCase,
  readBusinessVerificationCase,
  transitionBusinessVerificationCase
} from "./repositories/business-verification";
import { auditEvents, documentUploadIntents, exportLaneStageEvents, organizationMemberships, products } from "./schema";

/**
 * Cross-tenant isolation, proved against a real PostgreSQL with the migrations
 * and the non-owner application role applied.
 *
 * These do not run without `EXPORTHQ_TEST_DATABASE_URL`. They are skipped
 * rather than faked, because a mocked row-level security test proves nothing:
 * the behaviour under test lives in the database, not in this repository.
 */

const databaseUrl = process.env.EXPORTHQ_TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

const tenantA = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const tenantB = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";

describeWithDatabase("tenant isolation", () => {
  let database: ExportHqDatabase;

  beforeAll(async () => {
    database = createDatabase(databaseUrl as string);
    const rows = (await database.execute(sql`
      select
        app_resolve_organization('org_syntheticaaaaa') as tenant_a,
        app_resolve_organization('org_syntheticbbbbb') as tenant_b
    `)) as unknown as Array<{ tenant_a: string; tenant_b: string }>;
    expect(rows[0]).toEqual({ tenant_a: tenantA, tenant_b: tenantB });
  });

  function context(organizationId: string) {
    return { organizationId, actorId: "user_test", actorType: "customer" as const };
  }

  it("applies the tenant context inside the transaction", async () => {
    const read = await withTenantTransaction(database, context(tenantA), (tx) => readTenantContext(tx));
    expect(read.organizationId).toBe(tenantA);
    expect(read.actorType).toBe("customer");
  });

  it("discards the context on commit so a pooled connection cannot carry it", async () => {
    await withTenantTransaction(database, context(tenantA), async () => undefined);
    const leaked = (await database.execute(
      sql`select coalesce(nullif(current_setting('app.organization_id', true), ''), '') as organization_id`
    )) as unknown as Array<{ organization_id: string }>;
    expect(leaked[0]?.organization_id).toBe("");
  });

  it("does not expose another tenant's profile", async () => {
    await withTenantTransaction(database, context(tenantA), (tx, scoped) =>
      saveCompanyProfile(tx, scoped, { originCountryCode: "BD", industry: "Textiles" })
    );

    const seenByB = await withTenantTransaction(database, context(tenantB), (tx, scoped) =>
      readCompanyProfile(tx, scoped)
    );
    expect(seenByB).toBeNull();

    const seenByA = await withTenantTransaction(database, context(tenantA), (tx, scoped) =>
      readCompanyProfile(tx, scoped)
    );
    expect(seenByA?.industry).toBe("Textiles");
  });

  it("keeps Export Lanes tenant-scoped and records controlled transitions", async () => {
    const suffix = Date.now().toString();
    const lane = await withTenantTransaction(database, context(tenantA), async (tx, scoped) => {
      const [membership] = await tx.insert(organizationMemberships).values({
        organizationId: tenantA,
        clerkUserId: `user_lane_${suffix}`,
        role: "org:member"
      }).returning({ id: organizationMemberships.id });
      const [product] = await tx.insert(products).values({
        organizationId: tenantA,
        sku: `LANE-${suffix}`,
        name: "Synthetic lane product",
        category: "Synthetic",
        countryOfOrigin: "BD",
        currency: "USD"
      }).returning({ id: products.id });
      if (!membership || !product) throw new Error("Synthetic lane prerequisites were not created.");
      return createExportLane(tx, scoped, {
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
    });

    const active = await withTenantTransaction(database, context(tenantA), (tx, scoped) =>
      transitionStoredExportLane(tx, scoped, {
        exportLaneId: lane.id,
        expectedVersion: lane.version,
        status: "active",
        rationale: "Synthetic integration path"
      })
    );
    expect(active.version).toBe(2);
    expect(active.status).toBe("active");

    const transitionEvidence = await withTenantTransaction(database, context(tenantA), async (tx) => {
      const stageHistory = await tx.select().from(exportLaneStageEvents).where(and(
        eq(exportLaneStageEvents.organizationId, tenantA),
        eq(exportLaneStageEvents.exportLaneId, lane.id)
      ));
      const audit = await tx.select().from(auditEvents).where(and(
        eq(auditEvents.organizationId, tenantA),
        eq(auditEvents.entityId, lane.id)
      ));
      return { stageHistory, audit };
    });
    expect(transitionEvidence.stageHistory).toHaveLength(1);
    expect(transitionEvidence.stageHistory[0]?.aggregateVersion).toBe(2);
    expect(transitionEvidence.audit.map((event) => event.action)).toEqual(expect.arrayContaining([
      "export_lane.created",
      "export_lane.transitioned"
    ]));

    const visibleToA = await withTenantTransaction(database, context(tenantA), (tx, scoped) =>
      listExportLanes(tx, scoped, { limit: 100 })
    );
    const visibleToB = await withTenantTransaction(database, context(tenantB), (tx, scoped) =>
      listExportLanes(tx, scoped, { limit: 100 })
    );
    expect(visibleToA.items.some((item) => item.id === lane.id)).toBe(true);
    expect(visibleToB.items.some((item) => item.id === lane.id)).toBe(false);
  });

  it("runs the synthetic evidence and business-verification path without arbitrary URLs", async () => {
    const checksum = "a".repeat(64);
    const intent = await withTenantTransaction(database, context(tenantA), async (tx, scoped) => {
      await saveCompanyProfile(tx, scoped, { originCountryCode: "BD", industry: "Synthetic verification" });
      return createEvidenceUploadIntent(tx, scoped, {
        name: "Synthetic registration.pdf",
        category: "company",
        linkedEntityType: "organization",
        linkedEntityId: tenantA,
        mimeType: "application/pdf",
        byteSize: 128,
        checksumSha256: checksum,
        expiresAt: new Date(Date.now() + 5 * 60_000)
      });
    });
    await withTenantTransaction(database, context(tenantA), (tx, scoped) =>
      consumeEvidenceUploadIntent(tx, scoped, {
        intentId: intent.id,
        object: { key: intent.objectKey, size: intent.byteSize, etag: "synthetic-etag", version: "quarantine-v1" },
        checksumSha256: checksum
      })
    );
    await withTenantTransaction(
      database,
      { organizationId: tenantA, actorId: "system_scanner", actorType: "system" },
      (tx, scoped) => recordEvidenceScanResult(tx, scoped, {
        documentVersionId: intent.documentVersionId,
        state: "clean",
        attempt: 1,
        scannerReference: "synthetic-scan",
        promotedObject: { key: intent.objectKey, size: intent.byteSize, etag: "synthetic-clean-etag", version: "clean-v1" }
      })
    );
    const download = await withTenantTransaction(
      database,
      { organizationId: tenantA, actorId: "system_reviewer", actorType: "system" },
      (tx, scoped) => authorizeEvidenceDownload(tx, scoped, intent.documentVersionId)
    );
    expect(download.objectKey).toBe(intent.objectKey);

    const verificationCase = await withTenantTransaction(database, context(tenantA), (tx, scoped) =>
      createBusinessVerificationCase(tx, scoped, {
        legalName: "Synthetic A Ltd",
        countryCode: "BD",
        registrationAuthority: "Synthetic registry",
        registrationNumber: `SYN-${Date.now()}`,
        registrationType: "company_registration",
        website: "https://synthetic.invalid",
        businessEmail: "verification@synthetic.invalid"
      })
    );
    await withTenantTransaction(database, context(tenantA), (tx, scoped) =>
      addBusinessVerificationEvidence(tx, scoped, {
        caseId: verificationCase.id,
        documentVersionId: intent.documentVersionId,
        evidenceType: "registration_extract"
      })
    );
    const submitted = await withTenantTransaction(database, context(tenantA), (tx, scoped) =>
      transitionBusinessVerificationCase(tx, scoped, {
        caseId: verificationCase.id,
        expectedVersion: verificationCase.version,
        status: "submitted",
        rationale: "Synthetic evidence package complete"
      })
    );
    const underReview = await withTenantTransaction(
      database,
      { organizationId: tenantA, actorId: "staff_reviewer", actorType: "staff" },
      (tx, scoped) => transitionBusinessVerificationCase(tx, scoped, {
        caseId: verificationCase.id,
        expectedVersion: submitted.version,
        status: "under_review",
        rationale: "Synthetic reviewer accepted assignment",
        reviewDueAt: new Date(Date.now() + 24 * 60 * 60_000)
      })
    );
    const verified = await withTenantTransaction(
      database,
      { organizationId: tenantA, actorId: "staff_reviewer", actorType: "staff" },
      (tx, scoped) => transitionBusinessVerificationCase(tx, scoped, {
        caseId: verificationCase.id,
        expectedVersion: underReview.version,
        status: "verified",
        rationale: "Synthetic facts reconciled to clean evidence"
      })
    );
    expect(verified.status).toBe("verified");

    const otherTenantCase = await withTenantTransaction(database, context(tenantB), (tx, scoped) =>
      readBusinessVerificationCase(tx, scoped, verificationCase.id)
    );
    const otherTenantIntents = await withTenantTransaction(database, context(tenantB), (tx) =>
      tx.select().from(documentUploadIntents)
    );
    expect(otherTenantCase).toBeNull();
    expect(otherTenantIntents.some((record) => record.id === intent.id)).toBe(false);
  });

  it("refuses a write aimed at another tenant even with a valid context", async () => {
    await expect(
      withTenantTransaction(database, context(tenantA), (tx) =>
        tx.execute(sql`insert into company_profiles (organization_id, origin_country_code, industry)
                       values (${tenantB}::uuid, 'DE', 'Machinery')`)
      )
    ).rejects.toThrow();
  });

  it("returns nothing for tenant tables without an organization context", async () => {
    const rows = await withPlatformTransaction(database, { actorId: "system", actorType: "system" }, (tx) =>
      tx.execute(sql`select count(*)::int as total from company_profiles`)
    );
    expect((rows as unknown as Array<{ total: number }>)[0]?.total).toBe(0);
  });

  it("does not expose organization rows without their tenant context", async () => {
    const unscoped = await withPlatformTransaction(
      database,
      { actorId: "system", actorType: "system" },
      (tx) => tx.execute(sql`select count(*)::int as total from organizations`)
    );
    expect((unscoped as unknown as Array<{ total: number }>)[0]?.total).toBe(0);

    const scoped = await withTenantTransaction(database, context(tenantA), (tx) =>
      tx.execute(sql`select id from organizations`)
    );
    expect(scoped).toEqual([{ id: tenantA }]);
  });

  it("refuses direct identity-projection writes from the application role", async () => {
    await expect(database.execute(sql`
      insert into organizations (clerk_organization_id, slug, legal_name, trading_name)
      values ('org_directwriteblocked', 'blocked', 'Blocked Ltd', 'Blocked')
    `)).rejects.toThrow();
  });

  it("writes an audit event in the same transaction as the change", async () => {
    await expect(
      withTenantTransaction(database, context(tenantA), async (tx, scoped) => {
        await saveCompanyProfile(tx, scoped, { originCountryCode: "BD", industry: "Rolled back" });
        await recordAuditEvent(tx, scoped, {
          action: "company_profile.updated",
          entityType: "company_profile",
          entityId: scoped.organizationId
        });
        throw new Error("deliberate rollback");
      })
    ).rejects.toThrow("deliberate rollback");

    const profile = await withTenantTransaction(database, context(tenantA), (tx, scoped) =>
      readCompanyProfile(tx, scoped)
    );
    expect(profile?.industry).not.toBe("Rolled back");
  });

  it("refuses to let a customer actor grant itself an entitlement", async () => {
    await expect(
      withTenantTransaction(database, context(tenantA), (tx, scoped) =>
        grantOrganizationEntitlement(tx, scoped, { tier: "managed", source: "paid", reason: "self grant" })
      )
    ).rejects.toThrow();
  });

  it("lets a system actor grant an entitlement the tenant can then read", async () => {
    await withTenantTransaction(
      database,
      { organizationId: tenantA, actorId: "system", actorType: "system" },
      (tx, scoped) =>
        grantOrganizationEntitlement(tx, scoped, { tier: "scale", source: "pilot", reason: "pilot exporter" })
    );

    const tier = await withTenantTransaction(database, context(tenantA), (tx, scoped) =>
      readOrganizationTier(tx, scoped)
    );
    expect(tier).toBe("scale");

    const otherTier = await withTenantTransaction(database, context(tenantB), (tx, scoped) =>
      readOrganizationTier(tx, scoped)
    );
    expect(otherTier).toBe("explore");
  });

  it("atomically enforces a shared rate-limit ceiling under concurrency", async () => {
    const store = new PostgresRateLimitStore(database);
    const now = Date.now();
    const decisions = await Promise.all(Array.from({ length: 40 }, () => store.consume(
      `integration-rate-${now}`,
      { now, resetAt: now + 60_000, ceiling: 7 }
    )));

    expect(decisions.filter((decision) => decision.allowed)).toHaveLength(7);
    expect(decisions.filter((decision) => !decision.allowed)).toHaveLength(33);
    expect(Math.max(...decisions.map((decision) => decision.count))).toBe(7);
  });

  it("lets exactly one concurrent caller claim an idempotency key", async () => {
    const store = new PostgresIdempotencyStore(database, "integration");
    const key = `claim-${Date.now()}`;
    const claims = await Promise.all(Array.from({ length: 30 }, () =>
      store.claim(key, "request-hash", new Date())
    ));

    expect(claims.filter(Boolean)).toHaveLength(1);
    expect((await store.read(key))?.attempts).toBe(1);
  });
});
