#!/usr/bin/env node
/**
 * Refreshes the app's bundled offline Duas (assets/supplications.json) from
 * the Learning API's public, published-only feed — the same snapshot the app
 * downloads at runtime (GET {DUAS_API_URL}/duas/content). The bundled copy is
 * only the first-launch / offline fallback, so refresh it before a release.
 *
 * The file's hand-written `meta` block (title, description, languages,
 * coverage notes) is kept as-is; `version`, `generated_at` and `categories`
 * are replaced with the feed's.
 *
 * Usage (from apps/mobile/android):
 *   node scripts/refresh-bundled-duas.mjs
 *   node scripts/refresh-bundled-duas.mjs --source http://localhost:8787/learning/api --out /tmp/check.json
 */
import { readFileSync, writeFileSync } from "node:fs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const source = arg("--source", "https://iqraspace.org/learning/api").replace(/\/+$/, "");
const out = arg("--out", new URL("../assets/supplications.json", import.meta.url));
const current = new URL("../assets/supplications.json", import.meta.url);

const res = await fetch(`${source}/duas/content`, { headers: { Accept: "application/json" } });
if (!res.ok) {
  console.error(`✗ ${source}/duas/content -> HTTP ${res.status}`);
  process.exit(1);
}
const feed = await res.json();
if (!Array.isArray(feed?.categories) || !feed.categories.length || typeof feed.version !== "string") {
  console.error("✗ Unexpected feed payload (no categories/version) — not writing anything.");
  process.exit(1);
}

const { meta } = JSON.parse(readFileSync(current, "utf8"));
const next = { meta, version: feed.version, generated_at: feed.generated_at, categories: feed.categories };
writeFileSync(out, JSON.stringify(next, null, 1) + "\n");
const duas = new Set(feed.categories.flatMap((c) => c.duas.map((d) => d.slug))).size;
console.log(`✓ Wrote ${out instanceof URL ? out.pathname : out}: ${feed.categories.length} categories, ${duas} distinct Duas (version ${feed.version}).`);
