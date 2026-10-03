// Pure Duas logic: validation rules, the Arabic normaliser (mirrors SQL
// public.normalize_arabic), and applyContext (mirrors get_dua_content()).
// No React / browser / Supabase imports and only erasable TypeScript syntax,
// so `node --test` can run it directly (see the "test:duas" npm script).
// Rules mirror the constraints in supabase/migrations/0025_duas_schema.sql.

/** Form-ish input: values may be strings (from inputs) or numbers/null. */
export type Loose = Record<string, unknown>;

export type Validation = { errors: string[]; warnings: string[] };

const ARABIC_RE = /[؀-ۿ]/;
const ARABIC_G = /[؀-ۿ]/g;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function hasArabic(s: unknown): boolean {
  return ARABIC_RE.test(String(s ?? ""));
}

const UNIFY: Record<string, string> = {
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
  "ٱ": "ا",
  "ى": "ي",
};

/** Mirrors public.normalize_arabic(): unify alef/yaa variants, then strip
 *  harakat (064B-065F), superscript alef (0670), Quranic marks (06D6-06ED),
 *  tatweel (0640), whitespace and the listed punctuation. */
export function normalizeArabic(t: unknown): string {
  return String(t ?? "")
    .replace(/[أإآٱى]/g, (c) => UNIFY[c])
    .replace(/[ً-ٰٟۖ-ۭـ\s،؛؟.,;:!"'()[\]-]+/g, "");
}

/** Share of letters that are Arabic-script (0..1). */
export function arabicRatio(s: unknown): number {
  const str = String(s ?? "");
  const letters = str.match(/\p{L}/gu) || [];
  if (!letters.length) return 0;
  return (str.match(ARABIC_G) || []).length / letters.length;
}

export function slugify(title: unknown): string {
  return String(title ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

const blank = (v: unknown): boolean => v == null || String(v).trim() === "";
const isInt = (v: unknown): boolean =>
  typeof v === "number" ? Number.isInteger(v) : /^-?\d+$/.test(String(v).trim());

const REPEAT_HINT = /\(\s*[x×]\s*\d+\s*\)|(?:^|[\s(])[x×]\s?\d+\b|\b\d+\s*(?:times|[x×])(?![a-z])/i;

export function looksLikeRepeat(s: unknown): boolean {
  return REPEAT_HINT.test(String(s ?? ""));
}

/** Validate a Dua-shaped object for the status it is about to be saved with. */
export function validateDua(d: Loose, opts: { status?: string } = {}): Validation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const status = opts.status ?? (d.status as string | undefined) ?? "draft";
  const arabic = String(d.arabic ?? "").trim();
  const en = String(d.translation_en ?? "").trim();
  const ur = String(d.translation_ur ?? "").trim();

  if (blank(d.slug)) errors.push("Slug is required.");
  else if (!SLUG_RE.test(String(d.slug).trim()))
    errors.push('Slug must be lowercase letters/digits separated by single hyphens (e.g. "ayat-al-kursi").');

  if (blank(d.title)) errors.push("Title is required.");

  if (arabic) {
    if (!hasArabic(arabic)) errors.push("Arabic field must contain Arabic-script text (a translation cannot replace it).");
    if (arabic === en || arabic === ur) errors.push("Arabic text must not be identical to a translation.");
    if (/(\.\.\.|…)\s*$/.test(arabic)) warnings.push('Arabic text ends with "..." — it may be truncated.');
  } else if (status === "review" || status === "published") {
    errors.push("Arabic text is required to send a Dua to review or publish it.");
  }

  if (en && arabicRatio(en) > 0.5)
    errors.push("English translation is mostly Arabic script — put Arabic in the Arabic field.");
  if (status === "published" && !en) errors.push("English translation is required to publish.");

  if (!blank(d.repeat_count)) {
    const n = Number(d.repeat_count);
    if (!Number.isInteger(n) || n < 1 || n > 1000)
      errors.push("Repeat count must be a whole number from 1 to 1000 (or empty).");
  } else {
    const embedded = [d.title, d.title_ur, d.translation_en, d.translation_ur].some(looksLikeRepeat);
    if (embedded)
      warnings.push(
        'A repetition like "(x3)" / "3 times" appears in the title or translation — use the Repeat count field instead.'
      );
  }

  if (!blank(d.audio_url) && !/^https:\/\//.test(String(d.audio_url).trim()))
    errors.push("Audio URL must start with https://");

  if (d.sort_order != null && String(d.sort_order).trim() !== "" && !isInt(d.sort_order))
    errors.push("Sort order must be a whole number.");

  const refsIn = Array.isArray(d.quran_refs) ? (d.quran_refs as Loose[]) : [];
  if (d.source_type === "quran" && (!blank(d.hadith_number) || !blank(d.hadith_grade))) {
    warnings.push('Hadith number/grade are filled but the source type is "Quran".');
  }
  if (d.source_type === "quran" && refsIn.length === 0) {
    warnings.push('Source type is "Quran" but no Quran references are listed.');
  }

  refsIn.forEach((r, i) => {
    const row = `Quran reference #${i + 1}`;
    const s = r?.surah;
    const a = r?.ayah_from;
    const b = r?.ayah_to;
    if (![s, a, b].every((x) => !blank(x) && isInt(x))) {
      errors.push(`${row}: surah, ayah from and ayah to must be whole numbers.`);
      return;
    }
    const sn = Number(s);
    const an = Number(a);
    const bn = Number(b);
    if (sn < 1 || sn > 114) errors.push(`${row}: surah must be 1-114.`);
    if (an < 1 || bn < 1) errors.push(`${row}: ayah numbers must be 1 or more.`);
    if (an > bn) errors.push(`${row}: ayah from must not be greater than ayah to.`);
  });

  if (status === "published" && blank(d.source_reference))
    errors.push("A source reference is required to publish (references must be explicit).");

  return { errors, warnings };
}

/** Validate per-category overrides (dua_category_map rows). */
export function validateMapping(m: Loose, label = "Category"): Validation {
  const errors: string[] = [];
  if (!blank(m.sort_order) && !isInt(m.sort_order)) errors.push(`${label}: sort order must be a whole number.`);
  if (!blank(m.context_repeat_count)) {
    const n = Number(m.context_repeat_count);
    if (!Number.isInteger(n) || n < 1 || n > 1000)
      errors.push(`${label}: repeat count override must be 1-1000 (or empty).`);
  }
  return { errors, warnings: [] };
}

export function validateCategory(c: Loose): Validation {
  const errors: string[] = [];
  if (blank(c.slug)) errors.push("Slug is required.");
  else if (!SLUG_RE.test(String(c.slug).trim()))
    errors.push("Slug must be lowercase letters/digits separated by single hyphens.");
  if (blank(c.name)) errors.push("Name is required.");
  if (!blank(c.sort_order) && !isInt(c.sort_order)) errors.push("Sort order must be a whole number.");
  return { errors, warnings: [] };
}

/** Reference line as the app shows it. */
export function composeReference(d: Loose): string {
  const parts: string[] = [];
  if (!blank(d.source_reference)) parts.push(String(d.source_reference).trim());
  if (!blank(d.hadith_number)) parts.push(`Hadith ${String(d.hadith_number).trim()}`);
  if (!blank(d.hadith_grade)) parts.push(String(d.hadith_grade).trim());
  return parts.join(" · ");
}

export function formatQuranRef(r: Loose | null | undefined): string {
  if (!r) return "";
  const { surah, ayah_from: a, ayah_to: b } = r;
  return `Qur’an ${surah}:${a}${String(b) !== String(a) ? "–" + b : ""}`;
}

const DUA_SKIP = ["arabic_normalized", "created_at", "created_by", "updated_at", "updated_by", "published_at"];
const CAT_SKIP = ["created_at", "created_by", "updated_at", "updated_by"];
const MAP_SKIP = ["updated_at"];

/** Strip server-managed columns from audit old_data before writing it back. */
export function restorableFields(entity: string, oldData: Loose | null | undefined): Loose {
  const skip = entity === "dua" ? DUA_SKIP : entity === "mapping" ? MAP_SKIP : CAT_SKIP;
  const out: Loose = {};
  for (const [k, v] of Object.entries(oldData || {})) if (!skip.includes(k)) out[k] = v;
  return out;
}

/** Apply a category's per-Dua overrides exactly like get_dua_content() does.
 *  `m` is a converted mapping row (null values for unset overrides). */
export function applyContext<T extends Loose>(d: T, m: Loose | null | undefined): T {
  if (!m) return d;
  const has = (v: unknown) => v != null && String(v).trim() !== "";
  return {
    ...d,
    title: has(m.context_title) ? m.context_title : d.title,
    title_ur: has(m.context_title) ? m.context_title_ur : d.title_ur,
    description: has(m.context_note) ? m.context_note : d.description,
    source_reference: has(m.context_reference) ? m.context_reference : d.source_reference,
    repeat_count: has(m.context_repeat_count) ? m.context_repeat_count : d.repeat_count,
  };
}

export function parseList(s: unknown): string[] {
  return String(s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
