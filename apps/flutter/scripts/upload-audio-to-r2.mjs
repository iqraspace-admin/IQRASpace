#!/usr/bin/env node
/**
 * Uploads Listening Mode's whole-Surah audio (Al-Afasy recitation + Urdu
 * translation, from `Resources/` at the repo root) to a **dedicated**
 * Cloudflare R2 bucket — deliberately not apps/quran's Supabase project
 * (or any Supabase project at all); see apps/flutter/AUDIO.md for why
 * (apps/quran's own COST.md/ARCHITECTURE.md explicitly reject
 * self-hosting audio there, and R2's lack of a per-object size cap plus
 * egress-free bandwidth fit this ~600MB+ whole-Surah use case better than
 * Supabase Storage's free tier did).
 *
 * No transcoding step: `Resources/Urdu Audio (Surah-wise)` turned out to
 * already be mono/16kHz/24kbps (confirmed via `ffprobe` on the largest
 * file, Al-Baqara) — already smaller than any reasonable re-encode
 * target, so transcoding it only made files bigger (~2.7x, matching the
 * 24kbps -> 64kbps ratio exactly) and was dropped. Uploaded as-is.
 *
 * Uses `@aws-sdk/client-s3` against R2's S3-compatible API — unlike the
 * old Supabase version of this script, a hand-rolled `fetch()` isn't
 * practical here since R2 uploads need SigV4 request signing, which the
 * SDK already implements correctly.
 *
 * Usage (from apps/flutter/scripts):
 *   Create apps/flutter/scripts/.env.local with (see .env.local.example):
 *     R2_ACCOUNT_ID=<Cloudflare account id>
 *     R2_ACCESS_KEY_ID=<R2 API token access key id>
 *     R2_SECRET_ACCESS_KEY=<R2 API token secret access key>
 *     R2_BUCKET=quran-audio
 *     R2_PUBLIC_BASE_URL=https://audio.iqraspace.org
 *   npm install && npm run upload:audio
 *
 * The bucket itself, its public custom domain, and the API token are all
 * created once, manually, in the Cloudflare dashboard — see
 * apps/flutter/AUDIO.md's "Cloudflare R2 setup" section. This script
 * intentionally does not auto-create the bucket (unlike the old Supabase
 * version): a bucket created via API here would still be missing its
 * custom-domain binding, which can only be done in the dashboard anyway.
 *
 * Safe to re-run — lists what's already in the bucket first and skips
 * those Surahs, so an interrupted run just picks up where it left off.
 * Writes `audio-manifest.json` (this directory) with the public URL for
 * every Surah successfully uploaded — not read by the app itself (see
 * `lib/core/constants/arabic_surah_audio.dart` / `urdu_surah_audio.dart`,
 * which compute URLs by convention instead).
 */

import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, ListObjectsV2Command, PutObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARABIC_SOURCE_DIR = path.join(__dirname, "..", "..", "..", "Resources", "Al-Afasy Recitation");
const URDU_SOURCE_DIR = path.join(__dirname, "..", "..", "..", "Resources", "Urdu Audio (Surah-wise)");
// Written by split-large-audio.mjs for the 5 Surahs whose whole file
// exceeded Supabase Storage's old 50MiB limit — see that script's
// header. R2 has no such limit, so this is purely historical: these
// Surahs stay split (re-merging already-verified audio would be
// unnecessary rework), but no *new* Surah needs splitting going forward.
const SPLIT_DIR = path.join(ARABIC_SOURCE_DIR, "split");
const SPLIT_MANIFEST_PATH = path.join(SPLIT_DIR, "split-manifest.json");

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET;
const PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL;
const MAX_ATTEMPTS = 3;

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}
if (!R2_ACCOUNT_ID) fail("Missing R2_ACCOUNT_ID — see apps/flutter/scripts/.env.local.example.");
if (!R2_ACCESS_KEY_ID) fail("Missing R2_ACCESS_KEY_ID — see apps/flutter/scripts/.env.local.example.");
if (!R2_SECRET_ACCESS_KEY) fail("Missing R2_SECRET_ACCESS_KEY — see apps/flutter/scripts/.env.local.example.");
if (!BUCKET) fail("Missing R2_BUCKET — see apps/flutter/scripts/.env.local.example.");
if (!PUBLIC_BASE_URL) fail("Missing R2_PUBLIC_BASE_URL (the bucket's public custom domain) — see apps/flutter/scripts/.env.local.example.");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

async function verifyBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch (err) {
    throw new Error(
      `Bucket "${BUCKET}" not reachable (${err.message}). Create it in the Cloudflare dashboard first — see apps/flutter/AUDIO.md's "Cloudflare R2 setup" section.`,
    );
  }
}

async function listExisting(prefix) {
  const names = new Set();
  let ContinuationToken;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken }));
    for (const obj of res.Contents ?? []) names.add(obj.Key.slice(prefix.length));
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return names;
}

async function uploadOne(localPath, objectPath) {
  const Body = await readFile(localPath);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: objectPath, Body, ContentType: "audio/mpeg" }));
      return;
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) throw new Error(`upload ${objectPath} failed: ${err.message}`);
      console.warn(`  retrying ${objectPath} (attempt ${attempt} failed: ${err.message})`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

function publicUrl(objectPath) {
  return `${PUBLIC_BASE_URL}/${objectPath}`;
}

/** `{ "4": [{part:1, durationMs}, {part:2, durationMs}], ... }`, or `{}` if split-large-audio.mjs hasn't been run. */
async function loadSplitManifest() {
  if (!existsSync(SPLIT_MANIFEST_PATH)) return {};
  return JSON.parse(await readFile(SPLIT_MANIFEST_PATH, "utf8"));
}

/** Uploads every split Surah's parts (from SPLIT_DIR) to `arabic/{NNN}_part{i}.mp3`, recording `manifest[surahNumber].arabicParts = [{url, durationMs}, ...]` — never a plain `arabicUrl` for these, since there is no one file. */
async function uploadSplitParts({ splitManifest, manifest }) {
  const surahNumbers = Object.keys(splitManifest);
  if (surahNumbers.length === 0) return;

  const existing = await listExisting("arabic/");
  console.log(`\nAl-Afasy (split parts): ${surahNumbers.length} Surah(s) split.`);
  let uploaded = 0;
  let skipped = 0;
  for (const surahNumberStr of surahNumbers.sort((a, b) => Number(a) - Number(b))) {
    const surahNumber = Number(surahNumberStr);
    const padded = surahNumberStr.padStart(3, "0");
    const parts = splitManifest[surahNumberStr];
    const arabicParts = [];
    for (const { part, durationMs } of parts) {
      const objectName = `${padded}_part${part}.mp3`;
      const objectPath = `arabic/${objectName}`;
      const localPath = path.join(SPLIT_DIR, objectName);
      if (existing.has(objectName)) {
        skipped++;
      } else {
        await uploadOne(localPath, objectPath);
        uploaded++;
        console.log(`  [${objectName}] uploaded`);
      }
      arabicParts.push({ url: publicUrl(objectPath), durationMs });
    }
    manifest[surahNumber] ??= {};
    manifest[surahNumber].arabicParts = arabicParts;
  }
  console.log(`Al-Afasy (split parts): ${uploaded} uploaded, ${skipped} skipped (already present).`);
}

async function uploadSet({ sourceDir, prefix, label, manifest, manifestKey, skipSurahNumbers }) {
  if (!existsSync(sourceDir)) {
    console.warn(`skip ${label}: source dir not found (${sourceDir})`);
    return;
  }
  // Local filenames vary ("004.mp3" for freshly-fetched Al-Afasy Surahs,
  // "001 Al Fatiha.mp3" / "001 - Al-Faatiha.mp3" for the originally
  // shipped ones) — only the leading 3-digit Surah number matters. The
  // uploaded object name is always normalized to `{NNN}.mp3` so the
  // bucket layout (and therefore the Dart constants generated from it)
  // stays uniform regardless of local naming.
  const files = (await readdir(sourceDir))
    .filter((f) => /^\d{3}/.test(f) && f.toLowerCase().endsWith(".mp3"))
    .filter((f, i, arr) => arr.indexOf(f) === i) // readdir shouldn't repeat, but stay defensive
    // Already-split Surahs (see uploadSplitParts) are handled entirely
    // through their parts — the whole file here is never uploaded for
    // them (it would just duplicate the split parts' content).
    .filter((f) => !skipSurahNumbers?.has(Number(f.slice(0, 3))));
  const existing = await listExisting(`${prefix}/`);
  console.log(`\n${label}: ${files.length} local file(s), ${existing.size} already in bucket.`);

  let uploaded = 0;
  let skipped = 0;
  for (const file of files.sort()) {
    const surahNumber = Number(file.slice(0, 3));
    const objectName = `${file.slice(0, 3)}.mp3`;
    const objectPath = `${prefix}/${objectName}`;
    const localPath = path.join(sourceDir, file);

    if (existing.has(objectName)) {
      skipped++;
    } else {
      await uploadOne(localPath, objectPath);
      uploaded++;
      console.log(`  [${objectName}] uploaded (from "${file}")`);
    }
    manifest[surahNumber] ??= {};
    manifest[surahNumber][manifestKey] = publicUrl(objectPath);
  }
  console.log(`${label}: ${uploaded} uploaded, ${skipped} skipped (already present).`);
}

async function main() {
  await verifyBucket();

  const manifest = {};
  const splitManifest = await loadSplitManifest();
  const splitSurahNumbers = new Set(Object.keys(splitManifest).map(Number));

  await uploadSet({
    sourceDir: ARABIC_SOURCE_DIR,
    prefix: "arabic",
    label: "Al-Afasy (Arabic)",
    manifest,
    manifestKey: "arabicUrl",
    skipSurahNumbers: splitSurahNumbers,
  });
  await uploadSplitParts({ splitManifest, manifest });
  await uploadSet({
    sourceDir: URDU_SOURCE_DIR,
    prefix: "urdu",
    label: "Urdu translation",
    manifest,
    manifestKey: "urduUrl",
  });

  const manifestPath = path.join(__dirname, "audio-manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to ${manifestPath} (${Object.keys(manifest).length} Surah entries).`);
}

main().catch((err) => {
  console.error("upload-audio-to-r2.mjs failed:", err);
  process.exit(1);
});
