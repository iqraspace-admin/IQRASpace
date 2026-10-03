// Wa Iyyaka Nastaeen stage. Consumes reports/wyn_reconciliation.json and
//  * creates the new WYN-derived categories,
//  * tags existing canonical Duas with the WYN ids they correspond to,
//  * adds category mappings (never duplicate Duas) for "same dua, different category" matches,
//  * creates DRAFT stubs for entries that are genuinely missing — with NO Arabic unless it can be
//    verified from IqraSpace's Quran dataset. The book's own Arabic/translation is copyrighted and
//    was deliberately not reproduced in the research inventory, so hadith Arabic must be supplied
//    (and verified) by a human via the admin UI. Stubs are never published automatically.
//  * fills hadith_number / hadith_grade ONLY when the inventory verified the reference and the match
//    is exact; nothing is invented.

const CATEGORY_NAMES = {
  'hamd-o-sana': ['Praise & Glorification', 'Hamd o Sana — praising Allah before supplicating'],
  'durood-sharif': ['Durood Sharif', 'Sending peace and blessings upon the Prophet ﷺ'],
  'protection-and-safety': ['Protection & Safety', 'Supplications for protection and safety'],
  'protection-from-enemy': ['Protection from an Enemy', 'Supplications when fearing an enemy or oppressor'],
  'night-protection': ['Protection During the Night', 'Supplications for the night'],
  'bad-dream': ['Bad Dreams & Fright in Sleep', 'What to do and say after a bad dream or fright while sleeping'],
  'evil-eye': ['Evil Eye', 'Protection from the evil eye and envy'],
  'protection-from-magic': ['Protection from Magic', 'Protection from sorcery and its effects'],
  'jinn-and-shayateen': ['Protection from Jinn & Shayateen', 'Seeking refuge from the jinn and devils'],
  'visiting-the-sick': ['Visiting the Sick', 'Supplications when visiting a sick person'],
  'trials-and-adversity': ['Trials & Adversity', 'On seeing someone in a trial or hardship'],
  'deceased-maghfirat': ['Forgiveness for the Deceased', 'Supplications for the forgiveness of the deceased'],
  istighfar: ['Seeking Forgiveness (Istighfar)', 'Supplications for forgiveness of sins'],
  'relief-from-distress': ['Relief from Sorrow & Distress', 'Supplications for relief from grief and distress'],
  'maqbool-duain': ['Accepted Supplications', 'Maqbool Duain — comprehensive supplications'],
  'after-salah': ['After the Prayer', 'Masnoon adhkar after the obligatory prayers'],
};
const REPEAT_WORDS = { '1': 1, '3': 3, '7': 7, '100': 100 };
const INSTRUCTION_TYPES = /^(Instruction\/practice|Hadith narration only)/;

export function buildWyn({ recon, categories, categoryBySlug, duas, mappings, slugify, normalizeArabic, verified, report }) {
  const wyn = recon.wyn;
  const duaBySlug = new Map(duas.map((d) => [d.slug, d]));
  const duaOfLegacy = (key) => {
    const m = mappings.find((x) => x.legacy_key === key);
    return m ? duaBySlug.get(m.dua_slug) : null;
  };
  const stat = {
    wyn_entries_audited: wyn.length,
    wyn_new_categories: 0,
    wyn_matched_and_tagged: 0,
    wyn_category_mappings_added: 0,
    wyn_missing_total: 0,
    wyn_missing_instruction_or_narration_not_stubbed: 0,
    wyn_missing_stubs_created: 0,
    wyn_missing_entries_folded_into_other_stub: 0,
    wyn_stubs_with_quran_arabic_prefilled: 0,
    wyn_incomplete_iqs_duas_flagged: 0,
    wyn_hadith_numbers_filled: 0,
  };
  const wynReport = { new_categories: [], mappings_added: [], stubs: [], not_stubbed: [], hadith_enriched: [], flagged_incomplete: [] };
  report.wyn = wynReport;

  // -- categories ------------------------------------------------------------
  const targetSlug = (w) => (w.proposed_iqs_category_slug === 'morning-and-evening' ? 'morning' : w.proposed_iqs_category_slug);
  let order = 250;
  for (const slug of [...new Set(wyn.map(targetSlug))]) {
    if (categoryBySlug.has(slug)) continue;
    const [name, description] = CATEGORY_NAMES[slug] ?? [slug, ''];
    const c = { slug, name, name_ur: null, name_te: null, description, description_ur: null, description_te: null, sort_order: order, is_active: true, origin: 'wyn_public_pdf' };
    order += 10;
    categories.push(c);
    categoryBySlug.set(slug, c);
    wynReport.new_categories.push(slug);
    stat.wyn_new_categories++;
  }

  let nextMapOrder = 1000;
  const addMapping = (duaSlug, catSlug) => {
    if (mappings.some((m) => m.dua_slug === duaSlug && m.category_slug === catSlug)) return false;
    mappings.push({ dua_slug: duaSlug, category_slug: catSlug, sort_order: nextMapOrder++ });
    return true;
  };
  const note = (d, text) => { d.review_notes = [d.review_notes, text].filter(Boolean).join(' '); };

  // -- matched entries -------------------------------------------------------
  const verifiedRefsByDua = new Map();
  for (const w of wyn) {
    if (!w.iqs_dua_key || !['exact_match', 'same_dua_diff_category', 'same_source_incomplete_text'].includes(w.match_status)) continue;
    if (w.confidence === 'low') continue;
    const d = duaOfLegacy(w.iqs_dua_key);
    if (!d) continue;
    if (!d.wyn_ids.includes(w.canonical_dua_id)) d.wyn_ids.push(w.canonical_dua_id);
    stat.wyn_matched_and_tagged++;

    if (w.match_status === 'same_dua_diff_category' && w.confidence === 'high') {
      const cat = targetSlug(w);
      if (addMapping(d.slug, cat)) {
        stat.wyn_category_mappings_added++;
        wynReport.mappings_added.push({ wyn: w.canonical_dua_id, dua: d.slug, category: cat });
      }
    }
    if (w.match_status === 'same_source_incomplete_text') {
      d.verification_status = 'needs_review';
      note(d, `Wa Iyyaka entry ${w.canonical_dua_id} appears to be longer than this text (${w.match_notes}).`);
      stat.wyn_incomplete_iqs_duas_flagged++;
      wynReport.flagged_incomplete.push({ wyn: w.canonical_dua_id, dua: d.slug });
    }
    if (w.verified && ['exact_match', 'same_source_incomplete_text'].includes(w.match_status)) {
      const m = String(w.hadith_ref).match(/^([A-Za-z' ].*?) (\d+)$/);
      if (m) {
        const list = verifiedRefsByDua.get(d.slug) ?? [];
        list.push({ w, collection: m[1], number: m[2] });
        verifiedRefsByDua.set(d.slug, list);
      }
    }
  }
  for (const [slug, list] of verifiedRefsByDua) {
    const d = duaBySlug.get(slug);
    const numbers = new Set(list.map((x) => `${x.collection}|${x.number}`));
    if (numbers.size !== 1 || d.hadith_number) continue; // ambiguous or already set: leave alone
    const { w, collection, number } = list[0];
    d.hadith_number = number;
    if (/^Sahih$/i.test(w.hadith_grade_printed)) d.hadith_grade = "Sahih (grade as printed in Wa Iyyaka Nasta'in)";
    note(d, `Hadith number ${collection} ${number} from the Wa Iyyaka inventory (${w.canonical_dua_id}), reference verified against the hadith corpus in that research; numbering follows that source.`);
    stat.wyn_hadith_numbers_filled++;
    wynReport.hadith_enriched.push({ dua: slug, ref: `${collection} ${number}`, wyn: w.canonical_dua_id });
  }

  // -- missing entries -> draft stubs ---------------------------------------
  const stubByKey = new Map();
  let stubOrder = 5000;
  for (const w of wyn.filter((x) => x.match_status === 'missing')) {
    stat.wyn_missing_total++;
    if (INSTRUCTION_TYPES.test(w.entry_type)) {
      stat.wyn_missing_instruction_or_narration_not_stubbed++;
      wynReport.not_stubbed.push({ wyn: w.canonical_dua_id, type: w.entry_type, title: w.wyn_title });
      continue;
    }
    const cat = targetSlug(w);
    const key = `${slugify(w.wyn_opening_translit)}|${w.hadith_ref}`;
    const existing = stubByKey.get(key);
    if (existing) {
      existing.wyn_ids.push(w.canonical_dua_id);
      addMapping(existing.slug, cat);
      stat.wyn_missing_entries_folded_into_other_stub++;
      continue;
    }
    const grade = /^(Sahih|Hasan|Da'?if)$/i.test(w.hadith_grade_printed) ? `${w.hadith_grade_printed} (grade as printed in Wa Iyyaka Nasta'in)` : null;
    const hadithRef = String(w.hadith_ref);
    const refMatch = hadithRef.match(/^([A-Za-z' ].*?) (\d+)$/);
    const qs = [...String(w.quran_ref).matchAll(/Q (\d+):(\d+)(?:-(\d+))?/g)];
    const rangeKey = qs.length === 1 ? `${qs[0][1]}:${qs[0][2]}-${qs[0][3] ?? qs[0][2]}` : null;
    const range = rangeKey ? verified.quran_ranges?.[rangeKey] : null;
    const repeat = REPEAT_WORDS[w.wyn_repetition] ?? null;
    const d = {
      slug: `${w.canonical_dua_id.toLowerCase()}-${slugify(w.wyn_opening_translit).slice(0, 48).replace(/-+$/, '')}`,
      title: w.wyn_title,
      title_ur: null,
      arabic: range ? range.arabic_uthmani.join(' ') : '',
      transliteration_latin: null,
      transliteration_telugu: null,
      transliteration_urdu: null,
      translation_en: range ? range.english_sahih.join(' ') : null,
      translation_ur: null,
      description: null,
      repeat_count: repeat,
      source_type: qs.length && refMatch ? 'mixed' : qs.length ? 'quran' : refMatch || /Sahih|Sunan|Jami|Musnad/.test(hadithRef) ? 'hadith' : 'other',
      source_collection: refMatch ? refMatch[1] : null,
      source_reference: hadithRef.startsWith('None') ? (qs.length ? `Qur'an ${qs.map((q) => `${q[1]}:${q[2]}${q[3] ? '-' + q[3] : ''}`).join(', ')}` : null) : hadithRef,
      // only numbers the inventory's corpus check confirmed (VERIFIED*); mismatching/unchecked numbers stay in the reference text only
      hadith_number: refMatch && /^VERIFIED/.test(w.reference_detail) ? refMatch[2] : null,
      hadith_grade: grade,
      quran_refs: qs.map((q) => ({ surah: +q[1], ayah_from: +q[2], ayah_to: +(q[3] ?? q[2]) })),
      audio_url: null,
      status: 'draft',
      verification_status: 'needs_review',
      review_notes:
        `Wa Iyyaka Nasta'in ${w.canonical_dua_id} (${w.wyn_section}); ${w.reference_detail} reference check in the research inventory${w.wyn_repetition && w.wyn_repetition !== 'Not specified' ? `; printed repetition: "${w.wyn_repetition}"` : ''}. ` +
        (range
          ? "Arabic/English are the referenced Qur'an passage from IqraSpace's dataset / Saheeh International; confirm this is the full wording the dua uses and add a transliteration. "
          : "STUB: no Arabic. The source book's text is copyrighted and was not reproduced; supply the Arabic from the cited hadith (verify against a hadith corpus), then translation and transliteration. ") +
        (w.needs_review ? 'Reconciliation flagged this entry as needing review. ' : '') +
        `Printed grade: ${w.hadith_grade_printed}.`,
      origin: 'wyn_public_pdf',
      wyn_ids: [w.canonical_dua_id],
      sort_order: stubOrder++,
    };
    if (range) stat.wyn_stubs_with_quran_arabic_prefilled++;
    duas.push(d);
    duaBySlug.set(d.slug, d);
    stubByKey.set(key, d);
    addMapping(d.slug, cat);
    stat.wyn_missing_stubs_created++;
    wynReport.stubs.push({ wyn: w.canonical_dua_id, slug: d.slug, category: cat, arabic_prefilled: !!range });
  }
  return { counts: stat };
}
