# Duas migration report

Generated 2026-10-03T10:28:27.561Z by build_canonical.mjs

| Outcome | Count | Meaning |
|---|---|---|
| Imported | 106 | legacy entries read from the old bundled supplications.json |
| Updated (corrected) | 3 | Istikhara, Ayat al-Kursi, Three Quls — completed from verified sources |
| Merged | 4 | legacy entries folded into an existing canonical Dua (category mapping kept) → 102 canonical Duas from the 106 |
| Duplicate (kept) | 1 | identical Arabic twice in the SAME category (hajj#2/#3) — cannot share one record; kept, flagged |
| Missing (Wa Iyyaka) | 110 | WYN entries with no IQS equivalent: 95 draft stubs created, 1 folded into another stub, 14 instruction/narration-only entries not stubbed |
| Needs review | 106 | Duas with verification_status = needs_review (includes all draft stubs) |
| Invalid | 0 | rows failing the DB constraints |

## Counts

```json
{
  "legacy_entries_imported": 106,
  "legacy_mappings_preserved": 106,
  "canonical_duas_from_legacy": 102,
  "merged_legacy_entries": 4,
  "corrected": 3,
  "same_category_duplicates_kept": 1,
  "titles_cleaned": 20,
  "repeat_counts_structured": 6,
  "repeat_counts_need_manual_structuring": 3,
  "urdu_translit_copies_dropped": 106,
  "categories_total": 41,
  "categories_from_legacy": 25,
  "duas_total": 197,
  "duas_published": 102,
  "duas_draft": 95,
  "mappings_total": 213,
  "verification_verified": 9,
  "verification_unchecked": 82,
  "verification_needs_review": 106,
  "translation_ur_populated": 10,
  "hadith_number_populated": 73,
  "invalid": 0,
  "wyn_entries_audited": 178,
  "wyn_new_categories": 16,
  "wyn_matched_and_tagged": 44,
  "wyn_category_mappings_added": 11,
  "wyn_missing_total": 110,
  "wyn_missing_instruction_or_narration_not_stubbed": 14,
  "wyn_missing_stubs_created": 95,
  "wyn_missing_entries_folded_into_other_stub": 1,
  "wyn_stubs_with_quran_arabic_prefilled": 9,
  "wyn_incomplete_iqs_duas_flagged": 8,
  "wyn_hadith_numbers_filled": 13
}
```

## Corrections

- **A-istikhara** `knowledge-istikharah-seeking-guidance-in-a-decision` — source Sahih al-Bukhari 1166 — applied
- **B-ayat-al-kursi** `ayat-al-kursi` — source Qur'an 2:255 — applied
- **C-three-quls** `three-quls` — source Qur'an 112-114 — applied

## Merged groups

- `ayat-al-kursi` ← evening#2, sleep#2 — Same Qur'anic verse (2:255); sleep#2 was a truncated copy of evening#2
- `three-quls` ← evening#3, sleep#3 — Same three Surahs recited in two contexts; both legacy Arabic fields were truncated
- `bismillah` ← wudu#0, food#0 — Identical Arabic (Bismillah) before wudu and before eating
- `seeking-refuge-from-the-accursed-devil` ← anger#0, faith#1 — Identical Arabic (A'udhu billahi minash-shaytanir-rajim) for anger and for whispers in prayer

## Repetition counts structured (repeat_count)

- morning#0: ×1 (occasion '(x1)')
- evening#0: ×1 (occasion '(x1)')
- morning#3: ×3 (occasion 'said 3 times')
- evening#3: ×3 (occasion 'x3 each')
- sleep#3: ×3 (translation 'repeated three times')
- witr#1: ×3 (translation 'said three times')

## Repetition counts NOT structured (per-part counts) — NEEDS MANUAL VERIFICATION

- salah#9: forgiveness phrase 'three times' inside a multi-part dhikr
- sickness#1: two parts: 'three times' and 'seven times'
- faith#1: 'spitting lightly to the left three times' is an instruction, not a recitation count

## Titles cleaned (count/chapter markers moved out of the title)

- morning#0: "Morning remembrance (x1)" → "Morning remembrance"
- morning#3: "Protection, said 3 times" → "Protection"
- evening#0: "Evening remembrance (x1)" → "Evening remembrance"
- evening#3: "The three Quls (Ikhlas, Falaq, Nas), x3 each" → "The three Quls (Ikhlas, Falaq, Nas)"
- salah#8: "Prostration of Qur'an recitation, sajdat at-tilawah (ch.21)" → "Prostration of Qur'an recitation, sajdat at-tilawah"
- salah#9: "General remembrance after the salam (ch.25)" → "General remembrance after the salam"
- food#5: "For someone who feeds or gives you drink (ch.72)" → "For someone who feeds or gives you drink"
- travel#3: "The fuller traveling dua (ch.96)" → "The fuller traveling dua"
- travel#4: "The traveler's farewell to the one staying behind (ch.100)" → "The traveler's farewell to the one staying behind"
- travel#5: "The one staying behind, to the traveler (ch.101)" → "The one staying behind, to the traveler"
- weather#5: "If rain becomes excessive or harmful (ch.66)" → "If rain becomes excessive or harmful"
- grief#5: "Upon closing the eyes of one who has died (ch.54)" → "Upon closing the eyes of one who has died"
- grief#6: "Placing the deceased into the grave (ch.58)" → "Placing the deceased into the grave"
- social#4: "Upon sneezing, said by the sneezer himself (ch.77)" → "Upon sneezing, said by the sneezer himself"
- social#5: "Replying to 'may Allah forgive you and us' (ch.86)" → "Replying to 'may Allah forgive you and us'"
- social#6: "For someone who has done you a favor (ch.87)" → "For someone who has done you a favor"
- social#7: "Reply when told 'I love you for Allah's sake' (ch.89)" → "Reply when told 'I love you for Allah's sake'"
- social#8: "To dispel a superstitious omen (ch.94)" → "To dispel a superstitious omen"
- faith#0: "When troubled by doubts about faith (ch.40)" → "When troubled by doubts about faith"
- faith#1: "Seeking refuge from distracting whispers in prayer (ch.45)" → "Seeking refuge from distracting whispers in prayer"

## Needs review (published)

- `ayat-al-kursi`: Arabic = Qur'an 2:255 from IqraSpace's Quran dataset (text_uthmani); English = Saheeh International; Latin transliteration = Al Quran Cloud en.transliteration. Telugu transliteration removed (the legacy text covered only the first words) — app falls back to Latin until a complete Telugu transliteration is supplied. NEEDS MANUAL VERIFICATION of transliteration only. Wa Iyyaka entry WYN-0006 appears to be longer than this text (Ayat al-Kursi. IQS evening#2 stops at "la ta'khudhuhu sinatun wa la nawm" (verified truncation); sleep#2 duplicates it. Qur'an 2:255 reference matches.). Wa Iyyaka entry WYN-0055 appears to be longer than this text (Instruction entry: recite Ayat al-Kursi at night. IQS sleep#2 covers the same practice (Bukhari) but its Arabic is truncated.). translation_ur = Urdu translation of the Qur'an (Al Quran Cloud ur.maududi, Tafheem ul Quran), unmodified.
- `three-quls`: Arabic = Surahs 112-114 from IqraSpace's Quran dataset (text_uthmani, Bismillah not prefixed); English = Saheeh International; Latin = Al Quran Cloud en.transliteration. Telugu transliteration removed (legacy covered only 1 ayah) — app falls back to Latin. NEEDS MANUAL VERIFICATION of transliteration only. Wa Iyyaka entry WYN-0019 appears to be longer than this text (Surah al-Ikhlas. IQS evening#3 holds only Al-Ikhlas v1 (verified data error); one IQS entry stands for three WYN entries.). Wa Iyyaka entry WYN-0020 appears to be longer than this text (Surah al-Falaq: IQS evening#3 does not contain its Arabic text (verified data error).). Wa Iyyaka entry WYN-0021 appears to be longer than this text (Surah an-Nas: IQS evening#3 does not contain its Arabic text (verified data error).). translation_ur = Urdu translation of the Qur'an (Al Quran Cloud ur.maududi, Tafheem ul Quran), unmodified.
- `salah-general-remembrance-after-the-salam`: Hisnul Muslim chapter 25 (from legacy title). Repetition counts are embedded in the translation text (forgiveness phrase 'three times' inside a multi-part dhikr); structure manually.
- `home-congratulating-new-parents`: Reference "General Sunnah practice" is descriptive, with no collection or hadith number — find the source.
- `anxiety-for-anxiety-and-sorrow`: Wa Iyyaka entry WYN-0152 appears to be longer than this text (Same hadith (Bukhari). The WYN opening continues "...wa dala'id daini wa ghalabatir rijal"; IQS ends at "wal-bukhli wal-jubn". IQS Arabic appears shorter than the printed WYN text. Confirm.).
- `seeking-refuge-from-the-accursed-devil`: Repetition counts are embedded in the translation text ('spitting lightly to the left three times' is an instruction, not a recitation count); structure manually. Hadith number Sahih Muslim 5738 from the Wa Iyyaka inventory (WYN-0063), reference verified against the hadith corpus in that research; numbering follows that source.
- `sickness-placing-the-hand-on-the-site-of-pain`: Repetition counts are embedded in the translation text (two parts: 'three times' and 'seven times'); structure manually. Hadith number Sahih Muslim 5737 from the Wa Iyyaka inventory (WYN-0094), reference verified against the hadith corpus in that research; numbering follows that source.
- `grief-for-a-deceased-loved-one`: Wa Iyyaka entry WYN-0111 appears to be longer than this text (Same hadith (Muslim) but the WYN opening continues "...wa akrim nuzulahu"; IQS ends at "wa'fu anhu". IQS Arabic appears shorter than the printed WYN text. Confirm against the full text.).
- `knowledge-istikharah-seeking-guidance-in-a-decision`: Arabic completed from Sahih al-Bukhari 1166 (fawazahmed0 ara-bukhari corpus; wording preserved, orthography normalised, narrator "or he said" in parentheses). The hadith number comes from the corpus numbering and the research inventory (IK1: printed Bukhari 1116 is a different hadith; the Istikhara hadith is 1166). English continuation and Latin transliteration continuation were drafted by IqraSpace — NEEDS MANUAL VERIFICATION against a scholarly translation. Telugu transliteration removed (legacy covered only the first third) — app falls back to Latin. Wa Iyyaka entry WYN-0178 appears to be longer than this text (Istikhara: IQS Arabic stops after "wa anta allamul ghuyub" and omits the continuation naming the matter (verified data error). Printed B 1116 flagged in the inventory as probable transposition of 1166. | Inventory: REFERENCE CHECK: Printed B 1116 (sunnah.com confirmed) is a hadith on praying while sitting (Imran bin Husain). The Istikhara hadith of Jabir is Sahih al-Bukhari 1166 (also 6382, 7390; T 480, N 3253, IM 1383). Likely typographical transposition; requires verification.).
- `social-greeting-a-fellow-muslim`: Reference "Sunnah greeting" is descriptive, with no collection or hadith number — find the source.
- `social-replying-to-may-allah-forgive-you-and-us`: Hisnul Muslim chapter 86 (from legacy title). Reference "General Sunnah reply" is descriptive, with no collection or hadith number — find the source.

## Wa Iyyaka stage

New categories: hamd-o-sana, durood-sharif, protection-and-safety, protection-from-enemy, night-protection, bad-dream, evil-eye, protection-from-magic, jinn-and-shayateen, visiting-the-sick, trials-and-adversity, deceased-maghfirat, istighfar, relief-from-distress, maqbool-duain, after-salah

Category mappings added for existing Duas (11):
- WYN-0047: `salah-before-the-final-salam` → protection-and-safety
- WYN-0085: `seeking-refuge-from-the-accursed-devil` → jinn-and-shayateen
- WYN-0086: `dressing-entering-the-toilet` → jinn-and-shayateen
- WYN-0087: `home-leaving-the-home` → jinn-and-shayateen
- WYN-0088: `home-before-marital-relations` → jinn-and-shayateen
- WYN-0134: `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` → istighfar
- WYN-0136: `salah-general-remembrance-after-the-salam` → istighfar
- WYN-0141: `social-expiation-at-the-end-of-a-gathering` → istighfar
- WYN-0158: `anxiety-dua-of-yunus-in-the-belly-of-the-whale` → maqbool-duain
- WYN-0164: `salah-general-remembrance-after-the-salam` → after-salah
- WYN-0176: `market-for-beneficial-provision-after-fajr` → after-salah

Existing Duas flagged as shorter than the WYN entry (8):
- WYN-0006: `ayat-al-kursi`
- WYN-0019: `three-quls`
- WYN-0020: `three-quls`
- WYN-0021: `three-quls`
- WYN-0055: `ayat-al-kursi`
- WYN-0111: `grief-for-a-deceased-loved-one`
- WYN-0152: `anxiety-for-anxiety-and-sorrow`
- WYN-0178: `knowledge-istikharah-seeking-guidance-in-a-decision`

Hadith numbers filled from verified inventory references (13):
- `morning-by-you-we-reach-morning-and-evening`: Jami' at-Tirmidhi 3391 (WYN-0007)
- `morning-morning-remembrance`: Sahih Muslim 6908 (WYN-0010)
- `evening-seeking-refuge-at-nightfall`: Sahih Muslim 6880 (WYN-0012)
- `morning-protection`: Sunan Abu Dawud 5088 (WYN-0013)
- `morning-sayyid-al-istighfar-master-of-seeking-forgiveness`: Sahih al-Bukhari 6306 (WYN-0017)
- `seeking-refuge-from-the-accursed-devil`: Sahih Muslim 5738 (WYN-0063)
- `sickness-placing-the-hand-on-the-site-of-pain`: Sahih Muslim 5737 (WYN-0094)
- `sickness-for-healing`: Sahih Muslim 5707 (WYN-0096)
- `grief-the-fuller-dua-for-calamity`: Sahih Muslim 2126 (WYN-0106)
- `grief-upon-closing-the-eyes-of-one-who-has-died`: Sahih Muslim 2130 (WYN-0109)
- `grief-in-the-funeral-prayer-more-generally`: Sunan Abu Dawud 3201 (WYN-0110)
- `repentance-general-seeking-of-forgiveness`: Jami' at-Tirmidhi 3577 (WYN-0127)
- `anxiety-dua-of-yunus-in-the-belly-of-the-whale`: Jami' at-Tirmidhi 3505 (WYN-0150)

Not stubbed (instructions / narrations, not recitations) (14):
- WYN-0058 [Instruction/practice (no recitation text)] Change sleeping position (instruction; no dua text)
- WYN-0069 [Instruction/practice (no recitation text)] If the person who caused the evil eye is known, ask him/her to perform ablution and wash the place where the waist belt is tied; afflicted person bathes with that water (hadith: Al-'ainu haqq...)
- WYN-0074 [Instruction/practice (no recitation text)] Regularly read the supplications for morning, evening, protection and healing
- WYN-0077 [Instruction/practice (no recitation text)] Eat seven 'Ajwah dates first thing in the morning
- WYN-0078 [Instruction/practice (no recitation text)] Perform cupping (hijamah), a masnun treatment
- WYN-0079 [Instruction/practice (no recitation text)] Read Ruqyah Shar'iyyah or play a recording before the afflicted person
- WYN-0083 [Instruction/practice (no recitation text)] Recite the Qur'an excessively (Qur'anic verse printed: wa nunazzilu minal Qur'ani ma huwa shifa'un wa rahmatun lil mu'minin)
- WYN-0084 [Instruction/practice (no recitation text)] Recite Al-Baqarah; if unable, its recitation can be played
- WYN-0090 [Instruction/practice (no recitation text)] Recitation of the Holy Qur'an is a healing (verses printed: a. wa nunazzilu minal Qur'ani... (17:82 wording); b. ya ayyuhan nasu qad ja'atkum maw'izatum mir rabbikum wa shifa'un lima fis sudur (10:57 wording))
- WYN-0091 [Instruction/practice (no recitation text)] Benefit from natural nutrients/medicines: honey, Habbat al-Sauda (Nigella), Zam Zam water, rain water, olive oil
- WYN-0092 [Instruction/practice (no recitation text)] During sickness recite Al-Fatihah an odd number of times and blow over the afflicted person (Surah al-Fatihah printed in full)
- WYN-0098 [Hadith narration only] The command to visit the sick (hadith: At'imul ja'i' wa 'udul marid wa fukkul 'ani)
- WYN-0099 [Hadith narration only] Excellence of visiting the sick (narration of 'Ali, seventy thousand angels)
- WYN-0100 [Hadith narration only] Hadith Qudsi: 'I was ill and you did not visit Me'