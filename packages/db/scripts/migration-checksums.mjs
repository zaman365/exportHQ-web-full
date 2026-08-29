import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const migrationsDirectory = fileURLToPath(new URL("../migrations-v2/", import.meta.url));
const manifestPath = path.join(migrationsDirectory, "checksums.sha256");

async function calculatedManifest() {
  const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();
  const lines = [];
  for (const file of files) {
    const content = await readFile(path.join(migrationsDirectory, file));
    const checksum = createHash("sha256").update(content).digest("hex");
    lines.push(`${checksum}  ${file}`);
  }
  return `${lines.join("\n")}\n`;
}

const command = process.argv[2] ?? "validate";
const calculated = await calculatedManifest();

if (command === "update") {
  await writeFile(manifestPath, calculated, "utf8");
  process.stdout.write(`Updated ${manifestPath}\n`);
} else if (command === "validate") {
  const recorded = await readFile(manifestPath, "utf8");
  if (recorded !== calculated) {
    throw new Error("Migration checksum mismatch. Never edit an applied migration; add a new migration and update the manifest.");
  }
  process.stdout.write("Migration checksums are valid.\n");
} else {
  throw new Error(`Unknown checksum command: ${command}`);
}
