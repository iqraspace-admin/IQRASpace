import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Server-only loader for the Supplications (Duas & Athkar) content —
 * reused wholesale from the IqraSpace Flutter app's own
 * `assets/supplications.json` ("Hisn al-Qalb"), per the redesign brief's
 * "reuse existing data wherever possible" — not a second, independently
 * maintained dataset. Mirrors quran.ts's fs-read + in-memory-cache style.
 */

export type Dua = {
  occasion: string;
  reference: string;
  arabic: string;
  transliteration_latin: string;
  transliteration_telugu: string;
  transliteration_urdu: string;
  translation_english: string;
};

export type SupplicationCategory = {
  id: string;
  label: string;
  description: string;
  duas: Dua[];
};

export type SupplicationsMeta = {
  title: string;
  description: string;
  category_count: number;
  dua_count: number;
  coverage_note: string;
  sources_note: string;
};

type SupplicationsData = {
  meta: SupplicationsMeta;
  categories: SupplicationCategory[];
};

const CONTENT_PATH = path.join(process.cwd(), "src", "content", "supplications.json");

let cache: SupplicationsData | null = null;

function load(): SupplicationsData {
  if (!cache) {
    cache = JSON.parse(readFileSync(CONTENT_PATH, "utf-8")) as SupplicationsData;
  }
  return cache;
}

export function getSupplicationsMeta(): SupplicationsMeta {
  return load().meta;
}

export function getSupplicationCategories(): SupplicationCategory[] {
  return load().categories;
}

export function getSupplicationCategory(id: string): SupplicationCategory | undefined {
  return load().categories.find((c) => c.id === id);
}
