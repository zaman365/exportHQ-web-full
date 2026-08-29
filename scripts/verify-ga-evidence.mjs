import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assessGeneralAvailabilityEvidence } from "../packages/domain/src/general-availability.ts";

const manifestArgument = process.argv[2];
if (!manifestArgument) {
  throw new Error("Usage: node --experimental-strip-types scripts/verify-ga-evidence.mjs <manifest.json>");
}

const manifestPath = resolve(process.cwd(), manifestArgument);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
let violations;
try {
  violations = assessGeneralAvailabilityEvidence(manifest, {
    sourceSha: process.env.EXPECTED_SHA,
    releaseTag: process.env.RELEASE_TAG,
    artifactSha256: process.env.EXPECTED_ARTIFACT_SHA256
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(`Malformed General Availability evidence manifest: ${message}`);
}

if (violations.length) {
  process.stderr.write(`General Availability promotion refused (${violations.length} violation(s)):\n`);
  for (const violation of violations) process.stderr.write(`- ${violation}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`General Availability evidence accepted for ${manifest.releaseTag} at ${manifest.sourceSha}.\n`);
}
