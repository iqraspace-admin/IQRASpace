// Shared helpers for the Duas content pipeline.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '..', '..', '..', '..');
export const quranDir = join(repoRoot, 'apps', 'quran', 'src', 'content', 'generated', 'surah');
export const bundledAssetPath = join(repoRoot, 'apps', 'mobile', 'android', 'assets', 'supplications.json');

export const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
export const maybeJson = (p) => (existsSync(p) ? readJson(p) : null);

/** Mirrors the SQL function public.normalize_arabic(). */
export function normalizeArabic(t) {
  return (t ?? '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/[ً-ٰٟۖ-ۭـ\s،؛؟.,;:!"'()[\]-]+/g, '');
}

export const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const COLLECTIONS = {
  Bukhari: 'Sahih al-Bukhari',
  Muslim: 'Sahih Muslim',
  'Abu Dawud': 'Sunan Abi Dawud',
  Tirmidhi: "Jami' at-Tirmidhi",
  'Ibn Majah': 'Sunan Ibn Majah',
  "Nasa'i": "Sunan an-Nasa'i",
  Ahmad: 'Musnad Ahmad',
  'Muwatta Malik': 'Muwatta Malik',
  'al-Hakim': 'al-Mustadrak (al-Hakim)',
  Darimi: 'Sunan ad-Darimi',
  Daraqutni: 'Sunan ad-Daraqutni',
  'Ibn Hibban': 'Sahih Ibn Hibban',
};

/** Parse a legacy display reference ("Qur'an 2:201, Abu Dawud") into structure. Never invents numbers/grades. */
export function parseReference(ref) {
  const quranRefs = [];
  const collections = [];
  const unknown = [];
  for (const raw of ref.split(',').map((x) => x.trim()).filter(Boolean)) {
    const q = raw.match(/^Qur'an\s+(\d+):(\d+)(?:-(\d+))?$/);
    if (q) {
      quranRefs.push({ surah: +q[1], ayah_from: +q[2], ayah_to: +(q[3] ?? q[2]) });
    } else if (COLLECTIONS[raw]) {
      collections.push(COLLECTIONS[raw]);
    } else {
      unknown.push(raw);
    }
  }
  let sourceType = 'other';
  if (quranRefs.length && (collections.length || unknown.length)) sourceType = 'mixed';
  else if (quranRefs.length) sourceType = 'quran';
  else if (collections.length && !unknown.length) sourceType = 'hadith';
  else if (collections.length) sourceType = 'mixed';
  return { quranRefs, collections, unknown, sourceType };
}

const surahCache = new Map();
export function quranVerses(surah, from, to) {
  if (!surahCache.has(surah)) surahCache.set(surah, readJson(join(quranDir, `${surah}.json`)));
  return surahCache
    .get(surah)
    .verses.filter((v) => v.verse_number >= from && v.verse_number <= to)
    .map((v) => v.text_uthmani);
}

// ---- SQL literal helpers -------------------------------------------------
export const sqlText = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
export const sqlInt = (v) => (v === null || v === undefined ? 'null' : String(Math.trunc(v)));
export const sqlJson = (v) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
export const sqlTextArray = (a) => (a?.length ? `array[${a.map(sqlText).join(', ')}]::text[]` : `'{}'::text[]`);

export function quranChapterNameArabic(surah) {
  quranVerses(surah, 1, 1); // ensure cached
  return surahCache.get(surah).chapter.name_arabic;
}
