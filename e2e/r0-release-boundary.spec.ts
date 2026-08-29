import { expect, test } from "@playwright/test";

test("public preview is useful and explicitly synthetic", async ({ page }) => {
  await page.goto("/ExportPanel/preview");
  await expect(page).toHaveTitle(/ExportPanel/i);
  await expect(page.getByText("Preview → Onboarding → Launch, Scale, or Managed")).toBeVisible();
  await expect(page.getByText("Sample readiness score")).toBeVisible();
});

test("plan discovery stays visible while checkout fails closed", async ({ page }) => {
  await page.goto("/ExportPanel/plans");
  await expect(page.getByRole("heading", { name: /Start with the work/i })).toBeVisible();
  await expect(page.getByText("Checkout is not active")).toBeVisible();
  await expect(page.getByText(/Preview|Planned/).first()).toBeVisible();
});

test("protected activation state is not disclosed", async ({ request }) => {
  const response = await request.get("/ExportPanel/api/activation", { maxRedirects: 0 });
  expect([302, 307, 404]).toContain(response.status());
});

test("unconfigured webhooks refuse state changes", async ({ request }) => {
  const response = await request.post("/ExportPanel/api/webhooks/clerk", {
    data: { type: "organization.created", data: { id: "org_synthetic", name: "Synthetic" } }
  });
  expect(response.status()).toBe(503);
});
