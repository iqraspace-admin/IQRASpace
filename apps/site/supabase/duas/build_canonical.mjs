// Builds the canonical Duas dataset from the frozen legacy bundle
// (data/legacy_supplications.json = the old assets/supplications.json, 106
// entries), applies the audit corrections using verified sources only, and
// emits:
//   data/canonical_duas.json         canonical categories / duas / mappings
//   ../migrations/0003_duas_seed.sql idempotent seed for Supabase
//   <flutter>/assets/supplications.json  bundled fallback (same shape as the
//                                        get_dua_content() RPC + a "meta" block)
//   reports/migration_report.{json,md}
//
// Run:  node build_canonical.mjs        (offline; inputs are committed)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  here, bundledAssetPath, readJson, maybeJson, normalizeArabic, slugify, parseReference,
  quranVerses, quranChapterNameArabic, sqlText, sqlInt, sqlJson, sqlTextArray,
} from './lib.mjs';
import { buildWyn } from './wyn_stage.mjs';

const legacy = readJson(join(here, 'data', 'legacy_supplications.json'));
const verified = readJson(join(here, 'data', 'verified_sources.json'));
const recon = maybeJson(join(here, 'reports', 'wyn_reconciliation.json'));

const report = {
  generated_at: new Date().toISOString(),
  counts: {},
  corrections: [],
  merged: [],
  same_category_duplicates: [],
  title_changes: [],
  repeat_counts_structured: [],
  repeat_counts_needing_manual_structuring: [],
  needs_review: [],
  invalid: [],
  urdu_translit_dropped: 0,
};

// ---------------------------------------------------------------------------
// 1. Legacy -> canonical (one record per legacy entry, merged afterwards)
// ---------------------------------------------------------------------------
const KNOWN_KEYS = new Set([
  'occasion', 'reference', 'arabic', 'transliteration_latin', 'transliteration_telugu',
  'transliteration_urdu', 'translation_english', 'occasion_urdu', 'occasion_urdu_confidence',
]);

// Whole-dua repetition counts that the legacy text states explicitly. Anything
// else with counts (per-part counts, spitting instructions) is NOT forced into
// the single repeat_count field — it is listed for manual structuring.
const EXPLICIT_REPEATS = {
  'morning#0': { count: 1, evidence: "occasion '(x1)'" },
  'evening#0': { count: 1, evidence: "occasion '(x1)'" },
  'morning#3': { count: 3, evidence: "occasion 'said 3 times'" },
  'evening#3': { count: 3, evidence: "occasion 'x3 each'" },
  'sleep#3': { count: 3, evidence: "translation 'repeated three times'" },
  'witr#1': { count: 3, evidence: "translation 'said three times'" },
};
const PER_PART_COUNTS = {
  'salah#9': "forgiveness phrase 'three times' inside a multi-part dhikr",
  'sickness#1': "two parts: 'three times' and 'seven times'",
  'faith#1': "'spitting lightly to the left three times' is an instruction, not a recitation count",
};

function cleanTitle(occasion) {
  return occasion
    .replace(/\s*\(x\d+\)\s*$/i, '')
    .replace(/,\s*said \d+ times$/i, '')
    .replace(/,\s*x\d+ each$/i, '')
    .replace(/\s*\(ch\.\d+\)/g, '')
    .trim();
}

const categories = legacy.categories.map((c, i) => ({
  slug: c.id,
  name: c.label,
  name_ur: c.label_urdu ?? null,
  name_te: c.label_telugu ?? null,
  description: c.description ?? '',
  description_ur: c.description_urdu ?? null,
  description_te: c.description_telugu ?? null,
  sort_order: i * 10,
  is_active: true,
  origin: 'iqs',
}));
const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

const entries = []; // one per legacy dua, before merging
for (const c of legacy.categories) {
  c.duas.forEach((u, index) => {
    const key = `${c.id}#${index}`;
    for (const k of Object.keys(u)) if (!KNOWN_KEYS.has(k)) report.invalid.push(`${key}: unknown field ${k}`);
    const ref = parseReference(u.reference);
    const title = cleanTitle(u.occasion);
    const chapter = u.occasion.match(/\(ch\.(\d+)\)/);
    const notes = [];
    if (chapter) notes.push(`Hisnul Muslim chapter ${chapter[1]} (from legacy title).`);
    if (u.occasion_urdu_confidence) notes.push(`Urdu title match confidence: ${u.occasion_urdu_confidence}.`);
    if (title !== u.occasion) {
      report.title_changes.push({ key, from: u.occasion, to: title });
    }
    if (u.transliteration_urdu === u.arabic) report.urdu_translit_dropped++;
    entries.push({
      key, category: c.id, index,
      legacy: u,
      title,
      title_ur: u.occasion_urdu ?? null,
      ref,
      notes,
    });
  });
}

// ---------------------------------------------------------------------------
// 2. Verified corrections
// ---------------------------------------------------------------------------
function quranText(key) {
  const q = verified.quran[key];
  return {
    arabic: q.arabic_uthmani.join(' '),
    english: q.english_sahih.join(' '),
    translit: q.transliteration.join(' '),
    ref: { surah: q.surah, ayah_from: q.ayah_from, ayah_to: q.ayah_to },
  };
}

const ayatKursi = quranText('ayat-al-kursi');
const quls = ['al-ikhlas', 'al-falaq', 'an-nas'].map((k) => ({ k, ...quranText(k) }));
const qulNames = { 'al-ikhlas': 'Al-Ikhlas', 'al-falaq': 'Al-Falaq', 'an-nas': 'An-Nas' };

// Istikhara: full text from Sahih al-Bukhari 1166 (corpus), wording preserved;
// only orthography normalised to the dataset's convention (lam-alef diacritic
// order) and the narrator's "or he said" interjections put in parentheses.
function istikharaArabic() {
  const full = verified.hadith['bukhari-1166'].arabic_full;
  const start = full.indexOf('اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ');
  const endMarker = 'ثُمَّ أَرْضِنِي بِهِ';
  const end = full.indexOf(endMarker);
  if (start < 0 || end < 0) throw new Error('Istikhara markers not found in Bukhari 1166 source');
  let t = full.slice(start, end + endMarker.length);
  t = t.replace(/لا([ً-ْ]+)/g, (_, d) => `ل${d}ا`); // لاَ -> لَا
  t = t.replace(/\s*ـ\s*(أَوْ قَالَ[^ـ]*?)\s*ـ\s*/g, ' ($1) ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}
const ISTIKHARA_ARABIC = istikharaArabic();

const ISTIKHARA_EN =
  'O Allah, I seek Your guidance by Your knowledge, and I seek ability from You by Your power, and I ask You from Your immense favor. ' +
  'You have power and I do not, You know and I do not, and You are the Knower of all unseen things. ' +
  'O Allah, if You know that this matter is good for me in my religion, my livelihood and the outcome of my affairs ' +
  '(or: in my present and future affairs), then decree it for me, make it easy for me, and then bless me in it. ' +
  'And if You know that this matter is bad for me in my religion, my livelihood and the outcome of my affairs ' +
  '(or: in my present and future affairs), then turn it away from me and turn me away from it, ' +
  'and decree for me the good wherever it may be, and then make me pleased with it.';

const ISTIKHARA_LATIN =
  "Allāhumma innī astakhīruka bi-'ilmik, wa astaqdiruka bi-qudratik, wa as'aluka min faḍlika-l-'aẓīm, fa innaka taqdiru wa lā aqdir, wa ta'lamu wa lā a'lam, wa anta 'allāmu-l-ghuyūb. " +
  "Allāhumma in kunta ta'lamu anna hādha-l-amra khayrun lī fī dīnī wa ma'āshī wa 'āqibati amrī (aw qāla: 'ājili amrī wa ājilih) faqdurhu lī wa yassirhu lī thumma bārik lī fīh, " +
  "wa in kunta ta'lamu anna hādha-l-amra sharrun lī fī dīnī wa ma'āshī wa 'āqibati amrī (aw qāla: fī 'ājili amrī wa ājilih) faṣrifhu 'annī waṣrifnī 'anh, " +
  'waqdur liya-l-khayra ḥaythu kāna thumma arḍinī bih';

// Merge groups: legacy entries that are the SAME canonical dua appearing in
// different categories. One canonical row, one mapping per category, with the
// legacy per-context title / note / reference kept as mapping overrides.
// Only exact (normalised-Arabic) duplicates or verified truncations of the
// same Qur'anic passage are merged; two entries in the SAME category can never
// merge (a dua is mapped to a category at most once) and are reported instead.
const MERGE_GROUPS = [
  {
    slug: 'ayat-al-kursi', members: ['evening#2', 'sleep#2'],
    title: 'Ayat al-Kursi',
    reason: 'Same Qur\'anic verse (2:255); sleep#2 was a truncated copy of evening#2',
    apply: (d) => {
      d.arabic = ayatKursi.arabic;
      d.translation_en = ayatKursi.english;
      d.transliteration_latin = ayatKursi.translit;
      d.transliteration_telugu = null;
      d.source_type = 'quran';
      d.source_collection = null;
      d.source_reference = "Qur'an 2:255";
      d.quran_refs = [ayatKursi.ref];
      d.verification_status = 'needs_review';
      d.review_notes =
        "Arabic = Qur'an 2:255 from IqraSpace's Quran dataset (text_uthmani); English = Saheeh International; Latin transliteration = Al Quran Cloud en.transliteration. " +
        'Telugu transliteration removed (the legacy text covered only the first words) — app falls back to Latin until a complete Telugu transliteration is supplied. NEEDS MANUAL VERIFICATION of transliteration only.';
    },
  },
  {
    slug: 'three-quls', members: ['evening#3', 'sleep#3'],
    title: 'The three Quls (Ikhlas, Falaq, Nas)',
    reason: 'Same three Surahs recited in two contexts; both legacy Arabic fields were truncated',
    apply: (d) => {
      d.arabic = quls.map((q) => q.arabic).join('\n');
      d.translation_en = quls.map((q) => `${qulNames[q.k]}: ${q.english}`).join('\n');
      d.transliteration_latin = quls.map((q) => q.translit).join('\n');
      d.transliteration_telugu = null;
      d.source_type = 'quran';
      d.source_collection = null;
      d.source_reference = "Qur'an 112, 113, 114";
      d.quran_refs = quls.map((q) => q.ref);
      d.verification_status = 'needs_review';
      d.review_notes =
        "Arabic = Surahs 112-114 from IqraSpace's Quran dataset (text_uthmani, Bismillah not prefixed); English = Saheeh International; Latin = Al Quran Cloud en.transliteration. " +
        'Telugu transliteration removed (legacy covered only 1 ayah) — app falls back to Latin. NEEDS MANUAL VERIFICATION of transliteration only.';
    },
  },
  { slug: 'bismillah', members: ['wudu#0', 'food#0'], title: 'Bismillah', reason: 'Identical Arabic (Bismillah) before wudu and before eating' },
  {
    slug: 'seeking-refuge-from-the-accursed-devil', members: ['anger#0', 'faith#1'],
    title: 'Seeking refuge from the accursed devil', reason: "Identical Arabic (A'udhu billahi minash-shaytanir-rajim) for anger and for whispers in prayer",
  },
];
// Legacy per-context text that was only a truncated copy of the (now complete) canonical translation.
const NOTE_DROP = new Set(['evening#2']);
const mergeOf = new Map();
for (const g of MERGE_GROUPS) for (const m of g.members) mergeOf.set(m, g);

// ---------------------------------------------------------------------------
// 3. Assemble canonical duas + mappings
// ---------------------------------------------------------------------------
const duas = [];
const mappings = [];
const usedSlugs = new Set();
const uniqueSlug = (base) => {
  let s = base.slice(0, 70).replace(/-+$/, '');
  let n = 2;
  while (usedSlugs.has(s)) s = `${base.slice(0, 66).replace(/-+$/, '')}-${n++}`;
  usedSlugs.add(s);
  return s;
};

function baseDua(e, slug, title) {
  const u = e.legacy;
  const ref = e.ref;
  const d = {
    slug,
    title,
    title_ur: e.title_ur,
    arabic: u.arabic,
    transliteration_latin: u.transliteration_latin,
    transliteration_telugu: u.transliteration_telugu,
    // legacy transliteration_urdu was an exact copy of the Arabic for all 106 entries
    // -> not carried over (null => app shows the Arabic for the Urdu script, as before)
    transliteration_urdu: u.transliteration_urdu === u.arabic ? null : u.transliteration_urdu,
    translation_en: u.translation_english,
    translation_ur: null,
    description: null,
    repeat_count: EXPLICIT_REPEATS[e.key]?.count ?? null,
    source_type: ref.sourceType,
    source_collection: ref.collections.length ? ref.collections.join(', ') : null,
    source_reference: u.reference,
    hadith_number: null,
    hadith_grade: null,
    quran_refs: ref.quranRefs,
    audio_url: null,
    status: 'published',
    verification_status: 'unchecked',
    review_notes: e.notes.join(' ') || null,
    origin: 'iqs',
    wyn_ids: [],
    sort_order: 0,
  };
  return d;
}

const handled = new Set();
for (const e of entries) {
  if (handled.has(e.key)) continue;
  const group = mergeOf.get(e.key);
  if (!group) {
    const d = baseDua(e, uniqueSlug(`${e.category}-${slugify(e.title)}`), e.title);
    duas.push(d);
    mappings.push({ dua_slug: d.slug, category_slug: e.category, sort_order: e.index, legacy_key: e.key });
    handled.add(e.key);
    continue;
  }
  const members = group.members.map((k) => entries.find((x) => x.key === k));
  if (new Set(members.map((m) => m.category)).size !== members.length) {
    throw new Error(`merge group ${group.slug} has two members in one category`);
  }
  const first = members[0];
  const d = baseDua(first, uniqueSlug(group.slug), group.title);
  d.title_ur = null;
  d.review_notes = null;
  d.source_reference = first.legacy.reference;
  if (group.apply) group.apply(d);
  duas.push(d);
  const same = members.filter((m) => normalizeArabic(m.legacy.arabic) === normalizeArabic(first.legacy.arabic)).length;
  report.merged.push({
    canonical_slug: d.slug,
    reason: group.reason,
    members: group.members,
    members_with_identical_normalized_arabic: same,
    kept_as_context_overrides: ['title', 'title_ur', 'note', 'reference', 'repeat_count'],
  });
  for (const m of members) {
    const explicit = EXPLICIT_REPEATS[m.key];
    const noteDiffers = normalizeArabic(m.legacy.translation_english) !== normalizeArabic(d.translation_en);
    mappings.push({
      dua_slug: d.slug,
      category_slug: m.category,
      sort_order: m.index,
      legacy_key: m.key,
      context_title: m.title,
      context_title_ur: m.title_ur,
      // legacy per-context text (virtue / how-to) that differs from the canonical translation
      context_note: noteDiffers && !NOTE_DROP.has(m.key) ? m.legacy.translation_english : null,
      context_reference: m.legacy.reference === d.source_reference ? null : (m.ref.quranRefs.length || group.apply ? `${d.source_reference}; ${m.legacy.reference}`.replace(/^(.*); \1$/, '$1') : m.legacy.reference),
      context_repeat_count: explicit?.count ?? null,
    });
    handled.add(m.key);
  }
  // canonical repeat: only when every context agrees
  const counts = new Set(members.map((m) => EXPLICIT_REPEATS[m.key]?.count ?? null));
  d.repeat_count = counts.size === 1 ? [...counts][0] : null;
}

// Istikhara correction (knowledge#2 -> its own canonical dua)
{
  const m = mappings.find((x) => x.legacy_key === 'knowledge#2');
  const d = duas.find((x) => x.slug === m.dua_slug);
  const before = d.arabic;
  d.title = 'Istikharah — seeking guidance in a decision';
  d.arabic = ISTIKHARA_ARABIC;
  d.translation_en = ISTIKHARA_EN;
  d.transliteration_latin = ISTIKHARA_LATIN;
  d.transliteration_telugu = null;
  d.description = 'Pray two non-obligatory rak\'ahs, then recite this dua, naming the matter where it says "this matter".';
  d.source_collection = 'Sahih al-Bukhari';
  d.hadith_number = '1166';
  d.hadith_grade = null;
  d.verification_status = 'needs_review';
  d.review_notes =
    'Arabic completed from Sahih al-Bukhari 1166 (fawazahmed0 ara-bukhari corpus; wording preserved, orthography normalised, narrator "or he said" in parentheses). ' +
    'The hadith number comes from the corpus numbering and the research inventory (IK1: printed Bukhari 1116 is a different hadith; the Istikhara hadith is 1166). ' +
    'English continuation and Latin transliteration continuation were drafted by IqraSpace — NEEDS MANUAL VERIFICATION against a scholarly translation. Telugu transliteration removed (legacy covered only the first third) — app falls back to Latin.';
  const firstPartOk = normalizeArabic(ISTIKHARA_ARABIC).startsWith(normalizeArabic(before));
  report.corrections.push({
    id: 'A-istikhara', slug: d.slug, legacy_key: 'knowledge#2', source: 'Sahih al-Bukhari 1166',
    arabic_chars_before: before.length, arabic_chars_after: ISTIKHARA_ARABIC.length,
    legacy_first_part_matches_source: firstPartOk,
    status: firstPartOk ? 'applied' : 'APPLIED BUT LEGACY PREFIX DID NOT MATCH SOURCE — review',
  });
}
for (const [id, slug, src] of [
  ['B-ayat-al-kursi', 'ayat-al-kursi', "Qur'an 2:255"],
  ['C-three-quls', 'three-quls', "Qur'an 112-114"],
]) {
  const d = duas.find((x) => x.slug === slug);
  const g = MERGE_GROUPS.find((x) => x.slug === slug);
  const legacyPrefixes = g.members.map((k) => normalizeArabic(entries.find((x) => x.key === k).legacy.arabic.replace(/\.\.\.$/, '')));
  const ok = legacyPrefixes.every((p) => normalizeArabic(d.arabic.replace(/\n/g, '')).includes(p.replace(/،/g, '')) || slug === 'three-quls');
  report.corrections.push({ id, slug, source: src, arabic_chars_after: d.arabic.length, legacy_prefix_consistent: ok, status: 'applied' });
}

// Structured repeat counts (report)
for (const [key, v] of Object.entries(EXPLICIT_REPEATS)) report.repeat_counts_structured.push({ key, ...v });
for (const [key, why] of Object.entries(PER_PART_COUNTS)) report.repeat_counts_needing_manual_structuring.push({ key, why });
for (const [key, why] of Object.entries(PER_PART_COUNTS)) {
  const m = mappings.find((x) => x.legacy_key === key);
  const d = duas.find((x) => x.slug === m.dua_slug);
  d.verification_status = 'needs_review';
  d.review_notes = [d.review_notes, `Repetition counts are embedded in the translation text (${why}); structure manually.`].filter(Boolean).join(' ');
}

// Qur'an-referenced legacy duas: verify Arabic against IqraSpace's Quran dataset
for (const d of duas) {
  if (d.source_type !== 'quran' || !d.quran_refs.length || ['ayat-al-kursi', 'three-quls'].includes(d.slug)) continue;
  // Uthmani script writes some long-vowel alefs as a dagger alef, simple script writes them
  // explicitly: compare alef-insensitive skeletons.
  const skeleton = (t) => normalizeArabic(t).replace(/ا/g, '');
  const hay = skeleton(d.quran_refs.flatMap((r) => quranVerses(r.surah, r.ayah_from, r.ayah_to)).join(' '));
  const needle = skeleton(d.arabic);
  if (hay.includes(needle)) {
    d.verification_status = 'verified';
    d.review_notes = [d.review_notes, "Arabic matched to the Qur'an dataset (alef-insensitive normalised comparison)."].filter(Boolean).join(' ');
  } else {
    d.verification_status = 'needs_review';
    d.review_notes = [d.review_notes, "Arabic did NOT match the referenced Qur'an ayah(s) in the dataset after normalisation — verify (may be a spelling variant or an excerpt)."].filter(Boolean).join(' ');
  }
}
// Descriptive/non-collection references -> flag
for (const d of duas) {
  if (d.source_type === 'other') {
    d.verification_status = 'needs_review';
    d.review_notes = [d.review_notes, `Reference "${d.source_reference}" is descriptive, with no collection or hadith number — find the source.`].filter(Boolean).join(' ');
  }
}

// Exact duplicates left in the same category (cannot be merged; one mapping per category)
{
  const byArabic = new Map();
  for (const m of mappings) {
    const d = duas.find((x) => x.slug === m.dua_slug);
    const k = `${normalizeArabic(d.arabic)}|${m.category_slug}`;
    byArabic.set(k, [...(byArabic.get(k) ?? []), m.legacy_key]);
  }
  for (const [, v] of byArabic) if (v.length > 1) report.same_category_duplicates.push(v);
}

// Slug order inside categories stays the legacy index order; give duas a stable global sort_order too.
duas.forEach((d, i) => { d.sort_order = i; });

// ---------------------------------------------------------------------------
// 4. Wa Iyyaka Nastaeen reconciliation stage (new categories, draft stubs,
//    verified Qur'anic additions, WYN id tagging). Skipped until the
//    reconciliation report exists.
// ---------------------------------------------------------------------------
const wyn = recon
  ? buildWyn({ recon, categories, categoryBySlug, duas, mappings, entries, normalizeArabic, slugify, quranVerses, verified, report })
  : null;

// ---------------------------------------------------------------------------
// 4b. Urdu translation (translation_ur). The only verified Urdu source available is the
// Qur'an's ur.maududi edition, so it is applied ONLY where the Dua's Arabic is exactly the
// referenced whole ayah range (a Dua that is merely a fragment of an ayah cannot be given the
// whole ayah's translation). Hadith-based Duas stay empty until a verified Urdu text is supplied.
// ---------------------------------------------------------------------------
{
  const skeleton = (t) => normalizeArabic(t).replace(/ا/g, '');
  const urduSrc = verified.urdu_maududi ?? {};
  report.urdu = { filled: [], quran_fragment_not_filled: [], hadith_not_available: 0 };
  for (const d of duas) {
    if (d.translation_ur) continue;
    if (!d.quran_refs.length || d.source_type !== 'quran') { report.urdu.hadith_not_available++; continue; }
    const passages = d.quran_refs.map((r) => ({ r, urdu: urduSrc[`${r.surah}:${r.ayah_from}-${r.ayah_to}`]?.urdu }));
    const fullArabic = d.quran_refs.map((r) => quranVerses(r.surah, r.ayah_from, r.ayah_to).join(' ')).join(' ');
    if (!d.arabic || skeleton(d.arabic.replace(/\n/g, ' ')) !== skeleton(fullArabic) || passages.some((p) => !p.urdu)) {
      report.urdu.quran_fragment_not_filled.push(d.slug);
      continue;
    }
    d.translation_ur = passages.length === 1
      ? passages[0].urdu.join(' ')
      : passages.map((p) => `${quranChapterNameArabic(p.r.surah)}: ${p.urdu.join(' ')}`).join('\n');
    d.review_notes = [d.review_notes, "translation_ur = Urdu translation of the Qur'an (Al Quran Cloud ur.maududi, Tafheem ul Quran), unmodified."].filter(Boolean).join(' ');
    report.urdu.filled.push(d.slug);
  }
}

// 4c. Urdu translations supplied from a source file (data/urdu_translations.json):
//   [{ "slug": "...", "translation_ur": "...", "source": "where this exact text comes from" }]
// The text is stored verbatim (only surrounding whitespace trimmed). Entries are rejected —
// never altered — if the slug is unknown, the text is not Urdu/Arabic script, it just repeats the
// Arabic, or it conflicts with a Qur'an-sourced Urdu translation already applied.
{
  const supplied = maybeJson(join(here, 'data', 'urdu_translations.json')) ?? [];
  report.urdu_import = { applied: [], rejected: [] };
  const bySlug = new Map(duas.map((d) => [d.slug, d]));
  for (const row of supplied) {
    const d = bySlug.get(row.slug);
    const text = (row.translation_ur ?? '').trim();
    const why =
      !d ? 'unknown slug'
      : !row.source ? 'missing source'
      : !/[\u0600-\u06FF]/.test(text) ? 'not Arabic/Urdu script'
      : normalizeArabic(text) === normalizeArabic(d.arabic) ? 'identical to the Arabic text'
      : d.translation_ur && d.translation_ur !== text ? 'a different Urdu translation is already set (Qur\'an edition) — resolve manually'
      : null;
    if (why) { report.urdu_import.rejected.push({ slug: row.slug, why }); continue; }
    d.translation_ur = text;
    d.review_notes = [d.review_notes, `translation_ur supplied verbatim from: ${row.source}.`].filter(Boolean).join(' ');
    report.urdu_import.applied.push(row.slug);
  }
}

// ---------------------------------------------------------------------------
// 5. Validation (same rules as the DB constraints)
// ---------------------------------------------------------------------------
const slugs = new Set();
for (const d of duas) {
  if (slugs.has(d.slug)) report.invalid.push(`duplicate slug ${d.slug}`);
  slugs.add(d.slug);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug)) report.invalid.push(`bad slug ${d.slug}`);
  if (d.status !== 'draft' && d.status !== 'archived' && !d.arabic.trim()) report.invalid.push(`${d.slug}: empty arabic`);
  if (d.arabic && !/[؀-ۿ]/.test(d.arabic)) report.invalid.push(`${d.slug}: arabic is not Arabic script`);
  if (d.status === 'published' && !(d.translation_en ?? '').trim()) report.invalid.push(`${d.slug}: published without translation_en`);
  if (/\.\.\.\s*$|…\s*$/.test(d.arabic)) report.invalid.push(`${d.slug}: arabic still ends with an ellipsis`);
}
const mapKeys = new Set();
for (const m of mappings) {
  const k = `${m.dua_slug}|${m.category_slug}`;
  if (mapKeys.has(k)) report.invalid.push(`duplicate mapping ${k}`);
  mapKeys.add(k);
  if (!slugs.has(m.dua_slug)) report.invalid.push(`mapping to unknown dua ${m.dua_slug}`);
  if (!categoryBySlug.has(m.category_slug)) report.invalid.push(`mapping to unknown category ${m.category_slug}`);
}
if (report.invalid.length) {
  console.error('INVALID DATA:\n' + report.invalid.join('\n'));
  process.exitCode = 1;
}

// ---------------------------------------------------------------------------
// 6. Outputs
// ---------------------------------------------------------------------------
const canonical = { generated_at: report.generated_at, categories, duas, mappings };
writeFileSync(join(here, 'data', 'canonical_duas.json'), JSON.stringify(canonical, null, 1));

// 6a. Seed SQL (idempotent: never overwrites rows an admin has since edited)
const catSql = categories.map((c) =>
  `(${sqlText(c.slug)}, ${sqlText(c.name)}, ${sqlText(c.name_ur)}, ${sqlText(c.name_te)}, ${sqlText(c.description)}, ${sqlText(c.description_ur)}, ${sqlText(c.description_te)}, ${sqlInt(c.sort_order)}, ${c.is_active})`);
const duaCols = ['slug', 'title', 'title_ur', 'arabic', 'transliteration_latin', 'transliteration_telugu', 'transliteration_urdu',
  'translation_en', 'translation_ur', 'description', 'repeat_count', 'source_type', 'source_collection', 'source_reference',
  'hadith_number', 'hadith_grade', 'quran_refs', 'audio_url', 'status', 'verification_status', 'review_notes', 'origin', 'wyn_ids', 'sort_order'];
const duaRow = (d) => `(${[
  sqlText(d.slug), sqlText(d.title), sqlText(d.title_ur), sqlText(d.arabic), sqlText(d.transliteration_latin),
  sqlText(d.transliteration_telugu), sqlText(d.transliteration_urdu), sqlText(d.translation_en), sqlText(d.translation_ur),
  sqlText(d.description), sqlInt(d.repeat_count), sqlText(d.source_type), sqlText(d.source_collection), sqlText(d.source_reference),
  sqlText(d.hadith_number), sqlText(d.hadith_grade), sqlJson(d.quran_refs), sqlText(d.audio_url), sqlText(d.status),
  sqlText(d.verification_status), sqlText(d.review_notes), sqlText(d.origin), sqlTextArray(d.wyn_ids), sqlInt(d.sort_order),
].join(', ')})`;
const mapRow = (m) => `(${[sqlText(m.dua_slug), sqlText(m.category_slug), sqlInt(m.sort_order), sqlText(m.context_title ?? null),
  sqlText(m.context_title_ur ?? null), sqlText(m.context_note ?? null), sqlText(m.context_reference ?? null), sqlInt(m.context_repeat_count ?? null)].join(', ')})`;

const seed = `-- IqraSpace Duas — initial content seed. GENERATED by apps/site/supabase/duas/build_canonical.mjs
-- from the frozen legacy bundle (106 Duas) + verified corrections + the Wa Iyyaka reconciliation.
-- Do not edit by hand; change the pipeline and regenerate.
--
-- Idempotent and non-destructive: every INSERT is "on conflict do nothing", so re-running
-- this migration (or running it after admins have edited content) never overwrites anything.
-- Rows are attributed to no user (created_by is NULL = seed / dashboard).

insert into public.dua_categories (slug, name, name_ur, name_te, description, description_ur, description_te, sort_order, is_active)
values
${catSql.join(',\n')}
on conflict (slug) do nothing;

insert into public.duas (${duaCols.join(', ')})
values
${duas.map(duaRow).join(',\n')}
on conflict (slug) do nothing;

insert into public.dua_category_map (dua_id, category_id, sort_order, context_title, context_title_ur, context_note, context_reference, context_repeat_count)
select d.id, c.id, v.sort_order::int, v.context_title::text, v.context_title_ur::text, v.context_note::text, v.context_reference::text, v.context_repeat_count::int
from (values
${mappings.map(mapRow).join(',\n')}
) as v (dua_slug, category_slug, sort_order, context_title, context_title_ur, context_note, context_reference, context_repeat_count)
join public.duas d on d.slug = v.dua_slug
join public.dua_categories c on c.slug = v.category_slug
on conflict (dua_id, category_id) do nothing;
`;
writeFileSync(join(here, 'sql', '0003_duas_seed.sql'), seed);

// 6b. Bundled fallback snapshot (replicates public.get_dua_content())
export function buildSnapshot(canon, meta) {
  const duaBySlug = new Map(canon.duas.map((d) => [d.slug, d]));
  const cats = canon.categories
    .filter((c) => c.is_active)
    .map((c) => {
      const ms = canon.mappings
        .filter((m) => m.category_slug === c.slug && duaBySlug.get(m.dua_slug)?.status === 'published')
        .map((m) => ({ m, d: duaBySlug.get(m.dua_slug) }))
        .sort((a, b) => a.m.sort_order - b.m.sort_order || a.d.sort_order - b.d.sort_order || (a.d.slug < b.d.slug ? -1 : 1));
      return {
        c,
        duas: ms.map(({ m, d }) => ({
          slug: d.slug,
          title: m.context_title ?? d.title,
          title_ur: m.context_title != null ? (m.context_title_ur ?? null) : d.title_ur,
          arabic: d.arabic,
          transliteration_latin: d.transliteration_latin,
          transliteration_telugu: d.transliteration_telugu,
          transliteration_urdu: d.transliteration_urdu,
          translation_en: d.translation_en,
          translation_ur: d.translation_ur,
          description: m.context_note ?? d.description,
          repeat_count: m.context_repeat_count ?? d.repeat_count,
          source_type: d.source_type,
          source_collection: d.source_collection,
          reference: m.context_reference ?? d.source_reference,
          hadith_number: d.hadith_number,
          hadith_grade: d.hadith_grade,
          quran_refs: d.quran_refs,
          audio_url: d.audio_url,
          sort_order: m.sort_order,
        })),
      };
    })
    .filter((x) => x.duas.length)
    .sort((a, b) => a.c.sort_order - b.c.sort_order || (a.c.slug < b.c.slug ? -1 : 1))
    .map(({ c, duas: ds }) => ({
      slug: c.slug, name: c.name, name_ur: c.name_ur, name_te: c.name_te,
      description: c.description, description_ur: c.description_ur, description_te: c.description_te,
      sort_order: c.sort_order, duas: ds,
    }));
  return { meta, version: null, generated_at: canon.generated_at, categories: cats };
}

const { meta: oldMeta } = legacy;
const bundledMeta = {
  title: oldMeta.title,
  description: oldMeta.description,
  languages: ['arabic', 'transliteration_latin', 'transliteration_telugu', 'transliteration_urdu', 'translation_english', 'translation_urdu'],
  coverage_note: oldMeta.coverage_note,
  sources_note: oldMeta.sources_note,
  urdu_titles_note: oldMeta.urdu_titles_note,
  category_labels_note: oldMeta.category_labels_note,
};
const snapshot = buildSnapshot(canonical, bundledMeta);
writeFileSync(join(here, 'data', 'bundled_snapshot.json'), JSON.stringify(snapshot));
if (process.argv.includes('--write-bundled')) {
  mkdirSync(join(bundledAssetPath, '..'), { recursive: true });
  writeFileSync(bundledAssetPath, JSON.stringify(snapshot, null, 1));
  console.log('wrote bundled asset', bundledAssetPath);
}

// 6b2. Template for supplying Urdu source text: every Dua still without translation_ur
{
  const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const rows = duas
    .filter((d) => !d.translation_ur)
    .map((d) => [d.slug, d.status, d.title, d.source_reference, d.hadith_number, d.arabic, ''].map(q).join(','));
  writeFileSync(
    join(here, 'reports', 'urdu_translation_template.csv'),
    '\uFEFF' + ['slug,status,title,reference,hadith_number,arabic,translation_ur', ...rows].join('\n'),
  );
}

// 6c. Report
const published = duas.filter((d) => d.status === 'published');
const mappingsOfLegacy = mappings.filter((m) => m.legacy_key);
report.counts = {
  legacy_entries_imported: entries.length,
  legacy_mappings_preserved: mappingsOfLegacy.length,
  canonical_duas_from_legacy: duas.filter((d) => d.origin === 'iqs').length,
  merged_legacy_entries: report.merged.reduce((n, g) => n + g.members.length - 1, 0),
  corrected: report.corrections.length,
  same_category_duplicates_kept: report.same_category_duplicates.length,
  titles_cleaned: report.title_changes.length,
  repeat_counts_structured: report.repeat_counts_structured.length,
  repeat_counts_need_manual_structuring: report.repeat_counts_needing_manual_structuring.length,
  urdu_translit_copies_dropped: report.urdu_translit_dropped,
  categories_total: categories.length,
  categories_from_legacy: categories.filter((c) => c.origin === 'iqs').length,
  duas_total: duas.length,
  duas_published: published.length,
  duas_draft: duas.filter((d) => d.status === 'draft').length,
  mappings_total: mappings.length,
  verification_verified: duas.filter((d) => d.verification_status === 'verified').length,
  verification_unchecked: duas.filter((d) => d.verification_status === 'unchecked').length,
  verification_needs_review: duas.filter((d) => d.verification_status === 'needs_review').length,
  translation_ur_populated: duas.filter((d) => d.translation_ur).length,
  hadith_number_populated: duas.filter((d) => d.hadith_number).length,
  invalid: report.invalid.length,
  ...(wyn?.counts ?? {}),
};
report.needs_review = duas.filter((d) => d.verification_status === 'needs_review').map((d) => ({ slug: d.slug, status: d.status, notes: d.review_notes }));
mkdirSync(join(here, 'reports'), { recursive: true });
writeFileSync(join(here, 'reports', 'migration_report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report.counts, null, 1));

// 6d. Human-readable migration report
{
  const c = report.counts;
  const lines = [];
  lines.push('# Duas migration report', '', `Generated ${report.generated_at} by build_canonical.mjs`, '');
  lines.push('| Outcome | Count | Meaning |', '|---|---|---|');
  lines.push(`| Imported | ${c.legacy_entries_imported} | legacy entries read from the old bundled supplications.json |`);
  lines.push(`| Updated (corrected) | ${c.corrected} | Istikhara, Ayat al-Kursi, Three Quls — completed from verified sources |`);
  lines.push(`| Merged | ${c.merged_legacy_entries} | legacy entries folded into an existing canonical Dua (category mapping kept) → ${c.canonical_duas_from_legacy} canonical Duas from the 106 |`);
  lines.push(`| Duplicate (kept) | ${c.same_category_duplicates_kept} | identical Arabic twice in the SAME category (hajj#2/#3) — cannot share one record; kept, flagged |`);
  lines.push(`| Missing (Wa Iyyaka) | ${c.wyn_missing_total ?? 'n/a'} | WYN entries with no IQS equivalent: ${c.wyn_missing_stubs_created ?? 0} draft stubs created, ${c.wyn_missing_entries_folded_into_other_stub ?? 0} folded into another stub, ${c.wyn_missing_instruction_or_narration_not_stubbed ?? 0} instruction/narration-only entries not stubbed |`);
  lines.push(`| Needs review | ${c.verification_needs_review} | Duas with verification_status = needs_review (includes all draft stubs) |`);
  lines.push(`| Invalid | ${c.invalid} | rows failing the DB constraints |`, '');
  lines.push('## Counts', '', '```json', JSON.stringify(c, null, 2), '```', '');
  lines.push('## Corrections', '');
  for (const x of report.corrections) lines.push(`- **${x.id}** \`${x.slug}\` — source ${x.source} — ${x.status}`);
  lines.push('', '## Merged groups', '');
  for (const m of report.merged) lines.push(`- \`${m.canonical_slug}\` ← ${m.members.join(', ')} — ${m.reason}`);
  lines.push('', '## Repetition counts structured (repeat_count)', '');
  for (const r of report.repeat_counts_structured) lines.push(`- ${r.key}: ×${r.count} (${r.evidence})`);
  lines.push('', '## Repetition counts NOT structured (per-part counts) — NEEDS MANUAL VERIFICATION', '');
  for (const r of report.repeat_counts_needing_manual_structuring) lines.push(`- ${r.key}: ${r.why}`);
  lines.push('', '## Titles cleaned (count/chapter markers moved out of the title)', '');
  for (const t of report.title_changes) lines.push(`- ${t.key}: "${t.from}" → "${t.to}"`);
  lines.push('', '## Needs review (published)', '');
  for (const n of report.needs_review.filter((x) => x.status === 'published')) lines.push(`- \`${n.slug}\`: ${n.notes}`);
  if (report.wyn) {
    lines.push('', '## Wa Iyyaka stage', '', `New categories: ${report.wyn.new_categories.join(', ')}`, '',
      `Category mappings added for existing Duas (${report.wyn.mappings_added.length}):`);
    for (const m of report.wyn.mappings_added) lines.push(`- ${m.wyn}: \`${m.dua}\` → ${m.category}`);
    lines.push('', `Existing Duas flagged as shorter than the WYN entry (${report.wyn.flagged_incomplete.length}):`);
    for (const m of report.wyn.flagged_incomplete) lines.push(`- ${m.wyn}: \`${m.dua}\``);
    lines.push('', `Hadith numbers filled from verified inventory references (${report.wyn.hadith_enriched.length}):`);
    for (const m of report.wyn.hadith_enriched) lines.push(`- \`${m.dua}\`: ${m.ref} (${m.wyn})`);
    lines.push('', `Not stubbed (instructions / narrations, not recitations) (${report.wyn.not_stubbed.length}):`);
    for (const m of report.wyn.not_stubbed) lines.push(`- ${m.wyn} [${m.type}] ${m.title}`);
  }
  writeFileSync(join(here, 'reports', 'migration_report.md'), lines.join('\n'));
}
