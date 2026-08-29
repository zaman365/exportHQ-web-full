import { writeFile } from "node:fs/promises";

const origin =
  process.env.EXPORTHQ_PRODUCTION_ORIGIN ?? "https://export-hq.com";
const outputPath =
  process.env.EXPORTHQ_UPTIME_OUTPUT ?? "/tmp/exporthq-uptime.json";
const checks = [];

async function check(path, options, accept) {
  const startedAt = new Date().toISOString();
  const start = performance.now();
  try {
    const response = await fetch(`${origin}${path}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
      ...options,
    });
    const body = await response.text();
    const passed = accept(response, body);
    checks.push({
      path,
      startedAt,
      durationMs: Math.round(performance.now() - start),
      status: response.status,
      passed,
    });
  } catch (error) {
    checks.push({
      path,
      startedAt,
      durationMs: Math.round(performance.now() - start),
      status: null,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

await check(
  "/",
  {},
  (response, body) => response.status === 200 && /Export HQ/i.test(body),
);
await check(
  "/ExportPanel/preview",
  {},
  (response, body) =>
    response.status === 200 && /preview|illustrative/i.test(body),
);
await check(
  "/ExportPanel/plans",
  {},
  (response, body) => response.status === 200 && body.length > 1_000,
);
await check(
  "/ExportPanel/api/webhooks/clerk",
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  },
  (response) => response.status === 400 || response.status === 401,
);

const report = {
  checkedAt: new Date().toISOString(),
  origin,
  passed: checks.every((item) => item.passed),
  checks,
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

if (!report.passed) process.exitCode = 1;
