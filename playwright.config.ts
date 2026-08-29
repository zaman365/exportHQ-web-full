import { defineConfig, devices } from "@playwright/test";

const port = process.env.EXPORTHQ_E2E_PORT ?? "3197";
const localBaseUrl = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["line"]] : "line",
  use: {
    baseURL: process.env.EXPORTHQ_E2E_BASE_URL ?? localBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } }
  ],
  webServer: process.env.EXPORTHQ_E2E_EXTERNAL_SERVER === "1" ? undefined : {
    command: `pnpm --filter @exporthq/app exec next start --hostname 127.0.0.1 --port ${port}`,
    url: `${localBaseUrl}/ExportPanel/preview`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
      EXPORTHQ_ENVIRONMENT: "production",
      EXPORTHQ_DEMO_MODE: "false",
      NEXT_PUBLIC_SITE_URL: "https://export-hq.com",
      NEXT_PUBLIC_APP_URL: "https://export-hq.com/ExportPanel"
    }
  }
});
