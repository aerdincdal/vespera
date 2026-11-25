#!/usr/bin/env node
/**
 * Snapshot the live backend's module catalogue into src/lib/mock/generated/modules.json.
 * The frontend adapts this raw JSON at import time (see src/lib/mock/modules.ts), so the
 * offline experience mirrors the API exactly. Usage: `npm run sync-mock [-- --api http://host:8000]`.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../src/lib/mock/generated/modules.json");

const argApi = process.argv.indexOf("--api");
const API = (argApi > -1 && process.argv[argApi + 1]) || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getJson(path) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${API}${path}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

const list = await getJson("/api/modules");
if (!Array.isArray(list)) throw new Error("/api/modules did not return an array");

const modules = {};
const failed = [];
for (const entry of list) {
  const slug = typeof entry === "string" ? entry : entry?.slug;
  if (!slug) continue;
  try {
    modules[slug] = await getJson(`/api/modules/${slug}`);
    process.stdout.write(`  ✓ ${slug}\n`);
  } catch (e) {
    failed.push(slug);
    process.stdout.write(`  ✗ ${slug}: ${e.message}\n`);
  }
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), api: API, list, modules }, null, 2) + "\n", "utf8");
console.log(`\nWrote ${Object.keys(modules).length}/${list.length} modules → ${OUT}`);
if (failed.length) {
  console.log(`Failed: ${failed.join(", ")}`);
  process.exitCode = 2;
}
