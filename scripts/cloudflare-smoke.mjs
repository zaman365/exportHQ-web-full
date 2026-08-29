import { spawn } from "node:child_process";

const port = Number(process.env.EXPORTHQ_SMOKE_PORT ?? 8788);
const origin = `http://127.0.0.1:${port}`;
const processHandle = spawn("node_modules/.bin/wrangler", [
  "dev", "--local", "--port", String(port), "--config", "dist/server/wrangler.json"
], {
  cwd: new URL("../apps/app/", import.meta.url),
  env: {
    ...process.env,
    NODE_ENV: "production",
    EXPORTHQ_ENVIRONMENT: "production",
    EXPORTHQ_DEMO_MODE: "false",
    NEXT_PUBLIC_SITE_URL: "https://export-hq.com",
    NEXT_PUBLIC_APP_URL: "https://export-hq.com/ExportPanel"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let output = "";
processHandle.stdout.on("data", (chunk) => { output = `${output}${chunk}`.slice(-12_000); });
processHandle.stderr.on("data", (chunk) => { output = `${output}${chunk}`.slice(-12_000); });

async function waitForWorker() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (processHandle.exitCode !== null) throw new Error(`Worker exited before smoke checks.\n${output}`);
    try {
      const response = await fetch(`${origin}/ExportPanel/preview`, { redirect: "manual" });
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Worker did not become ready.\n${output}`);
}

try {
  await waitForWorker();
  const preview = await fetch(`${origin}/ExportPanel/preview`);
  if (preview.status !== 200 || !(await preview.text()).match(/preview|illustrative/i)) {
    throw new Error("ExportPanel preview smoke failed.");
  }

  const plans = await fetch(`${origin}/ExportPanel/plans`);
  if (plans.status !== 200 || !(await plans.text()).includes("Checkout is not active")) {
    throw new Error("Plans fail-closed smoke failed.");
  }

  const webhook = await fetch(`${origin}/ExportPanel/api/webhooks/clerk`, { method: "POST", body: "{}" });
  if (webhook.status !== 503) throw new Error(`Unconfigured webhook returned ${webhook.status}.`);

  process.stdout.write("Cloudflare artifact smoke passed.\n");
} finally {
  processHandle.kill("SIGTERM");
}
