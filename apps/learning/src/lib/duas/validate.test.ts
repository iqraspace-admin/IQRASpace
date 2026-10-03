import test from "node:test";
import assert from "node:assert/strict";
import {
  validateDua, validateMapping, validateCategory, normalizeArabic, slugify,
  composeReference, restorableFields, arabicRatio, parseList, looksLikeRepeat, applyContext,
} from "./validate.ts";

const AR = "بِسْمِ اللّٰهِ"; // with harakat
const base = (o: Record<string, unknown> = {}) => ({
  slug: "morning-dua", title: "Morning", arabic: AR, translation_en: "In the name of Allah",
  translation_ur: "", repeat_count: "", source_type: "hadith", source_reference: "Bukhari",
  hadith_number: "", hadith_grade: "", quran_refs: [], audio_url: "", sort_order: 0, ...o,
});
const has = (r: { errors: string[]; warnings: string[] }, kind: "errors" | "warnings", re: RegExp) =>
  r[kind].some((m) => re.test(m));

test("valid dua passes for publish", () => {
  assert.deepEqual(validateDua(base(), { status: "published" }), { errors: [], warnings: [] });
});

test("slug format", () => {
  for (const s of ["Bad", "a--b", "-a", "a-", "a b", ""]) {
    assert.ok(has(validateDua(base({ slug: s })), "errors", /slug/i), s);
  }
  for (const s of ["a", "a-b-1", "ayat-al-kursi"]) assert.equal(validateDua(base({ slug: s })).errors.length, 0, s);
});

test("title required", () => {
  assert.ok(has(validateDua(base({ title: "  " })), "errors", /title/i));
});

test("arabic required for review/published, not draft", () => {
  assert.equal(validateDua(base({ arabic: "" }), { status: "draft" }).errors.length, 0);
  assert.ok(has(validateDua(base({ arabic: "" }), { status: "review" }), "errors", /arabic/i));
  assert.ok(has(validateDua(base({ arabic: "" }), { status: "published" }), "errors", /arabic/i));
});

test("arabic must contain arabic script and not equal translation", () => {
  assert.ok(has(validateDua(base({ arabic: "Bismillah" })), "errors", /Arabic-script/));
  assert.ok(has(validateDua(base({ translation_ur: AR })), "errors", /identical/));
  assert.ok(has(validateDua(base({ translation_en: AR })), "errors", /identical|mostly Arabic/));
});

test("translation_en not mostly arabic; required to publish", () => {
  assert.ok(has(validateDua(base({ translation_en: "بسم الله الرحمن" })), "errors", /mostly Arabic/));
  assert.ok(has(validateDua(base({ translation_en: "" }), { status: "published" }), "errors", /English translation is required/));
  assert.equal(validateDua(base({ translation_en: "" }), { status: "review" }).errors.length, 0);
  assert.equal(arabicRatio("hello"), 0);
});

test("repeat_count range", () => {
  for (const v of ["0", "1001", "1.5", "abc", -1]) assert.ok(has(validateDua(base({ repeat_count: v })), "errors", /Repeat count/), String(v));
  for (const v of ["", null, "1", 1000, "33"]) assert.equal(validateDua(base({ repeat_count: v })).errors.length, 0, String(v));
});

test("audio_url https only", () => {
  assert.ok(has(validateDua(base({ audio_url: "http://x.org/a.mp3" })), "errors", /https/));
  assert.equal(validateDua(base({ audio_url: "https://x.org/a.mp3" })).errors.length, 0);
});

test("hadith fields on quran source warn", () => {
  const r = validateDua(base({ source_type: "quran", hadith_number: "12", quran_refs: [{ surah: 2, ayah_from: 255, ayah_to: 255 }] }));
  assert.equal(r.errors.length, 0);
  assert.ok(has(r, "warnings", /Hadith/));
});

test("quran_refs sanity", () => {
  const bad = (refs: unknown[]) => validateDua(base({ quran_refs: refs })).errors;
  assert.ok(bad([{ surah: 0, ayah_from: 1, ayah_to: 1 }]).length);
  assert.ok(bad([{ surah: 115, ayah_from: 1, ayah_to: 1 }]).length);
  assert.ok(bad([{ surah: 2, ayah_from: 5, ayah_to: 4 }]).length);
  assert.ok(bad([{ surah: 2, ayah_from: "a", ayah_to: 4 }]).length);
  assert.ok(bad([{ surah: 2, ayah_from: 1.5, ayah_to: 4 }]).length);
  assert.equal(bad([{ surah: "2", ayah_from: "255", ayah_to: "256" }, { surah: 114, ayah_from: 1, ayah_to: 6 }]).length, 0);
});

test("source_reference required to publish only", () => {
  assert.ok(has(validateDua(base({ source_reference: " " }), { status: "published" }), "errors", /source reference/i));
  assert.equal(validateDua(base({ source_reference: "" }), { status: "review" }).errors.length, 0);
});

test("embedded repeat patterns warn only when repeat_count empty", () => {
  for (const t of ["Dua (x3)", "Say x3", "Recite 3 times", "Say 33x", "(×7)"]) {
    const r = validateDua(base({ title: t }));
    assert.equal(r.errors.length, 0, t);
    assert.ok(has(r, "warnings", /Repeat count/), t);
  }
  assert.equal(validateDua(base({ title: "Dua (x3)", repeat_count: 3 })).warnings.length, 0);
  assert.ok(!looksLikeRepeat("Extra protection"));
  assert.ok(!looksLikeRepeat("Max 1 time"));
  assert.equal(validateDua(base({ translation_en: "Praise be to Allah" })).warnings.length, 0);
});

test("truncated arabic warns", () => {
  assert.ok(has(validateDua(base({ arabic: AR + "..." })), "warnings", /truncated/));
  assert.ok(has(validateDua(base({ arabic: AR + "…" })), "warnings", /truncated/));
});

test("mapping + category validation", () => {
  assert.equal(validateMapping({ sort_order: "3", context_repeat_count: "" }).errors.length, 0);
  assert.ok(validateMapping({ sort_order: "x" }).errors.length);
  assert.ok(validateMapping({ context_repeat_count: "2000" }).errors.length);
  assert.ok(validateCategory({ slug: "Bad", name: "" }).errors.length >= 2);
  assert.equal(validateCategory({ slug: "morning", name: "Morning", sort_order: "0" }).errors.length, 0);
});

// Hand-computed expectations following the SQL normalize_arabic().
test("normalizeArabic parity with SQL normalize_arabic", () => {
  const cases: Array<[unknown, string]> = [
    ["", ""],
    [null, ""],
    ["بِسْمِ اللّٰهِ", "بسمالله"],
    ["أإآٱى", "ااااي"],
    ["كــتاب", "كتاب"],
    ["المۖ ۭه", "المه"],
    ["رب، اغفر؛ (لي)؟ [x]-.,;:!\"' \t\n", "رباغفرليx"],
    ["ةؤئء", "ةؤئء"],
    ["ي٠", "ي٠"],
  ];
  for (const [input, expected] of cases) assert.equal(normalizeArabic(input), expected, JSON.stringify(input));
  const n = normalizeArabic(cases[2][0]);
  assert.equal(normalizeArabic(n), n);
  assert.equal(normalizeArabic("اللَّهُ"), normalizeArabic("الله"));
});

test("helpers", () => {
  assert.equal(slugify("Ayat al-Kursi (Throne Verse)!"), "ayat-al-kursi-throne-verse");
  assert.equal(slugify("  "), "");
  assert.equal(composeReference({ source_reference: "Bukhari", hadith_number: "6306", hadith_grade: "Sahih" }), "Bukhari · Hadith 6306 · Sahih");
  assert.deepEqual(parseList("a, b,,c "), ["a", "b", "c"]);
  const r = restorableFields("dua", { id: "x", slug: "s", arabic_normalized: "n", created_at: 1, updated_at: 2, created_by: 3, updated_by: 4, published_at: 5, title: "t" });
  assert.deepEqual(r, { id: "x", slug: "s", title: "t" });
  assert.deepEqual(restorableFields("category", { id: 1, created_at: 1, name: "n" }), { id: 1, name: "n" });
});

test("applyContext mirrors get_dua_content() overrides incl. context_reference", () => {
  const d = { title: "T", title_ur: "TU", description: "D", source_reference: "Bukhari", repeat_count: 1 };
  assert.deepEqual(applyContext(d, null), d);
  assert.deepEqual(applyContext(d, { context_title: null, context_title_ur: "X", context_note: null, context_reference: null, context_repeat_count: null }), d);
  const r = applyContext(d, { context_title: "CT", context_title_ur: null, context_note: "N", context_reference: "Muslim 12", context_repeat_count: 3 });
  assert.deepEqual(r, { title: "CT", title_ur: null, description: "N", source_reference: "Muslim 12", repeat_count: 3 });
  assert.deepEqual(restorableFields("mapping", { dua_id: "a", category_id: "b", context_reference: "r", updated_at: 1 }), { dua_id: "a", category_id: "b", context_reference: "r" });
});
