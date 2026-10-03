# WYN vs IQS Dua-level Reconciliation

Generated 2026-10-03T09:01:24.152Z. Inputs: 178-entry Wa Iyyaka Nastaeen inventory, `apps/mobile/android/assets/supplications.json` (25 categories, 106 duas).

## 1. Status counts

| WYN match_status | Count |
|---|---|
| exact_match | 19 |
| same_dua_diff_category | 24 |
| same_source_incomplete_text | 8 |
| similar_not_same | 17 |
| missing | 110 |
| wyn_revised_specific | 0 |
| **total** | **178** |

| IQS match_status | Count |
|---|---|
| not_in_wyn | 62 |
| exact_match | 19 |
| iqs_data_error | 5 |
| similar_not_same | 5 |
| same_dua_diff_category | 13 |
| same_source_incomplete_text | 2 |
| **total** | **106** |

IQS duas with at least one WYN counterpart: 44; with none: 62. WYN entries that are instruction/narration rather than recitations: 23. WYN entries with confidence low: 16; needs_review: 24; verified=true: 25.

### Method notes

- Dua-level reconciliation, not a count comparison. Candidates were found by reading both lists side by side (WYN printed transliteration opening + hadith/Quran reference + occasion vs IQS transliteration_latin, Arabic with diacritics stripped, reference and occasion); every pair was judged manually. No Arabic text, hadith number or grade was invented: all reference/grade fields restate the inventory CSV.
- The WYN inventory holds transliterated opening words only (no Arabic), so Arabic completeness can only be assessed from the IQS side; "shorter_than_wyn" judgements rest on the continuation visible in the WYN opening words ("...") and are medium confidence.
- WYN match_status: exact_match = same dua in an IQS category thematically equal to the WYN section (morning/evening, sickness, grief, repentance, anxiety, faith, knowledge); same_dua_diff_category = same dua exists in IQS under a different category; same_source_incomplete_text = same dua/hadith exists but IQS Arabic is truncated or shorter; similar_not_same = IQS has a related but different dua; missing = no IQS counterpart. wyn_revised_specific = 0: no input attributes any of the 178 entries to the revised edition only (the 178 are the 2013 English 1st edition, cross-checked against Urdu 2014).
- IQS rows use the same codes plus iqs_data_error (the five verified truncations: evening#2, sleep#2, evening#3, sleep#3, knowledge#2) and not_in_wyn (no counterpart in the 178-entry inventory). A WYN entry may link to one IQS dua while one IQS dua links to several WYN entries (e.g. the three Quls); iqs_secondary_keys lists additional IQS duas that carry the same recitation.
- Instruction/narration entries (Entry Type "Instruction/practice" or "Hadith narration only") are not recitations; where IQS has no counterpart they are status missing with a note to decide whether to model them as practice notes.
- verified=true only when the inventory Verification Status is VERIFIED, the IQS match is high confidence, status is exact_match or same_dua_diff_category, and the IQS reference collection (or Qur'an verse) overlaps the WYN printed reference.
- proposed_iqs_category_slug: existing IQS ids where IQS already has an equivalent category (morning, evening, faith, sickness, grief, knowledge); new kebab-case slugs mirror the inventory sections. istighfar vs IQS repentance, and relief-from-distress vs IQS anxiety, overlap conceptually - owner decision whether to rename/merge rather than create parallel categories. Morning/Evening entries not matched to an IQS morning/evening dua get morning-and-evening (a combined category does not exist in IQS).
- Scope caveat: the 178-entry inventory (English 2013 1st edition) has no Travel (Safar) section, while the audit workbook's 197 structural entries (Urdu 2014) include a 23-item Safar section. IQS travel#0-5 therefore show not_in_wyn here, which does not mean they are surplus.
- Within WYN itself the same dua is listed more than once (0017/0134 Sayyid al-Istighfar, 0150/0158 Yunus dua, 0096/0104 adhhibil ba's, 0066/0080, 0095/0103, 0041/0173, 0133/0169, and the tahlil formula 0022/0031/0082/0177); WYN-side deduplication is only noted here, not done.

## 2. Per-section table (22 WYN sections of the inventory)

"Exact" and "Incomplete text" are matched in an equivalent IQS category; "Partial" = similar_not_same.

| WYN section | Entries | Exact | Incomplete text | Same dua, other category | Partial | Missing | Proposed slug |
|---|---|---|---|---|---|---|---|
| Hamd o Sana (Praise and Glorification) | 2 | 0 | 0 | 0 | 0 | 2 | hamd-o-sana |
| Durood Sharif (Peace and Blessings upon the Messenger) | 2 | 0 | 0 | 1 | 1 | 0 | durood-sharif |
| Morning and Evening Adhkar | 21 | 6 | 4 | 1 | 0 | 10 | morning-and-evening, evening, morning |
| Protection and Safety | 22 | 0 | 0 | 2 | 1 | 19 | protection-and-safety |
| Protection from Enemies | 6 | 0 | 0 | 0 | 0 | 6 | protection-from-enemy |
| Night Protection | 2 | 0 | 1 | 0 | 1 | 0 | night-protection |
| Fright during Sleep (Fear) | 2 | 0 | 0 | 0 | 2 | 0 | bad-dream |
| Bad Dreams | 2 | 0 | 0 | 0 | 0 | 2 | bad-dream |
| Waswasa / Evil Whisperings | 9 | 1 | 0 | 1 | 3 | 4 | faith |
| Evil Eye / Nazar | 5 | 0 | 0 | 1 | 1 | 3 | evil-eye |
| Protection from Magic (Black Magic) | 9 | 0 | 0 | 2 | 1 | 6 | protection-from-magic |
| Protection from Jinn and Shaytan | 7 | 0 | 0 | 5 | 0 | 2 | jinn-and-shayateen |
| Healing | 8 | 2 | 0 | 0 | 1 | 5 | sickness |
| Visiting the Sick | 7 | 2 | 0 | 0 | 0 | 5 | visiting-the-sick |
| Trials and Adversity (seeing someone in illness/trial) | 1 | 0 | 0 | 0 | 0 | 1 | trials-and-adversity |
| Trials and Adversity (receiving unfortunate news) | 1 | 1 | 0 | 0 | 0 | 0 | grief |
| Forgiveness for the Deceased | 7 | 2 | 1 | 0 | 0 | 4 | deceased-maghfirat |
| Istighfar (Seeking Forgiveness) | 28 | 3 | 0 | 4 | 2 | 19 | istighfar |
| Sorrow and Distress | 15 | 2 | 1 | 0 | 2 | 10 | relief-from-distress |
| Accepted Duas | 6 | 0 | 0 | 1 | 0 | 5 | maqbool-duain |
| Post-Salah Adhkar | 15 | 0 | 0 | 6 | 2 | 7 | after-salah |
| Istikhara | 1 | 0 | 1 | 0 | 0 | 0 | knowledge |

## 3. Proposed category slugs (WYN entries per slug)

| Slug | New or existing | WYN entries |
|---|---|---|
| istighfar | new | 28 |
| protection-and-safety | new | 22 |
| relief-from-distress | new | 15 |
| after-salah | new | 15 |
| morning-and-evening | new | 11 |
| faith | existing | 9 |
| protection-from-magic | new | 9 |
| sickness | existing | 8 |
| jinn-and-shayateen | new | 7 |
| visiting-the-sick | new | 7 |
| deceased-maghfirat | new | 7 |
| protection-from-enemy | new | 6 |
| maqbool-duain | new | 6 |
| evening | existing | 5 |
| morning | existing | 5 |
| evil-eye | new | 5 |
| bad-dream | new | 4 |
| hamd-o-sana | new | 2 |
| durood-sharif | new | 2 |
| night-protection | new | 2 |
| trials-and-adversity | new | 1 |
| grief | existing | 1 |
| knowledge | existing | 1 |

## 4. IQS duplicates

| Duplicate | Canonical copy | Kind | Evidence |
|---|---|---|---|
| sleep#2 | evening#2 | truncated_same_verse | Ayat al-Kursi: evening#2 Arabic is the first clause of the verse, sleep#2 the same clause plus "..." - both truncated forms of Qur'an 2:255. |
| sleep#3 | evening#3 | same_canonical_text_partial | Same canonical content (the three Quls: Ikhlas, Falaq, Nas). evening#3 holds only Ikhlas v1; sleep#3 holds the three surah opening words only; sleep#3 adds the blow-and-wipe practice. |
| hajj#3 | hajj#2 | identical_arabic_different_occasion | Identical Arabic after stripping diacritics (La ilaha illallahu wahdahu...qadir); different occasion (Arafah vs Safa/Marwa) and reference (Tirmidhi vs Muslim). |
| food#0 | wudu#0 | identical_arabic_different_occasion | Identical Arabic "Bismillah" after stripping diacritics; different occasions (before eating vs before wudu). Generic basmala reused by design. |
| faith#1 | anger#0 | identical_arabic_different_occasion | Identical Arabic "A'udhu billahi minash shaitanir rajim" after stripping diacritics; different occasions (whispers in prayer vs anger). |

Related but not duplicates: morning#0/evening#0 (morning vs evening wording of one dua), market#0 (longer variant of the tahlil in hajj#2/#3).

## 5. IQS issues

Dataset-wide: all 106 entries have transliteration_urdu identical to the Arabic; there is no translation_urdu field; 10 entries lack occasion_urdu; nearly every reference is a collection name without hadith number or grade.

Per entry (excluding the dataset-wide items):

| IQS key | Issues | Status |
|---|---|---|
| morning#0 | Count embedded in occasion text: "(x1)" | exact_match |
| evening#0 | Count embedded in occasion text: "(x1)" | exact_match |
| evening#2 | Ayat al-Kursi truncated after "la ta'khudhuhu sinatun wa la nawm"; translation says "(recited in full)" | iqs_data_error |
| evening#3 | Three Quls entry holds only Al-Ikhlas v1 in Arabic ("Qul huwa-llahu ahad..."); Falaq and Nas absent; "x3 each" embedded in occasion text | iqs_data_error |
| sleep#2 | Arabic ends with "..." (truncated); Ayat al-Kursi truncated to first clause + "..." | iqs_data_error |
| sleep#3 | Three Quls entry holds only the opening words of each surah, not the surahs | iqs_data_error |
| salah#6 | Hisnul Muslim chapter marker embedded in occasion | not_in_wyn |
| salah#8 | Hisnul Muslim chapter marker "(ch.21)" embedded in occasion | not_in_wyn |
| salah#9 | Repeat counts embedded in transliteration/Arabic text; Hisnul Muslim chapter marker "(ch.25)" embedded in occasion | same_dua_diff_category |
| home#4 | Reference is descriptive, not a source: "General Sunnah practice" | not_in_wyn |
| food#5 | Hisnul Muslim chapter marker "(ch.72)" embedded in occasion | not_in_wyn |
| dressing#1 | Category misfit: toilet dua filed under Dressing & appearance | same_dua_diff_category |
| dressing#2 | Category misfit: toilet dua filed under Dressing & appearance | not_in_wyn |
| travel#3 | Hisnul Muslim chapter marker "(ch.96)" embedded in occasion | not_in_wyn |
| travel#4 | Hisnul Muslim chapter marker "(ch.100)" embedded in occasion | not_in_wyn |
| travel#5 | Hisnul Muslim chapter marker "(ch.101)" embedded in occasion | not_in_wyn |
| weather#5 | Hisnul Muslim chapter marker "(ch.66)" embedded in occasion | not_in_wyn |
| anxiety#0 |  | same_source_incomplete_text |
| anger#1 | Category misfit: debt-relief dua filed under Anger & difficulty | not_in_wyn |
| sickness#0 | Arabic spelled with an alef-with-sukun in al-ba's - check orthography | exact_match |
| sickness#1 | Repeat counts embedded in transliteration/Arabic text | exact_match |
| grief#2 |  | same_source_incomplete_text |
| grief#5 | Hisnul Muslim chapter marker "(ch.54)" embedded in occasion; Contains "[name]" placeholder | exact_match |
| grief#6 | Hisnul Muslim chapter marker "(ch.58)" embedded in occasion | not_in_wyn |
| knowledge#2 | Istikhara Arabic stops at "wa anta allamul ghuyub"; continuation naming the matter and asking khayr/sarf is absent (translation notes it) | iqs_data_error |
| hajj#1 | Reference mixes Qur'an verse and hadith collection: "Qur'an 2:201, Abu Dawud" | not_in_wyn |
| social#0 | Reference is descriptive, not a source: "Sunnah greeting" | not_in_wyn |
| social#4 | Hisnul Muslim chapter marker "(ch.77)" embedded in occasion | not_in_wyn |
| social#5 | Hisnul Muslim chapter marker "(ch.86)" embedded in occasion; Reference is descriptive, not a source: "General Sunnah reply" | not_in_wyn |
| social#6 | Hisnul Muslim chapter marker "(ch.87)" embedded in occasion | not_in_wyn |
| social#7 | Hisnul Muslim chapter marker "(ch.89)" embedded in occasion | not_in_wyn |
| social#8 | Hisnul Muslim chapter marker "(ch.94)" embedded in occasion | not_in_wyn |
| quranic#0 |  | same_dua_diff_category |
| faith#0 | Hisnul Muslim chapter marker "(ch.40)" embedded in occasion | similar_not_same |
| faith#1 | Hisnul Muslim chapter marker "(ch.45)" embedded in occasion | exact_match |

Proposed repeat counts (only where existing text states one):

| IQS key | Count | Evidence |
|---|---|---|
| morning#0 | 1 | occasion "Morning remembrance (x1)" |
| morning#3 | 3 | occasion "Protection, said 3 times" |
| evening#0 | 1 | occasion "Evening remembrance (x1)" |
| evening#3 | 3 | occasion "The three Quls (Ikhlas, Falaq, Nas), x3 each" (3 per surah) |
| sleep#3 | 3 | translation "...wipe over as much of the body as possible - repeated three times" |
| witr#1 | 3 | translation "(said three times, prolonging the voice on the third)" |

Not convertible to a single count: salah#9 (Counts embedded in text: "(x3)" applies to Astaghfirullah only; no count for the rest - not a single entry-level count.) ; sickness#1 (Two different counts in one entry: Bismillah (x3), a'udhu... (x7) - cannot be a single repeat_count.) ; faith#1 ("three times" refers to the dry spitting to the left, not to the recitation count.)

## 6. NEEDS MANUAL VERIFICATION (low-confidence or unsure judgements)

| WYN id | Title | Proposed IQS key | Status (confidence) | Reason |
|---|---|---|---|---|
| WYN-0003 | Allahumma salli 'ala Muhammadi(n)w wa 'ala ali Muhammad | salah#7 | similar_not_same (low) | Short salawat on the Prophet and his family. IQS salah#7 (Salat Ibrahimiyyah) starts with the same words but is the longer Ibrahimic form. Inventory flags the printed N 1293 reference as a mismatch in source. / Inventory: REFERENCE CHECK: Printed N 1293 resolves to Abu Sa'id al-Khudri's salawat narration (sunnah.com confirmed). The Zaid bin Kharijah narration the book describes is Sunan an-Nasa'i 1292. Requires verification of the book's numbering. |
| WYN-0022 | La ilaha illAllahu wahdahu la sharika lahu, lahul mulku wa lahul hamdu | hajj#2 | same_dua_diff_category (low) | Generic tahlil formula (La ilaha illallah wahdahu...lahu al-mulk...). Same text exists in IQS only under Hajj (hajj#2/#3) with a different occasion; WYN uses it as a morning/evening dhikr. Same formula recurs in WYN-0031, 0082, 0177. |
| WYN-0031 | La ilaha illAllahu wahdahu la sharika lahu... | hajj#2 | same_dua_diff_category (low) | Tahlil formula (opening words only in WYN). IQS has the same formula only under Hajj; the 100-times count of the cited hadith is not in IQS. |
| WYN-0041 | Allahumma inni a'udhu bika min 'adhabil qabri... min 'adhabin nari...  | salah#5 | similar_not_same (medium) | Refuge from punishment of the grave/Fire/trials/Dajjal in the Ahmad wording (same text as WYN-0173). IQS salah#5 is the Muslim wording (jahannam, qabr, mahya wal mamat, masih dajjal): different narration, not the same text. |
| WYN-0054 | Amanar rasulu bima unzila ilaihi mir rabbihi (end of Surah al-Baqarah, | quranic#1 | similar_not_same (low) | WYN: last two verses of al-Baqarah (2:285-286) for night protection. IQS quranic#1 is only the supplication within 2:286 (Rabbana la tu'akhidhna), not the two-verse recitation. |
| WYN-0056 | A'udhu bi kalimatillahit tammati min ghadabihi wa 'iqabihi wa sharri ' | evening#1 | similar_not_same (medium) | Shares the opening phrase "A'udhu bi kalimatillahit tammati" but is a different dua ("min ghadabihi wa iqabihi..."). |
| WYN-0057 | A'udhu bi kalimatillahit tammatil lati la yujawizu hunna barrun wa la  | evening#1 | similar_not_same (medium) | Shares the opening phrase "A'udhu bi kalimatillahit tammatil lati la yujawizu hunna barrun wa la fajir" - different dua from evening#1. |
| WYN-0060 | Command to seek refuge with Allah - Qur'anic verse printed (wa imma ya | faith#1 | similar_not_same (low) | Instruction/verse (Q 41:36) commanding refuge-seeking from waswasa; IQS faith#1 is the a'udhu practice, not the verse. |
| WYN-0061 | Belief with conviction that there will be no reckoning upon whispering | faith#0 | similar_not_same (low) | Instruction to hold conviction that whisperings are not held against one; IQS faith#0 ("Amantu billahi wa rusulih") is related in theme but appears to be a different item. Needs manual check. |
| WYN-0062 | Read A'udhubillah excessively | faith#1 | similar_not_same (low) | Instruction to recite a'udhubillah excessively against waswasa; IQS faith#1 / anger#0 carry the a'udhu text for other occasions. |
| WYN-0064 | Recite Surah al-Ikhlas and Mu'awwidhatain | evening#3 | same_dua_diff_category (low) | Instruction: recite Ikhlas and the Mu'awwidhatain against waswasa. The three Quls exist in IQS only under morning/evening (and sleep) with a different purpose. |
| WYN-0070 | Recite Al-Fatihah, Al-Ikhlas and Mu'awwidhatain | evening#3 | similar_not_same (low) | Instruction: recite Al-Fatihah, Al-Ikhlas and Mu'awwidhatain for evil eye. Overlaps the IQS three-Quls entry but adds Al-Fatihah and a different purpose. |
| WYN-0075 | Recite Ayat al-Kursi and Mu'awwidhat (Ikhlas, Falaq, Nas) in morning,  | evening#2 | same_dua_diff_category (low) | Instruction: recite Ayat al-Kursi and the three Quls morning/evening/before bed (as protection from magic). Corresponds to IQS evening#2, evening#3, sleep#2, sleep#3 collectively. |
| WYN-0076 | Recite the last two verses of al-Baqarah every night | quranic#1 | similar_not_same (low) | Instruction: recite last two verses of al-Baqarah nightly. IQS quranic#1 holds only one supplication from 2:286. |
| WYN-0082 | La ilaha illAllahu wahdahu la sharika lahu, lahul mulku wa lahul hamdu | hajj#2 | same_dua_diff_category (low) | Tahlil formula, 100 times (Muslim). IQS has the formula only under Hajj with no count. |
| WYN-0089 | When changing clothes: Bismillah | wudu#0 | same_dua_diff_category (low) | WYN: say "Bismillah" when changing clothes. IQS has the same one-word text for other occasions only (wudu#0, food#0); the clothing occasion is not in IQS. |
| WYN-0097 | Imsahil ba'sa Rabban nas biyadikash shifa'u la yakshiful karba illa an | sickness#0 | similar_not_same (medium) | "Imsahil ba'sa Rabban nas biyadikash shifa'" is a sibling formula of IQS sickness#0, not the same wording. |
| WYN-0122 | Subhanaka wa bihamdika astaghfiruka wa atubu ilaik | social#2 | similar_not_same (medium) | Shorter form "Subhanaka wa bihamdika astaghfiruka wa atubu ilaik" (Muslim) vs the fuller gathering expiation in IQS social#2; different narration. |
| WYN-0124 | Allahummaghfirli warhamni wahdini warzuqni | salah#3 | similar_not_same (medium) | Shorter "Allahummaghfirli warhamni wahdini warzuqni" (Muslim); IQS salah#3 (between prostrations) is a longer sibling. |
| WYN-0145 | HasbunAllahu wa ni'mal Wakil | anxiety#2 | similar_not_same (medium) | "Hasbunallahu wa ni'mal wakil" (Q 3:173) vs IQS anxiety#2 "Hasbiyallahu la ilaha illa huwa" - different dua. |
| WYN-0146 | Allahummaghfirli warhamni wa 'afini warzuqni | salah#3 | similar_not_same (low) | Shorter sibling of IQS salah#3 (Tirmidhi 3524 wording not in IQS). |
| WYN-0167 | Rabbi qini 'adhabaka yawma tub'athu 'ibadak | sleep#1 | similar_not_same (low) | "Rabbi qini adhabaka yawma tub'athu ibadak" (Muslim, after salah) vs IQS sleep#1 "Allahumma qini adhabaka yawma tab'athu ibadak" (before sleep, Abu Dawud/Tirmidhi). Same core wording, different vocative, source and occasion - needs manual check. |
| WYN-0173 | Allahumma inni a'udhu bika min 'adhabil qabri... min 'adhabin nari...  | salah#5 | similar_not_same (medium) | Ahmad wording (same text as WYN-0041); IQS salah#5 is the Muslim wording. |
| WYN-0177 | La ilaha illAllahu wahdahu la sharika lahu, lahul mulku wa lahul hamdu | hajj#2 | same_dua_diff_category (low) | Tahlil formula x10 after salah (al-Albani). IQS has the formula under Hajj with no count. |

Also needs manual check: medium-confidence "shorter text" judgements (WYN-0111, WYN-0121, WYN-0152) and reference mismatches flagged by the inventory (WYN-0003, WYN-0034, WYN-0131, WYN-0139, WYN-0163, WYN-0166, WYN-0178).
