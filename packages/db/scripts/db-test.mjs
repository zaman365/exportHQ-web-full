import { spawnSync } from "node:child_process";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const migrationsFolder = fileURLToPath(new URL("../migrations-v2/", import.meta.url));

function safeTestUrl(name, value) {
  if (!value) throw new Error(`${name} is required.`);
  const parsed = new URL(value);
  const databaseName = parsed.pathname.replace(/^\//, "");
  const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (!local && !/(^|[_-])(test|ci)([_-]|$)/i.test(databaseName)) {
    throw new Error(`${name} must point to localhost or an explicitly named test/CI database.`);
  }
  return value;
}

async function withClient(url, work) {
  const client = postgres(url, { prepare: false, max: 1 });
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

async function reset(url) {
  if (process.env.EXPORTHQ_ALLOW_TEST_RESET !== "1") {
    throw new Error("EXPORTHQ_ALLOW_TEST_RESET=1 is required for a test reset.");
  }
  await withClient(url, async (client) => {
    await client.unsafe("drop schema if exists public cascade");
    // Drizzle records applied migrations outside `public`. Keeping that
    // journal while deleting the application schema makes the next migrate a
    // dangerous no-op, so a test reset must clear both schemas atomically from
    // the same database-owner session.
    await client.unsafe("drop schema if exists drizzle cascade");
    await client.unsafe("create schema public authorization current_user");
    await client.unsafe("grant all on schema public to current_user");
  });
}

async function runMigrations(url) {
  const client = postgres(url, { prepare: false, max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder });
  } finally {
    await client.end();
  }
}

async function seed(url) {
  await withClient(url, async (client) => {
    await client`
      insert into organizations (
        id, clerk_organization_id, slug, legal_name, trading_name,
        default_locale, default_timezone
      ) values
        ('3f2504e0-4f89-41d3-9a0c-0305e82c3301', 'org_syntheticaaaaa', 'synthetic-a', 'Synthetic A Ltd', 'Synthetic A', 'en', 'Asia/Dhaka'),
        ('6ba7b810-9dad-41d1-80b4-00c04fd430c8', 'org_syntheticbbbbb', 'synthetic-b', 'Synthetic B Ltd', 'Synthetic B', 'bn', 'Asia/Dhaka')
      on conflict (id) do nothing`;
    await client`
      insert into regulatory_publishers (
        id, slug, name, publisher_type, jurisdiction, canonical_base_url
      ) values (
        '11111111-1111-4111-8111-111111111111',
        'synthetic-eu-authority', 'Synthetic EU Authority', 'official', 'EU',
        'https://authority.synthetic.invalid'
      ) on conflict (id) do nothing`;
    await client`
      insert into regulatory_sources (
        id, publisher_id, canonical_url, title, jurisdiction, source_type,
        reference, content_hash_sha256, effective_from, retrieved_at,
        reviewed_at, reviewed_by, confidence, method_version,
        freshness_sla_days, next_review_at, review_state
      ) values (
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111',
        'https://authority.synthetic.invalid/rules/apparel',
        'Synthetic EU apparel requirement', 'EU', 'official_guidance',
        'Synthetic integration fixture; no real-world authority',
        repeat('b', 64), '2026-08-01T00:00:00Z', '2026-08-01T00:00:00Z',
        '2026-08-02T00:00:00Z', 'synthetic_reviewer', 'high',
        'synthetic-method-v1', 60, '2026-10-01T00:00:00Z', 'human_reviewed'
      ) on conflict (id) do nothing`;
    await client`
      insert into regulatory_rules (
        id, source_id, stable_key, version, jurisdiction, title, summary,
        product_categories, hs_codes, market_country_codes, effective_from,
        confidence, method_version, rule_version, review_state, reviewed_by,
        reviewed_at
      ) values (
        '33333333-3333-4333-8333-333333333333',
        '22222222-2222-4222-8222-222222222222',
        'synthetic.eu.apparel', 1, 'EU', 'Review synthetic EU apparel evidence',
        'Synthetic integration-only rule requiring a reviewed lane impact.',
        array['apparel'], array['62'], array['DE'], '2026-08-01T00:00:00Z',
        'high', 'synthetic-method-v1', 'synthetic-rule-v1', 'human_reviewed',
        'synthetic_reviewer', '2026-08-02T00:00:00Z'
      ) on conflict (id) do nothing`;
  });
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}.`);
}

const command = process.argv[2];
const migrationUrl = safeTestUrl(
  "EXPORTHQ_TEST_MIGRATION_DATABASE_URL",
  process.env.EXPORTHQ_TEST_MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL
);

if (command === "reset") {
  await reset(migrationUrl);
} else if (command === "migrate") {
  await runMigrations(migrationUrl);
} else if (command === "seed") {
  await seed(migrationUrl);
} else if (command === "backup") {
  const backupPath = process.env.EXPORTHQ_TEST_BACKUP_PATH ?? "/tmp/exporthq-test.backup";
  if (!backupPath.startsWith("/tmp/") && !backupPath.startsWith("/private/tmp/")) {
    throw new Error("Test backups must be written under /tmp.");
  }
  const backupUrl = safeTestUrl(
    "EXPORTHQ_TEST_BACKUP_DATABASE_URL",
    process.env.EXPORTHQ_TEST_BACKUP_DATABASE_URL
  );
  run("pg_dump", ["--format=custom", "--no-owner", `--file=${backupPath}`, backupUrl]);
} else if (command === "restore") {
  const restoreUrl = safeTestUrl("EXPORTHQ_TEST_RESTORE_DATABASE_URL", process.env.EXPORTHQ_TEST_RESTORE_DATABASE_URL);
  const backupPath = process.env.EXPORTHQ_TEST_BACKUP_PATH ?? "/tmp/exporthq-test.backup";
  await access(backupPath);
  await reset(restoreUrl);
  run("pg_restore", ["--no-owner", `--dbname=${restoreUrl}`, backupPath]);
} else {
  throw new Error(`Unknown db-test command: ${command ?? "missing"}`);
}
