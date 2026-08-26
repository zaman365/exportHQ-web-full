import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createDatabase, type ExportHqDatabase } from "./index";
import { readTenantContext, withPlatformTransaction, withTenantTransaction } from "./tenant";
import { recordAuditEvent } from "./audit";
import { grantOrganizationEntitlement, readOrganizationTier } from "./entitlements";
import { saveCompanyProfile, readCompanyProfile } from "./repositories/company-profile";

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
    await database.execute(sql`
      insert into organizations (id, clerk_organization_id, slug, legal_name, trading_name)
      values
        (${tenantA}::uuid, 'org_isolationtestaaaa', 'tenant-a', 'Tenant A Ltd', 'Tenant A'),
        (${tenantB}::uuid, 'org_isolationtestbbbb', 'tenant-b', 'Tenant B Ltd', 'Tenant B')
      on conflict (clerk_organization_id) do nothing`);
  });

  afterAll(async () => {
    await database.execute(
      sql`delete from organizations where id in (${tenantA}::uuid, ${tenantB}::uuid)`
    );
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
});
