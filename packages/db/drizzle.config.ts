import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations-v2",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgres://localhost/exporthq" },
  strict: true,
  verbose: true
});
