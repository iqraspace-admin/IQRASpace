# Font assets

`AmiriQuran.ttf` is the font actually wired up in `pubspec.yaml`
(`flutter.fonts` -> family `AmiriQuran`) and referenced by
`AyahRichText`'s `fontFamily: 'AmiriQuran'`.

**Source:** Amiri Quran, the Uthmani-script cut of the Amiri typeface by
Khaled Hosny — https://github.com/aliftype/amiri.

**License:** SIL Open Font License 1.1 — see `OFL.txt` in this directory.
OFL permits bundling, embedding, and redistributing the font inside this
app at no cost and with no per-use restriction; the only requirements are
the standard reserved-font-name and no-selling-the-font-alone terms in
the license text itself.

Also present in this directory but **not yet wired into the app**
(no `pubspec.yaml` entry, no code reference):
- `Amiri-Regular.ttf`, `Amiri-Bold.ttf`, `Amiri-Italic.ttf`,
  `Amiri-BoldItalic.ttf` — the general Amiri family (not the Uthmani
  Quran cut). Candidate for UI chrome text (titles, buttons) if the app
  wants a different font there than the Mushaf text uses — a follow-up
  decision, not made in this pass.
- `AmiriQuranColored.ttf` — a variant with per-glyph coloring baked into
  the font itself. Not used here: this app applies Tajweed coloring in
  code (`TextSpan` colors driven by `TajweedParser`'s parsed rule tags),
  so it needs a plain, uncolored glyph outline to color per-span. Worth
  a second look only if a future pass wants font-level coloring instead
  of/alongside the API-driven rule coloring.

## Noto fonts (Supplications feature)

`NotoNaskhArabic.ttf`, `NotoSansTelugu.ttf`, and `NotoNastaliqUrdu.ttf`
back the Supplications feature (`lib/features/supplications`) — its
`arabic` field (always Naskh) and its script-switchable transliteration
line (Telugu script / Urdu-as-Arabic-script). None of the Amiri fonts
above cover Telugu or a Nastaliq Urdu cut, and Amiri Quran itself is a
Mushaf-specific Uthmani cut, not meant for general Arabic prose like
dua/hadith text.

**Source:** the Noto Fonts project (Google) —
https://github.com/notofonts/arabic (Naskh Arabic),
https://github.com/notofonts/telugu (Sans Telugu),
https://github.com/notofonts/nastaliq-urdu (Nastaliq Urdu). Each is a
variable font (single file, weight axis), pulled from the
`google/fonts` repo's `ofl/` directory.

**License:** SIL Open Font License 1.1 for each — see
`NotoNaskhArabic-OFL.txt`, `NotoSansTelugu-OFL.txt`, and
`NotoNastaliqUrdu-OFL.txt` in this directory.
