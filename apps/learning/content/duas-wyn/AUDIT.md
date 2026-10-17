# Wa Iyyaka Nastaeen ↔ IqraSpace Duas — audit report

Generated 2026-10-17 from `catalog.json` against the Learning D1 snapshot taken before this change. Workflow and sources: [README.md](README.md).

## What was audited

| Source | What it gave | How it was read |
|---|---|---|
| **WYN app** v3.3.7 (Android, `com.alhuda.duas.iyykanastaeen`, Sept 2025) | The authoritative list: **23 categories, 478 placements, 342 distinct Duas** (some Duas appear in several categories), with WYN's order, counts and printed references | Its bundled SQLite content database, read directly — no screenshots or guesses |
| **Reference PDF** (Al-Huda `AIWF-eBooks-004 … Subh o Shaam kay Azkaar o Hifazat ki Duaain`) | Byte-identical (SHA-256 `5af4ac1b…`) to the **Urdu 6th edition, 2014** used by the earlier research | Morning/Evening pages (printed pp. 8–15) re-read directly from page images for this audit |
| **Printed-book inventory** (`docs/supplications/research`, English 2013 + Urdu 2014, 178 entries) | Section counts and printed references for the "Book" column | Earlier research, verified page by page |
| **IqraSpace** (Learning D1, local snapshot = the data imported for the Cloudflare cutover) | 197 Duas (102 published, 95 WYN stub drafts — 85 of them with no Arabic at all), 41 categories | Read directly |
| **Qur'an / hadith corpora** | Arabic for every new Dua where available; each hadith text machine-checked to occur in the cited hadith | Al Quran Cloud (Tanzil), fawazahmed0 hadith-api (Darussalam numbering = WYN's) |

## Why IqraSpace showed 5 Morning Duas against WYN's 22

1. **Category, not content.** Ten of the 21 printed Morning/Evening items were already published in IqraSpace — but filed under other categories (Istighfar, Protection, Hajj, Anxiety, the combined "three Quls" row, …), so the `morning` category showed only 5. The other ten existed only as **unpublished stub drafts with no Arabic**, which never reach the site or app.
2. **The app is not the book.** WYN's Morning list (22) = the book's 21 items **plus** Durood (Nasa'i 1293, from the book's Durood section) and *Ḥasbiya-llāh* ×7 (Qur'an 9:129) — **minus** the book's separate "kufr wal-faqr" item (ME11), which the app folds into the *'āfinī fī badanī* entry (same hadith, Abu Dawud 5090) — and the three Quls are three separate entries. Evening (20) is the same set minus the two morning-only items (*'adada khalqihi* ×3 and the traveller's *sami'a sāmi'un*), with the evening wordings (*amsaynā*); *Astaghfirullāh* ×100, printed "in the morning" in the book, is listed in both in the app.
3. **The PDF check.** All 21 Morning/Evening items in the reference PDF were re-read; they match the inventory (order, wording, counts: 3× for items 1, 9–11, 15–17; 100× for 19–20; 1× otherwise). Item 20 (*Astaghfirullāh* 100×) is printed "morning 100 times"; item 21 is the traveller's morning dua.

WYN's own data has slips too, recorded rather than copied: its labels for the three Quls in Morning/Evening are shifted by one (Al-Falaq is labelled "Surah Al-Ikhlaas", An-Nas "Surah Al-Falaq"), and several printed references point to a neighbouring hadith number (listed per category under "Unresolved verification issues", e.g. Muslim 6943 → 6944, Nasa'i 1304 → 1303, Bukhari 843 → 842, Bukhari 1162 → 1166).

The same pattern — WYN content present only as empty stubs, or filed elsewhere — explains every other category's gap; see the table.

## Structure decision (from the owner)

WYN's 23 categories come first, in WYN's order, with WYN's names and Dua sequence; IqraSpace's own
categories (Wudu, Food, Hajj, …) stay, listed after them. Existing slugs are reused where the concept is
the same (`morning`, `evening`, `waking`, `travel`, and the 13 WYN categories created earlier); six are
new: `evil-whisperings`, `healing`, `visiting-graveyard`, `istikhara`, `shifa-collection`, `sakeenah`.
IqraSpace's "Sickness & healing" and "Doubts & whispers" stay as IqraSpace categories (their scope differs).

## What could not be mirrored exactly

- **Same Dua twice in one category.** WYN repeats a few Duas inside one category (e.g. the travel takbir/*āyibūn* at departure *and* return). A Dua can appear once per category in IqraSpace's schema; the repeat is listed under "Not added" for that category.
- **Pure pointers.** Two WYN Black-Magic entries only say "refer to the morning/evening section" / "listen to the audio lecture" — nothing to recite or cite.
- **Copyright.** WYN's own English/Urdu translations, transliterations and narration texts are not reproduced. Every new translation is an IqraSpace draft awaiting scholar review.
- **Telugu.** The database has a Telugu *transliteration* field only (no Telugu translation column). Telugu transliterations were drafted for texts up to ~600 Arabic characters; longer recitations (whole Surahs, long ayat) fall back to Latin in the app, as existing long entries already do.

## Reviewer actions this sync does not take on its own

- **Duplicate shown in Evening.** The published combined row `three-quls` stays in Evening (after WYN's sequence) next to WYN's three separate Surah entries. Remove that one mapping in the admin category page if Evening should match WYN exactly; the row stays in its other categories.
- **Other kept extras** (published, listed after WYN's sequence): `home-leaving-the-home` in Jinns & Shaitan, `travel-entering-a-town-or-village` in Travel.
- **Cannot be published yet:** `wyn-allahumma-ijal-hammi-al-akhirah` (Healing Collection) — WYN prints no reference and none was found in the corpora; the publish rules require one, so it stays in review until a source is supplied.
- **Superseded WYN stub drafts.** 65 stub drafts from the earlier pass were not used — mostly printed-book entries that the app does not carry (listed below), plus a few duplicates of rows now filled (e.g. `wyn-0015` is merged into the full Abu Dawud 5090 row, `wyn-0080` duplicates `wyn-0066`, `wyn-0142` duplicates the *Astaghfirullāh* ×100 row). They are drafts, invisible to the site and app; archive them from the admin list when convenient.
- **Proposed corrections** to 24 published Duas (below) are not applied unless `--with-corrections` is passed after reading them. The most important: truncated Arabic in Sayyid al-Istighfar, the morning and evening remembrance Duas, the calamity Dua and two funeral Duas; `sickness-for-healing` (Arabic blends two narrations); the morning *bika aṣbaḥnā* row ending with the evening word *an-nushūr*; counts written inside Arabic text; wrong or missing hadith numbers.


## Summary by category

Columns: **WYN** = entries in the WYN app category · **Book** = entries in the matching section of the printed book (English 2013 / Urdu 2014), where one exists · **Before** = IqraSpace rows mapped to that category before this change · **Reused** = existing published rows placed as-is · **Filled** = existing WYN stub drafts completed · **Added** = new Duas · **Excl.** = WYN entries not representable · **Corr.** = proposed fixes to published rows · **Issues** = open verification notes.

| # | Category | WYN | Book | Before | Reused | Filled | Added | Excl. | Corr. | Issues |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Morning Supplications (`morning`) | 22 | 21 | 5 (+10 draft) | 9 | 9 | 4 | 0 | 4 | 53 |
| 2 | Evening Supplications (`evening`) | 20 | 21 | 4 (+0 draft) | 8 | 6 | 6 | 0 | 3 | 53 |
| 3 | Protection During the Night (`night-protection`) | 24 | 2 | 0 (+0 draft) | 3 | 3 | 18 | 0 | 1 | 52 |
| 4 | After a Bad Dream (`bad-dream`) | 4 | 4 | 0 (+1 draft) | 0 | 0 | 4 | 0 | 0 | 10 |
| 5 | Supplications for Waking Up (`waking`) | 8 | — | 2 (+0 draft) | 2 | 0 | 6 | 0 | 2 | 18 |
| 6 | Supplications for Protection (`protection-and-safety`) | 25 | 22 | 1 (+19 draft) | 2 | 1 | 22 | 0 | 1 | 34 |
| 7 | For Warding Off Evil Whisperings (`evil-whisperings`) | 10 | 9 | 0 (+0 draft) | 1 | 2 | 7 | 0 | 0 | 22 |
| 8 | For Warding Off Evil-Eye (`evil-eye`) | 18 | 5 | 0 (+2 draft) | 2 | 3 | 13 | 0 | 1 | 34 |
| 9 | Protection Against Black Magic (`protection-from-magic`) | 7 | 9 | 0 (+2 draft) | 1 | 0 | 4 | 2 | 0 | 12 |
| 10 | Protection Against Jinns and Shaitan (`jinn-and-shayateen`) | 13 | 7 | 4 (+0 draft) | 6 | 3 | 4 | 0 | 0 | 21 |
| 11 | Protection from Enemies (`protection-from-enemy`) | 7 | 6 | 0 (+6 draft) | 0 | 6 | 1 | 0 | 0 | 12 |
| 12 | Supplication for Healing (`healing`) | 8 | 8 | 0 (+0 draft) | 2 | 1 | 5 | 0 | 2 | 14 |
| 13 | Visiting the Sick (`visiting-the-sick`) | 9 | 7 | 0 (+2 draft) | 3 | 0 | 6 | 0 | 3 | 11 |
| 14 | Forgiveness of the Deceased (`deceased-maghfirat`) | 7 | 7 | 0 (+4 draft) | 3 | 0 | 4 | 0 | 3 | 11 |
| 15 | Visiting the Graveyard (`visiting-graveyard`) | 3 | — | 0 (+0 draft) | 0 | 0 | 3 | 0 | 0 | 4 |
| 16 | Supplications for Forgiveness (`istighfar`) | 19 | 28 | 3 (+19 draft) | 3 | 2 | 14 | 0 | 2 | 29 |
| 17 | Relief from Sorrow and Distress (`relief-from-distress`) | 16 | 15 | 0 (+10 draft) | 5 | 1 | 10 | 0 | 3 | 24 |
| 18 | Accepted Supplications (`maqbool-duain`) | 6 | 6 | 1 (+5 draft) | 1 | 0 | 5 | 0 | 0 | 7 |
| 19 | After Salah (`after-salah`) | 25 | 15 | 2 (+7 draft) | 3 | 2 | 18 | 2 | 1 | 50 |
| 20 | Seeking Divine Counsel (`istikhara`) | 1 | 1 | 0 (+0 draft) | 1 | 0 | 0 | 0 | 0 | 2 |
| 21 | Supplications for Travelling (`travel`) | 26 | — | 6 (+0 draft) | 9 | 1 | 11 | 5 | 3 | 38 |
| 22 | Supplications for Healing (Collection) (`shifa-collection`) | 194 | — | 0 (+0 draft) | 15 | 14 | 143 | 22 | 7 | 239 |
| 23 | Ayaat of Tranquility (`sakeenah`) | 6 | — | 0 (+0 draft) | 0 | 0 | 6 | 0 | 0 | 5 |
| | **Total (placements)** | **478** | | **28** | **79** | **54** | **314** | **31** | **24** Duas | |

Distinct Duas in the catalog: **332** (256 new, 30 stub fills, 46 reused). Verification of new/filled rows: unchecked 204, needs_review 82. All of them enter the database as **review**, not published.

## Corrections proposed for published rows (opt-in: `--with-corrections`)

| Dua | Field | Reason |
|---|---|---|
| `anxiety-when-overwhelmed-by-a-matter` | source_reference | Row cites only 'Abu Dawud'. The wording is from Qur'an 9:129 (as WYN cites); Abu Dawud 5081 is a mawquf report of Abu ad-Darda' for saying it seven times. |
| `morning-by-you-we-reach-morning-and-evening` | arabic | Row cites Tirmidhi 3391 but ends 'wa ilayka-n-nushūr'; in Tirmidhi 3391 the morning wording ends 'wa ilayka-l-maṣīr' (nushūr is the evening wording). WYN's morning text also ends al-maṣīr. Corpus Tirmidhi 3391 CONTAINED. |
| `morning-by-you-we-reach-morning-and-evening` | transliteration_latin | follows corrected Arabic |
| `morning-by-you-we-reach-morning-and-evening` | transliteration_telugu | follows corrected Arabic |
| `morning-by-you-we-reach-morning-and-evening` | translation_en | follows corrected Arabic |
| `morning-by-you-we-reach-morning-and-evening` | translation_ur | follows corrected Arabic |
| `morning-by-you-we-reach-morning-and-evening` | source_reference | row says only 'Tirmidhi'; hadith_number already 3391 |
| `morning-morning-remembrance` | arabic | Published Arabic stops after 'lā sharīka lah' — the rest of the dua in Sahih Muslim 6908 (and in WYN) is missing. |
| `morning-morning-remembrance` | transliteration_latin | published transliteration covers only the truncated first part |
| `morning-morning-remembrance` | transliteration_telugu | published Telugu covers only the truncated first part |
| `morning-morning-remembrance` | translation_en | published translation covers only the truncated first part |
| `morning-morning-remembrance` | translation_ur | published translation covers only the truncated first part |
| `morning-morning-remembrance` | source_reference | row says only 'Muslim'; hadith_number is 6908 |
| `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` | arabic | Published Arabic stops after 'mā-staṭaʿtu'; the rest of Sayyid al-Istighfar (aʿūdhu bika … illā ant) in Bukhari 6306 and in WYN is missing. Corpus Bukhari 6306 CONTAINED. |
| `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` | transliteration_latin | covers only the truncated part |
| `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` | transliteration_telugu | covers only the truncated part |
| `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` | translation_en | covers only the truncated part |
| `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` | translation_ur | covers only the truncated part |
| `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` | description | virtue from Bukhari 6306 missing (optional) |
| `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` | source_reference | row says only 'Bukhari'; hadith_number is 6306 |
| `evening-evening-remembrance` | arabic | Published Arabic stops after 'lā sharīka lah' — the rest of the dua in Sahih Muslim 6908 (and in WYN) is missing. |
| `evening-evening-remembrance` | transliteration_latin | published transliteration covers only the truncated first part |
| `evening-evening-remembrance` | transliteration_telugu | published Telugu covers only the truncated first part |
| `evening-evening-remembrance` | translation_en | published translation covers only the truncated first part |
| `evening-evening-remembrance` | translation_ur | published translation covers only the truncated first part |
| `evening-evening-remembrance` | hadith_number | missing; WYN cites Sahih Muslim 6908 |
| `evening-evening-remembrance` | source_reference | row says only 'Muslim' |
| `sleep-seeking-protection-through-the-night` | repeat_count | Abu Dawud 5045 says the Prophet ﷺ said it three times; WYN shows 3x. Row has null. |
| `sleep-seeking-protection-through-the-night` | hadith_number | missing; WYN cites Sunan Abi Dawud 5045 (verified) |
| `sleep-seeking-protection-through-the-night` | source_reference | row says only 'Abu Dawud, Tirmidhi' |
| `waking-upon-waking` | arabic | Published Arabic has a malformed 'ِللهِ' (kasra written before the lam, detached); replace with the corpus wording of Bukhari 6314 (CONTAINED). |
| `waking-upon-waking` | source_reference | Reference lacks the hadith number (WYN prints Bukhari 6314; corpus confirms the text). |
| `waking-upon-waking` | hadith_number | Missing hadith number. |
| `waking-upon-waking-an-alternate-wording` | source_reference | Reference lacks the hadith number (WYN prints Tirmidhi 3401; corpus confirms the text). |
| `waking-upon-waking-an-alternate-wording` | hadith_number | Missing hadith number. |
| `salah-before-the-final-salam` | source_reference | Reference lacks the hadith number (WYN prints Muslim 1324; corpus confirms the text). |
| `salah-before-the-final-salam` | hadith_number | Missing hadith number. |
| `sickness-for-healing` | arabic | Published Arabic ('Allahumma rabban-nas adhhibil-ba's, ishfi anta...') is a blend not found verbatim in any corpus hadith and does not match its cited Sahih Muslim 5707; proposed text is Muslim 5707 verbatim (check.mjs CONTAINED) and matches WYN. |
| `sickness-for-healing` | transliteration_latin | follow corrected Arabic |
| `sickness-for-healing` | transliteration_telugu | follow corrected Arabic |
| `sickness-for-healing` | translation_en | follow corrected Arabic (no 'Allahumma' in Muslim 5707) |
| `sickness-for-healing` | translation_ur | follow corrected Arabic |
| `sickness-for-healing` | source_reference | existing reference 'Bukhari, Muslim' has no numbers |
| `sickness-placing-the-hand-on-the-site-of-pain` | arabic | Published Arabic embeds repetition markers (×٣)/(×٧) in the text; counts belong in the description. |
| `sickness-placing-the-hand-on-the-site-of-pain` | transliteration_latin | Remove embedded (x3)/(x7) markers. |
| `sickness-placing-the-hand-on-the-site-of-pain` | transliteration_telugu | Remove embedded (x3)/(x7) markers. |
| `sickness-placing-the-hand-on-the-site-of-pain` | translation_en | Remove 'three times'/'seven times' from the translation text. |
| `sickness-placing-the-hand-on-the-site-of-pain` | translation_ur | Remove 'تین مرتبہ'/'سات مرتبہ' from the translation text. |
| `sickness-placing-the-hand-on-the-site-of-pain` | description | Carries the two different counts that were embedded in the text fields. |
| `sickness-placing-the-hand-on-the-site-of-pain` | source_reference | Reference reads only 'Muslim'; hadith number 5737 is already stored and corpus-confirmed. |
| `sickness-placing-the-hand-on-the-site-of-pain` | title_ur | Current Urdu title ('dua for visiting the sick') does not match this dua, which the sufferer says for himself. |
| `sickness-visiting-the-sick` | source_collection | Text 'لا بأس طهور إن شاء الله' is found in Bukhari (3616, 5656, 5662), not in Abu Dawud or Tirmidhi per corpus search. |
| `sickness-visiting-the-sick` | source_reference | Current reference 'Abu Dawud, Tirmidhi' is wrong; WYN cites Bukhari 5662 (verified CONTAINED). |
| `sickness-visiting-the-sick` | hadith_number | Was null. |
| `grief-the-fuller-dua-for-calamity` | arabic | Muslim 2126 gives the dua as the istirja' followed by 'Allahumma'jurni...'; the published row (titled 'the fuller dua') omits the opening istirja'. WYN shows the full text. Verified CONTAINED in Muslim 2126. |
| `grief-the-fuller-dua-for-calamity` | transliteration_latin | Match the full Arabic. |
| `grief-the-fuller-dua-for-calamity` | transliteration_telugu | Match the full Arabic. |
| `grief-the-fuller-dua-for-calamity` | translation_en | Match the full Arabic. |
| `grief-the-fuller-dua-for-calamity` | translation_ur | Match the full Arabic. |
| `grief-the-fuller-dua-for-calamity` | source_reference | Reference reads only 'Muslim'; number already stored. |
| `grief-upon-closing-the-eyes-of-one-who-has-died` | transliteration_telugu | Published Telugu contains Latin text 'li-[name]' inside the Telugu-script reading. |
| `grief-upon-closing-the-eyes-of-one-who-has-died` | source_reference | Reference reads only 'Muslim'; number already stored. |
| `grief-in-the-funeral-prayer-more-generally` | arabic | Published text stops after the first sentence (omits 'our male and female' and the two remaining sentences) though it cites Abu Dawud 3201. Full wording verified CONTAINED in Abu Dawud 3201. |
| `grief-in-the-funeral-prayer-more-generally` | transliteration_latin | Match the full Arabic. |
| `grief-in-the-funeral-prayer-more-generally` | transliteration_telugu | Match the full Arabic. |
| `grief-in-the-funeral-prayer-more-generally` | translation_en | Match the full Arabic. |
| `grief-in-the-funeral-prayer-more-generally` | translation_ur | Match the full Arabic. |
| `grief-in-the-funeral-prayer-more-generally` | source_reference | Cited number is AD 3201; the stored generic reference does not identify the text used. |
| `grief-for-a-deceased-loved-one` | arabic | Published text stops after 'wa'fu 'anhu' (row's own review note flags this); full dua from Muslim 2232, verified CONTAINED. |
| `grief-for-a-deceased-loved-one` | transliteration_latin | Match the full Arabic. |
| `grief-for-a-deceased-loved-one` | transliteration_telugu | Match the full Arabic. |
| `grief-for-a-deceased-loved-one` | translation_en | Match the full Arabic. |
| `grief-for-a-deceased-loved-one` | translation_ur | Match the full Arabic. |
| `grief-for-a-deceased-loved-one` | hadith_number | Was null; WYN cites Muslim 2232 (verified). |
| `grief-for-a-deceased-loved-one` | source_reference | Reference reads only 'Muslim'. |
| `repentance-general-seeking-of-forgiveness` | source_collection | Corpus: the 'al-'Azim' wording is in Tirmidhi 3577; Abu Dawud 1517 lacks 'al-'Azim'. |
| `repentance-general-seeking-of-forgiveness` | source_reference | Match the stored hadith number and the exact wording. |
| `anxiety-for-relief-from-hardship` | source_collection | Row cites 'Musnad Ahmad' with no number; WYN prints Sahih Ibn Hibban 974. |
| `anxiety-for-relief-from-hardship` | source_reference | Row reference is just 'Ahmad' with no number; WYN prints Ibn Hibban 974. |
| `anxiety-for-relief-from-hardship` | hadith_number | Missing hadith number. |
| `anxiety-for-relief-from-hardship` | hadith_grade | WYN (Urdu reference) prints the grade as Sahih. |
| `anxiety-for-anxiety-and-sorrow` | arabic | The published text stops before 'wa ḍala'i-d-dayn wa ghalabati-r-rijāl'. The full wording is from corpus Bukhari 6369 (CONTAINED). |
| `anxiety-for-anxiety-and-sorrow` | translation_en | Updated to match the completed Arabic. |
| `anxiety-for-anxiety-and-sorrow` | translation_ur | Updated to match the completed Arabic. |
| `anxiety-for-anxiety-and-sorrow` | transliteration_latin | Updated to match the completed Arabic. |
| `anxiety-for-anxiety-and-sorrow` | transliteration_telugu | Updated to match the completed Arabic. |
| `anxiety-for-anxiety-and-sorrow` | source_reference | The row only says 'Bukhari'. |
| `anxiety-for-anxiety-and-sorrow` | hadith_number | Missing hadith number. |
| `salah-salutations-on-the-prophet-after-tashahhud-salat-ibrahimiyyah-ch` | source_reference | The row only says 'Bukhari'. WYN prints Bukhari 3370 (Kitab Ahadith al-Anbiya'), and the corpus confirms the wording there. |
| `salah-salutations-on-the-prophet-after-tashahhud-salat-ibrahimiyyah-ch` | hadith_number | Missing hadith number. |
| `market-for-beneficial-provision-after-fajr` | source_reference | The row only says 'Ibn Majah'; WYN prints Ibn Majah 925, and the corpus confirms the wording there. |
| `market-for-beneficial-provision-after-fajr` | hadith_number | Missing hadith number. |
| `market-for-beneficial-provision-after-fajr` | hadith_grade | WYN prints Sahih. |
| `travel-the-travelers-farewell-to-the-one-staying-behind` | title | The row's title says it is the traveler's words to those staying behind, but in Tirmidhi 3443 it is said to the person setting out on a journey (Ibn 'Umar to a man about to travel). WYN labels it 'The Family's Supplication for the Traveler'. |
| `travel-the-travelers-farewell-to-the-one-staying-behind` | title_ur | The Urdu title 'مسافر کی مقیم کے لئے دعاء' has the same reversed direction. |
| `travel-the-travelers-farewell-to-the-one-staying-behind` | source_reference | The row only says 'Tirmidhi'; WYN prints 3443, and the corpus confirms the wording there. |
| `travel-the-travelers-farewell-to-the-one-staying-behind` | hadith_number | Missing hadith number. |
| `travel-the-one-staying-behind-to-the-traveler` | arabic | Verified in three parts in corpus Tirmidhi 3444 (the hadith splits the dua across the man asking for more; each part CONTAINED). The corpus and WYN read 'حَيْثُمَا كُنْتَ'; the row has 'حَيْثُ كُنْتَ'. |
| `travel-the-one-staying-behind-to-the-traveler` | transliteration_latin | Updated to match the corrected Arabic. |
| `travel-the-one-staying-behind-to-the-traveler` | transliteration_telugu | Updated to match the corrected Arabic. |
| `travel-the-one-staying-behind-to-the-traveler` | source_reference | The row only says 'Tirmidhi'. |
| `travel-the-one-staying-behind-to-the-traveler` | hadith_number | Missing hadith number. |
| `travel-the-fuller-traveling-dua` | arabic | The published 'fuller traveling dua' contains only 'Allahumma inna nas'aluka … ma tarda', a small part of the dua. The full text is from corpus Muslim 3275 (CONTAINED from 'subhana-lladhi' to the end); the three takbirs are described in the hadith ('kabbara thalathan'). |
| `travel-the-fuller-traveling-dua` | translation_en | Updated to match the full Arabic. |
| `travel-the-fuller-traveling-dua` | translation_ur | Updated to match the full Arabic. |
| `travel-the-fuller-traveling-dua` | transliteration_latin | Updated to match the full Arabic. |
| `travel-the-fuller-traveling-dua` | transliteration_telugu | Updated to match the full Arabic. |
| `travel-the-fuller-traveling-dua` | source_reference | The row only says 'Muslim'; WYN prints Muslim 3275. |
| `travel-the-fuller-traveling-dua` | hadith_number | Missing hadith number. |
| `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` | arabic | Published text stops after 'ma istata'tu' — the second half of Sayyid al-Istighfar (a'udhu bika ... illa anta) is missing. Proposed text is Bukhari 6306 (check.mjs CONTAINED). |
| `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` | transliteration_latin | Match the completed Arabic. |
| `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` | transliteration_telugu | Match the completed Arabic. |
| `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` | translation_en | Published translation covers only the first half. |
| `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` | translation_ur | Published translation covers only the first half. |
| `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` | source_reference | Add the hadith number to the citation (hadith_number already 6306). |
| `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` | title_ur | Current title_ur is the generic section heading 'صبح اور شام کے وقت پڑھے جانے والے اذکار', not a title for this dua. |

## Printed-book entries not in the WYN app

36 of 178 entries of the printed book (2013/2014) have no WYN app counterpart in this catalog. They are not added as separate Duas (the request is to mirror the app); the 65 WYN stub drafts created for them earlier stay as drafts.

<details><summary>List</summary>

- WYN-0001 (PG1) Subhan Allahi wa bi hamdihi subhan Allahil 'azim — Dua/dhikr text
- WYN-0022 (ME18) La ilaha illAllahu wahdahu la sharika lahu, lahul mulku wa lahul hamdu, wa huwa 'ala kulli — Dua/dhikr text
- WYN-0031 (PR6) La ilaha illAllahu wahdahu la sharika lahu... — Dua/dhikr text
- WYN-0036 (PR11) Allahumma inni a'udhu bika min 'ilmin la yanfa'u... — Dua/dhikr text
- WYN-0058 (BD1) Change sleeping position (instruction; no dua text) — Instruction/practice (no recitation text)
- WYN-0061 (WH2) Belief with conviction that there will be no reckoning upon whisperings (hadith: Inn Allah — Instruction/practice (no recitation text)
- WYN-0062 (WH3) Read A'udhubillah excessively — Instruction/practice (no recitation text)
- WYN-0064 (WH5) Recite Surah al-Ikhlas and Mu'awwidhatain — Instruction/practice (no recitation text)
- WYN-0069 (EE1) If the person who caused the evil eye is known, ask him/her to perform ablution and wash t — Instruction/practice (no recitation text)
- WYN-0070 (EE2) Recite Al-Fatihah, Al-Ikhlas and Mu'awwidhatain — Instruction/practice (no recitation text)
- WYN-0074 (BM1) Regularly read the supplications for morning, evening, protection and healing — Instruction/practice (no recitation text)
- WYN-0075 (BM2) Recite Ayat al-Kursi and Mu'awwidhat (Ikhlas, Falaq, Nas) in morning, evening and before g — Instruction/practice (no recitation text)
- WYN-0079 (BM6) Read Ruqyah Shar'iyyah or play a recording before the afflicted person — Instruction/practice (no recitation text)
- WYN-0082 (BM9) La ilaha illAllahu wahdahu la sharika lahu, lahul mulku wa lahul hamdu wa huwa 'ala kulli  — Dua/dhikr text
- WYN-0087 (JN5) When leaving the home: Bismillahi tawakkaltu 'alAllahi wa la hawla wa la quwwata illa bill — Dua/dhikr text
- WYN-0089 (JN7) When changing clothes: Bismillah — Dua/dhikr text
- WYN-0091 (HL2) Benefit from natural nutrients/medicines: honey, Habbat al-Sauda (Nigella), Zam Zam water, — Instruction/practice (no recitation text)
- WYN-0100 (VS3) Hadith Qudsi: 'I was ill and you did not visit Me' — Hadith narration only
- WYN-0117 (SF4) Rabbighfir warham wa Anta khairur rahimin — Dua/dhikr text
- WYN-0118 (SF5) Rabbanaghfirli wali walidayya wa lil mu'minina yawma yaqumul hisab — Dua/dhikr text
- WYN-0119 (SF6) Rabbana innana amanna faghfirlana dhunubana wa qina 'adhaban nar — Dua/dhikr text
- WYN-0120 (SF7) Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal khasirin — Dua/dhikr text
- WYN-0121 (SF8) Rabbanaghfir lana dhunubana wa israfana fi amrina wa thabbit aqdamana wansurna 'alal qawmi — Dua/dhikr text
- WYN-0131 (SF18) Allahumma inni as'aluka ya Allahul Ahadus Samadul ladhi lam yalid... an taghfirali dhunubi — Dua/dhikr text
- WYN-0133 (SF20) Allahummaghfirli ma qaddamtu wa ma akh-khartu wa ma asrartu wa ma a'lantu wa ma asraftu... — Dua/dhikr text
- WYN-0136 (SF23) Astaghfirullah — Dua/dhikr text
- WYN-0137 (SF24) SubhanakAllahumma Rabbana wa bihamdika, Allahummaghfirli — Dua/dhikr text
- WYN-0138 (SF25) Allahummaghfirli dhanbi kullahu diqqahu wa jillahu wa awwalahu wa akhirahu wa 'alaniyatahu — Dua/dhikr text
- WYN-0139 (SF26) Allahumma inni zalamtu nafsi zulman kathiran, wa la yaghfirudh dhunuba illa Anta... — Dua/dhikr text
- WYN-0142 (DS1) Astaghfirullah — Dua/dhikr text
- WYN-0143 (DS2) La ilaha illAllah — Dua/dhikr text
- WYN-0144 (DS3) La hawla wa la quwwata illa billah — Dua/dhikr text
- WYN-0146 (DS5) Allahummaghfirli warhamni wa 'afini warzuqni — Dua/dhikr text
- WYN-0149 (DS8) Ya Hayyu ya Qayyumu bi rahmatika astaghith — Dua/dhikr text
- WYN-0164 (AS2) Astaghfirullah — Dua/dhikr text
- WYN-0177 (AS15) La ilaha illAllahu wahdahu la sharika lahu, lahul mulku wa lahul hamdu, wa huwa 'ala kulli — Dua/dhikr text

</details>

## Category-by-category detail

### 1. Morning Supplications — `morning`

WYN app: **22** · printed book: **21** · IqraSpace before: **5 published**, 10 draft · after review: **22** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Morning: glorification by the number of His creation | Sahih Muslim 6913 | 3 | WYN stub filled → review | unchecked | `wyn-0005-subhan-allahi-wa-bi-hamdihi-adada-khalqihi-wa-ri` |
| 2 | Short salutation on the Prophet ﷺ (Durood) | Sahih al-Bukhari 3370 (opening words); WYN cites Sunan an-Nasa'i 1293 |  | new → review | needs_review | `wyn-allahumma-salli-ala-muhammad-short-durood` |
| 3 | Ayat al-Kursi | Qur'an 2:255 |  | existing (published) | needs_review | `ayat-al-kursi` |
| 4 | Surah al-Ikhlas | Qur'an 112:1-4 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-al-ikhlas` |
| 5 | Surah al-Falaq | Qur'an 113:1-5 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-al-falaq` |
| 6 | Surah an-Nas | Qur'an 114:1-6 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-an-nas` |
| 7 | When overwhelmed by a matter | Abu Dawud | 7 | existing (published) | unchecked | `anxiety-when-overwhelmed-by-a-matter` |
| 8 | By You we reach morning and evening | Tirmidhi |  | existing (published) | unchecked | `morning-by-you-we-reach-morning-and-evening` |
| 9 | Morning: upon the fitrah of Islam | Musnad Ahmad 15360, 15363 (vol. 24) | 1 | WYN stub filled → review | needs_review | `wyn-0008-asbahna-ala-fitratil-islam-wa-ala-kalimatil-ikhl` |
| 10 | Morning remembrance | Muslim | 1 | existing (published) | unchecked | `morning-morning-remembrance` |
| 11 | Contentment with Allah | Abu Dawud, Tirmidhi |  | existing (published) | unchecked | `morning-contentment-with-allah` |
| 12 | Seeking refuge at nightfall | Muslim |  | existing (published) | unchecked | `evening-seeking-refuge-at-nightfall` |
| 13 | Protection | Abu Dawud, Tirmidhi | 3 | existing (published) | unchecked | `morning-protection` |
| 14 | Asking for well-being in body, hearing and sight | Sunan Abi Dawud 5090 | 3 | WYN stub filled → review | needs_review | `wyn-0014-allahumma-afini-fi-badani-allahumma-afini-fi-sam` |
| 15 | O Ever-Living, O Sustainer, by Your mercy I seek help | al-Mustadrak (al-Hakim) 2044 (vol. 2); Sahih at-Targhib wat-Tarhib 661 | 1 | WYN stub filled → review | needs_review | `wyn-0016-ya-hayyu-ya-qayyumu-bi-rahmatika-astaghithu-asli` |
| 16 | Originator of the heavens and earth: refuge from evil | Jami' at-Tirmidhi 3529 | 1 | WYN stub filled → review | unchecked | `wyn-0009-allahumma-fatiras-samawati-wal-ard-alimal-ghaibi` |
| 17 | Asking for well-being and protection from all sides | Sunan Abi Dawud 5074 | 1 | WYN stub filled → review | needs_review | `wyn-0018-allahumma-inni-asalukal-afiyata-fid-dunya-wal-ak` |
| 18 | Sayyid al-Istighfar (master of seeking forgiveness) | Bukhari |  | existing (published) | unchecked | `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` |
| 19 | The best dua, on the Day of Arafah | Tirmidhi |  | existing (published) | unchecked | `hajj-the-best-dua-on-the-day-of-arafah` |
| 20 | Glory and praise be to Allah (100 times) | Sahih Muslim 6843 | 100 | WYN stub filled → review | unchecked | `wyn-0023-subhanallahi-wa-bihamdihi` |
| 21 | I seek Allah's forgiveness | al-Mu'jam al-Awsat (at-Tabarani) 3749 (vol. 4); Sahih Muslim 1334 | 100 | WYN stub filled → review | unchecked | `wyn-0024-astaghfirullah` |
| 22 | Traveller's dua at dawn | Sahih Muslim 6900 |  | WYN stub filled → review | unchecked | `wyn-0025-samia-samiun-bi-hamdillahi-wa-husni-balaihi-alai` |

**Already in this category but not in WYN (kept, listed after WYN's sequence):** `wyn-0015-allahumma-inni-audhu-bika-minal-kufri-wal-faqr` (draft)

**Proposed corrections to published rows (4 Duas, opt-in):**
- `anxiety-when-overwhelmed-by-a-matter`: source_reference — Row cites only 'Abu Dawud'. The wording is from Qur'an 9:129 (as WYN cites); Abu Dawud 5081 is a mawquf report of Abu ad-Darda' for saying it seven times.
- `morning-by-you-we-reach-morning-and-evening`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, source_reference — Row cites Tirmidhi 3391 but ends 'wa ilayka-n-nushūr'; in Tirmidhi 3391 the morning wording ends 'wa ilayka-l-maṣīr' (nushūr is the evening wording). WYN's morning text also ends al-maṣīr. Corpus Tirmidhi 3391 CONTAINED.
- `morning-morning-remembrance`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, source_reference — Published Arabic stops after 'lā sharīka lah' — the rest of the dua in Sahih Muslim 6908 (and in WYN) is missing.
- `morning-sayyid-al-istighfar-master-of-seeking-forgiveness`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, description, source_reference, arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, source_reference, title_ur — Published Arabic stops after 'mā-staṭaʿtu'; the rest of Sayyid al-Istighfar (aʿūdhu bika … illā ant) in Bukhari 6306 and in WYN is missing. Corpus Bukhari 6306 CONTAINED.

<details><summary>Unresolved verification issues (53)</summary>

- W002: WYN prints Sunan an-Nasa'i 1293 (grade printed 'Hasan' in the app, 'Sahih' in the book); that hadith's wording is 'ṣalli ʿalā Muḥammadin ʿabdika wa rasūlika…' and does not contain 'wa ʿalā āli Muḥammad' in the first clause. Exact short wording is the opening of Bukhari 3370 (also Nasa'i 1287-1292, Muslim 907). Cited Bukhari 3370; admin to decide whether to keep WYN's Nasa'i reference.
- W002: The short form is an excerpt of the full Salat Ibrahimiyyah (published row salah-salutations-on-the-prophet-after-tashahhud-salat-ibrahimiyyah-ch); kept as a separate row because WYN shows only this short wording.
- W003: WYN cites al-Mu'jam al-Kabir (at-Tabarani) 541 and 7532 (not in corpus) for the morning/evening and after-salah practice; existing row only cites Qur'an 2:255.
- W003: Existing row has title_ur null — admin may want to add 'آیت الکرسی'.
- W004: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W004: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W004: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W004: WYN also cites Sahih Muslim 1886 and Bukhari 5017 for Surah al-Ikhlas (virtue / bedtime recitation).
- W005: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W005: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W005: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W005: WYN also cites Bukhari 5017 and Sunan an-Nasa'i 5439 (virtue of al-Falaq) — both checked in corpus and relevant.
- W006: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W006: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W006: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W006: WYN also cites Bukhari 5017 and Sunan an-Nasa'i 5439; Nasa'i 5439 names only al-Falaq.
- W007: WYN gives repeat count 7 in Morning/Evening placements; the existing row (anxiety category) has repeat_count null — count should come from the WYN placement.
- W007: Abu Dawud 5081 (seven-times virtue) is graded Mawdu' by al-Albani and Muhyi ad-Din Abdul Hamid in the corpus (Zubair Ali Zai: isnad Hasan). The Qur'anic wording itself is unaffected.
- W007: Did not set quran_refs on the existing row: the dua is an excerpt of 9:129 (without 'fa in tawallaw faqul'); a whole-ayah ref would make the build overwrite the Arabic.
- W008: Current published wording (…wa ilayka-n-nushūr for the morning) is itself attested in Sunan Abi Dawud 5068, so it is a narration difference rather than an error; the correction aligns the row with its cited Tirmidhi 3391 and with WYN. Admin decision.
- W008: Corpus grades for Tirmidhi 3391: Sahih (Shakir, al-Albani), Hasan (Bashar Awad, Zubair Ali Zai); WYN prints Sahih.
- W009: Arabic not verified against a primary corpus: Musnad Ahmad 15360/15363 is outside the corpus and no Six-Books parallel was found (find.mjs 'فطرة الإسلام وعلى كلمة الإخلاص' → none).
- W009: Arabic normalised from WYN's Indo-Pak script to standard Arabic orthography (same words and vowels); the 'ﷺ' written in WYN as 'صلی الله علیه وسلم' is kept as voweled text.
- W010: Sahih Muslim 6908 (and Abu Dawud 5071, Tirmidhi 3390) quote the full text only in the evening form and say 'in the morning he said the same: aṣbaḥnā wa aṣbaḥa-l-mulku lillāh'. The morning wording (hādha-l-yawm … baʿdahu) is the standard derived form, as WYN prints it; check.mjs confirms the shared segments only.
- W010: Published row repeat_count 1 matches WYN (no count shown).
- W011: WYN cites al-Silsilah as-Sahihah 2686 (not in corpus); the published row cites 'Abu Dawud, Tirmidhi' and includes 'ṣalla-llāhu ʿalayhi wa sallam' after Muḥammad, which WYN's text omits — same dua, wording variant.
- W011: WYN places it in both Morning (#11) and Evening (#10); no count shown.
- W012: WYN cites Muslim 6880 (evening, scorpion sting) and Muslim 6878 (when stopping at a place) — both verified to contain the wording. WYN also lists it under Morning, Evil-eye, Travelling and Healing.
- W012: Published row source_reference is just 'Muslim' (hadith_number 6880).
- W013: Matches Abu Dawud 5088 exactly; published repeat_count 3 matches WYN.
- W014: WYN's app shows both parts of Abu Dawud 5090 as ONE item; the book inventory splits them (WYN-0014, WYN-0015) and a separate draft stub exists for WYN-0015 (wyn-0015-allahumma-inni-audhu-bika-minal-kufri-wal-faqr). Filled WYN-0014 with the combined text; the WYN-0015 stub becomes redundant — admin to archive or keep.
- W014: In the corpus the two parts are not contiguous (the second is introduced by 'qāla ʿAbbās fīhi: wa taqūlu…'); each part verified separately.
- W014: Corpus grades: al-Albani / Muhyi ad-Din 'Hasan Isnaad', Zubair Ali Zai 'Daif'; WYN prints Hasan.
- W014: Arabic is assembled from abudawud 5090 (96% of its wording occurs there) rather than one verbatim excerpt — check the wording.
- W015: Arabic not verified against a primary corpus. Partial Six-Books parallel: Jami' at-Tirmidhi 3524 contains only 'yā Ḥayyu yā Qayyūmu bi-raḥmatika astaghīth' (graded Hasan by al-Albani); the rest is not in the corpus.
- W015: Book candidate WYN-0008 (fitrah dua) is unrelated and not attached.
- W016: Corpus vowels 'wa sharakihi' (his snares); WYN's app has 'wa shirkihi' (his shirk) — both readings are reported; corpus wording used and translated as 'snares'. Admin may switch.
- W016: Corpus grades: Sahih (Shakir, al-Albani), Hasan (Bashar Awad), Isnaad Hasan (Zubair Ali Zai).
- W017: Abu Dawud 5074 gives 'ʿawratī' (singular) in one chain and 'ʿawrātī' (plural, 'wa qāla ʿUthmān') in the other; plural used to match WYN.
- W017: WYN also cites Musnad Ahmad 4785 (not in corpus).
- W017: Arabic is assembled from abudawud 5074 (100% of its wording occurs there) rather than one verbatim excerpt — check the wording.
- W018: WYN's app omits 'laka' in 'abū'u laka bi-dhanbī' and has 'innahu' for 'fa-innahu'; corpus Bukhari 6306 wording used.
- W018: Slug starts with 'morning-' but the dua is identical for evening; WYN places it in Morning, Evening and Forgiveness.
- W019: Identical wording exists in published rows hajj-the-best-dua-on-the-day-of-arafah and hajj-atop-safa-and-marwa (sim 1.0), but their titles/descriptions are tied to Hajj occasions, so reusing them would show 'Day of Arafah'/'Safa and Marwa' titles in Morning/Evening/After-Salah lists. Proposed as a new general row; admin may instead merge.
- W019: Counts differ by placement (Morning/Evening: none shown; Protection and Jinn: 100; After Salah: 10 — WYN cites al-Silsilah as-Sahihah 113 / Sahih at-Targhib 477, not in corpus). repeat_count left null; per-placement counts should come from the WYN mapping.
- W019: Book candidates WYN-0020 (al-Falaq) and WYN-0064 (Ikhlas/Mu'awwidhatain) are unrelated and not attached.
- W019: Same Arabic as existing row hajj-the-best-dua-on-the-day-of-arafah (published); reused it instead of inserting a duplicate.
- W020: WYN also places it in Healing (#1, #156) with no count; repeat_count 100 is for the Morning/Evening/Jinn placements.
- W021: The 100-times morning practice rests on al-Mu'jam al-Awsat 3749 (not in corpus); the wording itself is verified in Muslim 1334.
- W021: After-Salah placement uses count 3 (Muslim 1334); WYN-0136/WYN-0164 (Astaghfirullah thrice after salah) are already attached to published row salah-general-remembrance-after-the-salam, which combines it with 'Allāhumma anta-s-salām…'. Not re-attached here.
- W021: Another stub wyn-0142-astaghfirullah (WYN-0142) has the same wording — possible duplicate to reconcile in another batch.
- W022: Corpus vowels 'sammaʿa' (has made heard); WYN's app has 'samiʿa' (has heard) — both readings are reported by the commentators. Corpus wording used.
- W022: WYN places it in Morning (#22) and Travelling (#14).

</details>

### 2. Evening Supplications — `evening`

WYN app: **20** · printed book: **21** · IqraSpace before: **4 published** · after review: **20** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Short salutation on the Prophet ﷺ (Durood) | Sahih al-Bukhari 3370 (opening words); WYN cites Sunan an-Nasa'i 1293 |  | new → review | needs_review | `wyn-allahumma-salli-ala-muhammad-short-durood` |
| 2 | Ayat al-Kursi | Qur'an 2:255 |  | existing (published) | needs_review | `ayat-al-kursi` |
| 3 | Surah al-Ikhlas | Qur'an 112:1-4 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-al-ikhlas` |
| 4 | Surah al-Falaq | Qur'an 113:1-5 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-al-falaq` |
| 5 | Surah an-Nas | Qur'an 114:1-6 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-an-nas` |
| 6 | When overwhelmed by a matter | Abu Dawud | 7 | existing (published) | unchecked | `anxiety-when-overwhelmed-by-a-matter` |
| 7 | Evening: by You we reach the evening | Jami' at-Tirmidhi 3391 | 1 | new → review | unchecked | `wyn-evening-allahumma-bika-amsayna` |
| 8 | Evening: upon the fitrah of Islam | Musnad Ahmad 15360, 15363 (vol. 24) | 1 | new → review | needs_review | `wyn-evening-amsayna-ala-fitratil-islam` |
| 9 | Evening remembrance | Muslim | 1 | existing (published) | unchecked | `evening-evening-remembrance` |
| 10 | Contentment with Allah | Abu Dawud, Tirmidhi |  | existing (published) | unchecked | `morning-contentment-with-allah` |
| 11 | Seeking refuge at nightfall | Muslim |  | existing (published) | unchecked | `evening-seeking-refuge-at-nightfall` |
| 12 | Protection | Abu Dawud, Tirmidhi | 3 | existing (published) | unchecked | `morning-protection` |
| 13 | O Ever-Living, O Sustainer, by Your mercy I seek help | al-Mustadrak (al-Hakim) 2044 (vol. 2); Sahih at-Targhib wat-Tarhib 661 | 1 | WYN stub filled → review | needs_review | `wyn-0016-ya-hayyu-ya-qayyumu-bi-rahmatika-astaghithu-asli` |
| 14 | Asking for well-being in body, hearing and sight | Sunan Abi Dawud 5090 | 3 | WYN stub filled → review | needs_review | `wyn-0014-allahumma-afini-fi-badani-allahumma-afini-fi-sam` |
| 15 | Originator of the heavens and earth: refuge from evil | Jami' at-Tirmidhi 3529 | 1 | WYN stub filled → review | unchecked | `wyn-0009-allahumma-fatiras-samawati-wal-ard-alimal-ghaibi` |
| 16 | Asking for well-being and protection from all sides | Sunan Abi Dawud 5074 | 1 | WYN stub filled → review | needs_review | `wyn-0018-allahumma-inni-asalukal-afiyata-fid-dunya-wal-ak` |
| 17 | Sayyid al-Istighfar (master of seeking forgiveness) | Bukhari |  | existing (published) | unchecked | `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` |
| 18 | The best dua, on the Day of Arafah | Tirmidhi |  | existing (published) | unchecked | `hajj-the-best-dua-on-the-day-of-arafah` |
| 19 | Glory and praise be to Allah (100 times) | Sahih Muslim 6843 | 100 | WYN stub filled → review | unchecked | `wyn-0023-subhanallahi-wa-bihamdihi` |
| 20 | I seek Allah's forgiveness | al-Mu'jam al-Awsat (at-Tabarani) 3749 (vol. 4); Sahih Muslim 1334 | 100 | WYN stub filled → review | unchecked | `wyn-0024-astaghfirullah` |

**Already in this category but not in WYN (kept, listed after WYN's sequence):** `three-quls` (published)

**Proposed corrections to published rows (3 Duas, opt-in):**
- `anxiety-when-overwhelmed-by-a-matter`: source_reference — Row cites only 'Abu Dawud'. The wording is from Qur'an 9:129 (as WYN cites); Abu Dawud 5081 is a mawquf report of Abu ad-Darda' for saying it seven times.
- `morning-sayyid-al-istighfar-master-of-seeking-forgiveness`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, description, source_reference, arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, source_reference, title_ur — Published Arabic stops after 'mā-staṭaʿtu'; the rest of Sayyid al-Istighfar (aʿūdhu bika … illā ant) in Bukhari 6306 and in WYN is missing. Corpus Bukhari 6306 CONTAINED.
- `evening-evening-remembrance`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, hadith_number, source_reference — Published Arabic stops after 'lā sharīka lah' — the rest of the dua in Sahih Muslim 6908 (and in WYN) is missing.

<details><summary>Unresolved verification issues (53)</summary>

- W002: WYN prints Sunan an-Nasa'i 1293 (grade printed 'Hasan' in the app, 'Sahih' in the book); that hadith's wording is 'ṣalli ʿalā Muḥammadin ʿabdika wa rasūlika…' and does not contain 'wa ʿalā āli Muḥammad' in the first clause. Exact short wording is the opening of Bukhari 3370 (also Nasa'i 1287-1292, Muslim 907). Cited Bukhari 3370; admin to decide whether to keep WYN's Nasa'i reference.
- W002: The short form is an excerpt of the full Salat Ibrahimiyyah (published row salah-salutations-on-the-prophet-after-tashahhud-salat-ibrahimiyyah-ch); kept as a separate row because WYN shows only this short wording.
- W003: WYN cites al-Mu'jam al-Kabir (at-Tabarani) 541 and 7532 (not in corpus) for the morning/evening and after-salah practice; existing row only cites Qur'an 2:255.
- W003: Existing row has title_ur null — admin may want to add 'آیت الکرسی'.
- W004: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W004: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W004: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W004: WYN also cites Sahih Muslim 1886 and Bukhari 5017 for Surah al-Ikhlas (virtue / bedtime recitation).
- W005: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W005: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W005: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W005: WYN also cites Bukhari 5017 and Sunan an-Nasa'i 5439 (virtue of al-Falaq) — both checked in corpus and relevant.
- W006: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W006: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W006: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W006: WYN also cites Bukhari 5017 and Sunan an-Nasa'i 5439; Nasa'i 5439 names only al-Falaq.
- W007: WYN gives repeat count 7 in Morning/Evening placements; the existing row (anxiety category) has repeat_count null — count should come from the WYN placement.
- W007: Abu Dawud 5081 (seven-times virtue) is graded Mawdu' by al-Albani and Muhyi ad-Din Abdul Hamid in the corpus (Zubair Ali Zai: isnad Hasan). The Qur'anic wording itself is unaffected.
- W007: Did not set quran_refs on the existing row: the dua is an excerpt of 9:129 (without 'fa in tawallaw faqul'); a whole-ayah ref would make the build overwrite the Arabic.
- W011: WYN cites al-Silsilah as-Sahihah 2686 (not in corpus); the published row cites 'Abu Dawud, Tirmidhi' and includes 'ṣalla-llāhu ʿalayhi wa sallam' after Muḥammad, which WYN's text omits — same dua, wording variant.
- W011: WYN places it in both Morning (#11) and Evening (#10); no count shown.
- W012: WYN cites Muslim 6880 (evening, scorpion sting) and Muslim 6878 (when stopping at a place) — both verified to contain the wording. WYN also lists it under Morning, Evil-eye, Travelling and Healing.
- W012: Published row source_reference is just 'Muslim' (hadith_number 6880).
- W013: Matches Abu Dawud 5088 exactly; published repeat_count 3 matches WYN.
- W014: WYN's app shows both parts of Abu Dawud 5090 as ONE item; the book inventory splits them (WYN-0014, WYN-0015) and a separate draft stub exists for WYN-0015 (wyn-0015-allahumma-inni-audhu-bika-minal-kufri-wal-faqr). Filled WYN-0014 with the combined text; the WYN-0015 stub becomes redundant — admin to archive or keep.
- W014: In the corpus the two parts are not contiguous (the second is introduced by 'qāla ʿAbbās fīhi: wa taqūlu…'); each part verified separately.
- W014: Corpus grades: al-Albani / Muhyi ad-Din 'Hasan Isnaad', Zubair Ali Zai 'Daif'; WYN prints Hasan.
- W014: Arabic is assembled from abudawud 5090 (96% of its wording occurs there) rather than one verbatim excerpt — check the wording.
- W015: Arabic not verified against a primary corpus. Partial Six-Books parallel: Jami' at-Tirmidhi 3524 contains only 'yā Ḥayyu yā Qayyūmu bi-raḥmatika astaghīth' (graded Hasan by al-Albani); the rest is not in the corpus.
- W015: Book candidate WYN-0008 (fitrah dua) is unrelated and not attached.
- W016: Corpus vowels 'wa sharakihi' (his snares); WYN's app has 'wa shirkihi' (his shirk) — both readings are reported; corpus wording used and translated as 'snares'. Admin may switch.
- W016: Corpus grades: Sahih (Shakir, al-Albani), Hasan (Bashar Awad), Isnaad Hasan (Zubair Ali Zai).
- W017: Abu Dawud 5074 gives 'ʿawratī' (singular) in one chain and 'ʿawrātī' (plural, 'wa qāla ʿUthmān') in the other; plural used to match WYN.
- W017: WYN also cites Musnad Ahmad 4785 (not in corpus).
- W017: Arabic is assembled from abudawud 5074 (100% of its wording occurs there) rather than one verbatim excerpt — check the wording.
- W018: WYN's app omits 'laka' in 'abū'u laka bi-dhanbī' and has 'innahu' for 'fa-innahu'; corpus Bukhari 6306 wording used.
- W018: Slug starts with 'morning-' but the dua is identical for evening; WYN places it in Morning, Evening and Forgiveness.
- W019: Identical wording exists in published rows hajj-the-best-dua-on-the-day-of-arafah and hajj-atop-safa-and-marwa (sim 1.0), but their titles/descriptions are tied to Hajj occasions, so reusing them would show 'Day of Arafah'/'Safa and Marwa' titles in Morning/Evening/After-Salah lists. Proposed as a new general row; admin may instead merge.
- W019: Counts differ by placement (Morning/Evening: none shown; Protection and Jinn: 100; After Salah: 10 — WYN cites al-Silsilah as-Sahihah 113 / Sahih at-Targhib 477, not in corpus). repeat_count left null; per-placement counts should come from the WYN mapping.
- W019: Book candidates WYN-0020 (al-Falaq) and WYN-0064 (Ikhlas/Mu'awwidhatain) are unrelated and not attached.
- W019: Same Arabic as existing row hajj-the-best-dua-on-the-day-of-arafah (published); reused it instead of inserting a duplicate.
- W020: WYN also places it in Healing (#1, #156) with no count; repeat_count 100 is for the Morning/Evening/Jinn placements.
- W021: The 100-times morning practice rests on al-Mu'jam al-Awsat 3749 (not in corpus); the wording itself is verified in Muslim 1334.
- W021: After-Salah placement uses count 3 (Muslim 1334); WYN-0136/WYN-0164 (Astaghfirullah thrice after salah) are already attached to published row salah-general-remembrance-after-the-salam, which combines it with 'Allāhumma anta-s-salām…'. Not re-attached here.
- W021: Another stub wyn-0142-astaghfirullah (WYN-0142) has the same wording — possible duplicate to reconcile in another batch.
- W023: Candidate morning-by-you-we-reach-morning-and-evening (sim 1.0) is the MORNING wording (aṣbaḥnā first) — not merged per the morning/evening rule. WYN-0007 is attached to both rows because the book entry covers both forms.
- W023: Corpus grades for Tirmidhi 3391: Sahih (Shakir, al-Albani), Hasan (Bashar Awad, Zubair Ali Zai).
- W024: Arabic not verified against a primary corpus: Musnad Ahmad 15360/15363 is outside the corpus and no Six-Books parallel was found (find.mjs 'فطرة الإسلام وعلى كلمة الإخلاص' → none).
- W024: Arabic normalised from WYN's Indo-Pak script to standard Arabic orthography (same words and vowels); the 'ﷺ' written in WYN as 'صلی الله علیه وسلم' is kept as voweled text.
- W024: Evening wording is a separate row from the morning stub wyn-0008 (W009) per the morning/evening rule; WYN-0008 is attached to both since the book entry covers both.
- W025: Full evening wording verified against corpus Muslim 6908 in two CONTAINED segments (the narrator's remark 'qāla urāhu qāla fīhinna' sits between 'lā sharīka lah' and 'lahu-l-mulk'). Same in Abu Dawud 5071 / Tirmidhi 3390.
- W025: Translation of 'sū'i-l-kibar' as 'miseries of old age' (kibar); some editions read 'kibr' (arrogance) — Abu Dawud 5071 notes the variant.
- W025: Suggested wyn_ids change on evening-evening-remembrance: ["WYN-0010"] — book entry WYN-0010 covers the evening form (p.6); row has none

</details>

### 3. Protection During the Night — `night-protection`

WYN app: **24** · printed book: **2** · IqraSpace before: **0 published** · after review: **24** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Last two verses of Surah al-Baqarah at night | Qur'an 2:285-286 (virtue: Sahih al-Bukhari 4008) |  | new → review | unchecked | `wyn-last-two-ayat-of-surah-al-baqarah` |
| 2 | Ayat al-Kursi | Qur'an 2:255 |  | existing (published) | needs_review | `ayat-al-kursi` |
| 3 | Bedtime: in Your name I lay down my side | Sahih al-Bukhari 7393 |  | new → review | unchecked | `wyn-bedtime-bismika-rabbi-wadatu-janbi` |
| 4 | Bedtime: I have submitted myself to You | Sahih al-Bukhari 6313 |  | new → review | unchecked | `wyn-bedtime-allahumma-aslamtu-nafsi-ilayk` |
| 5 | Surah al-Ikhlas | Qur'an 112:1-4 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-al-ikhlas` |
| 6 | Surah al-Falaq | Qur'an 113:1-5 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-al-falaq` |
| 7 | Surah an-Nas | Qur'an 114:1-6 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-an-nas` |
| 8 | Tasbih 33, Tahmid 33, Takbir 34 | Sahih Muslim 1349; Sahih al-Bukhari 5361 | 100 | WYN stub filled → review | unchecked | `wyn-0172-subhan-allah-33-alhamdulillah-33-allahu-akbar-34` |
| 9 | Bedtime: praise for food, sufficiency and shelter | Sahih Muslim 6894 |  | new → review | unchecked | `wyn-bedtime-alhamdulillahil-ladhi-atamana-wa-saqana` |
| 10 | Bedtime: praise in every condition, refuge from the Fire | Sunan Abi Dawud 5058 |  | new → review | unchecked | `wyn-bedtime-alhamdulillahil-ladhi-kafani-wa-awani` |
| 11 | Bedtime: praise and asking to be saved from the Fire | al-Mustadrak (al-Hakim) 2045 (vol. 2) |  | new → review | needs_review | `wyn-bedtime-asaluka-bi-izzatika-an-tunajjiyani` |
| 12 | Knower of the unseen and seen: refuge at bedtime | Jami' at-Tirmidhi 3392 (WYN cites Musnad Ahmad vol. 1, 51) |  | new → review | unchecked | `wyn-bedtime-allahumma-alimal-ghaybi-wash-shahadah` |
| 13 | Bedtime: forgive my sin and drive away my devil | al-Mustadrak (al-Hakim) 2026 (vol. 2) |  | WYN stub filled → review | needs_review | `wyn-0130-allahummaghfirli-wakhsa-shaitani-wa-fukka-rihani` |
| 14 | Bedtime: tahlil, hawqalah, tasbih and takbir | Sahih Ibn Hibban 5528 (vol. 12) |  | new → review | needs_review | `wyn-bedtime-tahlil-hawqalah-tasbih-takbir` |
| 15 | Bedtime: You created my soul | Sahih Muslim 6888 |  | new → review | unchecked | `wyn-bedtime-allahumma-khalaqta-nafsi` |
| 16 | Bedtime: Lord of the heavens, settle our debts | Sahih Muslim 6889 |  | WYN stub filled → review | unchecked | `wyn-0046-allahumma-rabbas-samawati-wa-rabbal-ardi-wa-rabb` |
| 17 | Before sleeping | Bukhari |  | existing (published) | unchecked | `sleep-before-sleeping` |
| 18 | Seeking protection through the night | Abu Dawud, Tirmidhi | 3 | existing (published) | unchecked | `sleep-seeking-protection-through-the-night` |
| 19 | Bedtime: recite Surah al-Mulk | Qur'an 67:1-30 (practice: Jami' at-Tirmidhi 3404) |  | new → review | unchecked | `wyn-bedtime-surah-al-mulk` |
| 20 | Bedtime: recite Surah as-Sajdah | Qur'an 32:1-30 (practice: Jami' at-Tirmidhi 2892) |  | new → review | unchecked | `wyn-bedtime-surah-as-sajdah` |
| 21 | Bedtime: recite Surah al-Isra (Bani Isra'il) | Qur'an 17:1-111 (practice: Jami' at-Tirmidhi 3405) |  | new → review | unchecked | `wyn-bedtime-surah-al-isra` |
| 22 | Bedtime: recite Surah az-Zumar | Qur'an 39:1-75 (practice: Jami' at-Tirmidhi 3405) |  | new → review | unchecked | `wyn-bedtime-surah-az-zumar` |
| 23 | Before sleep: Surah al-Kafirun | Qur'an 109:1-6; Sunan Abi Dawud 5055 |  | new → review | unchecked | `wyn-surah-al-kafirun-before-sleep` |
| 24 | Waking in the night: tahlil, praise and asking forgiveness | Sahih al-Bukhari 1154 |  | new → review | needs_review | `wyn-waking-at-night-la-ilaha-illallah-then-forgiveness` |

**Proposed corrections to published rows (1 Duas, opt-in):**
- `sleep-seeking-protection-through-the-night`: repeat_count, hadith_number, source_reference — Abu Dawud 5045 says the Prophet ﷺ said it three times; WYN shows 3x. Row has null.

<details><summary>Unresolved verification issues (52)</summary>

- W003: WYN cites al-Mu'jam al-Kabir (at-Tabarani) 541 and 7532 (not in corpus) for the morning/evening and after-salah practice; existing row only cites Qur'an 2:255.
- W003: Existing row has title_ur null — admin may want to add 'آیت الکرسی'.
- W004: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W004: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W004: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W004: WYN also cites Sahih Muslim 1886 and Bukhari 5017 for Surah al-Ikhlas (virtue / bedtime recitation).
- W005: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W005: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W005: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W005: WYN also cites Bukhari 5017 and Sunan an-Nasa'i 5439 (virtue of al-Falaq) — both checked in corpus and relevant.
- W006: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W006: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W006: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W006: WYN also cites Bukhari 5017 and Sunan an-Nasa'i 5439; Nasa'i 5439 names only al-Falaq.
- W026: Published row quranic-for-mistakes-and-forgetfulness holds only an excerpt of 2:286 (rabbanā lā tu'ākhidhnā…) — different item, not merged.
- W026: WYN-0076 also cites Sunan ad-Darimi 3387 (not in corpus).
- W027: WYN's app writes 'rabbī' (with yā'); Bukhari 7393 has 'rabbi' (shortened vocative). Corpus wording used. Muslim 6893 / Abu Dawud 5050 / Tirmidhi 3401 have a similar wording.
- W027: No WYN book inventory id found for this item.
- W028: WYN's app has 'wa nabiyyika' (without 'bi'); Bukhari 6313 has 'wa bi-nabiyyika'. Corpus wording used.
- W028: No WYN book inventory id found for this item.
- W029: Muslim 1349 and Bukhari 5361 give only the counts (tasbīḥah/taḥmīdah/takbīrah), not the spoken words; the words were verified from Bukhari 843. WYN's app shows them as three lines without 'wa'.
- W029: WYN shows a placement count of 100 (total of 33+33+34); repeat_count left null because a single counter of 100 would misrepresent the split — the split is in the description.
- W030: No WYN book inventory id found for this item.
- W031: WYN prints no grade for this item; corpus grades: Sahih Isnaad (al-Albani, Muhyi ad-Din), Sahih (Shu'ayb al-Arna'ut), Isnaad Hasan (Zubair Ali Zai). hadith_grade left null.
- W031: No WYN book inventory id found for this item.
- W032: Arabic not verified against a primary corpus: al-Mustadrak 2045 is outside the corpus; no Six-Books parallel for 'as'aluka bi-ʿizzatika an tunajjiyanī mina-n-nār' (find.mjs → none). Closest relative is Abu Dawud 5058 (W031), a different wording.
- W032: WYN prints no grade. No WYN book inventory id found.
- W033: WYN prints Musnad Ahmad vol. 1, 51 (not in corpus); same wording found in Jami' at-Tirmidhi 3392 (word order ʿālima-l-ghayb first, as in WYN) and Abu Dawud 5067 (fāṭira first) — Tirmidhi cited.
- W033: WYN's app omits 'min' before 'sharri-sh-shayṭān'; corpus wording used.
- W033: Related but different from W016 (Tirmidhi 3529, which adds 'wa an aqtarifa…'). No WYN book id found; corpus grades Sahih / Hasan Sahih.
- W034: Arabic not verified against a primary corpus. Close Six-Books parallel: Abu Dawud 5054 (Sahih per al-Albani) — 'bismi-llāhi waḍaʿtu janbī, Allāhumma-ghfir lī dhanbī wa akhsi' shayṭānī wa fukka rihānī wa-jʿalnī fi-n-nadiyyi-l-aʿlā' — which lacks 'wa thaqqil mīzānī'; WYN's al-Hakim wording kept because it includes that phrase.
- W034: Grade 'Sahih' is from the WYN book entry WYN-0130; the app placement prints no grade.
- W034: Stub's category is istighfar; WYN app places it in Protection During the Night (#13).
- W035: Arabic not verified against a primary corpus: Sahih Ibn Hibban 5528 is outside the corpus; no Six-Books parallel with this order at bedtime (Bukhari 1154 has similar phrases for waking at night, in a different order and context).
- W035: Published rows hajj-the-best-dua-on-the-day-of-arafah / market-entering-the-marketplace share only the first sentence (sim ~0.55) — not the same dua.
- W035: WYN prints no grade; book candidates WYN-0114 and WYN-0147 are unrelated and not attached.
- W036: No WYN book inventory id found for this item.
- W037: WYN's app text differs from its cited Muslim 6889: it reads 'rabba-s-samāwāti-s-sabʿ' (no 'rabba-l-arḍ'), 'al-Qur'āni-l-ʿaẓīm' for 'al-furqān', and omits 'fāliqa-l-ḥabbi wan-nawā' and 'aʿūdhu bika min sharri kulli shay'in anta ākhidhun bi-nāṣiyatih' — closer to Tirmidhi 3481 (which still has those phrases). Corpus Muslim 6889 wording used; admin to confirm.
- W037: Stub WYN-0046 is in protection-and-safety; WYN app places it in Protection During the Night (#16).
- W038: WYN's wording 'Allāhumma bismika amūtu wa aḥyā' (Bukhari 6314) vs published 'bismika-llāhumma amūtu wa aḥyā' — same dua, word-order variant (Bukhari 6312 has 'bismika amūtu wa aḥyā'). Published row has hadith_number null; WYN cites Bukhari 6314.
- W039: Corpus grades for Abu Dawud 5045: Sahih (al-Albani), Sahih li-ghairihi (al-Arna'ut), Isnaad Hasan (Zubair Ali Zai); WYN prints none.
- W040: WYN's item is an instruction ('Bedtime: recite Surah al-Mulk') with no recitable text in the app; resolved to the whole surah per the instruction rule. Admin may prefer a description-only card given the length (30 ayat).
- W040: Corpus grades for Tirmidhi 3404: Sahih (Shakir, al-Albani), Daif (Zubair Ali Zai); WYN prints none.
- W041: WYN's item is an instruction ('Bedtime: recite Surah as-Sajdah') with no recitable text in the app; resolved to the whole surah per the instruction rule. Admin may prefer a description-only card given the length (30 ayat).
- W041: WYN cites Tirmidhi 2892, which the corpus grades 'Daif Maqtu' (al-Albani) / Daif (Zubair Ali Zai) — that entry ends with a Tawus statement. The same narration is Tirmidhi 3404 (graded Sahih by al-Albani); admin may prefer citing 3404.
- W042: WYN's item is an instruction ('Bedtime: recite Surah al-Isra (Bani Isra'il)') with no recitable text in the app; resolved to the whole surah per the instruction rule. Admin may prefer a description-only card given the length (111 ayat).
- W042: Corpus grades for Tirmidhi 3405: Sahih (Shakir, al-Albani), Hasan (Zubair Ali Zai).
- W043: WYN's item is an instruction ('Bedtime: recite Surah az-Zumar') with no recitable text in the app; resolved to the whole surah per the instruction rule. Admin may prefer a description-only card given the length (75 ayat).
- W043: Corpus grades for Tirmidhi 3405: Sahih (Shakir, al-Albani), Hasan (Zubair Ali Zai).
- W044: WYN prints no grade for Abu Dawud 5055; corpus grades: Al-Albani Sahih, Shuaib al-Arnaut Hasan, Zubair Ali Zai Hasan.
- W044: WYN shows the Basmala before the surah; Telugu reading includes it, assuming the build's Uthmani 109:1 also carries it (check).
- W045: Arabic is assembled from bukhari 1154 (100% of its wording occurs there) rather than one verbatim excerpt — check the wording.

</details>

### 4. After a Bad Dream — `bad-dream`

WYN app: **4** · printed book: **4** · IqraSpace before: **0 published**, 1 draft · after review: **4** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | After a bad dream: seeking refuge from Satan and its evil | Sahih Muslim 5903 |  | new → review | unchecked | `wyn-after-a-bad-dream-seeking-refuge` |
| 2 | After a bad dream: asking for a good, true dream | Amal al-Yawm wa al-Laylah (Ibn al-Sunni), vol. 1, p. 671 |  | new → review | needs_review | `wyn-asking-for-a-good-true-dream` |
| 3 | Upon fright during sleep | Jami' at-Tirmidhi 3528 |  | new → review | unchecked | `wyn-upon-fright-during-sleep` |
| 4 | Upon fright during sleep: refuge in Allah's perfect words | al-Mu'jam al-Awsat (at-Tabarani), vol. 6, 5411 |  | new → review | needs_review | `wyn-fright-in-sleep-perfect-words-no-righteous-or-wicked` |

**Already in this category but not in WYN (kept, listed after WYN's sequence):** `wyn-0059-spit-on-the-left-side-three-times-and-read-audhu` (draft)

<details><summary>Unresolved verification issues (10)</summary>

- W046: The hadith gives the instruction 'let him seek refuge in Allah from the evil of Satan and its evil'; the first-person opener 'a'udhu' is derived from that command (as WYN prints), not verbatim in the corpus.
- W046: Existing 'seeking-refuge-from-the-accursed-devil' (a'udhu billahi minash-shaytanir-rajim) is a different wording; not merged.
- W047: Arabic not verified against a primary corpus (Ibn al-Sunni is not in the corpus; no Six-Books parallel found for 'ru'ya saliha sadiqa').
- W047: WYN prints no grade; authenticity of this narration not established here.
- W047: WYN writes 'رؤیًا' with tanween; normalised to 'رُؤْيَا' (indeclinable). Confirm against the printed source.
- W048: Corpus reads 'al-tammah' (singular adjective); WYN app prints 'al-tammat'. Corpus wording used.
- W048: Corpus grades: Shakir/Al-Albani/Bashar Awad Hasan; Zubair Ali Zai Da'if.
- W048: Batch candidate wyn-0065 (Qur'an 23:97-98) is a different Dua; not used here (it is filled by W085).
- W049: Arabic not verified against a primary corpus (Tabarani not in corpus).
- W049: Related but longer/different wording exists in Muwatta Malik 1739 (Jibril's words, mursal of Yahya b. Sa'id; graded Hasan li-ghayrihi by al-Hilali) - not used because the wording differs.

</details>

### 5. Supplications for Waking Up — `waking`

WYN app: **8** · printed book: **no matching section** · IqraSpace before: **2 published** · after review: **8** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Upon Wakeup | Bukhari |  | existing (published) | unchecked | `waking-upon-waking` |
| 2 | Upon waking, an alternate wording | Tirmidhi |  | existing (published) | unchecked | `waking-upon-waking-an-alternate-wording` |
| 3 | On waking at night: the closing verses of Al Imran | Qur'an 3:190-200; Sahih al-Bukhari 183 |  | new → review | unchecked | `wyn-waking-last-ayat-of-al-imran` |
| 4 | Supplication for light | Sahih al-Bukhari 6316 |  | new → review | unchecked | `wyn-dua-for-light-allahumma-ijal-fi-qalbi-nuran` |
| 5 | Surah al-Falaq | Qur'an 113:1-5 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-al-falaq` |
| 6 | Surah an-Nas | Qur'an 114:1-6 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-an-nas` |
| 7 | Starting the night prayer: ten each of takbir, praise, tasbih, tahlil and istighfar | Sunan Abi Dawud 766 | 50 | new → review | needs_review | `wyn-tahajjud-opening-ten-takbir-tahmid-tasbih` |
| 8 | Opening supplication of the night prayer (Tahajjud) | Sahih al-Bukhari 1120 |  | new → review | needs_review | `wyn-tahajjud-opening-allahumma-lakal-hamd-anta-qayyim` |

**Proposed corrections to published rows (2 Duas, opt-in):**
- `waking-upon-waking`: arabic, source_reference, hadith_number — Published Arabic has a malformed 'ِللهِ' (kasra written before the lam, detached); replace with the corpus wording of Bukhari 6314 (CONTAINED).
- `waking-upon-waking-an-alternate-wording`: source_reference, hadith_number — Reference lacks the hadith number (WYN prints Tirmidhi 3401; corpus confirms the text).

<details><summary>Unresolved verification issues (18)</summary>

- W005: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W005: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W005: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W005: WYN also cites Bukhari 5017 and Sunan an-Nasa'i 5439 (virtue of al-Falaq) — both checked in corpus and relevant.
- W006: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W006: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W006: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W006: WYN also cites Bukhari 5017 and Sunan an-Nasa'i 5439; Nasa'i 5439 names only al-Falaq.
- W051: Tirmidhi 3401 is graded Hasan by Tirmidhi/Al-Albani; Zubair Ali Zai Da'if. WYN prints no grade.
- W052: Bukhari 183 says 'the last ten verses'; WYN prints 3:190-200 (11 ayat), the range commonly given for this practice. Kept as WYN prints.
- W054: Only the closing supplication is verbatim in Abu Dawud 766; the five phrases are reconstructed from 'kabbara/hamida/sabbaha/hallala/istaghfara ten times' (as WYN prints them).
- W054: WYN placement count is 50 (5 phrases x 10); repeat_count left null because the count applies per phrase (10 each), not to the whole text - set display accordingly.
- W054: The hadith also mentions seeking refuge from the constriction of standing on the Day of Resurrection; WYN omits it.
- W054: WYN prints no grade; corpus: Al-Albani Hasan Sahih, Shuaib al-Arnaut Hasan.
- W054: Arabic is assembled from abudawud 766 (70% of its wording occurs there) rather than one verbatim excerpt — check the wording.
- W055: WYN app adds 'wa lakal-hamd, anta malikus-samawati wal-ard' which is not in Bukhari 1120 (a 'malik' phrase occurs in Nasa'i 1619 / Ibn Majah 1355); corpus Bukhari 1120 wording used.
- W055: Bukhari 1120 ends 'la ilaha illa anta - or: la ilaha ghayruk' (narrator's doubt); WYN prints 'la ilaha ghayruk'. Used 'la ilaha illa anta'.
- W055: Arabic is assembled from bukhari 1120 (99% of its wording occurs there) rather than one verbatim excerpt — check the wording.

</details>

### 6. Supplications for Protection — `protection-and-safety`

WYN app: **25** · printed book: **22** · IqraSpace before: **1 published**, 19 draft · after review: **25** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Refuge from the constriction of this world and the Day of Resurrection | Sunan Abi Dawud 5085 | 10 | new → review | unchecked | `wyn-refuge-from-constriction-of-dunya-and-qiyamah` |
| 2 | Refuge from severe affliction, misery, an evil decree and gloating enemies | Sahih al-Bukhari 6347 (also 6616) |  | new → review | needs_review | `wyn-refuge-from-hardship-of-affliction-and-gloating-enemies` |
| 3 | Refuge from the loss of Allah's blessings and well-being | Sahih Muslim 6944 |  | new → review | unchecked | `wyn-refuge-from-loss-of-blessing-and-wellbeing` |
| 4 | Refuge from poverty, humiliation, and wronging or being wronged | Sunan Abi Dawud 1544 |  | new → review | unchecked | `wyn-refuge-from-poverty-scarcity-humiliation-and-injustice` |
| 5 | Refuge from hunger and treachery | Sunan Abi Dawud 1547 |  | new → review | unchecked | `wyn-refuge-from-hunger-and-treachery` |
| 6 | Comprehensive refuge from weakness, hypocrisy and serious illness | al-Mustadrak (al-Hakim), vol. 2, 1987 |  | new → review | needs_review | `wyn-comprehensive-refuge-from-weakness-hypocrisy-and-disease` |
| 7 | Refuge from leprosy, insanity and evil diseases | Sunan Abi Dawud 1554 |  | new → review | unchecked | `wyn-refuge-from-leprosy-insanity-and-evil-diseases` |
| 8 | Refuge from the evil of one's hearing, sight, tongue, heart and desire | Sunan Abi Dawud 1551 |  | new → review | unchecked | `wyn-refuge-from-evil-of-hearing-sight-tongue-heart` |
| 9 | Refuge from helplessness, and asking for a purified soul | Sahih Muslim 6906 |  | new → review | unchecked | `wyn-refuge-from-helplessness-and-asking-purity-of-soul` |
| 10 | Refuge from arrogance: great in my own eyes, small with Allah | Sahih Muslim 7435 |  | new → review | needs_review | `wyn-refuge-from-being-great-in-own-eyes` |
| 11 | Protection from the greed of one's own soul | Akhbar Makkah (al-Fakihi) 415 |  | new → review | needs_review | `wyn-rabbi-qini-shuhha-nafsi` |
| 12 | Refuge from words unheard, deeds not raised, and knowledge without benefit | Musnad Ahmad, vol. 20, 13003 |  | new → review | needs_review | `wyn-refuge-from-unheard-word-and-unraised-deed` |
| 13 | Refuge from incapacity, laziness and the trials of life and death | Sahih Muslim 6873 |  | new → review | unchecked | `wyn-refuge-from-incapacity-laziness-and-grave` |
| 14 | Refuge from the evil of what I have done and not done | Sahih Muslim 6895 |  | new → review | unchecked | `wyn-refuge-from-evil-of-what-i-did-and-did-not-do` |
| 15 | Refuge from evil character, deeds and desires | Jami' at-Tirmidhi 3591 |  | new → review | unchecked | `wyn-refuge-from-evil-character-deeds-desires` |
| 16 | Asking Allah to set right one's religion, world and Hereafter | Sahih Muslim 6903 |  | new → review | unchecked | `wyn-allahumma-aslih-li-dini` |
| 17 | Refuge from decrepit old age, miserliness, cowardice and the oppression of men | Sahih Ibn Hibban, vol. 3, 1011 |  | new → review | needs_review | `wyn-refuge-from-decrepit-age-and-oppression-of-men` |
| 18 | Refuge from a bad neighbour, spouse, child, wealth and scheming friend | al-Silsilah as-Sahihah 3137 |  | new → review | needs_review | `wyn-refuge-from-bad-neighbour-spouse-child-wealth-friend` |
| 19 | Refuge from an evil day, night, hour, companion and neighbour | al-Mu'jam al-Kabir (at-Tabarani), vol. 17, 810; Sahih al-Jami' as-Saghir 1299 |  | WYN stub filled → review | needs_review | `wyn-0039-allahumma-inni-audhu-bika-min-yawmis-sui-wa-min` |
| 20 | Before the final salam | Muslim |  | existing (published) | unchecked | `salah-before-the-final-salam` |
| 21 | The best dua, on the Day of Arafah | Tirmidhi | 100 | existing (published) | unchecked | `hajj-the-best-dua-on-the-day-of-arafah` |
| 22 | Refuge in Allah's might from being led astray | Sahih Muslim 6899 |  | new → review | unchecked | `wyn-refuge-in-allahs-might-from-being-led-astray` |
| 23 | Asking Allah to erase wretchedness and record us among the blessed | Hilyat al-Awliya' wa Tabaqat al-Asfiya', p. 103 |  | new → review | needs_review | `wyn-if-you-wrote-us-wretched-erase-it` |
| 24 | Refuge from a painful or evil death | Sunan an-Nasa'i 5531 |  | new → review | unchecked | `wyn-refuge-from-a-painful-death` |
| 25 | Asking Allah to replace misfortune with happiness and forgiveness | Tafsir al-Tabari (Ibn Jarir) 20478 |  | new → review | needs_review | `wyn-if-you-wrote-wretchedness-or-sin-for-me-erase-it` |

**Already in this category but not in WYN (kept, listed after WYN's sequence):** `wyn-0044-allahumma-inni-audhu-bika-min-jaris-sui-wa-min-z` (draft), `wyn-0030-allahumma-inni-audhu-bika-min-qawlin-la-yusmau-w` (draft), `wyn-0028-allahumma-inni-audhu-bika-minal-barasi-wal-junun` (draft), `wyn-0037-allahumma-inni-audhu-bika-minal-jui-minal-khiyan` (draft), `wyn-0027-allahumma-inni-audhu-bika-min-sharri-ma-amiltu-w` (draft), `wyn-0036-allahumma-inni-audhu-bika-min-ilmin-la-yanfau` (draft), `wyn-0042-allahumma-inni-audhu-bika-minat-taraddi-wal-hadm` (draft), `wyn-0038-allahumma-inni-audhu-bika-minal-ajzi-wal-kasali` (draft), `wyn-0040-audhu-billahi-an-uradda-ila-ardhalil-umuri` (draft), `wyn-0046-allahumma-rabbas-samawati-wa-rabbal-ardi-wa-rabb` (draft), `wyn-0033-allahumma-inni-audhu-bika-minal-faqri-wal-qillat` (draft), `wyn-0045-allahumma-laka-aslamtu-wa-bika-amantu-wa-alaika` (draft), `wyn-0029-allahumma-inni-audhu-bika-min-diqid-dunya-wa-diq` (draft), `wyn-0032-allahumma-inni-audhu-bika-min-jahdil-balai-wa-da` (draft), `wyn-0026-allahumma-inni-audhu-bika-min-munkaratil-akhlaqi` (draft), `wyn-0035-allahumma-inni-audhu-bika-min-sharri-sami-wa-min` (draft), `wyn-0034-allahumma-inni-audhu-bika-min-zawali-nimatika-wa` (draft), `wyn-0043-allahumma-inni-audhu-bika-minal-ajzi-wal-kasali` (draft)

**Proposed corrections to published rows (1 Duas, opt-in):**
- `salah-before-the-final-salam`: source_reference, hadith_number — Reference lacks the hadith number (WYN prints Muslim 1324; corpus confirms the text).

<details><summary>Unresolved verification issues (34)</summary>

- W019: Identical wording exists in published rows hajj-the-best-dua-on-the-day-of-arafah and hajj-atop-safa-and-marwa (sim 1.0), but their titles/descriptions are tied to Hajj occasions, so reusing them would show 'Day of Arafah'/'Safa and Marwa' titles in Morning/Evening/After-Salah lists. Proposed as a new general row; admin may instead merge.
- W019: Counts differ by placement (Morning/Evening: none shown; Protection and Jinn: 100; After Salah: 10 — WYN cites al-Silsilah as-Sahihah 113 / Sahih at-Targhib 477, not in corpus). repeat_count left null; per-placement counts should come from the WYN mapping.
- W019: Book candidates WYN-0020 (al-Falaq) and WYN-0064 (Ikhlas/Mu'awwidhatain) are unrelated and not attached.
- W019: Same Arabic as existing row hajj-the-best-dua-on-the-day-of-arafah (published); reused it instead of inserting a duplicate.
- W056: Grade: WYN app prints Sahih, WYN book inventory prints Hasan Sahih; corpus Al-Albani Hasan Sahih, Zubair Ali Zai Hasan.
- W056: repeat_count 10 taken from the hadith ('ten times'); WYN placement has no count.
- W057: Bukhari 6347 reports that the Prophet ﷺ sought refuge from these four (6616: 'seek refuge in Allah from...'); the opener 'Allahumma inni a'udhu bika' is supplied (as WYN prints), not verbatim in the corpus.
- W057: In Bukhari 6347 Sufyan says he added one of the four himself and does not know which.
- W057: Arabic is assembled from bukhari 6347 (76% of its wording occurs there) rather than one verbatim excerpt — check the wording.
- W058: WYN prints Muslim 6943; text is at 6944 in the corpus numbering (6943 is an unrelated short chain).
- W060: WYN app English label prints 'Sahih' but its Urdu label and the book print 'Hasan'; Hasan used. Corpus: Al-Albani Hasan, Zubair Ali Zai Da'if.
- W061: Arabic not verified against a primary corpus (al-Hakim not in corpus; no Six-Books parallel with this full wording found - shorter related lists exist in Muslim 6873 and Abu Dawud 1554).
- W062: Corpus reads 'wa min sayyi'il-asqam'; WYN app omits 'min'. Corpus wording used. Zubair Ali Zai grades it Da'if; Al-Albani Sahih.
- W064: WYN prints 'Sahih Muslim 2722' (international/Abd al-Baqi numbering); in the Darussalam numbering used here the text is at 6906.
- W065: WYN prints 'Sahih Muslim 7625'; in the corpus numbering the text is at 7435.
- W065: These are the words of the Companion Utbah ibn Ghazwan (in a sermon), not a supplication of the Prophet ﷺ; reviewer may want to label it as a Companion's supplication.
- W066: Arabic not verified against a primary corpus (al-Fakihi not in corpus; no Six-Books parallel found).
- W066: Likely a report about a Companion's supplication during tawaf rather than a Prophetic hadith; WYN gives no narrator or grade - verify attribution.
- W066: Kept the phrase twice as WYN shows it; alternatively store once with repeat_count 2.
- W067: Arabic not verified against a primary corpus (Musnad Ahmad not in corpus). Closest Six-Books wording (Abu Dawud 1548: 'ilm la yanfa', qalb la yakhsha', nafs la tashba', du'a la yusma') differs, so not substituted.
- W070: Tirmidhi himself says 'hasan gharib'; Al-Albani/Shakir/Zubair Ali Zai Sahih.
- W072: Arabic not verified against a primary corpus (Ibn Hibban not in corpus). Related but different Six-Books wordings: Nasa'i 5445/5478 (Sa'd: bukhl, jubn, ardhal al-'umur, fitnat al-dunya, 'adhab al-qabr) and Abu Dawud 1539 ('fitnat al-sadr', graded Da'if); 'baghy al-rijal' not found in corpus.
- W073: Arabic not verified against a primary corpus (Silsilah not in corpus; no Six-Books parallel found - 'jar al-su'' alone appears elsewhere in other contexts).
- W073: WYN prints no grade; inclusion in al-Silsilah as-Sahihah implies al-Albani judged it authentic (as a whole or by supporting routes) - confirm.
- W073: 'zawj' is gender-neutral (spouse); translated as 'spouse'.
- W074: Arabic not verified against a primary corpus (Tabarani not in corpus; no Six-Books parallel found).
- W074: Hadith number discrepancy: WYN app prints al-Mu'jam al-Kabir 17/810; the existing draft/book inventory says 801. Confirm which is correct.
- W074: Batch book_candidates WYN-0083 and WYN-0090 (Qur'an 17:82 / 10:57, recitation as healing) are not this Dua; excluded from wyn_ids.
- W077: Arabic not verified against a primary corpus (Hilyat al-Awliya' not in corpus; no Six-Books parallel).
- W077: Likely a Companion's (non-Prophetic) supplication; WYN gives no narrator, volume or grade - verify attribution.
- W077: WYN writes 'أشقیاءُ' (nominative); normalised to accusative 'أَشْقِيَاءَ' as the grammar requires. Confirm.
- W078: WYN prints Nasa'i 5533; that hadith has a different order (al-hadm before al-taraddi, separate 'a'udhu' clauses). WYN's wording matches Nasa'i 5531 exactly; 5531 cited.
- W079: Arabic not verified against a primary corpus (Tafsir al-Tabari not in corpus).
- W079: Reported in Tafsir al-Tabari under 13:39 as a Companion's supplication (not a Prophetic hadith); WYN gives no narrator or grade - verify attribution.

</details>

### 7. For Warding Off Evil Whisperings — `evil-whisperings`

WYN app: **10** · printed book: **9** · IqraSpace before: **0 published** · after review: **10** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | When Satan prompts you: seek refuge in Allah (Fussilat 41:36) | Qur'an 41:36 |  | new → review | unchecked | `wyn-seek-refuge-when-satan-prompts-fussilat-36` |
| 2 | Against whispers about Allah's creation: 'I believe in Allah' | Sunan Abi Dawud 4721 |  | new → review | unchecked | `wyn-amantu-billah-against-whispers` |
| 3 | Against whispers about Allah: 'Allah is One, the Self-Sufficient' | Sunan Abi Dawud 4722 (quoting Qur'an 112:1-4) |  | new → review | unchecked | `wyn-allahu-ahad-against-whispers` |
| 4 | When troubled by evil thoughts: praise Allah who reduced Satan's plot to whispering | Sunan Abi Dawud 5112 |  | new → review | unchecked | `wyn-allahu-akbar-radda-kaydahu-ilal-waswasah` |
| 5 | When doubts arise: 'He is the First and the Last' (al-Hadid 57:3) | Qur'an 57:3; Sunan Abi Dawud 5110 |  | new → review | unchecked | `wyn-huwal-awwalu-wal-akhiru-against-doubts` |
| 6 | Refuge from the promptings of the devils (al-Mu'minun 23:97-98) | Qur'an 23:97-98 | 3 | WYN stub filled → review | unchecked | `wyn-0065-rabbi-audhubika-min-hamazatish-shayatin-wa-audhu` |
| 7 | Glorification: 'Glory be to You, O Allah, and with Your praise' | Sunan Abi Dawud 776; al-Silsilah as-Sahihah 2598 |  | new → review | unchecked | `wyn-subhanaka-allahumma-wa-bihamdik` |
| 8 | Night prayer opening: tahlil and 'Allahu akbar kabira' | Sunan Abi Dawud 775 | 3 | new → review | needs_review | `wyn-tahlil-and-takbir-kabira-night-prayer` |
| 9 | Seeking refuge from Satan's goading, puffing and spittle | Sunan Abi Dawud 775 |  | WYN stub filled → review | unchecked | `wyn-0066-audhu-billahis-samiil-alimi-minash-shaitanir-raj` |
| 10 | Seeking refuge from the accursed devil | Bukhari, Muslim |  | existing (published) | needs_review | `seeking-refuge-from-the-accursed-devil` |

<details><summary>Unresolved verification issues (22)</summary>

- W080: WYN app has no Arabic field for this item; the verse is printed in its reference text. Modelled as the verse itself.
- W081: Existing published 'faith-when-troubled-by-doubts-about-faith' has the longer wording 'amantu billahi wa rusulih' (Bukhari/Muslim); different wording, kept separate.
- W081: WYN prints no grade; corpus Al-Albani Sahih (Zubair Ali Zai: in Bukhari 3276 / Muslim 134).
- W082: Text is Qur'an 112:1-4 as quoted in the hadith (without 'qul huwa'); arabic is given explicitly - the build must not overwrite it with full Uthmani 112:1-4.
- W082: WYN prints no grade; corpus Al-Albani Hasan.
- W084: The advice in Abu Dawud 5110 is from Ibn Abbas (mawquf), not a saying of the Prophet ﷺ; corpus grade: Al-Albani 'Hasan isnad'.
- W085: Existing draft Arabic began with 'wa qul' (the command); WYN's recited Dua omits it, so an excerpt is used.
- W085: The Uthmani substring starts 'رَّبِّ' with shadda (assimilation from the preceding 'qul'); when recited standalone it is 'rabbi' - reviewer may drop the shadda.
- W085: repeat_count 3 kept from the WYN book inventory (WYN-0065 'Three times'); WYN app placement shows no count.
- W085: Batch book_candidates WYN-0117 and WYN-0120 are different Duas (23:118, 7:23); excluded.
- W086: WYN cites only al-Silsilah as-Sahihah 2598 (not in corpus); the identical wording is in Abu Dawud 776 (Six-Books parallel used). WYN's own context for 2598 may differ (e.g. a virtue of these words) - check.
- W086: WYN prints no grade; corpus Al-Albani Sahih for Abu Dawud 776.
- W087: WYN shows these two phrases (each x3) as a separate item in 'Warding off Evil-Whisperings'; in Abu Dawud 775 they are part of the night-prayer opening before the ta'awwudh (W088). Both lines checked separately (CONTAINED); combined text is not contiguous in the hadith.
- W087: WYN refs print no grade for this item; grade copied from WYN's grade for Abu Dawud 775 on the related entry (Sahih). Corpus: Al-Albani Sahih, Zubair Ali Zai 'Isnaad Hasan'; Abu Dawud himself notes it is said to be mursal via al-Hasan.
- W087: Book candidates WYN-0066/WYN-0080 are the ta'awwudh of the same hadith (mapped to W088), not this item; wyn_ids left empty.
- W087: Arabic is assembled from abudawud 775 (100% of its wording occurs there) rather than one verbatim excerpt — check the wording.
- W088: Duplicate WYN stub: wyn-0080-audhu-billahis-samiil-alimi-min-ash-shaitanir-ra (WYN-0080, Black Magic section) is the same dua; this fill carries both WYN ids — retire/merge the wyn-0080 stub.
- W088: Book entry WYN-0080 says 'Three times'; WYN app placements have no count and Abu Dawud 775 gives no count for this phrase, so repeat_count left null — admin to decide.
- W088: Corpus grades: Al-Albani Sahih; Shuaib al-Arnaut Sahih li-ghairihi; Zubair Ali Zai Isnaad Hasan.
- W088: Glosses of hamz/nafkh/nafth (madness/arrogance/poetry per narrators' explanation) kept literal in translation; consider a footnote.
- W089: Published row cites Sahih Muslim 5738 (the Khinzab hadith) whose Arabic says 'fa-ta'awwadh billahi minhu', not this exact formula; the exact words occur in Sahih al-Bukhari 6115 and Sahih Muslim 6646/6647 (anger hadith). WYN also prints Musannaf Abd al-Razzaq 2589. Not changed — reference is WYN's own; admin may add Bukhari 6115.
- W089: Existing source_reference 'Bukhari, Muslim' has no numbers.

</details>

### 8. For Warding Off Evil-Eye — `evil-eye`

WYN app: **18** · printed book: **5** · IqraSpace before: **0 published**, 2 draft · after review: **18** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Against envy: Al-Baqarah 2:109 (excerpt) | Qur'an 2:109 | 3 | new → review | needs_review | `wyn-evil-eye-baqarah-109-excerpt` |
| 2 | Against envy: An-Nisa 4:54 | Qur'an 4:54 | 7 | new → review | needs_review | `wyn-evil-eye-nisa-54` |
| 3 | Against the evil eye: Al-Kahf 18:39 (Ma sha' Allah) | Qur'an 18:39 |  | new → review | needs_review | `wyn-evil-eye-kahf-39-ma-sha-allah` |
| 4 | Against the evil eye: Al-Qalam 68:51 | Qur'an 68:51 |  | new → review | needs_review | `wyn-evil-eye-qalam-51` |
| 5 | Musa's dua for an expanded chest and eased speech | Qur'an 20:25-28 |  | new → review | unchecked | `wyn-rabbi-shrah-li-sadri-taha-25-28` |
| 6 | Surah Ash-Sharh (94) | Qur'an 94:1-8 |  | new → review | needs_review | `wyn-evil-eye-surah-ash-sharh` |
| 7 | Surah al-Ikhlas | Qur'an 112:1-4 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-al-ikhlas` |
| 8 | Surah al-Falaq | Qur'an 113:1-5 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-al-falaq` |
| 9 | Surah an-Nas | Qur'an 114:1-6 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-an-nas` |
| 10 | Seeking refuge at nightfall | Muslim |  | existing (published) | unchecked | `evening-seeking-refuge-at-nightfall` |
| 11 | Refuge in Allah's perfect words from devils, vermin and the evil eye | Sahih al-Bukhari 3371 |  | new → review | unchecked | `wyn-audhu-bi-kalimatillahit-tammah-evil-eye` |
| 12 | Jibril's ruqyah: 'Bismillahi arqika' | Sahih Muslim 5700 |  | WYN stub filled → review | unchecked | `wyn-0072-bismillahi-arqika-min-kulli-shaiin-yudhika-min-s` |
| 13 | Jibril's ruqyah: 'Bismillahi yubrika' | Sahih Muslim 5699 |  | WYN stub filled → review | unchecked | `wyn-0073-bismillahi-yubrika-wa-min-kulli-dain-yashfika-wa` |
| 14 | Ruqyah with soil and saliva: 'Turbatu ardina' | Sahih al-Bukhari 5745 | 3 | new → review | unchecked | `wyn-bismillah-turbatu-ardina-ruqyah` |
| 15 | Ruqyah: 'Wipe away the affliction, Lord of mankind' | Sahih al-Bukhari 5744 (WYN cites Musnad Ahmad 24995) |  | new → review | unchecked | `wyn-imsahil-bas-rabban-nas` |
| 16 | For healing | Bukhari, Muslim |  | existing (published) | unchecked | `sickness-for-healing` |
| 17 | For one struck by the evil eye: remove its heat, cold and pain | Al-Silsilah al-Sahihah 2572 |  | new → review | needs_review | `wyn-allahumma-adh-hib-anhu-harraha-wa-bardaha` |
| 18 | Seeking refuge from Satan's goading, puffing and spittle | Sunan Abi Dawud 775 |  | WYN stub filled → review | unchecked | `wyn-0066-audhu-billahis-samiil-alimi-minash-shaitanir-raj` |

**Proposed corrections to published rows (1 Duas, opt-in):**
- `sickness-for-healing`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, source_reference — Published Arabic ('Allahumma rabban-nas adhhibil-ba's, ishfi anta...') is a blend not found verbatim in any corpus hadith and does not match its cited Sahih Muslim 5707; proposed text is Muslim 5707 verbatim (check.mjs CONTAINED) and matches WYN.

<details><summary>Unresolved verification issues (34)</summary>

- W004: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W004: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W004: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W004: WYN also cites Sahih Muslim 1886 and Bukhari 5017 for Surah al-Ikhlas (virtue / bedtime recitation).
- W005: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W005: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W005: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W005: WYN also cites Bukhari 5017 and Sunan an-Nasa'i 5439 (virtue of al-Falaq) — both checked in corpus and relevant.
- W006: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W006: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W006: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W006: WYN also cites Bukhari 5017 and Sunan an-Nasa'i 5439; Nasa'i 5439 names only al-Falaq.
- W012: WYN cites Muslim 6880 (evening, scorpion sting) and Muslim 6878 (when stopping at a place) — both verified to contain the wording. WYN also lists it under Morning, Evil-eye, Travelling and Healing.
- W012: Published row source_reference is just 'Muslim' (hadith_number 6880).
- W088: Duplicate WYN stub: wyn-0080-audhu-billahis-samiil-alimi-min-ash-shaitanir-ra (WYN-0080, Black Magic section) is the same dua; this fill carries both WYN ids — retire/merge the wyn-0080 stub.
- W088: Book entry WYN-0080 says 'Three times'; WYN app placements have no count and Abu Dawud 775 gives no count for this phrase, so repeat_count left null — admin to decide.
- W088: Corpus grades: Al-Albani Sahih; Shuaib al-Arnaut Sahih li-ghairihi; Zubair Ali Zai Isnaad Hasan.
- W088: Glosses of hamz/nafkh/nafth (madness/arrogance/poetry per narrators' explanation) kept literal in translation; consider a footnote.
- W090: Count 3 comes from WYN's '(x3)' marker only; no Prophetic text prescribes reciting this verse for the evil eye — admin may want a note that this is a WYN practice, not a sunnah dua.
- W091: Count 7 comes from WYN's '(x7)' marker only; no Prophetic source prescribes it.
- W092: The recitable phrase is only 'ma sha'a Allahu la quwwata illa billah'; WYN prints the full ayah, so the whole ayah is used. Admin could switch to an excerpt.
- W092: Book candidate WYN-0142 (Astaghfirullah) is unrelated; wyn_ids empty.
- W094: Published row quranic-for-ease-and-openness-of-heart covers only 20:25-26; WYN has 25-28, so a new row was made rather than reuse. Admin may prefer to extend the existing row instead.
- W094: WYN prints the reference as 'Ta-Ha: 28-25' (reversed range).
- W095: WYN's English ref says 'Al-Ma'un:1-8' — wrong surah name; the Arabic and Urdu ref ('Alam Nashrah') are Surah 94 Ash-Sharh. Used 94:1-8.
- W095: Corpus 94:1 Uthmani text is prefixed with the Basmala; the build should strip it.
- W096: Published row sickness-seeking-refuge-for-a-child-or-loved-one (sim 0.86) is the 'u'idhukuma' (for two others) form and already carries WYN-0071; WYN's app and book (WYN-0071 title 'A'udhu bi kalimatillah...') use the first-person 'a'udhu' wording, which is the exact wording in Bukhari 3371. Made a new row; admin should move WYN-0071 off the existing row (or decide to reuse it instead).
- W098: WYN app text reads 'wa sharri kulli dhi 'ayn' and corpus agrees (book title adds 'min'); corpus wording used.
- W099: Count 3 is from WYN's '(x3)' marker; Bukhari 5745 itself gives no number.
- W099: Description of the finger/saliva practice is from the companion narration (Bukhari 5746), paraphrased.
- W100: WYN prints Musnad Ahmad 24995 (not in corpus); identical wording found in Sahih al-Bukhari 5744 and used instead.
- W101: If the admin prefers to keep the 'Allahumma rabban-nas' form, the correct source for it is Sahih al-Bukhari 5743 ('...adhhibil-ba's, ishfihi wa antash-shafi...'), not Muslim 5707 — either way the published text needs fixing.
- W102: Arabic not verified against a primary corpus (no Six-Books parallel found with find.mjs).
- W102: Pronoun 'anhu' (him) is for a male; adapt to 'anha' for a female — admin may add a note.

</details>

### 9. Protection Against Black Magic — `protection-from-magic`

WYN app: **7** · printed book: **9** · IqraSpace before: **0 published**, 2 draft · after review: **5** in WYN order (+2 WYN entries not representable — see below).

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 2 | The three Quls (Ikhlas, Falaq, Nas) | Qur'an 112, 113, 114 | 3 | existing (published) | needs_review | `three-quls` |
| 3 | Last two verses of Surah al-Baqarah at night | Qur'an 2:285-286 (virtue: Sahih al-Bukhari 4008) |  | new → review | unchecked | `wyn-last-two-ayat-of-surah-al-baqarah` |
| 4 | Eat seven 'Ajwah dates in the morning | Sahih al-Bukhari 5445 |  | new → review | unchecked | `wyn-seven-ajwah-dates-in-the-morning` |
| 5 | Cupping (hijamah) as a Sunnah treatment | Sahih al-Bukhari 5696 (WYN cites Musnad Ahmad 12045) |  | new → review | needs_review | `wyn-cupping-hijamah-as-treatment` |
| 7 | Refuge in Allah's Face, perfect words and Beautiful Names | Muwatta Malik 1741 (Book of Poetry, no. 12) |  | new → review | needs_review | `wyn-audhu-bi-wajhillahil-azim-kab-al-ahbar` |

**Not added (2):**
- WYN #1 (`BlackMagic-01`): WYN item is only a pointer ('refer to the morning/evening, protection and healing supplications for references'); no recitable text and no source text of its own.
- WYN #6 (`BlackMagic-06`): WYN item only says to listen to an audio lecture ('Treatment of Magic, Evil Eye and Possession of Jinns', QO33); nothing to recite and no source text.

**Already in this category but not in WYN (kept, listed after WYN's sequence):** `wyn-0080-audhu-billahis-samiil-alimi-min-ash-shaitanir-ra` (draft), `wyn-0081-audhu-billahil-azimi-biwajhihil-karimi-wa-sultan` (draft)

<details><summary>Unresolved verification issues (12)</summary>

- W104: Same recitation as published row three-quls (morning/evening, x3); made a separate instruction row because WYN's item is the bedtime blow-and-wipe practice. Admin may prefer reusing three-quls.
- W104: WYN-0075 (BM 2) also mentions Ayat al-Kursi (Bukhari 5010) and morning/evening; WYN-0064 is the same practice in the whisperings section. Both tagged here — drop if the admin wants one id per row.
- W104: Same Arabic as existing row three-quls (published); reused it instead of inserting a duplicate.
- W105: Published row quranic-for-mistakes-and-forgetfulness holds only 2:286; this covers both ayat as the hadith requires.
- W105: WYN-0076 also cites Sunan ad-Darimi 3387 (graded Sahih in WYN) — not in corpus.
- W105: Same Arabic as wyn-last-two-ayat-of-surah-al-baqarah (from W026); merged into that row.
- W106: Corpus vowelling 'لَمْ يَضُرُّهُ' kept as-is (grammatically 'lam yadurrahu'); transliteration uses 'yaḍurrahu'. Admin may normalise the Arabic vowel.
- W107: WYN prints Musnad Ahmad 12045 (vol. 19, Sahih) — not in corpus; its exact wording is unverified. Used the Bukhari 5696 statement on cupping (also from Anas) as the parallel; confirm it is the same report.
- W107: Not a recitable dua; it's a practice. Admin may prefer to exclude it from a Duas list.
- W109: Not a Prophetic hadith: it is the statement of Ka'b al-Ahbar (corpus grade al-Hilali: 'Maqtu Sahih'). WYN prints no grade.
- W109: WYN's 'Book of Poetry: 12' = corpus Malik 1741.
- W109: Book candidates WYN-0114/WYN-0147 are unrelated.

</details>

### 10. Protection Against Jinns and Shaitan — `jinn-and-shayateen`

WYN app: **13** · printed book: **7** · IqraSpace before: **4 published** · after review: **13** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Recite the Qur'an abundantly — it is healing and mercy | Qur'an 17:82 |  | new → review | unchecked | `wyn-recite-quran-abundantly-isra-82` |
| 2 | Recite Surah al-Baqarah at home — Satan flees | Sahih Muslim 1824 |  | new → review | unchecked | `wyn-recite-surah-al-baqarah-at-home` |
| 3 | Entering the toilet | Bukhari, Muslim |  | existing (published) | unchecked | `dressing-entering-the-toilet` |
| 4 | Refuge in Allah's Noble Face and eternal authority from Satan | Sunan Abi Dawud 466 |  | WYN stub filled → review | unchecked | `wyn-0081-audhu-billahil-azimi-biwajhihil-karimi-wa-sultan` |
| 5 | Entering the masjid | Muslim |  | existing (published) | unchecked | `masjid-entering-the-masjid` |
| 6 | Leaving the masjid: protection from Satan | Sunan Ibn Majah 773 |  | new → review | unchecked | `wyn-allahumma-simni-minash-shaitan-leaving-masjid` |
| 7 | Leaving the masjid | Muslim |  | existing (published) | unchecked | `masjid-leaving-the-masjid` |
| 8 | Seeking refuge from the accursed devil | Bukhari, Muslim |  | existing (published) | needs_review | `seeking-refuge-from-the-accursed-devil` |
| 9 | There is no god but Allah alone | Musnad Ahmad 1622 |  | new → review | needs_review | `wyn-la-ilaha-illallahu-wahdah-jinn` |
| 10 | The best dua, on the Day of Arafah | Tirmidhi | 100 | existing (published) | unchecked | `hajj-the-best-dua-on-the-day-of-arafah` |
| 11 | Glory and praise be to Allah (100 times) | Sahih Muslim 6843 | 100 | WYN stub filled → review | unchecked | `wyn-0023-subhanallahi-wa-bihamdihi` |
| 12 | Seeking refuge from Satan's goading, puffing and spittle | Sunan Abi Dawud 775 |  | WYN stub filled → review | unchecked | `wyn-0066-audhu-billahis-samiil-alimi-minash-shaitanir-raj` |
| 13 | Before marital relations | Bukhari, Muslim |  | existing (published) | unchecked | `home-before-marital-relations` |

**Already in this category but not in WYN (kept, listed after WYN's sequence):** `home-leaving-the-home` (published)

<details><summary>Unresolved verification issues (21)</summary>

- W019: Identical wording exists in published rows hajj-the-best-dua-on-the-day-of-arafah and hajj-atop-safa-and-marwa (sim 1.0), but their titles/descriptions are tied to Hajj occasions, so reusing them would show 'Day of Arafah'/'Safa and Marwa' titles in Morning/Evening/After-Salah lists. Proposed as a new general row; admin may instead merge.
- W019: Counts differ by placement (Morning/Evening: none shown; Protection and Jinn: 100; After Salah: 10 — WYN cites al-Silsilah as-Sahihah 113 / Sahih at-Targhib 477, not in corpus). repeat_count left null; per-placement counts should come from the WYN mapping.
- W019: Book candidates WYN-0020 (al-Falaq) and WYN-0064 (Ikhlas/Mu'awwidhatain) are unrelated and not attached.
- W019: Same Arabic as existing row hajj-the-best-dua-on-the-day-of-arafah (published); reused it instead of inserting a duplicate.
- W020: WYN also places it in Healing (#1, #156) with no count; repeat_count 100 is for the Morning/Evening/Jinn placements.
- W088: Duplicate WYN stub: wyn-0080-audhu-billahis-samiil-alimi-min-ash-shaitanir-ra (WYN-0080, Black Magic section) is the same dua; this fill carries both WYN ids — retire/merge the wyn-0080 stub.
- W088: Book entry WYN-0080 says 'Three times'; WYN app placements have no count and Abu Dawud 775 gives no count for this phrase, so repeat_count left null — admin to decide.
- W088: Corpus grades: Al-Albani Sahih; Shuaib al-Arnaut Sahih li-ghairihi; Zubair Ali Zai Isnaad Hasan.
- W088: Glosses of hamz/nafkh/nafth (madness/arrogance/poetry per narrators' explanation) kept literal in translation; consider a footnote.
- W089: Published row cites Sahih Muslim 5738 (the Khinzab hadith) whose Arabic says 'fa-ta'awwadh billahi minhu', not this exact formula; the exact words occur in Sahih al-Bukhari 6115 and Sahih Muslim 6646/6647 (anger hadith). WYN also prints Musannaf Abd al-Razzaq 2589. Not changed — reference is WYN's own; admin may add Bukhari 6115.
- W089: Existing source_reference 'Bukhari, Muslim' has no numbers.
- W110: Same verse as W126 (healing section). Kept as a separate instruction row (WYN-0083, jinn section) — admin may merge both placements into one row.
- W111: WYN's book note that a recording may be played if one cannot recite is WYN's own advice, not in the hadith; not included.
- W112: Existing row has no hadith number; WYN cites Sahih al-Bukhari 142 (corpus text matches the published Arabic). Admin may add hadith_number 142.
- W113: App refs show no grade; grade from WYN book entry WYN-0081 (Sahih). Corpus: Al-Albani Sahih.
- W114: Existing row lacks hadith number; WYN cites Sahih Muslim 1652 (corpus text matches). Admin may add it.
- W115: WYN prints no grade; corpus: Al-Albani Sahih, Zubair Ali Zai Sahih.
- W116: Existing row lacks hadith number; WYN cites Sahih Muslim 1652 (corpus text matches). Admin may add it.
- W117: Arabic not verified against a primary corpus. The phrase is too generic for a meaningful find.mjs parallel; the context of Musnad Ahmad 1622 (how/when it is said, any count) is unverified — description is generic.
- W117: WYN prints no grade.
- W118: Existing row has no hadith number; WYN cites Sahih al-Bukhari 141 (corpus text matches). Admin may add it.

</details>

### 11. Protection from Enemies — `protection-from-enemy`

WYN app: **7** · printed book: **6** · IqraSpace before: **0 published**, 6 draft · after review: **7** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | O Allah, support him with the Holy Spirit | Sahih al-Bukhari 453 |  | new → review | unchecked | `wyn-allahumma-ayyidhu-bi-ruhil-qudus` |
| 2 | O Allah, suffice me against them as You will | Sahih Muslim 7511 |  | WYN stub filled → review | unchecked | `wyn-0048-allahummak-finihim-bima-shita` |
| 3 | When fearing a people: we place You before them | Sunan Abi Dawud 1537 |  | WYN stub filled → review | unchecked | `wyn-0049-allahumma-inna-najaluka-fi-nuhurihim-wa-naudhubi` |
| 4 | Musa's refuge from every arrogant one | Qur'an 40:27 |  | WYN stub filled → review | unchecked | `wyn-0050-inni-udhtu-bi-rabbi-wa-rabbikum-min-kulli-mutaka` |
| 5 | Help me against whoever wrongs me | Jami' at-Tirmidhi 3604 (sub-narration; WYN prints 3604/7) |  | WYN stub filled → review | unchecked | `wyn-0051-allahumma-mattini-bisami-wa-basari-wajalhumal-wa` |
| 6 | Lord of the seven heavens, be my protector against so-and-so | Al-Adab al-Mufrad 707 |  | WYN stub filled → review | needs_review | `wyn-0052-allahumma-rabbas-samawatis-sabi-wa-rabbal-arshil` |
| 7 | Allah is mightier than all His creation — against a feared ruler | Al-Adab al-Mufrad 708 | 3 | WYN stub filled → review | needs_review | `wyn-0053-allahu-akbar-allahu-aazzu-min-khalqihi-jamian-th` |

<details><summary>Unresolved verification issues (12)</summary>

- W119: It is a dua for another person (Hassan) in a specific context; WYN lists it under protection from enemies.
- W121: Corpus grades differ: Al-Albani, Shuaib al-Arnaut Sahih; Zubair Ali Zai Da'if.
- W122: Draft stub's Arabic/translations were the whole ayah including 'wa qala Musa'; replaced with the excerpt WYN prints.
- W123: WYN prints 3604/7; in the corpus this text is sub-narration 3604.08 (3604.07 is a different hadith) — numbering offset only.
- W123: Tirmidhi himself says 'hasan gharib from this route'.
- W123: 'waj'alhumal-waritha minni' rendered by meaning (keep them sound till death); literal 'make them the inheritor from me' — scholar review.
- W124: Arabic not verified against a primary corpus. Tirmidhi 3523 has a different, Da'if wording ('kun li jaran min sharri khalqika kullihim...') — not a parallel.
- W124: To my knowledge Adab al-Mufrad 707 is a statement of Ibn Mas'ud (mawquf), not a Prophetic hadith — verify and note in description.
- W125: Arabic not verified against a primary corpus; no Six-Books parallel found ('Allahu a'azzu min khalqihi').
- W125: To my knowledge Adab al-Mufrad 708 is a statement of Ibn 'Abbas (mawquf) — verify.
- W125: Count 3 from WYN book entry WYN-0053 ('Three times'); app placement has no count.
- W125: Telugu transliteration given though the Arabic is near ~600 characters.

</details>

### 12. Supplication for Healing — `healing`

WYN app: **8** · printed book: **8** · IqraSpace before: **0 published** · after review: **8** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Recite the Qur'an abundantly — it is healing and mercy | Qur'an 17:82 |  | new → review | unchecked | `wyn-recite-quran-abundantly-isra-82` |
| 2 | Healing for what is in the breasts (Yunus 10:57) | Qur'an 10:57 |  | new → review | unchecked | `wyn-healing-for-what-is-in-the-breasts-yunus-57` |
| 3 | Ruqyah with Surah al-Fatihah | Qur'an 1:1-7; Sunan Abi Dawud 3896 |  | new → review | unchecked | `wyn-ruqyah-with-surah-al-fatihah` |
| 4 | Ayyub's dua: adversity has touched me | Qur'an 21:83 |  | WYN stub filled → review | unchecked | `wyn-0093-anni-massaniyad-durru-wa-anta-arhamur-rahimin` |
| 5 | Placing the hand on the site of pain | Muslim |  | existing (published) | needs_review | `sickness-placing-the-hand-on-the-site-of-pain` |
| 6 | Visiting the sick: asking Allah to cure them | Sunan Abi Dawud 3106 | 7 | new → review | unchecked | `wyn-asalullah-al-azim-an-yashfiyak` |
| 7 | For healing | Bukhari, Muslim |  | existing (published) | unchecked | `sickness-for-healing` |
| 8 | Healing: remove the affliction, Lord of mankind | Musnad Ahmad 24234 (vol. 40) |  | new → review | needs_review | `wyn-imsahil-bas-la-yakshiful-karb` |

**Proposed corrections to published rows (2 Duas, opt-in):**
- `sickness-for-healing`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, source_reference — Published Arabic ('Allahumma rabban-nas adhhibil-ba's, ishfi anta...') is a blend not found verbatim in any corpus hadith and does not match its cited Sahih Muslim 5707; proposed text is Muslim 5707 verbatim (check.mjs CONTAINED) and matches WYN.
- `sickness-placing-the-hand-on-the-site-of-pain`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, description, source_reference, title_ur — Published Arabic embeds repetition markers (×٣)/(×٧) in the text; counts belong in the description.

<details><summary>Unresolved verification issues (14)</summary>

- W101: If the admin prefers to keep the 'Allahumma rabban-nas' form, the correct source for it is Sahih al-Bukhari 5743 ('...adhhibil-ba's, ishfihi wa antash-shafi...'), not Muslim 5707 — either way the published text needs fixing.
- W126: Same verse as W110 (jinn section); admin may merge both into one row.
- W126: WYN-0090 covers both 17:82 and 10:57; tagged on this row and on W127.
- W126: Same Arabic as wyn-recite-quran-abundantly-isra-82 (from W110); merged into that row.
- W127: WYN-0090 also tagged on W126 (17:82). Book candidates WYN-0067/WYN-0114 unrelated.
- W128: WYN-0092 says recite it an odd number of times (citing Muslim 5733 too); no repeat_count set since the app gives none.
- W128: Corpus 1:1 text starts with a BOM character (U+FEFF) — build should strip it.
- W129: Draft stub's Arabic/translations were the whole ayah ('wa Ayyuba idh nada rabbahu...'); replaced with the excerpt WYN prints.
- W130: Corpus Muslim 5737 spells 'بِاسْمِ اللَّهِ'; kept the common 'بِسْمِ اللَّهِ' spelling. Second phrase verified CONTAINED in Muslim 5737.
- W130: repeat_count left null because the dua has two different counts (3 and 7); WYN placements give no single count.
- W131: One WYN placement (Healing collection, order 146) shows no count; the other two show 7, matching the hadith.
- W132: Arabic not verified against a primary corpus.
- W132: Closest Six-Books parallel: Bukhari 5744 (Aisha) 'امْسَحِ الْبَاسَ رَبَّ النَّاسِ، بِيَدِكَ الشِّفَاءُ، لاَ كَاشِفَ لَهُ إِلاَّ أَنْتَ' — same opening, different ending ('none can remove it but You'); WYN's ending 'lā yakshifu-l-karba illā anta' kept because it is a distinct wording. Reviewer may prefer the Bukhari wording.
- W132: WYN-0104 (Visiting the Sick, 'Adh-hibil ba's...') shares the Ahmad 24234 reference but is a different wording; not linked.

</details>

### 13. Visiting the Sick — `visiting-the-sick`

WYN app: **9** · printed book: **7** · IqraSpace before: **0 published**, 2 draft · after review: **9** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Visiting the sick: the Prophet's command | Sahih al-Bukhari 5649 |  | new → review | unchecked | `wyn-command-to-visit-the-sick` |
| 2 | Visiting the sick: seventy thousand angels pray for you | Jami' at-Tirmidhi 969 (also 967) |  | new → review | unchecked | `wyn-virtue-of-visiting-the-sick` |
| 3 | Visiting the sick: 'I was ill and you did not visit Me' | Sahih Muslim 6556 |  | new → review | unchecked | `wyn-i-was-ill-and-you-did-not-visit-me` |
| 4 | Visiting the sick: O Allah, grant him well-being | Jami' at-Tirmidhi 3564; Musnad Ahmad 637 (as printed in Wa Iyyaka Nastaeen) |  | new → review | needs_review | `wyn-allahumma-afihi-ishfihi` |
| 5 | Visiting the sick | Abu Dawud, Tirmidhi |  | existing (published) | unchecked | `sickness-visiting-the-sick` |
| 6 | Visiting the sick: asking Allah to cure them | Sunan Abi Dawud 3106 | 7 | new → review | unchecked | `wyn-asalullah-al-azim-an-yashfiyak` |
| 7 | For healing | Bukhari, Muslim |  | existing (published) | unchecked | `sickness-for-healing` |
| 8 | On seeing someone afflicted with a trial | Jami' at-Tirmidhi 3432 |  | new → review | unchecked | `wyn-upon-seeing-someone-afflicted` |
| 9 | The fuller dua for calamity | Muslim |  | existing (published) | unchecked | `grief-the-fuller-dua-for-calamity` |

**Already in this category but not in WYN (kept, listed after WYN's sequence):** `wyn-0101-allahumma-afihi-allahummash-fihi` (draft), `wyn-0095-asalullahal-azima-rabbal-arshil-azimi-an-yashfiy` (draft)

**Proposed corrections to published rows (3 Duas, opt-in):**
- `sickness-for-healing`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, source_reference — Published Arabic ('Allahumma rabban-nas adhhibil-ba's, ishfi anta...') is a blend not found verbatim in any corpus hadith and does not match its cited Sahih Muslim 5707; proposed text is Muslim 5707 verbatim (check.mjs CONTAINED) and matches WYN.
- `sickness-visiting-the-sick`: source_collection, source_reference, hadith_number — Text 'لا بأس طهور إن شاء الله' is found in Bukhari (3616, 5656, 5662), not in Abu Dawud or Tirmidhi per corpus search.
- `grief-the-fuller-dua-for-calamity`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, source_reference — Muslim 2126 gives the dua as the istirja' followed by 'Allahumma'jurni...'; the published row (titled 'the fuller dua') omits the opening istirja'. WYN shows the full text. Verified CONTAINED in Muslim 2126.

<details><summary>Unresolved verification issues (11)</summary>

- W101: If the admin prefers to keep the 'Allahumma rabban-nas' form, the correct source for it is Sahih al-Bukhari 5743 ('...adhhibil-ba's, ishfihi wa antash-shafi...'), not Muslim 5707 — either way the published text needs fixing.
- W131: One WYN placement (Healing collection, order 146) shows no count; the other two show 7, matching the hadith.
- W133: Instruction-style item (WYN app shows no Arabic); Arabic is the Prophet's statement from the cited hadith.
- W134: Instruction/virtue item (WYN app shows no Arabic); Arabic is the Prophet's statement from Tirmidhi 969.
- W134: Corpus grades for Tirmidhi 969: Shakir Sahih, al-Albani Sahih, Zubair Ali Zai Da'if; Tirmidhi himself: hasan gharib. WYN book also cites Musnad Ahmad 975.
- W135: Virtue/narration item (WYN app shows no Arabic); Arabic is the first portion of the hadith qudsi (the part about illness), matching the portion WYN's reference quotes. No matching WYN book entry found.
- W136: WYN prints Musnad Ahmad 637 (not in corpus) with 'اللّٰهُمَّ عَافِهِ / اللّٰهُمَّ اشْفِهِ'; used the Tirmidhi 3564 parallel (same 'Ali incident), where 'aw' marks Shu'bah's doubt between the two words.
- W136: Corpus grades for Tirmidhi 3564: Tirmidhi hasan sahih; al-Albani and Shakir Da'if; Zubair Ali Zai isnad hasan; Bashar Awad Hasan Sahih. Reviewer may prefer WYN's two-phrase form.
- W138: Corpus grades for Tirmidhi 3432: Tirmidhi hasan gharib; al-Albani and Shakir Sahih; Zubair Ali Zai Da'if.
- W138: The travel placement (Urdu ref) cites Ibn Majah 3892 (Ibn 'Umar, same wording; al-Albani Hasan, Arna'ut very Da'if) — same dua, also shown under 'Supplications for Travelling'.
- W139: Alternative: if the owner intends 'grief-upon-hearing-of-a-calamity' (istirja' alone, Qur'an 2:156) and this row to stay split, map W139 here without the arabic correction — but then the WYN item's opening is not shown.

</details>

### 14. Forgiveness of the Deceased — `deceased-maghfirat`

WYN app: **7** · printed book: **7** · IqraSpace before: **0 published**, 4 draft · after review: **7** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | For the deceased: Your servant is in need of Your mercy | al-Mustadrak al-Hakim 1368 (vol. 1) |  | new → review | needs_review | `wyn-allahumma-abduka-wabnu-amatika-deceased` |
| 2 | Funeral prayer: he is under Your protection | Sunan Abi Dawud 3202; Sunan Ibn Majah 1499 |  | new → review | needs_review | `wyn-allahumma-inna-fulana-fi-dhimmatik` |
| 3 | Upon closing the eyes of one who has died | Muslim |  | existing (published) | unchecked | `grief-upon-closing-the-eyes-of-one-who-has-died` |
| 4 | In the funeral prayer, more generally | Abu Dawud, Tirmidhi, Ibn Majah |  | existing (published) | unchecked | `grief-in-the-funeral-prayer-more-generally` |
| 5 | For a deceased loved one | Muslim |  | existing (published) | needs_review | `grief-for-a-deceased-loved-one` |
| 6 | For a deceased child: protect him from the punishment of the grave | Muwatta Malik 537 (Kitab al-Jana'iz) |  | new → review | unchecked | `wyn-allahumma-aidhhu-min-adhabil-qabr-child` |
| 7 | For a deceased child: make him a forerunner and reward for us | Sahih al-Bukhari, Book of Funerals, chapter 65 (heading) |  | new → review | needs_review | `wyn-allahummajalhu-lana-salafan-wa-faratan` |

**Already in this category but not in WYN (kept, listed after WYN's sequence):** `wyn-0108-allahumma-inna-fulanabna-fulanin-fi-dhimmatika-w` (draft), `wyn-0107-allahumma-abduka-wabnu-amatika-ihtaja-ila-rahmat` (draft), `wyn-0113-allahummajalhu-lana-salafan-wa-faratan-wa-ajran` (draft), `wyn-0112-allahumma-aidh-hu-min-adhabil-qabr-for-a-decease` (draft)

**Proposed corrections to published rows (3 Duas, opt-in):**
- `grief-upon-closing-the-eyes-of-one-who-has-died`: transliteration_telugu, source_reference — Published Telugu contains Latin text 'li-[name]' inside the Telugu-script reading.
- `grief-in-the-funeral-prayer-more-generally`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, source_reference — Published text stops after the first sentence (omits 'our male and female' and the two remaining sentences) though it cites Abu Dawud 3201. Full wording verified CONTAINED in Abu Dawud 3201.
- `grief-for-a-deceased-loved-one`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, hadith_number, source_reference — Published text stops after 'wa'fu 'anhu' (row's own review note flags this); full dua from Muslim 2232, verified CONTAINED.

<details><summary>Unresolved verification issues (11)</summary>

- W140: Arabic not verified against a primary corpus; no Six-Books parallel found (find.mjs all for 'احتاج الى رحمتك' and 'غني عن عذابه' returned nothing).
- W141: WYN prints Abu Dawud 3202; the corpus text of AD 3202 reads 'أَهْلُ الْوَفَاءِ وَالْحَمْدِ' where WYN has 'وَالْحَقِّ'. Ibn Majah 1499 (same isnad) has 'وَالْحَقِّ' and the full wording contiguously, so it was used as the verified basis.
- W141: WYN has 'اللّٰهُمَّ فَاغْفِرْ لَهُ' (as in AD 3202); Ibn Majah 1499 has 'فَاغْفِرْ لَهُ' without 'اللهم'. Reviewer may restore 'اللَّهُمَّ' before 'فَاغْفِرْ' to mirror WYN exactly.
- W142: Row uses a name placeholder 'لِـ[فُلَانٍ]' (Muslim 2130 has 'لِأَبِي سَلَمَةَ'); WYN uses 'لَهُ'. Same dua; left as is.
- W143: Published row's phrase order (living/dead, present/absent, young/old) differs from AD 3201; correction adopts AD 3201's order and full text as shown by WYN.
- W144: Corpus Muslim 2232 ends 'مِنْ عَذَابِ الْقَبْرِ أَوْ مِنْ عَذَابِ النَّارِ' ('aw' = narrator's doubt); WYN prints 'وَ مِنْ عَذَابِ النَّارِ'. Kept corpus wording; reviewer may prefer 'وَمِنْ' or the parallel narration 'وَقِهِ فِتْنَةَ الْقَبْرِ وَعَذَابَ النَّارِ'.
- W144: WYN book note says the dua is given in male then female form; only the male form is proposed.
- W145: WYN prints 'Muwatta, al-Jana'iz: 18' (chapter-internal number); corpus (sequential) numbering is Malik 537.
- W145: This is Abu Hurayrah's own practice (mawquf), not a saying of the Prophet ﷺ; corpus grade: Mauquf Sahih (Salim al-Hilali). WYN prints no grade.
- W146: Arabic not verified against a primary corpus; find.mjs found no numbered hadith containing it.
- W146: WYN cites only a Bukhari chapter (Kitab al-Jana'iz, bab 65); to my knowledge this wording is a mu'allaq report from al-Hasan al-Basri in the chapter heading (not a marfu' hadith), and the heading's order may be 'faratan wa salafan' — reviewer should confirm from a printed Bukhari. source_type set to 'other' for that reason.

</details>

### 15. Visiting the Graveyard — `visiting-graveyard`

WYN app: **3** · printed book: **no matching section** · IqraSpace before: **0 published** · after review: **3** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Visiting the graveyard: peace upon the believers who dwell here | Sahih Muslim 2256 |  | new → review | unchecked | `wyn-assalamu-ala-ahlid-diyar-graveyard` |
| 2 | Visiting the graveyard: peace upon you, abode of believers | Sahih Muslim 2255 |  | new → review | unchecked | `wyn-assalamu-alaykum-dara-qawmin-muminin` |
| 3 | Visiting the graveyard: you went ahead, we will follow | Sunan an-Nasa'i 2040; Musnad Ahmad 23039 (as printed in Wa Iyyaka Nastaeen) |  | new → review | needs_review | `wyn-assalamu-alaykum-ahlad-diyar-antum-lana-farat` |

<details><summary>Unresolved verification issues (4)</summary>

- W147: No matching WYN book entry in book_candidates (app-only item).
- W148: Hadith continues 'اللَّهُمَّ اغْفِرْ لأَهْلِ بَقِيعِ الْغَرْقَدِ' (specific to al-Baqi'); omitted, as in WYN. No matching WYN book entry (app-only item).
- W149: WYN cites Musnad Ahmad 23039 (not in corpus); WYN wording differs slightly: 'لَلَاحِقُونَ' and ending 'فَنَسْأَلُ اللَّهَ لَنَا وَلَكُمُ الْعَافِيَةَ'. Used Nasa'i 2040 parallel (al-Albani Sahih); Muslim 2257 is a shorter parallel without 'antum lana farat'.
- W149: WYN prints no grade; hadith_grade left null. No matching WYN book entry (app-only item).

</details>

### 16. Supplications for Forgiveness — `istighfar`

WYN app: **19** · printed book: **28** · IqraSpace before: **3 published**, 19 draft · after review: **19** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Seeking forgiveness brings rain, wealth and children | Qur'an 71:10-12 |  | WYN stub filled → review | unchecked | `wyn-0114-repentance-from-sins-and-seeking-forgiveness-exc` |
| 2 | Forgiveness: O Allah, forgive my sin | Sahih Muslim 6986 |  | new → review | unchecked | `wyn-allahummaghfir-li-dhanbi` |
| 3 | Forgiveness: my Lord, forgive my sins on the Day of Judgement | Sahih Muslim 518 |  | WYN stub filled → review | unchecked | `wyn-0116-rabbighfirli-khatiati-yawmad-din` |
| 4 | Forgiveness: glory be to You, I seek Your forgiveness | Sahih Muslim 1086 |  | new → review | unchecked | `wyn-subhanaka-wa-bihamdika-astaghfiruka` |
| 5 | Forgiveness: my Lord, forgive me and accept my repentance (at-Tawwab ar-Rahim) | Sunan Abi Dawud 1516 |  | new → review | unchecked | `wyn-rabbighfir-li-wa-tub-alayya-tawwabur-rahim` |
| 6 | Forgiveness, mercy, guidance and provision | Sahih Muslim 6849 |  | new → review | unchecked | `wyn-allahummaghfir-li-warhamni-wahdini-warzuqni` |
| 7 | Forgiveness: I seek Allah's forgiveness, the Ever-Living | Sunan Abi Dawud 1517 |  | new → review | unchecked | `wyn-astaghfirullah-alladhi-la-ilaha-illa-huwa` |
| 8 | Forgiveness and guidance to the soundest course | Musnad Ahmad 16269 |  | new → review | needs_review | `wyn-ghfir-li-dhanbi-wa-khatai-wa-amdi` |
| 9 | General seeking of forgiveness | Abu Dawud, Tirmidhi |  | existing (published) | unchecked | `repentance-general-seeking-of-forgiveness` |
| 10 | Forgiveness: forgive me, have mercy on me, accept my repentance | Musnad Ahmad 5354 (vol. 9) |  | new → review | needs_review | `wyn-ghfir-li-warhamni-wa-tub-alayya` |
| 11 | Forgiveness for mistakes, deliberate, secret and open sins | Musnad Ahmad 19925 (vol. 33) |  | new → review | needs_review | `wyn-ghfir-li-ma-akhtatu-wa-ma-taammadtu` |
| 12 | Forgiveness: drive away my devil, free me, make my scale heavy | al-Mustadrak al-Hakim 2026 (vol. 2) |  | new → review | needs_review | `wyn-wakhsa-shaytani-wa-fukka-rihani` |
| 13 | Forgiveness for every kind of sin, serious or in jest | Sahih al-Bukhari 6399 |  | new → review | unchecked | `wyn-ghfir-li-khatiati-wa-jahli-wa-israfi` |
| 14 | Make me ever grateful and accept my repentance | Jami' at-Tirmidhi 3551 |  | new → review | needs_review | `wyn-rabbijalni-laka-shakkaran-dhakkaran` |
| 15 | There is no god but Allah, the Forbearing, the Generous | Musnad Ahmad 712 |  | new → review | needs_review | `wyn-la-ilaha-illallahul-halimul-karim` |
| 16 | Sayyid al-Istighfar (master of seeking forgiveness) | Bukhari |  | existing (published) | unchecked | `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` |
| 17 | Steadfastness, sound resolve and Your forgiveness | al-Mu'jam al-Kabir at-Tabarani 7135 (vol. 7) |  | new → review | needs_review | `wyn-asalukath-thabata-fil-amr` |
| 18 | Forgiveness: my Lord, forgive me and accept my repentance (at-Tawwab al-Ghafur) | Jami' at-Tirmidhi 3434 | 100 | new → review | unchecked | `wyn-rabbighfir-li-wa-tub-alayya-tawwabul-ghafur` |
| 19 | Expiation at the end of a gathering | Tirmidhi, al-Hakim |  | existing (published) | unchecked | `social-expiation-at-the-end-of-a-gathering` |

**Already in this category but not in WYN (kept, listed after WYN's sequence):** `wyn-0135-allahumma-inni-asalukath-thabata-fil-amri-wal-az` (draft), `wyn-0128-allahummaghfirli-warhamni-wa-tub-alayya-innaka-a` (draft), `wyn-0129-allahummaghfirli-ma-akhtatu-wa-ma-taammadtu-wa-m` (draft), `wyn-0139-allahumma-inni-zalamtu-nafsi-zulman-kathiran-wa` (draft), `wyn-0130-allahummaghfirli-wakhsa-shaitani-wa-fukka-rihani` (draft), `wyn-0126-allahummaghfirli-dhanbi-wa-yassirli-amri-wa-bari` (draft), `wyn-0140-rabbighfirli-wa-tub-alaiya-innaka-antat-tawwabul` (draft), `wyn-0115-allahummaghfirli-dhanbi` (draft), `wyn-0118-rabbanaghfirli-wali-walidayya-wa-lil-muminina-ya` (draft), `wyn-0137-subhanakallahumma-rabbana-wa-bihamdika-allahumma` (draft), `wyn-0117-rabbighfir-warham-wa-anta-khairur-rahimin` (draft), `wyn-0132-allahummaghfirli-khatiati-wa-jahli-wa-israfi-fi` (draft), `wyn-0133-allahummaghfirli-ma-qaddamtu-wa-ma-akh-khartu-wa` (draft), `wyn-0123-rabbighfirli-wa-tub-alayya-innaka-antat-tawwabur` (draft), `wyn-0119-rabbana-innana-amanna-faghfirlana-dhunubana-wa-q` (draft), `wyn-0131-allahumma-inni-asaluka-ya-allahul-ahadus-samadul` (draft), `wyn-0138-allahummaghfirli-dhanbi-kullahu-diqqahu-wa-jilla` (draft), `salah-general-remembrance-after-the-salam` (published)

**Proposed corrections to published rows (2 Duas, opt-in):**
- `morning-sayyid-al-istighfar-master-of-seeking-forgiveness`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, description, source_reference, arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, source_reference, title_ur — Published Arabic stops after 'mā-staṭaʿtu'; the rest of Sayyid al-Istighfar (aʿūdhu bika … illā ant) in Bukhari 6306 and in WYN is missing. Corpus Bukhari 6306 CONTAINED.
- `repentance-general-seeking-of-forgiveness`: source_collection, source_reference — Corpus: the 'al-'Azim' wording is in Tirmidhi 3577; Abu Dawud 1517 lacks 'al-'Azim'.

<details><summary>Unresolved verification issues (29)</summary>

- W018: WYN's app omits 'laka' in 'abū'u laka bi-dhanbī' and has 'innahu' for 'fa-innahu'; corpus Bukhari 6306 wording used.
- W018: Slug starts with 'morning-' but the dua is identical for evening; WYN places it in Morning, Evening and Forgiveness.
- W150: Instruction-style item (WYN app shows no Arabic; its reference text quotes Nuh 10-12); mapped to the whole ayat.
- W150: Same Arabic as existing row wyn-0114-repentance-from-sins-and-seeking-forgiveness-exc (draft); reused it instead of inserting a duplicate.
- W152: The draft currently holds Qur'an 26:82 ('وَٱلَّذِىٓ أَطْمَعُ أَن يَغْفِرَ لِى خَطِيٓـَٔتِى يَوْمَ ٱلدِّينِ') with source_type 'mixed' and quran_refs 26:82; WYN's dua is the hadith wording from Muslim 518, so Arabic replaced, source_type set to hadith and quran_refs cleared (wording echoes 26:82).
- W153: Not merged with 'social-expiation-at-the-end-of-a-gathering' — that is the longer wording with 'Allahumma' and the shahadah (W167).
- W154: WYN shows no count for this item; the hadith mentions 100 times in one sitting (put in description, repeat_count null). Distinct from W166 (ending at-Tawwabul-Ghafur, count 100).
- W155: Not merged with 'salah-between-the-two-prostrations' (longer seven-part wording).
- W156: Kept separate from 'repentance-general-seeking-of-forgiveness' (Tirmidhi 3577 wording with 'al-'Azim'); WYN lists both as separate items (W156, W158). That published row currently carries WYN-0125 in wyn_ids — see W158 correction.
- W156: WYN-0131 also cites AD 1517 but is a different dua (as printed; book note) — not linked.
- W157: Arabic not verified against a primary corpus; no Six-Books parallel found ('استهديك لارشد امري').
- W157: Cleaned WYN text: 'وَاَعُوْذُبِكَ' spaced to 'وَاَعُوْذُ بِكَ'; 'لِاَرْشَدَ' changed to 'لِاَرْشَدِ' (genitive as first term of idafa) — reviewer to confirm.
- W157: WYN prints no grade for Ahmad 16269; no matching WYN book entry (app-only item).
- W158: Corpus Tirmidhi 3577 reads 'الْحَىَّ الْقَيُّومَ' (accusative, as an attribute of Allah); row has nominative 'الْحَيُّ الْقَيُّومُ' as WYN does — both readings are known; not changed.
- W158: Suggested wyn_ids change on repentance-general-seeking-of-forgiveness: ["WYN-0127"] — WYN-0125 is Abu Dawud 1517 (wording without 'al-'Azim'), now its own row (W156); this row's text matches Tirmidhi 3577 / WYN-0127 only.
- W159: Arabic not verified against a primary corpus; no Six-Books parallel with this exact wording found ('وارحمني وتب علي'). Only spacing cleaned ('اغْفِرْلِیْ' → 'اغْفِرْ لِیْ').
- W160: Arabic not verified against a primary corpus; no Six-Books parallel found ('ما اخطات وما تعمدت').
- W160: WYN text repeats 'وَ مَا تَعَمَّدْتُّ' twice (2nd and last phrase); WYN book title ends at 'wa ma jahiltu'. Possible copying error (last phrase may be 'وَمَا عَلِمْتُ') — reviewer must check Musnad Ahmad 19925. Translation follows the text as printed.
- W161: Arabic not verified against a primary corpus.
- W161: The Healing-collection placement cites Abu Dawud 5054 (al-Albani Sahih), but that bedtime narration reads 'اللَّهُمَّ اغْفِرْ لِي ذَنْبِي وَأَخْسِئْ شَيْطَانِي وَفُكَّ رِهَانِي وَاجْعَلْنِي فِي النَّدِيِّ الأَعْلَى' (adds 'dhanbi', 'akhsi'', no 'wa thaqqil mizani'), so it is not the same wording; WYN text (Hakim) kept.
- W162: Corpus spells 'وَخَطَاىَ' where WYN has 'وَخَطَئِیْ' (variant readings); corpus kept.
- W163: WYN app item has no reference; located via find.mjs in Tirmidhi 3551 (also Abu Dawud 1510, Ibn Majah 3830; al-Albani Sahih, Tirmidhi hasan sahih).
- W163: WYN wording differs from the corpus: opens 'اللّٰهُمَّ اجْعَلْنِیْ ذَكَّارًا لَكَ شَكَّارًا لَكَ' (order swapped), omits 'لَكَ رَهَّابًا', and orders 'وَاهْدِ قَلْبِىْ وَسَدِّدْ لِسَانِىْ'. Corpus wording used; reviewer may prefer WYN's form (would then be wyn_app).
- W163: hadith_grade left null (WYN prints none).
- W164: Arabic not verified against a primary corpus. Nearest Six-Books parallel: Tirmidhi 3504 ('Ali; words for which Allah forgives) — different order and no 'Rabb as-samawat as-sab'', graded Da'if (al-Albani, Shakir); not used.
- W164: WYN places this in 'Supplications for Forgiveness' but labels it 'Tasbeeh'; WYN prints no grade. No matching WYN book entry (app-only item).
- W165: Arabic not verified against a primary corpus. Parallels (Shaddad ibn Aws): Nasa'i 1304 and Tirmidhi 3407 — both lack 'مُوجِبَاتِ رَحْمَتِكَ وَعَزَائِمَ مَغْفِرَتِكَ' and are graded Da'if by al-Albani; WYN (Tabarani) wording kept.
- W165: Fixed one WYN typo: 'اَساَلُكَ' → 'اَسْاَلُكَ' (missing sukun).
- W167: Text matches Abu Dawud 4859 (and Tirmidhi 3433) exactly. Optional (not a defect): add hadith_number 4859 / 'Sunan Abi Dawud 4859' and WYN grade 'Hasan Sahih' to the row's source fields.

</details>

### 17. Relief from Sorrow and Distress — `relief-from-distress`

WYN app: **16** · printed book: **15** · IqraSpace before: **0 published**, 10 draft · after review: **16** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Talqin — instructing the dying | Muslim |  | existing (published) | unchecked | `sickness-talqin-instructing-the-dying` |
| 2 | Relief from distress: no might nor power except with Allah | Sahih at-Targhib wat-Tarhib 1580 (vol. 2) |  | new → review | needs_review | `wyn-la-hawla-wa-la-quwwata-illa-billah` |
| 3 | Allah is sufficient for us, the best Disposer of affairs | Sahih al-Bukhari 4563; Qur'an 3:173 |  | new → review | unchecked | `wyn-hasbunallahu-wa-nimal-wakil` |
| 4 | Sorrow: I complain of my grief only to Allah | Qur'an 12:86 |  | WYN stub filled → review | unchecked | `wyn-0147-innama-ashku-bath-thi-wa-huzni-ilallah` |
| 5 | Forgiveness, mercy, well-being and provision | Sahih Muslim 6851 |  | new → review | unchecked | `wyn-allahummaghfir-li-warhamni-wa-afini-warzuqni` |
| 6 | Dua of Yunus, in the belly of the whale | Qur'an 21:87 |  | existing (published) | verified | `anxiety-dua-of-yunus-in-the-belly-of-the-whale` |
| 7 | For relief from hardship | Ahmad |  | existing (published) | unchecked | `anxiety-for-relief-from-hardship` |
| 8 | In distress: Allah, Allah is my Lord | Sunan Abi Dawud 1525 |  | new → review | unchecked | `wyn-allahu-allahu-rabbi-la-ushriku` |
| 9 | In distress: O Ever-Living, by Your mercy I seek help | Jami' at-Tirmidhi 3524 |  | new → review | unchecked | `wyn-ya-hayyu-ya-qayyum-bi-rahmatika-astaghith` |
| 10 | Relief: forgive us and him, and relieve us of him | al-Tarikh al-Kabir (al-Bukhari) 308 |  | new → review | needs_review | `wyn-allahummaghfir-lana-wa-lahu-wa-arihna-minhu` |
| 11 | In distress: no god but Allah, the Magnificent, the Forbearing | Sahih al-Bukhari 6346 |  | new → review | unchecked | `wyn-la-ilaha-illallahul-azimul-halim` |
| 12 | For anxiety and sorrow | Bukhari |  | existing (published) | needs_review | `anxiety-for-anxiety-and-sorrow` |
| 13 | In distress: Your mercy I hope for | Sunan Abi Dawud 5090 |  | new → review | unchecked | `wyn-allahumma-rahmataka-arju` |
| 14 | In distress: no god but Allah, the Forbearing, the Generous | al-Mustadrak (al-Hakim) 1916 |  | new → review | needs_review | `wyn-la-ilaha-illallahul-halimul-karim-tabarakallah` |
| 15 | For grief and anxiety: I am Your servant | Musnad Ahmad 3712 |  | new → review | needs_review | `wyn-allahumma-inni-abduka-ibnu-abdika` |
| 16 | Salutations on the Prophet after tashahhud (Salat Ibrahimiyyah, ch.23) | Bukhari |  | existing (published) | unchecked | `salah-salutations-on-the-prophet-after-tashahhud-salat-ibrahimiyyah-ch` |

**Already in this category but not in WYN (kept, listed after WYN's sequence):** `wyn-0143-la-ilaha-illallah` (draft), `wyn-0149-ya-hayyu-ya-qayyumu-bi-rahmatika-astaghith` (draft), `wyn-0144-la-hawla-wa-la-quwwata-illa-billah` (draft), `wyn-0154-la-ilaha-illallahul-azimul-halimu-la-ilaha-illal` (draft), `wyn-0148-allahu-allahu-rabbi-la-ushriku-bihi-shaian` (draft), `wyn-0153-allahumma-rahmataka-arju-fala-takilni-ila-nafsi` (draft), `wyn-0156-allahumma-inni-abduka-ibnu-abdika-ibnu-amatika-n` (draft), `wyn-0142-astaghfirullah` (draft), `wyn-0155-la-ilaha-illallahul-halimul-karimu-subhanallahi` (draft)

**Proposed corrections to published rows (3 Duas, opt-in):**
- `anxiety-for-relief-from-hardship`: source_collection, source_reference, hadith_number, hadith_grade — Row cites 'Musnad Ahmad' with no number; WYN prints Sahih Ibn Hibban 974.
- `anxiety-for-anxiety-and-sorrow`: arabic, translation_en, translation_ur, transliteration_latin, transliteration_telugu, source_reference, hadith_number — The published text stops before 'wa ḍala'i-d-dayn wa ghalabati-r-rijāl'. The full wording is from corpus Bukhari 6369 (CONTAINED).
- `salah-salutations-on-the-prophet-after-tashahhud-salat-ibrahimiyyah-ch`: source_reference, hadith_number — The row only says 'Bukhari'. WYN prints Bukhari 3370 (Kitab Ahadith al-Anbiya'), and the corpus confirms the wording there.

<details><summary>Unresolved verification issues (24)</summary>

- W168: Arabic not verified against the cited narration (Silsilah not in corpus); the phrase itself is standard.
- W168: Not reused 'sickness-talqin-instructing-the-dying' despite identical wording: that row's translations and source (Muslim, talqin of the dying) are occasion-specific and would be wrong in Relief from Distress.
- W168: Description is generic; reviewer should add the context of Silsilah 1932 (not available to me).
- W168: Same Arabic as existing row sickness-talqin-instructing-the-dying (published); reused it instead of inserting a duplicate.
- W169: Cited source (Sahih at-Targhib 1580) not in corpus; exact phrase is CONTAINED in Bukhari 6384 ('a treasure of the treasures of Paradise'), noted in description. The distress-specific virtue of Targhib 1580 could not be checked — reviewer to confirm description.
- W169: Not reused 'home-leaving-the-home' (longer leaving-home dua that contains this phrase). WYN prints no grade; no matching WYN book entry.
- W171: Draft held the whole ayah (incl. 'qala' and 'wa a'lamu mina-llahi ma la ta'lamun'); WYN shows only the supplication portion, so it becomes a quran_excerpt.
- W172: Book candidate WYN-0149 ('Ya Hayyu ya Qayyum bi rahmatika astaghith') shares the Muslim 6851 reference but is a different dua — not linked; the book's reference for WYN-0149 may itself be misprinted.
- W173: Book candidate WYN-0093 (Q 21:83, du'a of Ayyub) is a different Dua and was not mapped here.
- W174: Ibn Hibban is not in the corpus; the published Arabic is not verified against a primary corpus.
- W174: Word order differs: the row has 'تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا', WYN has 'تَجْعَلُ الْحَزْنَ سَهْلًا اِذَا شِئْتَ'. Both orders circulate; the reviewer should confirm against Ibn Hibban 974.
- W174: I could not confirm that this hadith is in Musnad Ahmad, so the row's current 'Ahmad' attribution is doubtful.
- W176: Book candidate WYN-0146 shares the reference Tirmidhi 3524 but its title is 'Allahummaghfirli warhamni...', a different Dua, so it was not mapped.
- W176: Tirmidhi himself calls the chain gharib; the corpus grades are Hasan (Albani, Zubair Ali Zai).
- W177: Arabic not verified against a primary corpus (al-Tarikh al-Kabir is not in the corpus).
- W177: The occasion is unclear: WYN gives no context and I could not identify who 'him' (lahu/minhu) refers to, so 'minhu' could also be read as 'from it'. The translation is literal; a reviewer should supply the context.
- W177: Closest corpus parallel is Nasa'i 1825 ('اللَّهُمَّ اغْفِرْ لَنَا وَلَهُ وَأَعْقِبْنِي مِنْهُ عُقْبَى حَسَنَةً', on the death of Abu Salamah), which is a different wording and was not used.
- W179: The row's own review note already flagged the truncation. The corrections use the corpus word order ('al-jubni wal-bukhl'), so the row's 'wal-bukhli wal-jubn' order changes.
- W180: Grades differ. WYN's app prints Sahih, but the corpus grades Abu Dawud 5090 'Hasan Isnaad' (Albani) and Da'if (Zubair Ali Zai), and the WYN book lists the same number as Hasan for WYN-0014/0015.
- W180: Book candidates WYN-0014 and WYN-0015 share the reference but are different Duas from the same hadith, so they were not mapped.
- W181: Arabic not verified against a primary corpus (al-Hakim is not in the corpus, and find.mjs found no Six Books parallel).
- W182: Arabic not verified against a primary corpus (Musnad Ahmad is not in the corpus, and find.mjs found no Six Books parallel).
- W182: The book inventory WYN-0156 also lists 'Jami' at-Tirmidhi 2457 [Hasan]'. Corpus Tirmidhi 2457 is a different hadith (Ubayy ibn Ka'b), not this Dua.
- W183: WYN places this Durood in the Relief from Sorrow and Healing categories. The row's title is salah-specific (after tashahhud), so the reviewer may want a more general title.

</details>

### 18. Accepted Supplications — `maqbool-duain`

WYN app: **6** · printed book: **6** · IqraSpace before: **1 published**, 5 draft · after review: **6** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | The four words most beloved to the Prophet ﷺ | Sahih Muslim 6847 |  | new → review | unchecked | `wyn-subhanallah-walhamdulillah-wallahu-akbar` |
| 2 | Dua of Yunus, in the belly of the whale | Qur'an 21:87 |  | existing (published) | verified | `anxiety-dua-of-yunus-in-the-belly-of-the-whale` |
| 3 | Opening a request: O Originator of the heavens | al-Adab al-Mufrad 705 |  | new → review | needs_review | `wyn-ya-badias-samawat-ya-hayyu-ya-qayyum` |
| 4 | Asking by Allah's greatest name: the One, the Self-Sufficient | Jami' at-Tirmidhi 3475 |  | new → review | unchecked | `wyn-asaluka-bi-anni-ashhadu-annaka-antallah` |
| 5 | Asking by Allah's greatest name: the Bestower, Originator of the heavens | Sunan Abi Dawud 1495 |  | new → review | unchecked | `wyn-asaluka-bi-anna-lakal-hamd-al-mannan` |
| 6 | Waking in the night: tahlil, praise and asking forgiveness | Sahih al-Bukhari 1154 |  | new → review | needs_review | `wyn-waking-at-night-la-ilaha-illallah-then-forgiveness` |

**Already in this category but not in WYN (kept, listed after WYN's sequence):** `wyn-0157-subhanallahi-wal-hamdulillahi-wa-la-ilaha-illall` (draft), `wyn-0162-la-ilaha-illallahu-wahdahu-la-sharika-lahu-alham` (draft), `wyn-0159-ya-badias-samawati-ya-hayyu-ya-qayyumu-inni-asal` (draft), `wyn-0161-allahumma-inni-asaluka-bi-anna-lakal-hamda-la-il` (draft), `wyn-0160-allahumma-inni-asaluka-bi-anni-ash-hadu-annaka-a` (draft)

<details><summary>Unresolved verification issues (7)</summary>

- W173: Book candidate WYN-0093 (Q 21:83, du'a of Ayyub) is a different Dua and was not mapped here.
- W184: WYN also cites al-Silsilah al-Sahihah 2714 (not in the corpus) for the Healing placement.
- W185: Arabic not verified against a primary corpus (al-Adab al-Mufrad is not in the corpus).
- W185: A longer, related wording containing 'يا حي يا قيوم إني أسألك' is at Nasa'i 1300. It was not substituted because it is a different, longer text.
- W186: The WYN app prints the Sahih grade only in its Urdu reference. Tirmidhi calls it hasan gharib; the corpus grades are Sahih (Albani, Shakir, Zubair Ali Zai).
- W188: Arabic is assembled from bukhari 1154 (100% of its wording occurs there) rather than one verbatim excerpt — check the wording.
- W188: Same Arabic as wyn-waking-at-night-la-ilaha-illallah-then-forgiveness (from W045); merged into that row.

</details>

### 19. After Salah — `after-salah`

WYN app: **25** · printed book: **15** · IqraSpace before: **2 published**, 7 draft · after review: **23** in WYN order (+2 WYN entries not representable — see below).

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Allahu Akbar: after the prayer and on a journey | Sahih al-Bukhari 842; Jami' at-Tirmidhi 3446; Sahih al-Bukhari 2994 |  | new → review | needs_review | `wyn-allahu-akbar-after-salah-and-travel` |
| 2 | I seek Allah's forgiveness | al-Mu'jam al-Awsat (at-Tabarani) 3749 (vol. 4); Sahih Muslim 1334 | 3 | WYN stub filled → review | unchecked | `wyn-0024-astaghfirullah` |
| 3 | After salah: You are Peace | Sahih Muslim 1334 |  | new → review | unchecked | `wyn-allahumma-antas-salam-after-salah` |
| 4 | After salah: help me remember, thank and worship You well | Sunan an-Nasa'i 1303 |  | new → review | unchecked | `wyn-rabbi-ainni-ala-dhikrika-wa-shukrika` |
| 5 | After salah: protect me from Your punishment | Sahih Muslim 1642 |  | new → review | needs_review | `wyn-rabbi-qini-adhabaka-yawma-tabathu` |
| 6 | Tasbih 33, Tahmid 33, Takbir 34 | Sahih Muslim 1349; Sahih al-Bukhari 5361 | 100 | WYN stub filled → review | unchecked | `wyn-0172-subhan-allah-33-alhamdulillah-33-allahu-akbar-34` |
| 7 | The best dua, on the Day of Arafah | Tirmidhi | 10 | existing (published) | unchecked | `hajj-the-best-dua-on-the-day-of-arafah` |
| 8 | After salah: none can withhold what You give | Sahih al-Bukhari 6330 |  | new → review | unchecked | `wyn-after-salah-la-mania-lima-atayta` |
| 9 | After salah: His is the blessing and the bounty | Sahih Muslim 1343 |  | new → review | unchecked | `wyn-after-salah-la-hawla-wala-quwwata-lahun-nimah` |
| 10 | After salah: forgive me what I did before and after | Sunan Abi Dawud 760 |  | new → review | unchecked | `wyn-after-salah-allahummaghfir-li-ma-qaddamtu` |
| 11 | Forgive my sin, ease my affair, bless my provision | Musannaf Ibn Abi Shaybah 3047 |  | new → review | needs_review | `wyn-allahummaghfir-li-dhanbi-wa-yassir-li-amri` |
| 12 | After salah: refuge from cowardice, frail old age and the grave | Sahih al-Bukhari 2822 |  | new → review | unchecked | `wyn-after-salah-audhu-bika-minal-jubn` |
| 13 | After salah: refuge from the grave, the Fire, trials and the Dajjal | Musnad Ahmad 2778 |  | new → review | needs_review | `wyn-after-salah-audhu-bika-min-fitnatil-awar` |
| 14 | Takbir and tahlil 'by the number of the even and the odd' | Musannaf Ibn Abi Shaybah 29866 | 3 | new → review | needs_review | `wyn-after-salah-adadash-shafi-wal-witr` |
| 15 | Ayat al-Kursi | Qur'an 2:255 |  | existing (published) | needs_review | `ayat-al-kursi` |
| 16 | Surah al-Ikhlas | Qur'an 112:1-4 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-al-ikhlas` |
| 17 | Surah al-Falaq | Qur'an 113:1-5 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-al-falaq` |
| 18 | Surah an-Nas | Qur'an 114:1-6 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-an-nas` |
| 19 | Supplication for light | Sahih al-Bukhari 6316 |  | new → review | unchecked | `wyn-dua-for-light-allahumma-ijal-fi-qalbi-nuran` |
| 20 | After Fajr: 100 tasbih and 100 tahlil | Sunan an-Nasa'i 1354 | 200 | new → review | needs_review | `wyn-after-fajr-100-tasbih-100-tahlil` |
| 21 | For beneficial provision, after Fajr | Ibn Majah |  | existing (published) | unchecked | `market-for-beneficial-provision-after-fajr` |
| 23 | After Fajr and Maghrib: tahlil ten times (He gives life and death) | Jami' at-Tirmidhi 3534; Sahih al-Targhib wa al-Tarhib 472 | 10 | new → review | unchecked | `wyn-after-fajr-maghrib-yuhyi-wa-yumit-10x` |
| 24 | After Fajr and Maghrib: tahlil ten times (in His hand is all good) | Sahih al-Targhib wa al-Tarhib 475 | 10 | new → review | needs_review | `wyn-after-fajr-maghrib-biyadihil-khayr-10x` |

**Not added (2):**
- WYN #22 (`AfterSalah-23`): WYN lists this Dua twice in this category (repeat of position 7); a Dua can appear once per category here
- WYN #25 (`AfterSalah-22`): WYN lists this Dua twice in this category (repeat of position 23); a Dua can appear once per category here

**Already in this category but not in WYN (kept, listed after WYN's sequence):** `wyn-0168-la-ilaha-illallahu-wahdahu-la-sharika-lahu-allah` (draft), `wyn-0171-allahumma-inni-audhu-bika-minal-jubni-wa-audhu-b` (draft), `wyn-0166-rabbi-ainni-ala-dhikrika-wa-shukrika-wa-husni-ib` (draft), `wyn-0163-allahu-akbar` (draft), `wyn-0169-allahummaghfirli-ma-qaddamtu-wa-ma-akh-khartu-wa` (draft), `wyn-0170-la-ilaha-illallahu-wahdahu-la-sharika-lahu-la-ha` (draft), `salah-general-remembrance-after-the-salam` (published)

**Proposed corrections to published rows (1 Duas, opt-in):**
- `market-for-beneficial-provision-after-fajr`: source_reference, hadith_number, hadith_grade — The row only says 'Ibn Majah'; WYN prints Ibn Majah 925, and the corpus confirms the wording there.

<details><summary>Unresolved verification issues (50)</summary>

- W003: WYN cites al-Mu'jam al-Kabir (at-Tabarani) 541 and 7532 (not in corpus) for the morning/evening and after-salah practice; existing row only cites Qur'an 2:255.
- W003: Existing row has title_ur null — admin may want to add 'آیت الکرسی'.
- W004: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W004: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W004: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W004: WYN also cites Sahih Muslim 1886 and Bukhari 5017 for Surah al-Ikhlas (virtue / bedtime recitation).
- W005: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W005: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W005: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W005: WYN also cites Bukhari 5017 and Sunan an-Nasa'i 5439 (virtue of al-Falaq) — both checked in corpus and relevant.
- W006: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W006: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W006: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W006: WYN also cites Bukhari 5017 and Sunan an-Nasa'i 5439; Nasa'i 5439 names only al-Falaq.
- W021: The 100-times morning practice rests on al-Mu'jam al-Awsat 3749 (not in corpus); the wording itself is verified in Muslim 1334.
- W021: After-Salah placement uses count 3 (Muslim 1334); WYN-0136/WYN-0164 (Astaghfirullah thrice after salah) are already attached to published row salah-general-remembrance-after-the-salam, which combines it with 'Allāhumma anta-s-salām…'. Not re-attached here.
- W021: Another stub wyn-0142-astaghfirullah (WYN-0142) has the same wording — possible duplicate to reconcile in another batch.
- W029: Muslim 1349 and Bukhari 5361 give only the counts (tasbīḥah/taḥmīdah/takbīrah), not the spoken words; the words were verified from Bukhari 843. WYN's app shows them as three lines without 'wa'.
- W029: WYN shows a placement count of 100 (total of 33+33+34); repeat_count left null because a single counter of 100 would misrepresent the split — the split is in the description.
- W189: WYN's English reference prints Bukhari 843 and its Urdu reference prints 842. The takbir at the end of the prayer is at Bukhari 842; 843 is the 33x tasbih hadith.
- W189: The repeat count differs by placement (After Salah: once; Travelling #8: 3x; Travelling #15: on climbing), so repeat_count is left null.
- W189: One row serves three different occasions; the reviewer may prefer to split it.
- W190: Corpus Muslim 1334 reads 'تَبَارَكْتَ ذَا الْجَلاَلِ' without 'يَا'; Muslim 1335 notes the 'يَا ذَا' variant (Ibn Numayr). WYN's wording with 'يَا' was verified at Tirmidhi 300 / Abu Dawud 1512 instead.
- W190: Overlap: the published row salah-general-remembrance-after-the-salam (wyn_ids WYN-0136/0164/0165) combines 'Astaghfirullah x3' with this Dua. It was kept separate to mirror WYN's separate items; the reviewer may prefer reuse.
- W191: WYN prints Nasa'i 1304, but the text is at Nasa'i 1303. Nasa'i 1304 is a different dua (Shaddad ibn Aws, graded Da'if). A parallel with 'Allahumma' is at Abu Dawud 1522.
- W192: The corpus reads 'يَوْمَ تَبْعَثُ - أَوْ تَجْمَعُ - عِبَادَكَ' (the narrator's doubt between 'resurrect' and 'gather'). WYN's 'tab'athu' reading is used.
- W192: This is not the same Dua as the published row sleep-seeking-protection-through-the-night, which opens with 'Allahumma' instead of 'Rabbi' and belongs to a different occasion.
- W192: Arabic is assembled from muslim 1642 (89% of its wording occurs there) rather than one verbatim excerpt — check the wording.
- W193: al-Silsilah al-Sahihah is not in the corpus. The wording is verified at Muslim 1343 (also Bukhari 6330), but the 10x-after-salah virtue itself is not verified.
- W193: Possible reuse: the published rows hajj-the-best-dua-on-the-day-of-arafah and hajj-atop-safa-and-marwa have the same wording (sim 0.95). They were not reused because their titles and translation are Arafah-specific; the reviewer may prefer to generalise one of them instead.
- W193: Same Arabic as existing row hajj-the-best-dua-on-the-day-of-arafah (published); reused it instead of inserting a duplicate.
- W196: WYN reads 'أَنْتَ الْمُقَدِّمُ وَأَنْتَ الْمُؤَخِّرُ'; the corpus Abu Dawud 760 has 'أَنْتَ الْمُقَدِّمُ وَالْمُؤَخِّرُ' (no second 'anta'). The corpus wording is used.
- W197: Arabic not verified against a primary corpus (the Musannaf is not in the corpus, and find.mjs found no Six Books parallel).
- W197: WYN's label for this placement is 'For Forgiveness Of Sins', although it sits in After Salah #11.
- W199: Arabic not verified against a primary corpus (Musnad Ahmad is not in the corpus, and find.mjs found no Six Books parallel for 'فتنة الأعور الكذاب').
- W199: The book has this Dua twice: WYN-0173 (After Salah) and WYN-0041 (Protection section). Both are listed.
- W200: Arabic not verified against a primary corpus (the Musannaf is not in the corpus, and find.mjs found nothing for 'عدد الشفع والوتر').
- W200: WYN prints no grade, and I could not verify whether this narration is from the Prophet ﷺ or from a Companion/Successor. The reviewer should check before publishing.
- W200: WYN shows each phrase written out three times. I set repeat_count = 3 to mean three times per phrase; please confirm.
- W200: No book candidate matched (wyn_ids empty).
- W201: WYN prints Nasa'i 1355, which is a different hadith (the Prophet ﷺ counting tasbih on his hand). The 100 tasbih + 100 tahlil after Fajr hadith is Nasa'i 1354.
- W201: Corpus grades for Nasa'i 1354: 'Sahih Isnaad' (Albani, Abu Ghuddah), Da'if (Zubair Ali Zai).
- W201: WYN's placement count is 200 (100 + 100). I set repeat_count = 100 to mean 100 per phrase, as explained in the description; please confirm.
- W202: Corpus grades for Ibn Majah 925: Sahih (Albani), Da'if (Zubair Ali Zai).
- W203: WYN uses this in two placements: #23 'After Fajr and Asr' (Sahih al-Targhib 472, not in corpus) and #25 'After Maghrib' (Tirmidhi 3534). The after-Fajr version in the corpus is Tirmidhi 3474 (Da'if per Albani and Shakir); I found no corpus support for the 'after Asr' timing.
- W203: Corpus grades for Tirmidhi 3534: Hasan / Hasan Sahih. WYN prints no grade.
- W203: The published rows hajj-* lack 'yuhyi wa yumit', and market-entering-the-marketplace adds further phrases, so none of them is the same Dua.
- W203: No book candidate matched (wyn_ids empty).
- W204: Sahih al-Targhib is not in the corpus. The Six Books parallel, Ibn Majah 3799 (same wording, after Fajr), gives no count and is graded Da'if by all graders in the corpus.
- W204: No book candidate matched (wyn_ids empty).

</details>

### 20. Seeking Divine Counsel — `istikhara`

WYN app: **1** · printed book: **1** · IqraSpace before: **0 published** · after review: **1** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Istikharah — seeking guidance in a decision | Bukhari |  | existing (published) | needs_review | `knowledge-istikharah-seeking-guidance-in-a-decision` |

<details><summary>Unresolved verification issues (2)</summary>

- W205: WYN prints Bukhari 1162, but the Istikhara hadith is Bukhari 1166 (also 6382, 7390); 1162 is about the two rak'ahs of Fajr. The existing row already cites 1166.
- W205: The existing row keeps the narrator's alternative '(أَوْ قَالَ عَاجِلِ أَمْرِي وَآجِلِهِ)' in parentheses, which WYN's text omits; that is acceptable. The row's Telugu transliteration is null.

</details>

### 21. Supplications for Travelling — `travel`

WYN app: **26** · printed book: **no matching section** · IqraSpace before: **6 published** · after review: **21** in WYN order (+5 WYN entries not representable — see below).

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | The traveler's farewell to those staying behind | Sunan Ibn Majah 2825 |  | new → review | unchecked | `wyn-traveler-astawdiukallah-alladhi-la-tadiu-wadaiuh` |
| 2 | The traveler's farewell to the one staying behind | Tirmidhi |  | existing (published) | unchecked | `travel-the-travelers-farewell-to-the-one-staying-behind` |
| 3 | The one staying behind, to the traveler | Tirmidhi |  | existing (published) | unchecked | `travel-the-one-staying-behind-to-the-traveler` |
| 4 | Bismillah | Abu Dawud, Tirmidhi, Ibn Majah |  | existing (published) | unchecked | `bismillah` |
| 5 | Upon sneezing, said by the sneezer himself | Bukhari |  | existing (published) | unchecked | `social-upon-sneezing-said-by-the-sneezer-himself` |
| 6 | When mounting a vehicle for travel | Muslim |  | existing (published) | unchecked | `travel-when-mounting-a-vehicle-for-travel` |
| 8 | Allahu Akbar: after the prayer and on a journey | Sahih al-Bukhari 842; Jami' at-Tirmidhi 3446; Sahih al-Bukhari 2994 | 3 | new → review | needs_review | `wyn-allahu-akbar-after-salah-and-travel` |
| 9 | On a journey: I have wronged myself, so forgive me | Jami' at-Tirmidhi 3446 |  | new → review | unchecked | `wyn-travel-subhanaka-inni-qad-zalamtu-nafsi` |
| 10 | On a journey: My Lord, forgive my sins | Jami' at-Tirmidhi 3446 |  | new → review | unchecked | `wyn-travel-rabbighfir-li-dhunubi` |
| 11 | The fuller traveling dua | Muslim |  | existing (published) | unchecked | `travel-the-fuller-traveling-dua` |
| 12 | Returning from a journey | Bukhari, Muslim |  | existing (published) | unchecked | `travel-returning-from-a-journey` |
| 13 | Boarding a vessel: in Allah's name is its course and anchorage | Qur'an 11:41 |  | new → review | unchecked | `wyn-bismillahi-majraha-wa-mursaha` |
| 14 | Traveller's dua at dawn | Sahih Muslim 6900 |  | WYN stub filled → review | unchecked | `wyn-0025-samia-samiun-bi-hamdillahi-wa-husni-balaihi-alai` |
| 16 | Travelling: glorifying Allah when going downhill | Sahih al-Bukhari 2994 |  | new → review | needs_review | `wyn-subhanallah-when-descending` |
| 18 | My Lord, grant me a truthful entry and a truthful exit | Qur'an 17:80 |  | new → review | unchecked | `wyn-rabbi-adkhilni-mudkhala-sidq` |
| 19 | On seeing a town you wish to enter | as-Silsilah as-Sahihah 2759 |  | new → review | needs_review | `wyn-entering-a-town-rabbas-samawatis-sab` |
| 20 | My Lord, let me land at a blessed place | Qur'an 23:29 |  | new → review | unchecked | `wyn-rabbi-anzilni-munzalan-mubarakan` |
| 21 | Seeking refuge at nightfall | Muslim |  | existing (published) | unchecked | `evening-seeking-refuge-at-nightfall` |
| 22 | On seeing someone afflicted with a trial | Jami' at-Tirmidhi 3432 |  | new → review | unchecked | `wyn-upon-seeing-someone-afflicted` |
| 23 | Entering the marketplace | Tirmidhi, Ibn Majah, al-Hakim |  | existing (published) | unchecked | `market-entering-the-marketplace` |
| 26 | Returning from a journey: turning back to our Lord | al-Mu'jam al-Kabir (at-Tabarani), vol. 11, no. 11735 |  | new → review | needs_review | `wyn-awban-awban-returning-from-journey` |

**Not added (5):**
- WYN #7 (`travel-11`): WYN lists this Dua twice in this category (repeat of position 5); a Dua can appear once per category here
- WYN #15 (`travel-22`): WYN lists this Dua twice in this category (repeat of position 8); a Dua can appear once per category here
- WYN #17 (`travel-24`): WYN lists this Dua twice in this category (repeat of position 4); a Dua can appear once per category here
- WYN #24 (`travel-15`): WYN lists this Dua twice in this category (repeat of position 11); a Dua can appear once per category here
- WYN #25 (`travel-34`): WYN lists this Dua twice in this category (repeat of position 12); a Dua can appear once per category here

**Already in this category but not in WYN (kept, listed after WYN's sequence):** `travel-entering-a-town-or-village` (published)

**Proposed corrections to published rows (3 Duas, opt-in):**
- `travel-the-travelers-farewell-to-the-one-staying-behind`: title, title_ur, source_reference, hadith_number — The row's title says it is the traveler's words to those staying behind, but in Tirmidhi 3443 it is said to the person setting out on a journey (Ibn 'Umar to a man about to travel). WYN labels it 'The Family's Supplication for the Traveler'.
- `travel-the-one-staying-behind-to-the-traveler`: arabic, transliteration_latin, transliteration_telugu, source_reference, hadith_number — Verified in three parts in corpus Tirmidhi 3444 (the hadith splits the dua across the man asking for more; each part CONTAINED). The corpus and WYN read 'حَيْثُمَا كُنْتَ'; the row has 'حَيْثُ كُنْتَ'.
- `travel-the-fuller-traveling-dua`: arabic, translation_en, translation_ur, transliteration_latin, transliteration_telugu, source_reference, hadith_number — The published 'fuller traveling dua' contains only 'Allahumma inna nas'aluka … ma tarda', a small part of the dua. The full text is from corpus Muslim 3275 (CONTAINED from 'subhana-lladhi' to the end); the three takbirs are described in the hadith ('kabbara thalathan').

<details><summary>Unresolved verification issues (38)</summary>

- W012: WYN cites Muslim 6880 (evening, scorpion sting) and Muslim 6878 (when stopping at a place) — both verified to contain the wording. WYN also lists it under Morning, Evil-eye, Travelling and Healing.
- W012: Published row source_reference is just 'Muslim' (hadith_number 6880).
- W022: Corpus vowels 'sammaʿa' (has made heard); WYN's app has 'samiʿa' (has heard) — both readings are reported by the commentators. Corpus wording used.
- W022: WYN places it in Morning (#22) and Travelling (#14).
- W138: Corpus grades for Tirmidhi 3432: Tirmidhi hasan gharib; al-Albani and Shakir Sahih; Zubair Ali Zai Da'if.
- W138: The travel placement (Urdu ref) cites Ibn Majah 3892 (Ibn 'Umar, same wording; al-Albani Hasan, Arna'ut very Da'if) — same dua, also shown under 'Supplications for Travelling'.
- W189: WYN's English reference prints Bukhari 843 and its Urdu reference prints 842. The takbir at the end of the prayer is at Bukhari 842; 843 is the 33x tasbih hadith.
- W189: The repeat count differs by placement (After Salah: once; Travelling #8: 3x; Travelling #15: on climbing), so repeat_count is left null.
- W189: One row serves three different occasions; the reviewer may prefer to split it.
- W206: WYN uses the plural 'أَسْتَوْدِعُكُمُ اللَّهَ' (addressing several people); Ibn Majah 2825 has the singular 'أَسْتَوْدِعُكَ اللَّهَ'. The corpus singular is used; the reviewer may prefer WYN's plural for addressing family.
- W206: Corpus grade: Sahih (Albani). WYN prints no grade.
- W207: Because this row's slug says 'travelers-farewell-to-the-one-staying-behind', the reviewer may want to rename the slug too. Slugs are kept as-is per the instructions.
- W208: The difference is minor ('haythu' vs 'haythuma', same meaning), so the translations need no change.
- W209: WYN has two Travelling placements: #4 when putting a foot in the stirrup (Tirmidhi 3446 / Abu Dawud 2602; Tirmidhi says three times) and #17 when the mount stumbles (Abu Dawud 4982, which is the reference WYN prints). Both are covered by this generic row.
- W209: WYN shows no label for this item.
- W210: WYN prints no reference for this item; Tirmidhi 3446 / Abu Dawud 2602 were identified as the source from WYN's travel sequence.
- W210: The repeat count differs by placement (#5 once, #7 3x), so repeat_count is left null.
- W210: Possible reuse: the published row social-upon-sneezing-said-by-the-sneezer-himself has the same wording, but its title is sneezing-specific, so it was not reused.
- W210: Same Arabic as existing row social-upon-sneezing-said-by-the-sneezer-himself (published); reused it instead of inserting a duplicate.
- W211: WYN cites Qur'an 43:13-14 (al-Zukhruf); the existing row cites only 'Muslim' with source_type hadith. The text is a partial excerpt of 43:13 plus 43:14, matching the wording within Muslim 3275 / Tirmidhi 3446. The reviewer may add quran_refs [43:13-14].
- W212: Abu Dawud 2602 has the same Dua without 'قَدْ'. Corpus grade for Tirmidhi 3446: Sahih (Albani). WYN prints no grade.
- W214: After this correction the row overlaps travel-when-mounting-a-vehicle-for-travel (W211), which holds the 'Subhana-lladhi…' part alone. WYN also lists that part separately, so both rows are kept.
- W214: WYN shows no label for this item.
- W215: WYN prints Bukhari 3085; the row cites 'Bukhari, Muslim' without numbers. The wording is confirmed in corpus Bukhari 3085 and Muslim 3275. Optionally add source_reference 'Sahih al-Bukhari 3085'.
- W216: Excerpt starts at 'bismillahi' (the ayah opens with 'And he said: Embark therein'), matching WYN's printed text. Note Hafs reads majrēhā with imāla.
- W217: Bukhari 2994 says 'when we descended we glorified (sabbahna)'; the literal words 'subhanallah' are not in the hadith text, so check.mjs cannot verify. Arabic basis wyn_app (trivially standard wording).
- W217: Companion hadith Bukhari 2993 has the same report (kabbarna/sabbahna).
- W218: Excerpt omits the ayah's opening 'wa qul' (And say), matching WYN's printed text; it is otherwise the whole of 17:80.
- W219: Arabic not verified against a primary corpus (Silsilah 2759; no Six-Books parallel found by find.mjs).
- W219: WYN's wording uses singular feminine verbs (azallat, aqallat, adharrat, adallat) and the order heavens/earths/winds/devils; the commonly cited narration (an-Nasa'i al-Kubra, Ibn Hibban, al-Hakim) reads azlalna, aqlalna, adlalna, dharayna with winds last and 'khayra hadhihil-qaryah wa khayra ahliha'. Scholar should confirm which wording to publish.
- W219: Related published row travel-entering-a-town-or-village holds only the second half (khayraha wa khayra ahliha ...); it is not the same wording, so a new row is proposed.
- W219: WYN prints no grade in the app reference; hadith_grade left null.
- W220: Excerpt omits the ayah's opening 'wa qul' (And say), matching WYN's printed text; it is otherwise the whole of 23:29.
- W221: Same wording as the published row (Tirmidhi 3428). WYN places it in Travelling and in Healing (Allah's Praise); category placement only.
- W221: Tirmidhi 3428 corpus grades: Hasan (Shakir, al-Albani, Bashar Awad); Daif (Zubair Ali Zai). WYN prints no grade in the app.
- W221: Optional: the published row has no hadith_number; could be set to Jami' at-Tirmidhi 3428 (not a defect, so no correction proposed).
- W222: Arabic not verified against a primary corpus (Tabarani); find.mjs found no Six-Books parallel for 'la yughadiru alayna hawban'.
- W222: WYN prints no grade; hadith_grade null.

</details>

### 22. Supplications for Healing (Collection) — `shifa-collection`

WYN app: **194** · printed book: **no matching section** · IqraSpace before: **0 published** · after review: **172** in WYN order (+22 WYN entries not representable — see below).

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Glory and praise be to Allah (100 times) | Sahih Muslim 6843 | 100 | WYN stub filled → review | unchecked | `wyn-0023-subhanallahi-wa-bihamdihi` |
| 2 | The words Allah chose for His angels | Jami' at-Tirmidhi 3593 |  | new → review | unchecked | `wyn-subhana-rabbi-wa-bihamdihi` |
| 3 | The four words most beloved to the Prophet ﷺ | Sahih Muslim 6847 |  | new → review | unchecked | `wyn-subhanallah-walhamdulillah-wallahu-akbar` |
| 4 | Allah is the Greatest, truly great — praise abundantly | Sahih Muslim 1358 |  | WYN stub filled → review | unchecked | `wyn-0002-allahu-akbaru-kabira-n-w-wal-hamdulillahi-kathir` |
| 5 | Praise: the Most Generous, the Forbearing | Musnad Ahmad 726 |  | new → review | needs_review | `wyn-la-ilaha-illallahul-karimul-halim` |
| 6 | Praise: the Most High, the Magnificent | Musnad Ahmad 1363 |  | new → review | needs_review | `wyn-la-ilaha-illallahul-aliyyul-azim` |
| 7 | In distress: no god but Allah, the Magnificent, the Forbearing | Sahih al-Bukhari 6346 |  | new → review | unchecked | `wyn-la-ilaha-illallahul-azimul-halim` |
| 8 | The best dua, on the Day of Arafah | Tirmidhi |  | existing (published) | unchecked | `hajj-the-best-dua-on-the-day-of-arafah` |
| 9 | Entering the marketplace | Tirmidhi, Ibn Majah, al-Hakim |  | existing (published) | unchecked | `market-entering-the-marketplace` |
| 10 | Five declarations of Tawhid that Allah affirms | Jami' at-Tirmidhi 3430 |  | new → review | needs_review | `wyn-tahlil-allah-affirms-in-illness` |
| 11 | Glory to the Lord of might and dominion | Sunan Abi Dawud 873 |  | new → review | unchecked | `wyn-subhana-dhil-jabaruti-wal-malakut` |
| 12 | Short salutation on the Prophet ﷺ (Durood) | Sahih al-Bukhari 3370 (opening words); WYN cites Sunan an-Nasa'i 1293 |  | new → review | needs_review | `wyn-allahumma-salli-ala-muhammad-short-durood` |
| 13 | Durood: upon Muhammad, the unlettered Prophet | Sunan Abi Dawud 981 |  | new → review | unchecked | `wyn-durood-alan-nabiyyil-ummi` |
| 14 | Durood: upon Muhammad, his wives and descendants | Sahih al-Bukhari 3369 |  | new → review | unchecked | `wyn-durood-azwajihi-wa-dhurriyyatihi` |
| 15 | Salutations on the Prophet after tashahhud (Salat Ibrahimiyyah, ch.23) | Bukhari |  | existing (published) | unchecked | `salah-salutations-on-the-prophet-after-tashahhud-salat-ibrahimiyyah-ch` |
| 16 | Call upon Allah by His most beautiful names | Qur'an 7:180 |  | new → review | unchecked | `wyn-wa-lillahil-asmaul-husna` |
| 17 | O Possessor of Majesty and Honour | Jami' at-Tirmidhi 3525 |  | new → review | unchecked | `wyn-ya-dhal-jalali-wal-ikram` |
| 18 | In distress: O Ever-Living, by Your mercy I seek help | Jami' at-Tirmidhi 3524 |  | new → review | unchecked | `wyn-ya-hayyu-ya-qayyum-bi-rahmatika-astaghith` |
| 19 | Opening a request: O Originator of the heavens | al-Adab al-Mufrad 705 |  | new → review | needs_review | `wyn-ya-badias-samawat-ya-hayyu-ya-qayyum` |
| 20 | O Ever-Living, O Sustainer, by Your mercy I seek help | al-Mustadrak (al-Hakim) 2044 (vol. 2); Sahih at-Targhib wat-Tarhib 661 | 1 | WYN stub filled → review | needs_review | `wyn-0016-ya-hayyu-ya-qayyumu-bi-rahmatika-astaghithu-asli` |
| 21 | O Allah, You are Peace | Sahih Muslim 1334 |  | new → review | unchecked | `wyn-allahumma-antas-salam` |
| 22 | Calling upon Allah by His Greatest Name (al-Mannan) | Jami' at-Tirmidhi 3544 |  | new → review | unchecked | `wyn-allahumma-la-ilaha-illa-antal-mannan` |
| 23 | Asking by the Greatest Name: the One, the Self-Sufficient | Sunan Abi Dawud 1493 |  | new → review | unchecked | `wyn-allahumma-inni-asaluka-anni-ashhadu` |
| 24 | Asking Allah by His praise and Oneness (al-Mannan) | Sunan Ibn Majah 3858 |  | new → review | unchecked | `wyn-asaluka-bi-anna-lakal-hamd-wahdaka` |
| 25 | Lord of the heavens, Splitter of the seed: the First and the Last | Sahih Muslim 6889 |  | new → review | unchecked | `wyn-allahumma-rabbas-samawati-falikal-habb` |
| 26 | The Beautiful Names at the end of Surah al-Hashr | Qur'an 59:22-24 |  | new → review | unchecked | `wyn-al-hashr-22-24-beautiful-names` |
| 27 | Allah answered Yunus and saved him from distress | Qur'an 21:88 |  | new → review | unchecked | `wyn-fastajabna-lahu-wa-najjaynahu` |
| 28 | My Lord is with me; He will guide me | Qur'an 26:62 |  | new → review | unchecked | `wyn-inna-maiya-rabbi-sayahdin` |
| 29 | My Lord is near and responsive | Qur'an 11:61 |  | new → review | unchecked | `wyn-inna-rabbi-qaribun-mujib` |
| 30 | My Lord is Most Forgiving, Most Merciful | Qur'an 12:53 |  | new → review | unchecked | `wyn-inna-rabbi-ghafurun-rahim` |
| 31 | My Lord is Merciful and Loving | Qur'an 11:90 |  | new → review | unchecked | `wyn-inna-rabbi-rahimun-wadud` |
| 32 | My Lord hears supplication | Qur'an 14:39 |  | new → review | unchecked | `wyn-inna-rabbi-lasamiud-dua` |
| 33 | My Lord is Guardian over all things | Qur'an 11:57 |  | new → review | unchecked | `wyn-inna-rabbi-ala-kulli-shayin-hafiz` |
| 34 | My Lord is Free of need, Most Generous | Qur'an 27:40 |  | new → review | unchecked | `wyn-inna-rabbi-ghaniyyun-karim` |
| 35 | Allah has power over all things | Qur'an 2:20 |  | new → review | unchecked | `wyn-innallaha-ala-kulli-shayin-qadir` |
| 36 | Allah prevails in His affair | Qur'an 12:21 |  | new → review | unchecked | `wyn-wallahu-ghalibun-ala-amrihi` |
| 37 | Is Allah not sufficient for His servant? | Qur'an 39:36 |  | new → review | unchecked | `wyn-alaysallahu-bikafin-abdahu` |
| 38 | He is with you wherever you are | Qur'an 57:4 |  | new → review | unchecked | `wyn-wa-huwa-maakum-ayna-ma-kuntum` |
| 39 | Do not grieve; Allah is with us | Qur'an 9:40 |  | new → review | unchecked | `wyn-la-tahzan-innallaha-maana` |
| 40 | Never have I been disappointed in calling upon You | Qur'an 19:4 |  | new → review | unchecked | `wyn-wa-lam-akun-biduaika-rabbi-shaqiyya` |
| 41 | Who answers the distressed when he calls? | Qur'an 27:62 |  | new → review | unchecked | `wyn-amman-yujibul-mudtarra` |
| 42 | No one can withhold the mercy Allah opens | Qur'an 35:2 |  | new → review | unchecked | `wyn-ma-yaftahillahu-linnasi-min-rahmah` |
| 43 | Whatever afflicts you is from what you have earned | Qur'an 42:30 |  | new → review | unchecked | `wyn-wa-ma-asabakum-min-musibah` |
| 44 | No affliction strikes except by Allah's permission | Qur'an 64:11 |  | new → review | unchecked | `wyn-ma-asaba-min-musibatin-illa-biidhnillah` |
| 45 | Every affliction is written before it happens | Qur'an 57:22 |  | new → review | unchecked | `wyn-ma-asaba-fil-ardi-wa-la-fi-anfusikum` |
| 46 | Ease after hardship (Qur'an 65:7) | Qur'an 65:7 |  | new → review | unchecked | `wyn-ease-after-hardship-talaq` |
| 47 | Rely upon Allah, the sufficient Guardian | Qur'an 33:3 |  | new → review | unchecked | `wyn-rely-upon-allah-ahzab` |
| 48 | Allah suffices as the All-Knowing | Qur'an 4:70 |  | new → review | unchecked | `wyn-allah-suffices-as-knower` |
| 49 | Allah suffices as Protector and Helper | Qur'an 4:45 |  | new → review | unchecked | `wyn-allah-suffices-as-protector-and-helper` |
| 50 | Your Lord suffices as Guide and Helper | Qur'an 25:31 |  | new → review | unchecked | `wyn-your-lord-suffices-as-guide-and-helper` |
| 51 | Allah will suffice you against them | Qur'an 2:137 |  | new → review | unchecked | `wyn-allah-will-suffice-you-against-them` |
| 52 | I entrust my affair to Allah | Qur'an 40:44 |  | new → review | unchecked | `wyn-i-entrust-my-affair-to-allah` |
| 53 | Our Lord, upon You we rely | Qur'an 60:4 |  | new → review | unchecked | `wyn-rabbana-alayka-tawakkalna` |
| 54 | I have relied upon Allah, my Lord and your Lord | Qur'an 11:56 |  | new → review | unchecked | `wyn-inni-tawakkaltu-alallahi-rabbi` |
| 55 | Nothing befalls us except what Allah has decreed | Qur'an 9:51 |  | new → review | unchecked | `wyn-lan-yusibana-illa-ma-kataballah` |
| 56 | Allah is sufficient for us, the best Disposer of affairs | Sahih al-Bukhari 4563; Qur'an 3:173 |  | new → review | unchecked | `wyn-hasbunallahu-wa-nimal-wakil` |
| 57 | When overwhelmed by a matter | Abu Dawud |  | existing (published) | unchecked | `anxiety-when-overwhelmed-by-a-matter` |
| 58 | He is with you wherever you are | Qur'an 57:4 |  | new → review | unchecked | `wyn-he-is-with-you-wherever-you-are` |
| 59 | Whoever relies upon Allah, He suffices him | Qur'an 65:3 |  | new → review | unchecked | `wyn-whoever-relies-on-allah-he-suffices` |
| 60 | Allah provides for every creature | Qur'an 11:6 |  | new → review | unchecked | `wyn-no-creature-but-allah-provides` |
| 61 | Seek help through patience and prayer | Qur'an 2:153 |  | new → review | unchecked | `wyn-seek-help-through-patience-and-prayer` |
| 62 | Allah is with the patient | Qur'an 2:153 |  | new → review | unchecked | `wyn-allah-is-with-the-patient` |
| 63 | Allah loves the patient | Qur'an 3:146 |  | new → review | unchecked | `wyn-allah-loves-the-patient` |
| 64 | Be patient: Allah does not let the reward of the good be lost | Qur'an 11:115 |  | new → review | unchecked | `wyn-be-patient-allah-does-not-waste-reward` |
| 65 | The patient are rewarded without measure | Qur'an 39:10 |  | new → review | unchecked | `wyn-patient-rewarded-without-measure` |
| 66 | Our Lord, pour patience on us and let us die as Muslims | Qur'an 7:126 |  | new → review | unchecked | `wyn-rabbana-afrigh-alayna-sabran-wa-tawaffana` |
| 67 | Our Lord, pour patience on us and make our feet firm | Qur'an 2:250 |  | new → review | unchecked | `wyn-rabbana-afrigh-alayna-sabran-wa-thabbit` |
| 68 | With hardship comes ease | Qur'an 94:5-6 |  | new → review | unchecked | `wyn-with-hardship-comes-ease` |
| 69 | Do not despair of Allah's mercy | Qur'an 12:87 |  | new → review | unchecked | `wyn-do-not-despair-of-allahs-mercy` |
| 70 | I complain of my grief only to Allah | Qur'an 12:86 |  | new → review | unchecked | `wyn-innama-ashku-wa-alamu-minallah` |
| 71 | None removes harm but Allah | Qur'an 10:107 |  | new → review | unchecked | `wyn-if-allah-touches-you-with-harm` |
| 72 | In worry or hardship: Allah is my Lord, He has no partner | Sahih al-Jami' as-Saghir 6040 |  | new → review | needs_review | `wyn-allahu-rabbi-la-sharika-lah` |
| 73 | In distress: Allah, Allah is my Lord | Sunan Abi Dawud 1525 |  | new → review | unchecked | `wyn-allahu-allahu-rabbi-la-ushriku` |
| 74 | Dua of Yunus, in the belly of the whale | Qur'an 21:87 |  | existing (published) | verified | `anxiety-dua-of-yunus-in-the-belly-of-the-whale` |
| 75 | In worry: no might nor power except with Allah | Al-Mu'jam al-Awsat 6741 |  | new → review | needs_review | `wyn-la-hawla-wa-la-quwwata-illa-billah-al-aliyy` |
| 76 | Guide my heart, make my tongue upright, remove rancour | Sunan Abi Dawud 1510 (WYN cites Musnad Ahmad 1997) |  | new → review | needs_review | `wyn-ihdi-qalbi-wa-saddid-lisani` |
| 77 | For relief from hardship | Ahmad |  | existing (published) | unchecked | `anxiety-for-relief-from-hardship` |
| 78 | Dua for grief and anxiety: "I am Your servant..." | Musnad Ahmad 3712 |  | WYN stub filled → review | needs_review | `wyn-0156-allahumma-inni-abduka-ibnu-abdika-ibnu-amatika-n` |
| 79 | O Allah, make the Hereafter my concern |  |  | new → review | needs_review | `wyn-allahumma-ijal-hammi-al-akhirah` |
| 80 | When Satan prompts you: seek refuge in Allah (Fussilat 41:36) | Qur'an 41:36 |  | new → review | unchecked | `wyn-seek-refuge-when-satan-prompts-fussilat-36` |
| 81 | Ayyub's call: Satan has touched me with hardship | Qur'an 38:41 |  | new → review | unchecked | `wyn-anni-massaniya-ash-shaytan` |
| 82 | Satan has no authority over those who believe and rely on their Lord | Qur'an 16:99 |  | new → review | unchecked | `wyn-satan-has-no-authority-over-believers` |
| 83 | Refuge from the promptings of the devils (al-Mu'minun 23:97-98) | Qur'an 23:97-98 | 3 | WYN stub filled → review | unchecked | `wyn-0065-rabbi-audhubika-min-hamazatish-shayatin-wa-audhu` |
| 84 | Seeking refuge from Satan's goading, puffing and spittle | Sunan Abi Dawud 775 |  | WYN stub filled → review | unchecked | `wyn-0066-audhu-billahis-samiil-alimi-minash-shaitanir-raj` |
| 85 | Refuge in Allah's Noble Face and eternal authority from Satan | Sunan Abi Dawud 466 |  | WYN stub filled → review | unchecked | `wyn-0081-audhu-billahil-azimi-biwajhihil-karimi-wa-sultan` |
| 86 | Refuge from fright and the whispers of devils | Sunan Abi Dawud 3893 |  | new → review | unchecked | `wyn-audhu-bikalimatillah-min-ghadabihi` |
| 87 | When troubled by evil thoughts: praise Allah who reduced Satan's plot to whispering | Sunan Abi Dawud 5112 |  | new → review | unchecked | `wyn-allahu-akbar-radda-kaydahu-ilal-waswasah` |
| 88 | When doubts arise: 'He is the First and the Last' (al-Hadid 57:3) | Qur'an 57:3; Sunan Abi Dawud 5110 |  | new → review | unchecked | `wyn-huwal-awwalu-wal-akhiru-against-doubts` |
| 89 | When doubts are whispered: seek refuge in Allah | Sahih al-Bukhari 3276 |  | new → review | needs_review | `wyn-audhu-billah-against-doubts` |
| 90 | Against whispers about Allah's creation: 'I believe in Allah' | Sunan Abi Dawud 4721 |  | new → review | unchecked | `wyn-amantu-billah-against-whispers` |
| 91 | Surah an-Nas | Qur'an 114:1-6 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-an-nas` |
| 92 | Only the astray despair of their Lord's mercy | Qur'an 15:56 |  | new → review | unchecked | `wyn-who-despairs-of-his-lords-mercy` |
| 93 | He chooses for His mercy whom He wills | Qur'an 3:74 |  | new → review | unchecked | `wyn-he-chooses-for-his-mercy-whom-he-wills` |
| 94 | Ask Allah of His bounty | Qur'an 4:32 |  | new → review | unchecked | `wyn-ask-allah-of-his-bounty` |
| 95 | Asking for guidance, piety, chastity and contentment | Sahih Muslim 6904 |  | new → review | unchecked | `wyn-allahumma-inni-asalukal-huda-wat-tuqa` |
| 96 | Asking for mercy that guides the heart | Jami' at-Tirmidhi 3419 |  | new → review | unchecked | `wyn-allahumma-inni-asaluka-rahmatan-tahdi-biha-qalbi` |
| 97 | Asking for Allah's bounty and mercy | Al-Mu'jam al-Kabir 10379 |  | new → review | needs_review | `wyn-allahumma-inni-asaluka-min-fadlika-wa-rahmatik` |
| 98 | For a good outcome in all affairs | Musnad Ahmad 17628 |  | new → review | needs_review | `wyn-allahumma-ahsin-aqibatana` |
| 99 | In distress: Your mercy I hope for | Sunan Abi Dawud 5090 |  | new → review | unchecked | `wyn-allahumma-rahmataka-arju` |
| 100 | Ask Allah for well-being in this world and the next | Jami' at-Tirmidhi 3514 (WYN cites Al-Adab al-Mufrad 637) |  | new → review | needs_review | `wyn-ask-allah-for-afiyah` |
| 101 | The best supplication: well-being in this world and the next | Sunan Ibn Majah 3851 |  | new → review | unchecked | `wyn-allahumma-inni-asalukal-muafata` |
| 102 | Asking for pardon and well-being in this world and the next | Sunan Ibn Majah 2957 |  | new → review | unchecked | `wyn-asaluka-al-afwa-wal-afiyah-dunya-akhirah` |
| 103 | Seeking Laylat al-Qadr | Tirmidhi |  | existing (published) | unchecked | `fasting-seeking-laylat-al-qadr` |
| 104 | Forgive me, have mercy, guide, give well-being and provide | Sahih Muslim 6850 |  | new → review | unchecked | `wyn-allahummaghfir-li-warhamni-wahdini-wa-afini-warzuqni` |
| 105 | Well-being in body, hearing and sight | Sunan Abi Dawud 5090 | 3 | new → review | unchecked | `wyn-allahumma-afini-fi-badani` |
| 106 | Refuge from the loss of Allah's blessings and well-being | Sahih Muslim 6944 |  | new → review | unchecked | `wyn-refuge-from-loss-of-blessing-and-wellbeing` |
| 107 | Asking for well-being and protection from all sides | Sunan Abi Dawud 5074 | 1 | WYN stub filled → review | needs_review | `wyn-0018-allahumma-inni-asalukal-afiyata-fid-dunya-wal-ak` |
| 108 | Why not seek Allah's forgiveness? (27:46) | Qur'an 27:46 |  | new → review | unchecked | `wyn-law-la-tastaghfirunallah` |
| 109 | I seek Allah's forgiveness and repent to Him | Sahih al-Bukhari 6307 |  | new → review | unchecked | `wyn-astaghfirullah-wa-atubu-ilayh` |
| 110 | Forgiveness: I seek Allah's forgiveness, the Ever-Living | Sunan Abi Dawud 1517 |  | new → review | unchecked | `wyn-astaghfirullah-alladhi-la-ilaha-illa-huwa` |
| 112 | Musa's plea: I have wronged myself, so forgive me | Qur'an 28:16 |  | new → review | unchecked | `wyn-rabbi-inni-zalamtu-nafsi-faghfir-li` |
| 113 | Forgiveness: my Lord, forgive me and accept my repentance (at-Tawwab ar-Rahim) | Sunan Abi Dawud 1516 |  | new → review | unchecked | `wyn-rabbighfir-li-wa-tub-alayya-tawwabur-rahim` |
| 114 | Forgive, have mercy, mend, raise, provide and guide me | Musnad Ahmad 3514 |  | new → review | needs_review | `wyn-rabbighfir-li-warhamni-wajburni-warfani` |
| 115 | Forgiveness: drive away my devil, free me, make my scale heavy | al-Mustadrak al-Hakim 2026 (vol. 2) |  | new → review | needs_review | `wyn-wakhsa-shaytani-wa-fukka-rihani` |
| 116 | Forgive all my sins and guide me to good deeds and character | Sahih al-Jami' al-Saghir 2146 |  | new → review | needs_review | `wyn-ighfir-li-dhunubi-wa-khatayaya-anishni` |
| 117 | Sayyid al-Istighfar (master of seeking forgiveness) | Bukhari |  | existing (published) | unchecked | `morning-sayyid-al-istighfar-master-of-seeking-forgiveness` |
| 118 | Comprehensive plea for forgiveness of all faults | Sahih al-Bukhari 6398 |  | new → review | unchecked | `wyn-rabbighfir-li-khatiati-wa-jahli` |
| 119 | Seeking refuge at nightfall | Muslim |  | existing (published) | unchecked | `evening-seeking-refuge-at-nightfall` |
| 120 | Refuge in Allah's perfect words from devils, vermin and the evil eye | Sahih al-Bukhari 3371 |  | new → review | unchecked | `wyn-audhu-bi-kalimatillahit-tammah-evil-eye` |
| 121 | Protection | Abu Dawud, Tirmidhi | 3 | existing (published) | unchecked | `morning-protection` |
| 122 | Entering the toilet | Bukhari, Muslim |  | existing (published) | unchecked | `dressing-entering-the-toilet` |
| 123 | Refuge from leprosy, insanity and evil diseases | Sunan Abi Dawud 1554 |  | new → review | unchecked | `wyn-refuge-from-leprosy-insanity-and-evil-diseases` |
| 124 | Refuge from severe affliction, misery, an evil decree and gloating enemies | Sahih al-Bukhari 6347 (also 6616) |  | new → review | needs_review | `wyn-refuge-from-hardship-of-affliction-and-gloating-enemies` |
| 125 | For anxiety and sorrow | Bukhari |  | existing (published) | needs_review | `anxiety-for-anxiety-and-sorrow` |
| 126 | Refuge from an evil day, night, hour, companion and neighbour | al-Mu'jam al-Kabir (at-Tabarani), vol. 17, 810; Sahih al-Jami' as-Saghir 1299 |  | WYN stub filled → review | needs_review | `wyn-0039-allahumma-inni-audhu-bika-min-yawmis-sui-wa-min` |
| 127 | Refuge in Allah's pleasure from His displeasure | Sahih Muslim 1090 |  | new → review | unchecked | `wyn-audhu-bi-ridaka-min-sakhatik` |
| 128 | Refuge in Allah's Face, perfect words and Beautiful Names | Muwatta Malik 1741 (Book of Poetry, no. 12) |  | new → review | needs_review | `wyn-audhu-bi-wajhillahil-azim-kab-al-ahbar` |
| 129 | Refuge in Allah's perfect words from every evil | Al-Silsilah al-Sahihah 2995 |  | new → review | needs_review | `wyn-kalimatillah-at-tammat-illa-tariqan-bikhayr` |
| 130 | O Allah, suffice me against them as You will | Sahih Muslim 7511 |  | WYN stub filled → review | unchecked | `wyn-0048-allahummak-finihim-bima-shita` |
| 131 | When fearing a people: we place You before them | Sunan Abi Dawud 1537 |  | WYN stub filled → review | unchecked | `wyn-0049-allahumma-inna-najaluka-fi-nuhurihim-wa-naudhubi` |
| 132 | Relief from distress: no might nor power except with Allah | Sahih at-Targhib wat-Tarhib 1580 (vol. 2) |  | new → review | needs_review | `wyn-la-hawla-wa-la-quwwata-illa-billah` |
| 133 | Humble plea: You hear my words and see my place | Al-Mu'jam al-Kabir by al-Tabarani 11405 |  | new → review | needs_review | `wyn-innaka-tasmau-kalami-wa-tara-makani` |
| 134 | When I fall ill, He heals me (26:80) | Qur'an 26:80 |  | new → review | unchecked | `wyn-wa-idha-maridtu-fahuwa-yashfin` |
| 135 | He heals the hearts of believers (9:14) | Qur'an 9:14 |  | new → review | unchecked | `wyn-wa-yashfi-sudura-qawmin-muminin` |
| 136 | Recite the Qur'an abundantly — it is healing and mercy | Qur'an 17:82 |  | new → review | unchecked | `wyn-recite-quran-abundantly-isra-82` |
| 137 | Healing for what is in the breasts (Yunus 10:57) | Qur'an 10:57 |  | new → review | unchecked | `wyn-healing-for-what-is-in-the-breasts-yunus-57` |
| 138 | Ruqyah with Surah al-Fatihah | Qur'an 1:1-7; Sunan Abi Dawud 3896 |  | new → review | unchecked | `wyn-ruqyah-with-surah-al-fatihah` |
| 139 | Surah al-Ikhlas | Qur'an 112:1-4 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-al-ikhlas` |
| 140 | Surah al-Falaq | Qur'an 113:1-5 (practice: Sunan Abi Dawud 5082, 1523) | 3 | new → review | unchecked | `wyn-surah-al-falaq` |
| 142 | Ayyub's dua: adversity has touched me | Qur'an 21:83 |  | WYN stub filled → review | unchecked | `wyn-0093-anni-massaniyad-durru-wa-anta-arhamur-rahimin` |
| 143 | None but Allah can remove it (53:58) | Qur'an 53:58 |  | new → review | unchecked | `wyn-laysa-laha-min-dunillahi-kashifah` |
| 144 | Our Lord, remove the torment from us (44:12) | Qur'an 44:12 |  | new → review | unchecked | `wyn-rabbana-ikshif-annal-adhab` |
| 145 | Lessen the illness, not the reward | Sahih al-Adab al-Mufrad 504 |  | new → review | needs_review | `wyn-allahumma-anqus-minal-marad` |
| 146 | Visiting the sick: asking Allah to cure them | Sunan Abi Dawud 3106 | 7 | new → review | unchecked | `wyn-asalullah-al-azim-an-yashfiyak` |
| 147 | Remove the harm — You are the Physician and Healer | Musnad Ahmad 24774 |  | new → review | needs_review | `wyn-adhhibil-bas-anta-at-tabib` |
| 148 | Healing: remove the affliction, Lord of mankind | Musnad Ahmad 24234 (vol. 40) |  | new → review | needs_review | `wyn-imsahil-bas-la-yakshiful-karb` |
| 149 | For healing | Bukhari, Muslim |  | existing (published) | unchecked | `sickness-for-healing` |
| 150 | Ruqyah of the Prophet ﷺ: Lord of mankind, Remover of harm | Sahih al-Bukhari 5742 |  | new → review | unchecked | `wyn-rabban-nas-mudhhibal-bas-ishfi` |
| 151 | Placing the hand on the site of pain | Muslim |  | existing (published) | needs_review | `sickness-placing-the-hand-on-the-site-of-pain` |
| 152 | Jibril's ruqyah: 'Bismillahi yubrika' | Sahih Muslim 5699 |  | WYN stub filled → review | unchecked | `wyn-0073-bismillahi-yubrika-wa-min-kulli-dain-yashfika-wa` |
| 153 | Jibril's ruqyah: 'Bismillahi arqika' | Sahih Muslim 5700 |  | WYN stub filled → review | unchecked | `wyn-0072-bismillahi-arqika-min-kulli-shaiin-yudhika-min-s` |
| 154 | Ruqyah with earth and saliva for wounds | Sahih Muslim 5719 |  | new → review | unchecked | `wyn-bismillah-turbatu-ardina-biriqati-badina` |
| 155 | For one struck by the evil eye: remove its heat, cold and pain | Al-Silsilah al-Sahihah 2572 |  | new → review | needs_review | `wyn-allahumma-adh-hib-anhu-harraha-wa-bardaha` |
| 159 | Ayat al-Kursi | Qur'an 2:255 |  | existing (published) | needs_review | `ayat-al-kursi` |
| 160 | Last two verses of Surah al-Baqarah at night | Qur'an 2:285-286 (virtue: Sahih al-Bukhari 4008) |  | new → review | unchecked | `wyn-last-two-ayat-of-surah-al-baqarah` |
| 161 | Against envy: Al-Baqarah 2:109 (excerpt) | Qur'an 2:109 | 3 | new → review | needs_review | `wyn-evil-eye-baqarah-109-excerpt` |
| 162 | Against envy: An-Nisa 4:54 | Qur'an 4:54 | 7 | new → review | needs_review | `wyn-evil-eye-nisa-54` |
| 163 | Against the evil eye: Al-Kahf 18:39 (Ma sha' Allah) | Qur'an 18:39 |  | new → review | needs_review | `wyn-evil-eye-kahf-39-ma-sha-allah` |
| 164 | Against the evil eye: Al-Qalam 68:51 | Qur'an 68:51 |  | new → review | needs_review | `wyn-evil-eye-qalam-51` |
| 165 | Expand my chest, ease my task, untie my tongue (20:25-27) | Qur'an 20:25-27 |  | new → review | unchecked | `wyn-rabbishrah-li-sadri-wahlul-uqdatan` |
| 166 | Surah Ash-Sharh (94) | Qur'an 94:1-8 |  | new → review | needs_review | `wyn-evil-eye-surah-ash-sharh` |
| 177 | The magician will not succeed (20:69) | Qur'an 20:69 |  | new → review | unchecked | `wyn-wa-la-yuflihu-as-sahiru-haythu-ata` |
| 181 | Allah will nullify the magic (10:81-82) | Qur'an 10:81-82 |  | new → review | unchecked | `wyn-yunus-81-82-allah-will-nullify-magic` |
| 182 | Closing verses of al-Mu'minun (23:115-118) | Qur'an 23:115-118 | 1 | new → review | unchecked | `wyn-muminun-115-118-rabbighfir-warham` |
| 183 | Peace — a word from a Merciful Lord (36:58) | Qur'an 36:58 |  | new → review | unchecked | `wyn-salamun-qawlan-min-rabbin-rahim` |
| 184 | Peace upon Nuh among the worlds (37:79) | Qur'an 37:79 |  | new → review | unchecked | `wyn-salamun-ala-nuhin-fil-alamin` |
| 185 | Peace upon Ibrahim (37:109) | Qur'an 37:109 |  | new → review | unchecked | `wyn-salamun-ala-ibrahim` |
| 186 | Peace upon Musa and Harun (37:120) | Qur'an 37:120 |  | new → review | unchecked | `wyn-salamun-ala-musa-wa-harun` |
| 187 | Peace upon Ilyas (37:130) | Qur'an 37:130 |  | new → review | unchecked | `wyn-salamun-ala-ilyasin` |
| 188 | Peace it is until the break of dawn (97:5) | Qur'an 97:5 |  | new → review | unchecked | `wyn-salamun-hiya-hatta-matlail-fajr` |
| 190 | A hidden barrier when reciting the Qur'an (17:45) | Qur'an 17:45 |  | new → review | unchecked | `wyn-hijaban-masturan-isra-45` |
| 191 | A barrier before them and behind them (36:9) | Qur'an 36:9 |  | new → review | unchecked | `wyn-wa-jalna-min-bayni-aydihim-saddan` |

**Not added (22):**
- WYN #111 (`SH-ShifaDuas-SeekForgiveness-3`): WYN lists this Dua twice in this category (repeat of position 74); a Dua can appear once per category here
- WYN #141 (`SH-ShifaDuas-HealingPrayers-0-An-Naas`): WYN lists this Dua twice in this category (repeat of position 91); a Dua can appear once per category here
- WYN #156 (`SH-ShifaDuas-PraiseAllah-1`): WYN lists this Dua twice in this category (repeat of position 1); a Dua can appear once per category here
- WYN #157 (`SH-ShifaDuas-Durood-4`): WYN lists this Dua twice in this category (repeat of position 15); a Dua can appear once per category here
- WYN #158 (`SH-ShifaDuas-HealingPrayers-0-Al-Fatiha`): WYN lists this Dua twice in this category (repeat of position 138); a Dua can appear once per category here
- WYN #167 (`SH-ShifaDuas-HealingPrayers-0-Al-Ikhlaas`): WYN lists this Dua twice in this category (repeat of position 139); a Dua can appear once per category here
- WYN #168 (`SH-ShifaDuas-HealingPrayers-0-Al-Falaq`): WYN lists this Dua twice in this category (repeat of position 140); a Dua can appear once per category here
- WYN #169 (`SH-ShifaDuas-HealingPrayers-0-An-Naas`): WYN lists this Dua twice in this category (repeat of position 91); a Dua can appear once per category here
- WYN #170 (`SH-ShifaDuas-ProtectionFromEvil-1`): WYN lists this Dua twice in this category (repeat of position 119); a Dua can appear once per category here
- WYN #171 (`SH-ShifaDuas-ProtectionFromEvil-2`): WYN lists this Dua twice in this category (repeat of position 120); a Dua can appear once per category here
- WYN #172 (`SH-ShifaDuas-HealingPrayers-12`): WYN lists this Dua twice in this category (repeat of position 153); a Dua can appear once per category here
- WYN #173 (`SH-ShifaDuas-HealingPrayers-11`): WYN lists this Dua twice in this category (repeat of position 152); a Dua can appear once per category here
- WYN #174 (`SH-ShifaDuas-HealingPrayers-13`): WYN lists this Dua twice in this category (repeat of position 154); a Dua can appear once per category here
- WYN #175 (`SH-ShifaDuas-HealingPrayers-7`): WYN lists this Dua twice in this category (repeat of position 148); a Dua can appear once per category here
- WYN #176 (`SH-ShifaDuas-HealingPrayers-8`): WYN lists this Dua twice in this category (repeat of position 149); a Dua can appear once per category here
- WYN #178 (`SH-ShifaDuas-HealingPrayers-0-Al-Fatiha`): WYN lists this Dua twice in this category (repeat of position 138); a Dua can appear once per category here
- WYN #179 (`SH-ShifaDuas-AyatAlKursi`): WYN lists this Dua twice in this category (repeat of position 159); a Dua can appear once per category here
- WYN #180 (`SH-ShifaDuas-Al-Baqarah`): WYN lists this Dua twice in this category (repeat of position 160); a Dua can appear once per category here
- WYN #189 (`SH-ShifaDuas-MagicTreatment-9`): WYN lists this Dua twice in this category (repeat of position 51); a Dua can appear once per category here
- WYN #192 (`SH-ShifaDuas-HealingPrayers-0-Al-Falaq`): WYN lists this Dua twice in this category (repeat of position 140); a Dua can appear once per category here
- WYN #193 (`SH-ShifaDuas-HealingPrayers-0-An-Naas`): WYN lists this Dua twice in this category (repeat of position 91); a Dua can appear once per category here
- WYN #194 (`SH-ShifaDuas-ProtectionFromEvil-10`): WYN lists this Dua twice in this category (repeat of position 128); a Dua can appear once per category here

**Proposed corrections to published rows (7 Duas, opt-in):**
- `anxiety-when-overwhelmed-by-a-matter`: source_reference — Row cites only 'Abu Dawud'. The wording is from Qur'an 9:129 (as WYN cites); Abu Dawud 5081 is a mawquf report of Abu ad-Darda' for saying it seven times.
- `morning-sayyid-al-istighfar-master-of-seeking-forgiveness`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, description, source_reference, arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, source_reference, title_ur — Published Arabic stops after 'mā-staṭaʿtu'; the rest of Sayyid al-Istighfar (aʿūdhu bika … illā ant) in Bukhari 6306 and in WYN is missing. Corpus Bukhari 6306 CONTAINED.
- `sickness-for-healing`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, source_reference — Published Arabic ('Allahumma rabban-nas adhhibil-ba's, ishfi anta...') is a blend not found verbatim in any corpus hadith and does not match its cited Sahih Muslim 5707; proposed text is Muslim 5707 verbatim (check.mjs CONTAINED) and matches WYN.
- `sickness-placing-the-hand-on-the-site-of-pain`: arabic, transliteration_latin, transliteration_telugu, translation_en, translation_ur, description, source_reference, title_ur — Published Arabic embeds repetition markers (×٣)/(×٧) in the text; counts belong in the description.
- `anxiety-for-relief-from-hardship`: source_collection, source_reference, hadith_number, hadith_grade — Row cites 'Musnad Ahmad' with no number; WYN prints Sahih Ibn Hibban 974.
- `anxiety-for-anxiety-and-sorrow`: arabic, translation_en, translation_ur, transliteration_latin, transliteration_telugu, source_reference, hadith_number — The published text stops before 'wa ḍala'i-d-dayn wa ghalabati-r-rijāl'. The full wording is from corpus Bukhari 6369 (CONTAINED).
- `salah-salutations-on-the-prophet-after-tashahhud-salat-ibrahimiyyah-ch`: source_reference, hadith_number — The row only says 'Bukhari'. WYN prints Bukhari 3370 (Kitab Ahadith al-Anbiya'), and the corpus confirms the wording there.

<details><summary>Unresolved verification issues (239)</summary>

- W002: WYN prints Sunan an-Nasa'i 1293 (grade printed 'Hasan' in the app, 'Sahih' in the book); that hadith's wording is 'ṣalli ʿalā Muḥammadin ʿabdika wa rasūlika…' and does not contain 'wa ʿalā āli Muḥammad' in the first clause. Exact short wording is the opening of Bukhari 3370 (also Nasa'i 1287-1292, Muslim 907). Cited Bukhari 3370; admin to decide whether to keep WYN's Nasa'i reference.
- W002: The short form is an excerpt of the full Salat Ibrahimiyyah (published row salah-salutations-on-the-prophet-after-tashahhud-salat-ibrahimiyyah-ch); kept as a separate row because WYN shows only this short wording.
- W003: WYN cites al-Mu'jam al-Kabir (at-Tabarani) 541 and 7532 (not in corpus) for the morning/evening and after-salah practice; existing row only cites Qur'an 2:255.
- W003: Existing row has title_ur null — admin may want to add 'آیت الکرسی'.
- W004: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W004: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W004: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W004: WYN also cites Sahih Muslim 1886 and Bukhari 5017 for Surah al-Ikhlas (virtue / bedtime recitation).
- W005: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W005: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W005: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W005: WYN also cites Bukhari 5017 and Sunan an-Nasa'i 5439 (virtue of al-Falaq) — both checked in corpus and relevant.
- W006: Published row 'three-quls' combines Ikhlas+Falaq+Nas in one entry (and already carries WYN-0019/0020/0021/0175); WYN shows each surah as a separate item, so a separate row is proposed. Admin may prefer to keep three-quls for its current categories.
- W006: WYN's app text prefixes the Basmalah; quran_refs start at ayah 1 so the build will not include it.
- W006: WYN-0175 (recite the Mu'awwidhat after salah, Abu Dawud 1523, printed Sahih) covers all three surahs; it is on three-quls and not repeated here.
- W006: WYN also cites Bukhari 5017 and Sunan an-Nasa'i 5439; Nasa'i 5439 names only al-Falaq.
- W007: WYN gives repeat count 7 in Morning/Evening placements; the existing row (anxiety category) has repeat_count null — count should come from the WYN placement.
- W007: Abu Dawud 5081 (seven-times virtue) is graded Mawdu' by al-Albani and Muhyi ad-Din Abdul Hamid in the corpus (Zubair Ali Zai: isnad Hasan). The Qur'anic wording itself is unaffected.
- W007: Did not set quran_refs on the existing row: the dua is an excerpt of 9:129 (without 'fa in tawallaw faqul'); a whole-ayah ref would make the build overwrite the Arabic.
- W012: WYN cites Muslim 6880 (evening, scorpion sting) and Muslim 6878 (when stopping at a place) — both verified to contain the wording. WYN also lists it under Morning, Evil-eye, Travelling and Healing.
- W012: Published row source_reference is just 'Muslim' (hadith_number 6880).
- W013: Matches Abu Dawud 5088 exactly; published repeat_count 3 matches WYN.
- W015: Arabic not verified against a primary corpus. Partial Six-Books parallel: Jami' at-Tirmidhi 3524 contains only 'yā Ḥayyu yā Qayyūmu bi-raḥmatika astaghīth' (graded Hasan by al-Albani); the rest is not in the corpus.
- W015: Book candidate WYN-0008 (fitrah dua) is unrelated and not attached.
- W017: Abu Dawud 5074 gives 'ʿawratī' (singular) in one chain and 'ʿawrātī' (plural, 'wa qāla ʿUthmān') in the other; plural used to match WYN.
- W017: WYN also cites Musnad Ahmad 4785 (not in corpus).
- W017: Arabic is assembled from abudawud 5074 (100% of its wording occurs there) rather than one verbatim excerpt — check the wording.
- W019: Identical wording exists in published rows hajj-the-best-dua-on-the-day-of-arafah and hajj-atop-safa-and-marwa (sim 1.0), but their titles/descriptions are tied to Hajj occasions, so reusing them would show 'Day of Arafah'/'Safa and Marwa' titles in Morning/Evening/After-Salah lists. Proposed as a new general row; admin may instead merge.
- W019: Counts differ by placement (Morning/Evening: none shown; Protection and Jinn: 100; After Salah: 10 — WYN cites al-Silsilah as-Sahihah 113 / Sahih at-Targhib 477, not in corpus). repeat_count left null; per-placement counts should come from the WYN mapping.
- W019: Book candidates WYN-0020 (al-Falaq) and WYN-0064 (Ikhlas/Mu'awwidhatain) are unrelated and not attached.
- W019: Same Arabic as existing row hajj-the-best-dua-on-the-day-of-arafah (published); reused it instead of inserting a duplicate.
- W020: WYN also places it in Healing (#1, #156) with no count; repeat_count 100 is for the Morning/Evening/Jinn placements.
- W026: Published row quranic-for-mistakes-and-forgetfulness holds only an excerpt of 2:286 (rabbanā lā tu'ākhidhnā…) — different item, not merged.
- W026: WYN-0076 also cites Sunan ad-Darimi 3387 (not in corpus).
- W057: Bukhari 6347 reports that the Prophet ﷺ sought refuge from these four (6616: 'seek refuge in Allah from...'); the opener 'Allahumma inni a'udhu bika' is supplied (as WYN prints), not verbatim in the corpus.
- W057: In Bukhari 6347 Sufyan says he added one of the four himself and does not know which.
- W057: Arabic is assembled from bukhari 6347 (76% of its wording occurs there) rather than one verbatim excerpt — check the wording.
- W058: WYN prints Muslim 6943; text is at 6944 in the corpus numbering (6943 is an unrelated short chain).
- W074: Arabic not verified against a primary corpus (Tabarani not in corpus; no Six-Books parallel found).
- W074: Hadith number discrepancy: WYN app prints al-Mu'jam al-Kabir 17/810; the existing draft/book inventory says 801. Confirm which is correct.
- W074: Batch book_candidates WYN-0083 and WYN-0090 (Qur'an 17:82 / 10:57, recitation as healing) are not this Dua; excluded from wyn_ids.
- W081: Existing published 'faith-when-troubled-by-doubts-about-faith' has the longer wording 'amantu billahi wa rusulih' (Bukhari/Muslim); different wording, kept separate.
- W081: WYN prints no grade; corpus Al-Albani Sahih (Zubair Ali Zai: in Bukhari 3276 / Muslim 134).
- W084: The advice in Abu Dawud 5110 is from Ibn Abbas (mawquf), not a saying of the Prophet ﷺ; corpus grade: Al-Albani 'Hasan isnad'.
- W085: Existing draft Arabic began with 'wa qul' (the command); WYN's recited Dua omits it, so an excerpt is used.
- W085: The Uthmani substring starts 'رَّبِّ' with shadda (assimilation from the preceding 'qul'); when recited standalone it is 'rabbi' - reviewer may drop the shadda.
- W085: repeat_count 3 kept from the WYN book inventory (WYN-0065 'Three times'); WYN app placement shows no count.
- W085: Batch book_candidates WYN-0117 and WYN-0120 are different Duas (23:118, 7:23); excluded.
- W088: Duplicate WYN stub: wyn-0080-audhu-billahis-samiil-alimi-min-ash-shaitanir-ra (WYN-0080, Black Magic section) is the same dua; this fill carries both WYN ids — retire/merge the wyn-0080 stub.
- W088: Book entry WYN-0080 says 'Three times'; WYN app placements have no count and Abu Dawud 775 gives no count for this phrase, so repeat_count left null — admin to decide.
- W088: Corpus grades: Al-Albani Sahih; Shuaib al-Arnaut Sahih li-ghairihi; Zubair Ali Zai Isnaad Hasan.
- W088: Glosses of hamz/nafkh/nafth (madness/arrogance/poetry per narrators' explanation) kept literal in translation; consider a footnote.
- W090: Count 3 comes from WYN's '(x3)' marker only; no Prophetic text prescribes reciting this verse for the evil eye — admin may want a note that this is a WYN practice, not a sunnah dua.
- W091: Count 7 comes from WYN's '(x7)' marker only; no Prophetic source prescribes it.
- W092: The recitable phrase is only 'ma sha'a Allahu la quwwata illa billah'; WYN prints the full ayah, so the whole ayah is used. Admin could switch to an excerpt.
- W092: Book candidate WYN-0142 (Astaghfirullah) is unrelated; wyn_ids empty.
- W095: WYN's English ref says 'Al-Ma'un:1-8' — wrong surah name; the Arabic and Urdu ref ('Alam Nashrah') are Surah 94 Ash-Sharh. Used 94:1-8.
- W095: Corpus 94:1 Uthmani text is prefixed with the Basmala; the build should strip it.
- W096: Published row sickness-seeking-refuge-for-a-child-or-loved-one (sim 0.86) is the 'u'idhukuma' (for two others) form and already carries WYN-0071; WYN's app and book (WYN-0071 title 'A'udhu bi kalimatillah...') use the first-person 'a'udhu' wording, which is the exact wording in Bukhari 3371. Made a new row; admin should move WYN-0071 off the existing row (or decide to reuse it instead).
- W098: WYN app text reads 'wa sharri kulli dhi 'ayn' and corpus agrees (book title adds 'min'); corpus wording used.
- W101: If the admin prefers to keep the 'Allahumma rabban-nas' form, the correct source for it is Sahih al-Bukhari 5743 ('...adhhibil-ba's, ishfihi wa antash-shafi...'), not Muslim 5707 — either way the published text needs fixing.
- W102: Arabic not verified against a primary corpus (no Six-Books parallel found with find.mjs).
- W102: Pronoun 'anhu' (him) is for a male; adapt to 'anha' for a female — admin may add a note.
- W109: Not a Prophetic hadith: it is the statement of Ka'b al-Ahbar (corpus grade al-Hilali: 'Maqtu Sahih'). WYN prints no grade.
- W109: WYN's 'Book of Poetry: 12' = corpus Malik 1741.
- W109: Book candidates WYN-0114/WYN-0147 are unrelated.
- W112: Existing row has no hadith number; WYN cites Sahih al-Bukhari 142 (corpus text matches the published Arabic). Admin may add hadith_number 142.
- W113: App refs show no grade; grade from WYN book entry WYN-0081 (Sahih). Corpus: Al-Albani Sahih.
- W121: Corpus grades differ: Al-Albani, Shuaib al-Arnaut Sahih; Zubair Ali Zai Da'if.
- W126: Same verse as W110 (jinn section); admin may merge both into one row.
- W126: WYN-0090 covers both 17:82 and 10:57; tagged on this row and on W127.
- W126: Same Arabic as wyn-recite-quran-abundantly-isra-82 (from W110); merged into that row.
- W127: WYN-0090 also tagged on W126 (17:82). Book candidates WYN-0067/WYN-0114 unrelated.
- W128: WYN-0092 says recite it an odd number of times (citing Muslim 5733 too); no repeat_count set since the app gives none.
- W128: Corpus 1:1 text starts with a BOM character (U+FEFF) — build should strip it.
- W129: Draft stub's Arabic/translations were the whole ayah ('wa Ayyuba idh nada rabbahu...'); replaced with the excerpt WYN prints.
- W130: Corpus Muslim 5737 spells 'بِاسْمِ اللَّهِ'; kept the common 'بِسْمِ اللَّهِ' spelling. Second phrase verified CONTAINED in Muslim 5737.
- W130: repeat_count left null because the dua has two different counts (3 and 7); WYN placements give no single count.
- W131: One WYN placement (Healing collection, order 146) shows no count; the other two show 7, matching the hadith.
- W132: Arabic not verified against a primary corpus.
- W132: Closest Six-Books parallel: Bukhari 5744 (Aisha) 'امْسَحِ الْبَاسَ رَبَّ النَّاسِ، بِيَدِكَ الشِّفَاءُ، لاَ كَاشِفَ لَهُ إِلاَّ أَنْتَ' — same opening, different ending ('none can remove it but You'); WYN's ending 'lā yakshifu-l-karba illā anta' kept because it is a distinct wording. Reviewer may prefer the Bukhari wording.
- W132: WYN-0104 (Visiting the Sick, 'Adh-hibil ba's...') shares the Ahmad 24234 reference but is a different wording; not linked.
- W154: WYN shows no count for this item; the hadith mentions 100 times in one sitting (put in description, repeat_count null). Distinct from W166 (ending at-Tawwabul-Ghafur, count 100).
- W156: Kept separate from 'repentance-general-seeking-of-forgiveness' (Tirmidhi 3577 wording with 'al-'Azim'); WYN lists both as separate items (W156, W158). That published row currently carries WYN-0125 in wyn_ids — see W158 correction.
- W156: WYN-0131 also cites AD 1517 but is a different dua (as printed; book note) — not linked.
- W161: Arabic not verified against a primary corpus.
- W161: The Healing-collection placement cites Abu Dawud 5054 (al-Albani Sahih), but that bedtime narration reads 'اللَّهُمَّ اغْفِرْ لِي ذَنْبِي وَأَخْسِئْ شَيْطَانِي وَفُكَّ رِهَانِي وَاجْعَلْنِي فِي النَّدِيِّ الأَعْلَى' (adds 'dhanbi', 'akhsi'', no 'wa thaqqil mizani'), so it is not the same wording; WYN text (Hakim) kept.
- W169: Cited source (Sahih at-Targhib 1580) not in corpus; exact phrase is CONTAINED in Bukhari 6384 ('a treasure of the treasures of Paradise'), noted in description. The distress-specific virtue of Targhib 1580 could not be checked — reviewer to confirm description.
- W169: Not reused 'home-leaving-the-home' (longer leaving-home dua that contains this phrase). WYN prints no grade; no matching WYN book entry.
- W173: Book candidate WYN-0093 (Q 21:83, du'a of Ayyub) is a different Dua and was not mapped here.
- W174: Ibn Hibban is not in the corpus; the published Arabic is not verified against a primary corpus.
- W174: Word order differs: the row has 'تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا', WYN has 'تَجْعَلُ الْحَزْنَ سَهْلًا اِذَا شِئْتَ'. Both orders circulate; the reviewer should confirm against Ibn Hibban 974.
- W174: I could not confirm that this hadith is in Musnad Ahmad, so the row's current 'Ahmad' attribution is doubtful.
- W176: Book candidate WYN-0146 shares the reference Tirmidhi 3524 but its title is 'Allahummaghfirli warhamni...', a different Dua, so it was not mapped.
- W176: Tirmidhi himself calls the chain gharib; the corpus grades are Hasan (Albani, Zubair Ali Zai).
- W179: The row's own review note already flagged the truncation. The corrections use the corpus word order ('al-jubni wal-bukhl'), so the row's 'wal-bukhli wal-jubn' order changes.
- W180: Grades differ. WYN's app prints Sahih, but the corpus grades Abu Dawud 5090 'Hasan Isnaad' (Albani) and Da'if (Zubair Ali Zai), and the WYN book lists the same number as Hasan for WYN-0014/0015.
- W180: Book candidates WYN-0014 and WYN-0015 share the reference but are different Duas from the same hadith, so they were not mapped.
- W183: WYN places this Durood in the Relief from Sorrow and Healing categories. The row's title is salah-specific (after tashahhud), so the reviewer may want a more general title.
- W184: WYN also cites al-Silsilah al-Sahihah 2714 (not in the corpus) for the Healing placement.
- W185: Arabic not verified against a primary corpus (al-Adab al-Mufrad is not in the corpus).
- W185: A longer, related wording containing 'يا حي يا قيوم إني أسألك' is at Nasa'i 1300. It was not substituted because it is a different, longer text.
- W221: Same wording as the published row (Tirmidhi 3428). WYN places it in Travelling and in Healing (Allah's Praise); category placement only.
- W221: Tirmidhi 3428 corpus grades: Hasan (Shakir, al-Albani, Bashar Awad); Daif (Zubair Ali Zai). WYN prints no grade in the app.
- W221: Optional: the published row has no hadith_number; could be set to Jami' at-Tirmidhi 3428 (not a defect, so no correction proposed).
- W223: WYN prints no grade; corpus grades Tirmidhi 3593: Sahih (Shakir, al-Albani), Hasan Sahih (Bashar Awad); also in Sahih Muslim per Zubair Ali Zai.
- W225: Arabic not verified against a primary corpus (Musnad Ahmad 726). No exact Six-Books parallel; the nearest are Tirmidhi 3480 / Ibn Majah 1384 ('la ilaha illallahul-halimul-karim, subhanallahi rabbil-arshil-azim, wal-hamdu lillahi rabbil-alamin'), which are graded Daif and differ in wording.
- W225: WYN prints no grade; hadith_grade null.
- W226: Arabic not verified against a primary corpus (Musnad Ahmad 1363). Close Six-Books parallel: Tirmidhi 3504 (Ali), but it reads 'la ilaha illallahul-halimul-karim, la ilaha illallahu subhanallahi rabbil-arshil-azim' with 'al-hamdu lillahi rabbil-alamin' only in a second chain, and is graded Daif (Shakir, al-Albani, Zubair Ali Zai) — so WYN's Ahmad wording was kept.
- W226: The description (taught to Ali for forgiveness) is based on the Tirmidhi 3504 parallel; confirm against Ahmad 1363's context.
- W226: WYN prints no grade; hadith_grade null.
- W227: Cross-batch duplicate: W178 (batch B5, Relief from Sorrow and Distress, Bukhari 6346) is the same Dua with the same wording. Both items should map to this one row (wyn-0154-...); reconcile with B5's output to avoid two rows.
- W227: Stub has hadith_grade 'Sahih (grade as printed ...)'; set to null here per Sahihayn rule — keep the stub's value if preferred.
- W227: Same Arabic as wyn-la-ilaha-illallahul-azimul-halim (from W178); merged into that row.
- W228: In Tirmidhi 3430 the five phrases are interleaved with Allah's replies; the joined text is therefore not a contiguous substring — each phrase was verified separately with check.mjs.
- W228: WYN prints no grade; corpus grades: Sahih (Shakir, al-Albani), Hasan (Bashar Awad, Zubair Ali Zai); Tirmidhi: hasan gharib.
- W228: Arabic is assembled from tirmidhi 3430 (91% of its wording occurs there) rather than one verbatim excerpt — check the wording.
- W229: WYN prints no grade; corpus grades Abu Dawud 873: Sahih (al-Albani, Muhyi al-Din), Isnaad Sahih (Zubair Ali Zai).
- W230: Abu Dawud 981 is an abbreviated chain ('bi-hadhal-khabar') referring to the fuller hadith 980; WYN shows only this short form.
- W230: WYN prints Sahih; corpus grades: Hasan (al-Albani, Muhyi al-Din, Shuaib al-Arnaut), Sahih (Zubair Ali Zai).
- W231: WYN prints no reference ('-'); the wording matches Bukhari 3369 (Abu Humayd as-Sa'idi), also Bukhari 6360, Abu Dawud 979, Ibn Majah 905, Muwatta 397.
- W231: Not merged with salah-salutations-on-the-prophet-after-tashahhud-salat-ibrahimiyyah-ch: that row is the 'wa ala ali Muhammad' wording, a different narration.
- W232: Not a supplication itself but a Qur'anic instruction (WYN section heading verse). Kept as 'new' since it is recitable Qur'an text.
- W233: WYN prints no grade; corpus grades Tirmidhi 3525: Sahih (Shakir, al-Albani, Zubair Ali Zai), though Tirmidhi himself calls this chain gharib and not mahfuz (the mursal via al-Hasan being more correct). Same wording also Tirmidhi 3524.
- W233: Existing salah-general-remembrance-after-the-salam contains this phrase only as part of a longer dhikr; not the same Dua.
- W234: Overlap: published row salah-general-remembrance-after-the-salam (wyn_ids WYN-0136/0164/0165) bundles 'Astaghfirullah (x3)' with this Dua, so it is not the same wording; WYN shows this Dua alone here. Proposed as a separate row; admin may prefer reusing the bundled row instead.
- W234: WYN-0165 is also listed on that existing row; decide which row should carry it.
- W234: Muslim 1334 reads 'tabarakta dhal-jalali' (no 'ya'); the existing row has 'ya dhal-jalali' (another narration). Kept the corpus wording, which matches WYN's app text.
- W235: WYN prints no grade; corpus grades Tirmidhi 3544: Sahih (Shakir, al-Albani, Zubair Ali Zai); Tirmidhi: gharib from Thabit's route.
- W236: WYN prints no grade; corpus grades Abu Dawud 1493: Sahih (al-Albani, Muhyi al-Din, Shuaib al-Arnaut), Isnaad Sahih (Zubair Ali Zai).
- W237: WYN prints Musnad Ahmad 12205 (not in corpus); the same wording (with 'wahdaka la sharika lak') is at Ibn Majah 3858, used instead. Ibn Majah reads 'Dhul-Jalali' where WYN has 'Dha-l-Jalali'.
- W237: Ibn Majah 3858 grades: Hasan Sahih (al-Albani, Abd al-Baqi), Isnaad Hasan (Zubair Ali Zai). WYN prints no grade.
- W237: Related but different: W187 (batch B5, Abu Dawud 1495) has no 'wahdaka la sharika lak' and adds 'ya Hayyu ya Qayyum'; kept separate.
- W238: WYN's app text (and this row) stops before the closing request of Muslim 6889: 'اقْضِ عَنَّا الدَّيْنَ وَأَغْنِنَا مِنَ الْفَقْرِ' (settle our debt and free us from poverty). Admin may prefer the full dua.
- W238: WYN-0046 (printed book, Muslim 6889, full dua incl. qadā' ad-dayn) is genuinely this hadith but in fuller form; W037 (batch B1, sleep, different variant wording 'as-samawati as-sab'' without 'faliqal-habb') also cites WYN-0046. wyn_ids left empty here to avoid a double claim — reconcile with B1.
- W240: WYN cites 21:88 (Allah's answer), not 21:87 (the dua of Yunus itself); kept as printed.
- W248: This phrase recurs in many ayat (e.g. 2:106, 2:109, 2:148); WYN cites 2:20, used as printed.
- W249: WYN shows the phrase followed by '...'; the ayah continues 'but most people do not know'. Excerpt ends at 'amrih'.
- W250: WYN shows the phrase with '...'; excerpt is the opening clause of 39:36.
- W251: WYN shows the phrase with '...'; excerpt is the clause within 57:4.
- W254: WYN shows the phrase with '...'; excerpt ends at 'wa yakshifus-su'' within 27:62.
- W258: 57:22 continues into 57:23 ('so that you not despair over what has eluded you'); WYN cites 57:22 only.
- W259: WYN label for this item is "Ask Allah for His grace and mercy" but its app id is EntrustToAllah-0 (first of the "Entrust all matters to Allah" group); label looks misassigned in the app.
- W264: WYN places this item twice in the healing collection (order 51 "Entrust all matters to Allah" and order 189 "Treatment for magic"); one record, two placements.
- W265: WYN prints the surah as "Al-Mu'min" (= Ghafir, surah 40); reference 40:44 confirmed.
- W266: Uthmani excerpt begins with "رَّبَّنَا" (shadda on ra from assimilation with the preceding word in continuous recitation); reviewer may prefer "رَبَّنَا" when shown standalone.
- W271: Corpus text of 11:6 begins with the rub' al-hizb mark "۞"; the build should strip it from the displayed Arabic.
- W273: Same words also occur in 8:46; WYN cites 2:153, kept.
- W276: book_candidates (WYN-0067, WYN-0090, WYN-0114) are unrelated to this verse; wyn_ids left empty.
- W279: WYN prints the range as "6-5"; normalised to 94:5-6.
- W280: book_candidates (WYN-0150, WYN-0158: dua of Yunus) are unrelated; wyn_ids left empty.
- W281: Existing draft stub holds the whole ayah including the narrative "قَالَ" ("He said"); proposed Arabic drops "قَالَ" to match the WYN app wording. Reviewer may instead keep the whole ayah (arabic null, quran_refs 12:86).
- W283: Arabic not verified against a primary corpus.
- W283: Closest Six-Books parallel is Sunan Abi Dawud 1525 (distress dua, Albani: Sahih) with different wording: "اللَّهُ اللَّهُ رَبِّي لاَ أُشْرِكُ بِهِ شَيْئًا"; not substituted because the wording differs from WYN's.
- W284: Arabic not verified against a primary corpus for Tabarani 6741; the identical phrase appears in Sunan Ibn Majah 3878 (waking at night, different context).
- W284: WYN app text starts with a conjunction "وَلَا حَوْلَ"; dropped the leading "وَ" for a standalone recitation.
- W284: Existing published row home-leaving-the-home (sim 0.54) is a different dua (Bismillah, tawakkaltu...), not reused.
- W285: WYN prints Musnad Ahmad 1997; the same Ibn Abbas hadith is in Abu Dawud 1510 (Albani: Sahih), Tirmidhi 3551 and Ibn Majah 3830 — cited Abu Dawud 1510, whose ending matches WYN exactly ("...سَخِيمَةَ قَلْبِي"; Tirmidhi has "صَدْرِي").
- W285: WYN app prefixes "اللَّهُمَّ", which is not in the hadith (these words are the end of a longer dua beginning "رَبِّ أَعِنِّي"); omitted. Reviewer may prefer the full Abu Dawud 1510 dua.
- W286: Arabic not verified against a primary corpus (Musnad Ahmad 3712; no Six-Books parallel — find.mjs "ربيع قلبي" returned nothing).
- W286: Existing stub lists "Jami' at-Tirmidhi 2457" as a second source; Tirmidhi 2457 is the hadith of Ubayy ibn Ka'b about sending salawat, not this dua — recommend removing it from source_reference/source_collection (done in proposed dua).
- W287: Arabic not verified against a primary corpus; WYN prints no reference for this item.
- W287: Not found as a dua in the corpus; the related virtue hadith is Tirmidhi 2465 ("whoever has the Hereafter as his concern..."), which is not a supplication text. Reviewer should confirm the source or mark as a general supplication.
- W287: WYN label "Remember the great reward of patience" sits in the grief group (app id Grief-12); label appears misassigned.
- W288: WYN prints the surah as "Ha Mim As-Sajdah" (= Fussilat, surah 41).
- W288: Same Arabic as wyn-seek-refuge-when-satan-prompts-fussilat-36 (from W080); merged into that row.
- W289: Excerpt begins with "أَنِّى" ("that I..."), grammatically dependent on the preceding "nādā rabbahū"; the "(My Lord,)" in the translations is supplied for sense.
- W289: book_candidates (WYN-0060, WYN-0118) are unrelated; wyn_ids left empty.
- W290: book_candidates (WYN-0091, WYN-0119) are unrelated; wyn_ids left empty.
- W291: WYN prints no grade; corpus grades for Abu Dawud 3893: Al-Albani Daif, Muhammad Muhyi al-Din Abd al-Hamid Hasan, Zubair Ali Zai Daif.
- W291: Existing draft wyn-0065 (sim 0.40) is the Qur'anic 23:97-98 dua, a different text; not reused.
- W292: WYN prints no reference and no label for this item; it sits in the "Recite this when having doubts" group (app id DoubtRecitation-9). Linking it to Bukhari 3276 (also in Muslim) is an inference — please confirm.
- W292: Arabic "أَعُوذُ بِاللَّهِ" is the formula implied by the instruction "فَلْيَسْتَعِذْ بِاللَّهِ"; not a verbatim corpus quote.
- W292: Existing published seeking-refuge-from-the-accursed-devil is the longer formula (min ash-shaytan ar-rajim); different wording, not reused.
- W297: Only the opening clause of a very long supplication (Tirmidhi 3419) is given, matching WYN's app excerpt.
- W297: Corpus grades agree it is weak: Albani/Shakir Daif Isnaad, Bashar Awad Daif, Zubair Ali Zai Daif.
- W298: Arabic not verified against a primary corpus (no Six-Books parallel found for "أسألك من فضلك ورحمتك").
- W298: WYN app text has "اَللّٰهُم" without shadda; corrected to "اَللّٰهُمَّ". Urdu-style yeh (ی) in the app text normalised to Arabic ي.
- W298: Existing published masjid-leaving-the-masjid (sim 0.42) is the shorter Muslim dua "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ"; different dua, not reused.
- W299: Arabic not verified against a primary corpus (no Six-Books parallel found).
- W299: Fixed run-together words in the app text ("الْاُمُوْرِكُلِّهَا" → "الْاُمُوْرِ كُلِّهَا", "وَاَجِرْنَامِنْ" → "وَاَجِرْنَا مِنْ").
- W299: Urdu-style yeh (ی) in the app text normalised to Arabic ي.
- W300: WYN app item has NO Arabic text; only the heading "Ask Allah for well-being" and the reference Al-Adab al-Mufrad 637 (not in the corpus). The hadith of al-Abbas "سَلِ اللَّهَ الْعَافِيَةَ" (Tirmidhi 3514, Sahih) was chosen as the most likely content — please verify against Al-Adab al-Mufrad 637 and replace if it is a different text. If the WYN item is only a heading, consider excluding instead.
- W300: book_candidate WYN-0101 ("Allahumma 'afihi", Musnad Ahmad 637, visiting the sick) shares only the number 637; not linked.
- W301: WYN prints no grade; corpus: Al-Albani Sahih, Fuad Abd al-Baqi Sahih, Arnaut Sahih li-ghayrihi, Zubair Ali Zai Daif.
- W301: Existing draft wyn-0018 ("Allahumma inni as'alukal-'afiyata fid-dunya wal-akhirah", morning dua) uses al-'afiyah and is a longer, different dua; not merged.
- W302: Ibn Majah 2957 (the WYN reference) is graded Da'if by al-Albani, Abd al-Baqi, Arnaut and Zubair Ali Zai in the corpus (it is the Rukn al-Yamani/tawaf narration). The identical wording opens Ibn Majah 3871 (Ibn Umar, morning/evening duas), graded Sahih — consider citing 3871 instead or alongside.
- W302: WYN prints no grade for this item; hadith_grade left null.
- W303: Arabic identical to the published row. WYN cites Sunan Ibn Majah 3850 (corpus CONTAINED; Albani Sahih, Zubair Ali Zai Da'if); the existing row cites only 'Tirmidhi' with no number (find.mjs did not locate this exact wording in the corpus Tirmidhi, which has a variant with 'karim'). Admin may want to add 'Sunan Ibn Majah 3850' to source_reference; not proposed as a correction since the existing citation is not wrong.
- W303: Existing row has title_ur null; WYN places it under 'Ask Allah for well-being' in the Healing collection.
- W304: WYN prints Sahih Muslim 6851; that hadith has the four-word form without 'wahdini'. The five-word wording WYN shows (with 'wahdini') is at Muslim 6850 — cited 6850.
- W304: Not merged with published 'salah-between-the-two-prostrations' (that row has seven verbs incl. wajburni/warfa'ni).
- W305: Corpus grades for Abu Dawud 5090: Albani 'Hasan Isnaad', Zubair Ali Zai Da'if.
- W305: repeat_count 3 taken from the hadith (thrice morning and evening); WYN's Healing placement gives no count. WYN-0014 is the morning/evening book entry for the same dua — if the morning/evening WYN category already gets this dua from another batch, merge the two.
- W306: Not a supplication itself but a Qur'anic exhortation; WYN places it under 'Seek forgiveness abundantly'.
- W307: No count printed by WYN; repeat_count left null (hadith says 'more than seventy times a day').
- W307: Not merged with published 'repentance-general-seeking-of-forgiveness' (longer wording: al-'Azim alladhi la ilaha illa huwa al-Hayy al-Qayyum).
- W308: book_candidates (WYN-0091, WYN-0119) are unrelated; wyn_ids left empty.
- W309: Arabic not verified against a primary corpus (Musnad Ahmad not in corpus).
- W309: Six-Books parallels differ slightly: Ibn Majah 898 'rabbighfir li warhamni wajburni warzuqni warfa'ni' (no wahdini); Tirmidhi 284 'allahummaghfir li warhamni wajburni wahdini warzuqni' (no warfa'ni). WYN's six-verb form kept to mirror the app.
- W309: Similar to published 'salah-between-the-two-prostrations' (seven verbs incl. 'afini, starts Allahumma) but not the same wording; not merged.
- W310: Arabic not verified against a primary corpus (no Six-Books parallel found by find.mjs; original is al-Tabarani).
- W310: WYN vocalises 'kullihā' (genitive) after 'dhunubi wa khatayaya' (accusative); grammatically expected 'kullahā'. Kept WYN's Arabic as printed; Latin uses 'kullahā'. Scholar to confirm.
- W311: WYN app wording has 'wa abu'u bi-dhanbi' (without 'laka'); Bukhari 6306 has 'wa abu'u laka bi-dhanbi' — corpus wording proposed.
- W311: Corpus orthography uses 'لاَ' / 'إِلاَّ' / 'عَلَىَّ' (alif maqsura); admin may normalise to the row's existing 'لَا' style if preferred.
- W313: WYN app text reads 'wa sayyi'il asqam'; corpus Abu Dawud 1554 has 'wa min sayyi'il asqam' — corpus wording used. Zubair Ali Zai grades it Da'if; Albani/Arnaut Sahih.
- W313: Same Arabic as wyn-refuge-from-leprosy-insanity-and-evil-diseases (from W062); merged into that row.
- W315: Arabic not verified against a primary corpus (Ahmad/Silsilah not in corpus).
- W315: Closest corpus parallel is Muwatta Malik 1739 (Hasan li-ghayrihi, mursal from Yahya b. Sa'id) with different wording ('a'udhu bi-wajhillahil-karim wa bi-kalimatillah... allati', no 'min sharri ma khalaqa wa dhara'a wa bara'a', 'wa min tawariqil-layli wan-nahar'); WYN's Ahmad wording kept.
- W315: Not merged with published 'evening-seeking-refuge-at-nightfall' (different, short Muslim wording).
- W316: Arabic not verified against a primary corpus (al-Tabarani not in corpus; no Six-Books parallel found for 'innaka tasma'u kalami').
- W316: WYN text appears to have errors: 'wa dhalla jasadahu' (expected 'jasaduhu', subject) and 'wa kun bi dawman rahima' (commonly cited wording is 'wa kun bi ra'ufan rahima'). Kept as printed in WYN except stray doubled harakat; Latin/translation follow 'jasaduhu' and 'dawman'. Scholar to confirm.
- W316: This narration (Ibn Abbas, Prophet's dua at Arafah) is widely graded weak; WYN prints no grade — hadith_grade left null.
- W317: book_candidate WYN-0116 is unrelated; wyn_ids left empty.
- W318: In context the verse refers to relieving believers' hearts through victory; WYN lists it among the healing ('shifa') verses. Saheeh renders 'satisfy the breasts' — the draft uses 'heal' to match the healing context; review.
- W318: book_candidate WYN-0118 is unrelated.
- W319: In context 53:58 refers to the approaching Hour; WYN places it under 'Supplication for healing'.
- W320: In context these are the words of disbelievers when the punishment comes; WYN uses them as a healing supplication. book_candidates unrelated.
- W321: Arabic not verified against a primary corpus (al-Adab al-Mufrad not in corpus; no Six-Books parallel found).
- W321: Possibly a Companion's (mawquf) statement rather than a Prophetic dua — check al-Adab al-Mufrad 504 before labelling it a hadith of the Prophet ﷺ; description left null for that reason.
- W322: Arabic not verified against a primary corpus (Musnad Ahmad not in corpus; find.mjs found no Six-Books parallel for 'anta at-tabib').
- W322: WYN prints no grade; hadith_grade null.
- W323: Close to published 'sickness-for-healing' (sim 0.81) but a different narration/wording: that row is 'adhhibil-ba's ... la shifa'a illa shifa'uk' (A'ishah, Bukhari 5743/Muslim), this is Anas's 'mudhhibal-ba's ... la shafiya illa ant' (Bukhari 5742). Kept separate; admin may decide to merge.
- W324: WYN app reads 'yushfa bihi saqimuna'; Muslim 5719's main wording (Ibn Abi Umar) is 'li-yushfa bihi saqimuna' — the same hadith notes Ibn Abi Shaybah's narration has 'yushfa'. Corpus main wording used; Bukhari 5745 has 'yushfa saqimuna' (no 'bihi').
- W324: Placed twice in WYN's Healing collection (orders 154 and 174) — one row, two placements.
- W324: Not related to existing candidate 'bismillah' (sim 0.11).
- W325: Published 'quranic-for-ease-and-openness-of-heart' covers only 20:25-26; WYN's item adds 20:27, so kept as a separate row (admin could instead extend the existing row).
- W325: Excerpt spans three ayat (drops 'qala' at the start of 20:25), so arabic_basis is quran_excerpt with quran_refs 20:25-27.
- W325: Placed under WYN label 'For Warding Off Evil-Eye'. book_candidate WYN-0050 unrelated.
- W326: book_candidate WYN-0091 unrelated.
- W327: book_candidates (WYN-0083, WYN-0090, WYN-0116) are general Qur'an-recitation/other entries, not this passage; wyn_ids left empty.
- W328: Draft stub 'wyn-0117-rabbighfir-warham-wa-anta-khairur-rahimin' (WYN-0117) is 23:118 only (Istighfar section); this item is the full 23:115-118 passage, so kept separate and the stub was not filled. wyn_ids left empty.
- W328: WYN placement count '1' used as repeat_count.
- W329: Recitation practice (salam verses for magic) is WYN's ruqyah selection, not a narrated Prophetic practice; description phrased neutrally.
- W330: Recitation practice (salam verses for magic) is WYN's ruqyah selection, not a narrated Prophetic practice; description phrased neutrally.
- W331: Recitation practice (salam verses for magic) is WYN's ruqyah selection, not a narrated Prophetic practice; description phrased neutrally.
- W332: Recitation practice (salam verses for magic) is WYN's ruqyah selection, not a narrated Prophetic practice; description phrased neutrally.
- W333: Recitation practice (salam verses for magic) is WYN's ruqyah selection, not a narrated Prophetic practice; description phrased neutrally.
- W334: Recitation practice (salam verses for magic) is WYN's ruqyah selection, not a narrated Prophetic practice; description phrased neutrally.

</details>

### 23. Ayaat of Tranquility — `sakeenah`

WYN app: **6** · printed book: **no matching section** · IqraSpace before: **0 published** · after review: **6** in WYN order.

| # | Dua | Reference | Count | Status after sync | Verification | Slug |
|---|---|---|---|---|---|---|
| 1 | Tranquility in the Ark (2:248) | Qur'an 2:248 |  | new → review | unchecked | `wyn-sakinah-baqarah-248` |
| 2 | Tranquility sent down at Hunayn (9:26) | Qur'an 9:26 |  | new → review | unchecked | `wyn-sakinah-tawbah-26` |
| 3 | Tranquility in the cave: Allah is with us (9:40) | Qur'an 9:40 |  | new → review | unchecked | `wyn-sakinah-tawbah-40` |
| 4 | Tranquility in the believers' hearts (48:4) | Qur'an 48:4 |  | new → review | unchecked | `wyn-sakinah-fath-4` |
| 5 | Tranquility at the pledge under the tree (48:18) | Qur'an 48:18 |  | new → review | unchecked | `wyn-sakinah-fath-18` |
| 6 | Tranquility and the word of taqwa (48:26) | Qur'an 48:26 |  | new → review | unchecked | `wyn-sakinah-fath-26` |

<details><summary>Unresolved verification issues (5)</summary>

- W338: book_candidate WYN-0116 unrelated.
- W339: Telugu transliteration omitted: ayah is over ~600 Arabic characters.
- W339: book_candidates (WYN-0050, WYN-0097, WYN-0104) unrelated.
- W341: book_candidate WYN-0112 unrelated.
- W342: book_candidate WYN-0116 unrelated.

</details>

