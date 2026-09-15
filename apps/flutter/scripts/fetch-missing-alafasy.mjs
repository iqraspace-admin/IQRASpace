#!/usr/bin/env node
/**
 * Fills gaps in `Resources/Al-Afasy Recitation` (repo root, gitignored —
 * local working material, never committed) from quranicaudio.com's
 * Mishary Al-Afasy mirror. That folder is the source Listening Mode's
 * local/cached playback uploads to Supabase Storage from (see
 * `upload-audio-to-r2.mjs`) — this script is what keeps it at all
 * 114 Surahs rather than hand-downloading the rest one at a time.
 *
 * Deliberately plain Node ESM — see apps/quran/scripts/sync-content.mjs
 * for the same repo-wide convention. No API key needed; this CDN serves
 * public files over plain HTTPS.
 *
 * Usage (from apps/flutter/scripts): npm run fetch:missing-alafasy
 * Safe to re-run — already-present Surahs (any file already starting
 * with that zero-padded number) are skipped without a network call.
 */

import { createWriteStream, existsSync } from "node:fs";
import { mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESOURCES_DIR = path.join(__dirname, "..", "..", "..", "Resources", "Al-Afasy Recitation");
const BASE_URL = "https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee";
const TOTAL_SURAHS = 114;
const MAX_ATTEMPTS = 3;

function pad3(n) {
  return String(n).padStart(3, "0");
}

async function presentSurahNumbers() {
  if (!existsSync(RESOURCES_DIR)) {
    throw new Error(`Resources dir not found: ${RESOURCES_DIR} — run this from apps/flutter/scripts.`);
  }
  const files = await readdir(RESOURCES_DIR);
  const present = new Set();
  for (const f of files) {
    const m = f.match(/^(\d{3})/);
    if (m) present.add(Number(m[1]));
  }
  return present;
}

async function downloadOne(surahNumber) {
  const padded = pad3(surahNumber);
  const finalPath = path.join(RESOURCES_DIR, `${padded}.mp3`);
  const partPath = `${finalPath}.part`;
  const url = `${BASE_URL}/${padded}.mp3`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      await pipeline(res.body, createWriteStream(partPath));
      const { size } = await stat(partPath);
      if (size === 0) throw new Error("downloaded empty file");
      await rename(partPath, finalPath);
      console.log(`  [${padded}] OK (${(size / 1024 / 1024).toFixed(1)} MB)`);
      return true;
    } catch (err) {
      await rm(partPath, { force: true });
      console.warn(`  [${padded}] attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err.message}`);
      if (attempt < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.error(`  [${padded}] FAILED after ${MAX_ATTEMPTS} attempts.`);
  return false;
}

async function main() {
  await mkdir(RESOURCES_DIR, { recursive: true });
  const present = await presentSurahNumbers();
  const missing = [];
  for (let n = 1; n <= TOTAL_SURAHS; n++) {
    if (!present.has(n)) missing.push(n);
  }

  if (missing.length === 0) {
    console.log(`All ${TOTAL_SURAHS} Al-Afasy Surahs already present — nothing to fetch.`);
    return;
  }

  console.log(`Fetching ${missing.length} missing Al-Afasy Surah(s): ${missing.join(", ")}\n`);
  let ok = 0;
  for (const n of missing) {
    if (await downloadOne(n)) ok++;
  }
  console.log(`\nDone: ${ok}/${missing.length} downloaded successfully.`);
  if (ok < missing.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error("fetch-missing-alafasy.mjs failed:", err);
  process.exit(1);
});
