#!/usr/bin/env node
/**
 * Splits any `Resources/Al-Afasy Recitation` Surah file over Supabase
 * Storage's 50MiB free-tier object limit into sequential parts, each
 * comfortably under that limit — a storage workaround only, not a
 * change to the verified Surah audio itself (see
 * `upload-audio-to-r2.mjs`'s header and apps/flutter/AUDIO.md).
 *
 * Cut points are chosen at actual silence in the recitation (via
 * ffmpeg's `silencedetect` filter), nearest to each ideal
 * duration/N-fraction point, then cut with `-c copy` (no re-encode, no
 * quality loss, frame-accurate for MP3) — never mid-word/mid-ayah. Parts
 * are written back-to-back with no re-encoding at either boundary, so
 * there's nothing for a re-encode to introduce a gap or artifact with;
 * `IqraAudioHandler.playSurahLocal` plays them through
 * `ConcatenatingAudioSource`, which is gapless on Android (see its
 * `just_audio` doc comment).
 *
 * Uses the same bundled `ffmpeg-static` binary as this directory's other
 * scripts — no system ffmpeg/ffprobe required (duration and silence
 * detection are both read from plain `ffmpeg` stderr output, not
 * `ffprobe`, so only the one binary is needed).
 *
 * Usage (from apps/flutter/scripts): npm install && npm run split:large
 * Safe to re-run — a Surah already fully split (all expected part files
 * present) is skipped.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.join(__dirname, "..", "..", "..", "Resources", "Al-Afasy Recitation");
const OUTPUT_DIR = path.join(SOURCE_DIR, "split");

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
// Comfortably under the 50MiB hard limit — stream-copy cutting is exact
// on the requested timestamp, but the *silence point* chosen nearby (see
// findBestCut) can land a little off the ideal even split, so this
// leaves real headroom rather than targeting 50MiB itself.
const TARGET_PART_BYTES = 40 * 1024 * 1024;
// How far from each ideal cut point to search for real silence, and the
// minimum silence run to treat as a candidate. -30dB/0.35s (tried first)
// turned out too strict for this recording — it found only a handful of
// "silences" across an entire ~80-minute file, missing the vast majority
// of real ayah/word pauses (whose room-tone floor sits above -30dB) and
// forcing several Surahs to fall back to an exact-midpoint cut with no
// safety margin against landing mid-word. -25dB/0.2s found ~180
// candidates on the same file (one roughly every 25s) while still
// requiring a genuine 200ms drop in level, comfortably longer than a
// between-syllable dip within a word.
const SEARCH_WINDOW_SECONDS = 90;
const SILENCE_NOISE_DB = -25;
const MIN_SILENCE_SECONDS = 0.2;

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("close", (code) => resolve({ code, stderr }));
    proc.on("error", reject);
  });
}

async function probeDurationSeconds(filePath) {
  const { stderr } = await runFfmpeg(["-i", filePath, "-f", "null", "-"]);
  const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
  if (!m) throw new Error(`could not parse duration for ${filePath}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/** Every silence interval (in seconds) at least MIN_SILENCE_SECONDS long. */
async function detectSilences(filePath) {
  const { stderr } = await runFfmpeg([
    "-i", filePath,
    "-af", `silencedetect=noise=${SILENCE_NOISE_DB}dB:d=${MIN_SILENCE_SECONDS}`,
    "-f", "null", "-",
  ]);
  const starts = [...stderr.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...stderr.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => Number(m[1]));
  const n = Math.min(starts.length, ends.length);
  const intervals = [];
  for (let i = 0; i < n; i++) {
    intervals.push({ start: starts[i], end: ends[i], mid: (starts[i] + ends[i]) / 2 });
  }
  return intervals;
}

/** The detected silence interval's midpoint closest to `idealSeconds`, or `idealSeconds` itself if nothing was found within the search window (should be rare for Quran recitation). */
function findBestCut(idealSeconds, silences) {
  let best = null;
  let bestDistance = Infinity;
  for (const s of silences) {
    const distance = Math.abs(s.mid - idealSeconds);
    if (distance < bestDistance && distance <= SEARCH_WINDOW_SECONDS) {
      best = s.mid;
      bestDistance = distance;
    }
  }
  if (best === null) {
    console.warn(
      `    no silence found within ${SEARCH_WINDOW_SECONDS}s of ${idealSeconds.toFixed(1)}s — cutting at the ideal point exactly (rare; double-check this part's boundary by ear).`,
    );
    return idealSeconds;
  }
  return best;
}

function formatTimestamp(seconds) {
  return seconds.toFixed(3);
}

async function cutSegment(inputPath, startSeconds, endSeconds, outputPath) {
  const partPath = `${outputPath}.part`;
  const args = ["-y", "-i", inputPath];
  if (startSeconds > 0) args.push("-ss", formatTimestamp(startSeconds));
  if (endSeconds != null) args.push("-to", formatTimestamp(endSeconds));
  args.push("-c", "copy", "-f", "mp3", partPath);
  const { code, stderr } = await runFfmpeg(args);
  if (code !== 0) {
    await rm(partPath, { force: true });
    throw new Error(`ffmpeg cut failed (exit ${code}): ${stderr.slice(-500)}`);
  }
  await rename(partPath, outputPath);
}

async function splitOne(file) {
  const surahNumber = file.slice(0, 3);
  const inputPath = path.join(SOURCE_DIR, file);
  const { size } = await stat(inputPath);
  const partCount = Math.ceil(size / TARGET_PART_BYTES);

  const expectedOutputs = Array.from(
    { length: partCount },
    (_, i) => path.join(OUTPUT_DIR, `${surahNumber}_part${i + 1}.mp3`),
  );
  if (expectedOutputs.every((p) => existsSync(p))) {
    console.log(`  [${surahNumber}] already split into ${partCount} part(s) — skipping.`);
    return readManifestEntry(surahNumber, expectedOutputs);
  }

  console.log(`  [${surahNumber}] ${(size / 1024 / 1024).toFixed(1)}MB -> ${partCount} part(s)`);
  const totalDuration = await probeDurationSeconds(inputPath);
  const silences = await detectSilences(inputPath);
  console.log(`    duration ${totalDuration.toFixed(1)}s, ${silences.length} silence gap(s) detected`);

  const cutPoints = [];
  for (let i = 1; i < partCount; i++) {
    const ideal = (totalDuration * i) / partCount;
    const cut = findBestCut(ideal, silences);
    cutPoints.push(cut);
  }
  // Silence search could (rarely) pick the same or an out-of-order point
  // for two adjacent ideals on a short recitation — enforce strictly
  // increasing so no part ends up empty or overlapping.
  for (let i = 1; i < cutPoints.length; i++) {
    if (cutPoints[i] <= cutPoints[i - 1]) cutPoints[i] = cutPoints[i - 1] + 1;
  }

  const boundaries = [0, ...cutPoints, null]; // null = end of file
  const parts = [];
  for (let i = 0; i < partCount; i++) {
    const outputPath = expectedOutputs[i];
    await cutSegment(inputPath, boundaries[i], boundaries[i + 1], outputPath);
    const partDuration = await probeDurationSeconds(outputPath);
    const partSize = (await stat(outputPath)).size;
    console.log(
      `    part ${i + 1}: ${partDuration.toFixed(1)}s, ${(partSize / 1024 / 1024).toFixed(1)}MB`,
    );
    if (partSize > MAX_UPLOAD_BYTES) {
      throw new Error(`part ${i + 1} of Surah ${surahNumber} is still ${(partSize / 1024 / 1024).toFixed(1)}MB — over the limit; lower TARGET_PART_BYTES and re-run.`);
    }
    parts.push({ part: i + 1, durationMs: Math.round(partDuration * 1000) });
  }
  return { surahNumber: Number(surahNumber), parts };
}

async function readManifestEntry(surahNumber, outputPaths) {
  const parts = [];
  for (let i = 0; i < outputPaths.length; i++) {
    const durationSeconds = await probeDurationSeconds(outputPaths[i]);
    parts.push({ part: i + 1, durationMs: Math.round(durationSeconds * 1000) });
  }
  return { surahNumber: Number(surahNumber), parts };
}

async function main() {
  if (!ffmpegPath) throw new Error("ffmpeg-static did not resolve a binary path — try `npm install` again.");
  if (!existsSync(SOURCE_DIR)) throw new Error(`Source dir not found: ${SOURCE_DIR}`);
  await mkdir(OUTPUT_DIR, { recursive: true });

  const files = (await readdir(SOURCE_DIR)).filter((f) => /^\d{3}/.test(f) && f.toLowerCase().endsWith(".mp3"));
  const oversized = [];
  for (const f of files) {
    const { size } = await stat(path.join(SOURCE_DIR, f));
    if (size > MAX_UPLOAD_BYTES) oversized.push(f);
  }

  if (oversized.length === 0) {
    console.log("No Al-Afasy Surah file exceeds the 50MiB limit — nothing to split.");
    return;
  }
  console.log(`${oversized.length} Surah file(s) exceed 50MiB and will be split:\n`);

  const manifest = {};
  for (const file of oversized.sort()) {
    const { surahNumber, parts } = await splitOne(file);
    manifest[surahNumber] = parts;
  }

  const manifestPath = path.join(OUTPUT_DIR, "split-manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nSplit manifest written to ${manifestPath}.`);
  console.log("Next: npm run upload:audio (uploads split parts instead of the oversized originals).");
}

main().catch((err) => {
  console.error("split-large-audio.mjs failed:", err);
  process.exit(1);
});
