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
