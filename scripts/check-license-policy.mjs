import { readFile } from "node:fs/promises";

const input = JSON.parse(await readFile(process.argv[2] ?? "licenses.json", "utf8"));
if (input.error) {
  throw new Error(`Could not generate the production license inventory: ${input.error.message ?? "unknown error"}`);
}

// pnpm groups packages by SPDX expression at the top level. Match complete
// copyleft identifiers rather than substrings: `LGPL-3.0-or-later` contains
// `GPL-3.0` but is a distinct license and must not become a false positive.
const forbiddenIdentifier = /(^|[ (])(?:AGPL-|GPL-3\.0(?:-|\b)|SSPL-)/;
const found = Object.keys(input).filter((license) => forbiddenIdentifier.test(license));
if (found.length) throw new Error(`Forbidden production dependency licenses found: ${found.join(", ")}`);
process.stdout.write("Production dependency license policy passed.\n");
