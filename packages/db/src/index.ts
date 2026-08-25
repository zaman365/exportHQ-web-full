import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type ExportHqDatabase = ReturnType<typeof createDatabase>;

export function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, { prepare: false, max: 8 });
  return drizzle(client, { schema });
}

export { schema };
export { upsertMarketIntelligenceCatalog, type MarketOpportunitySeed } from "./market-intelligence";
