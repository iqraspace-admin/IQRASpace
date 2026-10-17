# Wa Iyyaka Nastaeen (WYN) → IqraSpace Duas

This folder holds the reviewed mapping that makes IqraSpace's WYN categories mirror the
**Wa Iyyaka Nastaeen** app (Al-Huda International, Dr. Farhat Hashmi) — same 23 categories, same
Duas, same order and repetition counts — and the workflow that gets it into the Learning D1
database **without publishing anything unreviewed**.

| File | What it is |
|---|---|
| `catalog.json` | The mapping: 23 WYN categories, every Dua (insert / fill a WYN stub / reuse an existing row), every placement in WYN order, proposed corrections to existing rows, documented exclusions, and open issues. |
| `AUDIT.md` | Category-by-category audit report (counts, what was added, corrections, unresolved verification issues). |
| `../../scripts/duas-wyn-sync.mjs` | `check` / `plan` / `sql` CLI (`npm run duas:wyn -- <cmd>`). Logic in `scripts/duas-wyn/sync-lib.mjs`, tests in `scripts/duas-wyn/sync.test.mjs` (part of `npm run test:duas`, which CI runs). |

## Sources and what is (not) copied

- **WYN structure** (categories, which Duas, order, counts, printed references) comes from the app's
  bundled content database (Android v3.3.7, `com.alhuda.duas.iyykanastaeen`, versionCode 35), cross-checked
  against the printed books (English 1st ed. 2013; Urdu 6th ed. 2014 — the Al-Huda PDF
  `AIWF-eBooks-004-Wa_Iyyaka_Nastain_Subh_o_Shaam_Kay_Azkaar_o_Hifazat_Ki_Duaain.pdf` is that Urdu edition).
- **Qur'anic text**: Tanzil Uthmani, Saheeh International (EN), Maududi (UR), en.transliteration — via
  Al Quran Cloud, the same provider the Flutter app uses (not the Quran app's Quran Foundation content,
  whose licence limits caching to one week).
- **Hadith Arabic**: copied from the fawazahmed0 hadith-api Arabic editions (Darussalam numbering, the
  numbering WYN prints) and machine-checked to be contained in the cited hadith. Where the collection is
  not in that corpus (Musnad Ahmad, Tabarani, al-Hakim, Ibn Hibban, Silsilah, …) WYN's Arabic is used and
  the row is marked `needs_review`.
- **Translations / transliterations of hadith Duas** (EN, UR, Latin, Telugu) are IqraSpace drafts.
  WYN's own translations, transliterations and narration texts are Al-Huda's copyrighted work and are
  **not** reproduced. The schema has no Telugu *translation* column — Telugu is a transliteration (reading aid).

## Safety rules (enforced by `sync-lib.mjs`, covered by tests)

1. New Duas are inserted with status **`review`** — never `published`. Re-running never overwrites them,
   so edits made in the admin review queue survive.
2. Existing WYN stub drafts are filled only while still `draft`, then move to `review`.
3. A **published** Dua is never changed — except by an explicit correction (`--with-corrections`), which
   applies only if the field still holds the exact value that was audited.
4. Categories not in the WYN set keep their order, after WYN's 23. Duas already in a WYN category that
   WYN does not list are kept, after WYN's sequence. Nothing is deleted.
5. Every change writes a `dua_audit_log` row (`changed_by = script:duas-wyn-sync`), so it shows in
   `/learning/admin/duas/activity` and can be reverted from there.
6. `plan` refuses (exit 1) if a published row would change without approval.

## Workflow (owner)

All commands from `apps/learning`. Steps 1–5 touch only your local D1.

1. **Check** the catalog: `npm run duas:wyn -- check`
   **Local D1 note:** since `wrangler.jsonc` got the production `database_id`, wrangler's local D1 is a
   new file (empty until you load it); data imported before that sits in an older
   `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite`. Load the current local D1 first
   (`npm run db:migrate:local`, then your data, e.g. the cutover `.migration/d1-import.sql`), or dry-run
   against the old file with `plan --db <that file>`.
2. **Dry-run** against local D1: `npm run duas:wyn -- plan` — reports categories added/renamed, Duas
   inserted/filled, placements, and confirms `0 published rows changed`.
3. **Apply locally**:
   `npm run duas:wyn -- sql --out .wrangler/wyn.sql` then
   `npx wrangler d1 execute iqraspace-learning --local --file .wrangler/wyn.sql`
4. **Review** in the admin UI (`npm run dev:api` + `npm run dev`):
   `/learning/admin/duas/list?status=review` — read each Dua against `AUDIT.md`'s issues for its category,
   fix what's wrong in the editor, set `verification_status` to `verified` once a scholar has checked it.
5. **Approve / publish** — either per Dua in the editor (status → Published), or list approved slugs
   (one per line, `#` comments allowed) in a file and run
   `npm run duas:wyn -- plan --publish approved.txt`, then `sql --out … --publish approved.txt`.
   Only `review` rows with Arabic, an English translation and a source reference are published.
   Proposed fixes to **already published** rows are listed in `AUDIT.md` ("Corrections"); after reading
   them add `--with-corrections`.
6. **Production** (owner only; deploys and remote writes never run from CI or an agent session):
   `npx wrangler d1 export iqraspace-learning --remote --output prod.sql`,
   `npm run duas:wyn -- plan --dump prod.sql [same flags]` to dry-run against an exact copy of production, then
   `npx wrangler d1 execute iqraspace-learning --remote --file .wrangler/wyn.sql`.
7. The site (`/duas`) and the Flutter app pick up published changes from the feed automatically (site
   within ~1–2 minutes). Before the next Flutter release refresh the bundled offline copy:
   `cd ../mobile/android && node scripts/refresh-bundled-duas.mjs`.

## Regenerating the catalog

`catalog.json` was built from the WYN app database plus per-Dua resolution (match to an existing row or
source the text), with every corpus-sourced Arabic re-verified by script. If WYN changes, rebuild it
the same way and re-run `check` and `test:duas`; the tests assert 23 categories, WYN order, and
`placements + documented exclusions = WYN's count` for every category.
