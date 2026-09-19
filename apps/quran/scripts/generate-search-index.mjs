#!/usr/bin/env node
// Generates public/search-index.json from the already-synced Quran
// content (src/content/generated/) — English (Sahih International, resource
// 85) translation text only, matching the IqraSpace Flutter app's own
// search scope. A build-time step, not a live query, same "synced content,
// no request-time third-party call" model as the rest of this app's Quran
// text (see QURAN-CONTENT.md) — the search page just fetches this one
// static JSON file client-side. Re-run after `npm run sync:content`
// whenever verse/translation content changes.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "src", "content", "generated");
const OUT_FILE = path.join(process.cwd(), "public", "search-index.json");
const ENGLISH_RESOURCE_ID = 85;

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(CONTENT_DIR, relativePath), "utf-8"));
}

const chapters = readJson("chapters.json").chapters;
const entries = [];

for (const chapter of chapters) {
  let content;
  try {
    content = readJson(`surah/${chapter.id}.json`);
  } catch {
    continue;
  }
  for (const verse of content.verses) {
    const translation = verse.translations.find((t) => t.resource_id === ENGLISH_RESOURCE_ID);
    if (!translation) continue;
    entries.push({
      key: verse.verse_key,
      surahId: chapter.id,
      surahName: chapter.name_simple,
      ayah: verse.verse_number,
      text: translation.text,
    });
  }
}

writeFileSync(OUT_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), entries }));
console.log(`Wrote ${entries.length} verses to ${OUT_FILE}`);
