/* global process */
import { gzipSync } from "node:zlib";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const nextDirectory = path.join(root, "apps/app/.next");
const staticDirectory = path.join(nextDirectory, "static");
const budgets = JSON.parse(await readFile(path.join(root, "config/public-beta-budgets.json"), "utf8"));
const buildManifest = JSON.parse(await readFile(path.join(nextDirectory, "build-manifest.json"), "utf8"));

async function filesBelow(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return (await Promise.all(entries.map((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? filesBelow(target) : [target];
    }))).flat();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function gzipBytes(file) {
  return gzipSync(await readFile(file), { level: 9 }).byteLength;
}

const allStaticFiles = await filesBelow(staticDirectory);
const initialJs = new Set(buildManifest.rootMainFiles.map((file) => path.join(nextDirectory, file)));
for (const file of allStaticFiles) {
  const relative = path.relative(staticDirectory, file).replaceAll(path.sep, "/");
  if (/^chunks\/app\/(layout|billing\/page)-.+\.js$/.test(relative)) initialJs.add(file);
}
const cssFiles = allStaticFiles.filter((file) => file.endsWith(".css"));
const imageFiles = (await filesBelow(path.join(root, "apps/app/public"))).filter((file) => /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(file));
if (!initialJs.size || !cssFiles.length) throw new Error("A completed ExportPanel production build is required for the R4 budget check.");

const initialJavaScriptGzip = (await Promise.all([...initialJs].map(gzipBytes))).reduce((sum, value) => sum + value, 0);
const initialCssGzip = (await Promise.all(cssFiles.map(gzipBytes))).reduce((sum, value) => sum + value, 0);
const largestImage = imageFiles.length ? Math.max(...await Promise.all(imageFiles.map(async (file) => (await stat(file)).size))) : 0;
const measurements = { initialJavaScriptGzip, initialCssGzip, largestImage };
const failures = Object.entries(measurements).filter(([name, value]) => value > budgets.transferBytes[name]);

process.stdout.write(`${JSON.stringify({ measurements, budgets: budgets.transferBytes }, null, 2)}\n`);
if (failures.length) throw new Error(`Public Beta static payload budget exceeded: ${failures.map(([name]) => name).join(", ")}.`);
