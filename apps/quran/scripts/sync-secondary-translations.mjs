#!/usr/bin/env node
/**
 * Merges Urdu (Arabic-script) and Telugu translations into the already-
 * synced `src/content/generated/surah/{n}.json` files, from the same two
 * public, unauthenticated hosts the IqraSpace Flutter app
 * (apps/mobile/android) already uses for these exact two languages — see
 * that app's `lib/core/network/dio_client.dart` and
 * `lib/features/quran_reader/data/datasources/surah_remote_datasource.dart`
 * for the identical sourcing decision, so the website and mobile app show
 * the same translation text.
 *
 * Deliberately separate from sync-content.mjs (which needs Quran
 * Foundation OAuth2 credentials this script doesn't) — both hosts here
 * are public, no-auth APIs, so this can run standalone with no
 * `.env.local` needed. Never touches `text_uthmani` (the Arabic text) or
 * any existing translation `resource_id` (85 English, 831 Roman Urdu,
 * both from the Quran Foundation Content API) — purely additive to each
 * verse's `translations[]` array, and idempotent (re-running replaces
 * only its own two resource_ids, never anyone else's).
 *
 * Sources:
 * - Urdu (Arabic script): Al Quran Cloud, GET /v1/surah/{n}/ur.maududi
 *   (Abul Ala Maududi's Urdu-script translation). Al Quran Cloud has no
 *   Telugu content at all (checked directly against its `/edition` list
 *   while building the Flutter app's equivalent feature), which is why
 *   Telugu comes from a different host below.
 * - Telugu: Quran.com's public v4 API, GET
 *   /quran/translations/227?chapter_number={n} ("Maulana Abder-Rahim ibn
 *   Muhammad") — the one Telugu resource that host has. The Quran
 *   Foundation Content API's own OAuth2-gated catalog was not queryable
 *   from this environment (no production credentials on hand) to confirm
 *   whether it also independently carries id 227, so this deliberately
 *   uses the same no-auth host apps/mobile/android already ships this
 *   exact translation from, rather than guessing at a Content-API id.
 *
 * Both hosts are run by/adjacent to the Quran Foundation (Quran.com v4 is
 * documented as "a separate product from the [Quran Foundation] Content
 * API, run by the same Quran Foundation" — see dio_client.dart) but carry
 * their own terms; this script doesn't change QURAN-CONTENT.md §3's
 * 7-day re-sync obligation for Quran Foundation Content API data, which
 * only applies to what sync-content.mjs fetches (English/Roman Urdu).
 *
 * Usage: npm run sync:secondary-translations
 * (no credentials/.env.local required — both hosts are public)
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SURAH_DIR = path.join(__dirname, "..", "src", "content", "generated", "surah");
const SURAH_COUNT = 114;
const REQUEST_DELAY_MS = 250;
const MAX_RETRIES = 3;

const URDU_RESOURCE_ID = "ur.maududi";
const TELUGU_RESOURCE_ID = 227;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, attempt = 1) {
  const res = await fetch(url);

  if (res.status === 429 || res.status >= 500) {
    if (attempt > MAX_RETRIES) {
      throw new Error(`Request failed after ${MAX_RETRIES} retries (${url}): ${res.status}`);
    }
    const backoff = REQUEST_DELAY_MS * 2 ** attempt;
    console.warn(`  ${res.status} on ${url} — retrying in ${backoff}ms (attempt ${attempt}/${MAX_RETRIES})`);
    await sleep(backoff);
    return fetchJson(url, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`Request failed (${url}): ${res.status} ${res.statusText}`);
  }

  await sleep(REQUEST_DELAY_MS);
  return res.json();
}

/** Roman Urdu/Telugu-style graceful degradation, matching
    surah_remote_datasource.dart's `_fetchQuranCom`: a hiccup on either of
    these two secondary, "nice to have" translations shouldn't crash the
    whole sync, and returning [] leaves that surah's existing merged
    entry (from a previous successful run, if any) untouched below. */
async function fetchUrdu(surahNumber) {
  try {
    const data = await fetchJson(`https://api.alquran.cloud/v1/surah/${surahNumber}/${URDU_RESOURCE_ID}`);
    return data.data.ayahs.map((a) => a.text);
  } catch (err) {
    console.warn(`  Urdu fetch failed for surah ${surahNumber}: ${err.message}`);
    return [];
  }
}

async function fetchTelugu(surahNumber) {
  try {
    const data = await fetchJson(
      `https://api.quran.com/api/v4/quran/translations/${TELUGU_RESOURCE_ID}?chapter_number=${surahNumber}`
    );
    return (data.translations ?? []).map((t) => t.text);
  } catch (err) {
    console.warn(`  Telugu fetch failed for surah ${surahNumber}: ${err.message}`);
    return [];
  }
}

/** Replaces any existing merged entry for this resource_id in place
    (idempotent re-run) — never touches any other resource_id already on
    the verse (85 English, 831 Roman Urdu). [syntheticId] is a large
    negative number derived from the verse's own globally-unique `id`
    (1-6236 across the whole Quran), so it can never collide with a real
    Quran Foundation translation-row id (which are large positive
    integers in the synced data, e.g. 401704). */
function mergeTranslation(verse, resourceId, text, syntheticId) {
  verse.translations = verse.translations.filter((t) => t.resource_id !== resourceId);
  verse.translations.push({ id: syntheticId, resource_id: resourceId, text });
}

async function main() {
  console.log(
    `Merging Urdu (${URDU_RESOURCE_ID}) and Telugu (${TELUGU_RESOURCE_ID}) translations into ${SURAH_COUNT} surah files...\n`
  );

  for (let n = 1; n <= SURAH_COUNT; n++) {
    const file = path.join(SURAH_DIR, `${n}.json`);
    const raw = JSON.parse(await readFile(file, "utf-8"));

    process.stdout.write(`Surah ${n}/${SURAH_COUNT} (${raw.chapter.name_simple})... `);
    const [urduTexts, teluguTexts] = await Promise.all([fetchUrdu(n), fetchTelugu(n)]);

    const urduOk = urduTexts.length === raw.verses.length;
    const teluguOk = teluguTexts.length === raw.verses.length;
    if (urduTexts.length && !urduOk) {
      console.warn(`  Urdu ayah count (${urduTexts.length}) != verse count (${raw.verses.length}) — skipping Urdu.`);
    }
    if (teluguTexts.length && !teluguOk) {
      console.warn(
        `  Telugu ayah count (${teluguTexts.length}) != verse count (${raw.verses.length}) — skipping Telugu.`
      );
    }

    raw.verses.forEach((verse, i) => {
      if (urduOk) mergeTranslation(verse, URDU_RESOURCE_ID, urduTexts[i], -(1_000_000 + verse.id));
      if (teluguOk) mergeTranslation(verse, TELUGU_RESOURCE_ID, teluguTexts[i], -(2_000_000 + verse.id));
    });

    await writeFile(file, JSON.stringify(raw, null, 2));
    console.log(`${urduOk ? "urdu ✓" : "urdu ✗"} ${teluguOk ? "telugu ✓" : "telugu ✗"}`);
  }

  console.log(`\nDone. Merged secondary translations into ${SURAH_COUNT} surah files.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
