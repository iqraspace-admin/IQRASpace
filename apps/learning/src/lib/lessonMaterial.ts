import { getSignedMaterialUrl } from "./storage";
import { quranSurahPdfUrl } from "./quranLink";

/** Marker prefix for `material_storage_path` meaning "not a Supabase
 * Storage object key — Surah N's whole-PDF file, served directly by
 * apps/quran" (the "Full Qur'an (Surah by Surah)" lesson plan, seeded by
 * scripts/seed-surah-lessons.mjs). Keeps the existing TEXT column doing
 * double duty with no schema change and no duplicate upload into the
 * lesson-materials bucket. */
const QURAN_SURAH_PREFIX = "quran-surah:";

export function isQuranSurahMaterialPath(path: string): boolean {
  return path.startsWith(QURAN_SURAH_PREFIX);
}

export function quranSurahMaterialPath(surahNumber: number): string {
  return `${QURAN_SURAH_PREFIX}${surahNumber}`;
}

/** The one place every material-viewing call site resolves a
 * `material_storage_path` (or `lesson_materials.storage_path`) into an
 * actual URL for the PDF Viewer — instead of each assuming every path is a
 * Supabase Storage bucket key. Bucket paths behave exactly as
 * `getSignedMaterialUrl` already did; only the Quran-Surah marker above
 * takes a different, signing-free path. */
export async function resolveMaterialUrl(path: string): Promise<{ url: string | null; error: string | null }> {
  if (isQuranSurahMaterialPath(path)) {
    const surahNumber = Number(path.slice(QURAN_SURAH_PREFIX.length));
    return Number.isFinite(surahNumber)
      ? { url: quranSurahPdfUrl(surahNumber), error: null }
      : { url: null, error: "Invalid Surah reference" };
  }
  // Normalized to a plain string here (getSignedMaterialUrl's own `error` is
  // a Supabase StorageError) so every call site handles one consistent
  // shape regardless of which branch above actually ran.
  const { url, error } = await getSignedMaterialUrl(path);
  return { url, error: error?.message ?? null };
}
