# Listening Mode audio architecture

## Why this exists

Listening Mode used to play a Surah by chaining per-ayah `just_audio`
`setUrl()` calls against Al Quran Cloud's combined-editions API — one
network fetch per ayah. Background/lock-screen support (`audio_service`)
was correctly wired, but audio still tended to stop when the phone locked:
the most likely cause was a mid-queue fetch for the *next* ayah stalling
once Android throttled the backgrounded/doze process, silently breaking
the chain.

The fix, for Listening Mode only: play one long-lived local Surah file
instead — the existing Al-Afasy recitation and Urdu-translation
recordings, hosted on Cloudflare R2 and cached on-device after first
play. **Reading + Listening Mode is unaffected** — it still plays
per-ayah audio from the Quran API, since that's what drives its
ayah-level highlight/sync (word/ayah-level local-file timing data doesn't
exist).

## A new, dedicated Cloudflare R2 bucket — not apps/quran's Supabase project

This is `apps/flutter`'s first-ever backend dependency (it was previously
"fully isolated," using only public, keyless APIs — see the root
`CLAUDE.md`). It deliberately uses its own object storage rather than
`apps/quran`'s Supabase project (or any Supabase project at all):

- `apps/quran/COST.md` and `ARCHITECTURE.md` explicitly reject
  self-hosting audio as "the single largest potential cost driver,"
  scoping that project's whole Supabase budget to "a few MB of small
  rows" (bookmarks/progress/prefs only).
- Reusing it for ~hundreds of MB of media would silently invalidate that
  documented decision and risk that project's free-tier budget.
- A separate bucket/project keeps both apps' cost models intact and
  isolates blast radius if this bucket's bandwidth ever grows.

This was originally built against a dedicated Supabase Storage-only
project, then migrated to Cloudflare R2 before shipping: R2 has no
per-object size limit (Supabase Storage's free tier caps a single object
at 50MiB, which is what originally forced 5 Surahs to be split into
parts — see "Splitting oversized Surahs" below), R2 has no egress/
bandwidth charges, and `iqraspace.org`'s DNS already lives on Cloudflare
(kept deliberately DNS-only/un-proxied for Vercel — see
`apps/quran/DEPLOYMENT.md` — R2 is unrelated to that and doesn't change
it), so adding R2 doesn't introduce a new vendor relationship. The 5
already-split Surahs were **not** re-merged as part of that migration —
their part files are already correct, verified audio; re-splitting/
merging them once the size limit no longer applied would have been
unnecessary rework.

## Cloudflare R2 setup (one-time, manual)

Done once via the Cloudflare dashboard, not scriptable:

1. Create the R2 bucket (`quran-audio`).
2. Create a scoped R2 API token (Object Read & Write, limited to this one
   bucket) — R2 > Manage API Tokens. Yields an Account ID, Access Key ID,
   and Secret Access Key.
3. Bind a **custom domain** to the bucket (e.g. `audio.iqraspace.org`) —
   the bucket's Settings > Public Access > Custom Domains. Cloudflare
   creates the DNS record for this subdomain itself; it does not touch
   `iqraspace.org`/`www`'s existing grey-cloud A-records (different
   hostname, no conflict). Never use the `r2.dev` dev subdomain for the
   shipped app — Cloudflare's own docs call it unsuitable for production
   (rate-limited, no SLA).
4. Set a CORS policy on the bucket allowing `GET`/`HEAD` — needed for
   Listening Mode on Flutter Web, which streams directly from the
   storage origin (no on-device cache there; see "On-device cache"
   below).

Fill the resulting four values plus the bucket name and public URL into
`apps/flutter/scripts/.env.local` (see `.env.local.example` in that
directory) before running `upload-audio-to-r2.mjs`.

## Storage layout

Public-read Cloudflare R2 bucket `quran-audio`, exposed via the custom
domain `audio.iqraspace.org`:
- `arabic/{surahNumber3digit}.mp3` — Al-Afasy recitation
- `arabic/{surahNumber3digit}_part{i}.mp3` — for a Surah split into
  sequential parts (see "Splitting oversized Surahs" below), instead of
  the plain path above
- `urdu/{surahNumber3digit}.mp3` — Urdu translation

This layout is unchanged from the original Supabase-hosted version — the
R2 migration was a lift-and-shift of bytes to a new backend, not a data
model change. Object names are always normalized to `{NNN}.mp3`
regardless of the local source filename (`upload-audio-to-r2.mjs`
handles both "004.mp3" and "001 Al Fatiha.mp3"-style local names) — the
bucket layout stays uniform even though `Resources/`'s own file naming
isn't.

### Splitting oversized Surahs (historical Supabase-era workaround)

Supabase Storage's free tier (the original backend for this bucket,
before the R2 migration above) capped a single Storage object at 50MiB.
5 of the 114 Al-Afasy recitation files exceed that (55-76MB — long
Surahs at a normal bitrate). `scripts/split-large-audio.mjs` splits each
into 2 sequential parts, safely under that now-historical limit — R2
itself has no per-object size limit, so no *new* Surah needs splitting
going forward, but these 5 Surahs' existing part files are kept as-is
(see "A new, dedicated Cloudflare R2 bucket" above for why they weren't
re-merged):

- Cut points are chosen at **real silence** in the recitation (via
  ffmpeg's `silencedetect`), nearest to the ideal even-split point — never
  mid-word/mid-ayah. (First attempt used too strict a silence threshold
  for this recording and found almost no candidates, forcing several
  fallback cuts at the exact ideal timestamp with no safety margin —
  caught before upload and fixed by loosening the threshold; see that
  script's comments for the exact numbers.)
- Cut with `-c copy` (stream copy, no re-encode) — no quality loss and no
  encoding-introduced boundary artifact for gapless playback to have to
  paper over.
- This is a **storage workaround only** — the Surah boundaries and
  verified audio content are unchanged; only *where the bytes are split*
  changes.

On the app side, `IqraAudioHandler.playSurahLocal` plays a Surah's part(s)
through one `ConcatenatingAudioSource` when there's more than one — gapless
on Android — with `just_audio`'s per-part-relative `position`/`duration`
reassembled into one continuous Surah-wide timeline (see that file's
`_priorPartsDuration`/`seek` for why: `just_audio` reports these
per-*currently-playing-part*, not pre-summed across a concatenated
sequence). The UI, lock-screen notification, and Settings cache all see
one Surah — nothing above `IqraAudioHandler` knows a Surah was ever split.

Public bucket objects are fetchable via a plain HTTPS GET
(`https://audio.iqraspace.org/{path}`) — no API key needed for reads, so
the app itself needs **no new dependency**: the existing `dio` client
does both the streaming URL and the on-device cache download (see
`lib/core/network/dio_client.dart`'s existing plain-`Dio` convention).

## Content pipeline (`scripts/`, not part of the shipped app)

Plain Node ESM scripts, mirroring `apps/quran/scripts/sync-content.mjs`'s
conventions (env-var-gated, fail-fast, clear logging):
1. `fetch-missing-alafasy.mjs` — fills gaps in `Resources/Al-Afasy
   Recitation` (repo root, gitignored) from quranicaudio.com.
2. `split-large-audio.mjs` — splits any Al-Afasy file over 50MiB into
   silence-cut parts (see "Splitting oversized Surahs" above), writing
   them plus a `split-manifest.json` (exact per-part durations) to
   `Resources/Al-Afasy Recitation/split/`.
3. `upload-audio-to-r2.mjs` — uploads `Resources/Al-Afasy Recitation`
   (whole files, or split parts for the Surahs `split-manifest.json`
   covers — never both) and `Resources/Urdu Audio (Surah-wise)` as-is to
   the bucket (R2 API token, `apps/flutter/scripts/.env.local` — never
   committed; see "Cloudflare R2 setup" above), skips already-uploaded
   Surahs/parts, writes `audio-manifest.json` with each Surah's public
   URL(s).

No transcoding step: `Resources/Urdu Audio (Surah-wise)` turned out to
already be mono/16kHz/24kbps (confirmed via `ffprobe` against the
largest file, Al-Baqara — a ~4h17m file at 24kb/s). A "compress before
upload" pass was tried first and made every file ~2.7x *bigger*
(24kbps -> 64kbps, exactly that ratio) before this was caught — the
originals are already smaller than any reasonable re-encode target, so
they're uploaded unchanged. The 587MB total is simply long total
recitation duration at an already-minimal bitrate, not an inflated
bitrate needing compression.

The Dart side doesn't read `audio-manifest.json` — the bucket's object
names are fully predictable (`{prefix}/{NNN}.mp3` or
`{prefix}/{NNN}_part{i}.mp3`), so `arabic_surah_audio.dart` /
`urdu_surah_audio.dart` just compute the URL from the Surah number
instead of storing 100+ literal strings. The one thing that *is* hand-
copied from `split-manifest.json` into `arabic_surah_audio.dart`'s
`_arabicSurahSplitParts` map is each split part's exact duration (needed
upfront for [seek]/progress across parts — see "Splitting oversized
Surahs" above) — the only place the app itself needs updating if a
Surah is newly split or a previously-split one is re-split differently.

## Lock screen: Listening Mode only

Reading + Listening Mode is **not** a background/lock-screen mode — it
plays per-ayah audio only while its reader screen is actively open, and
must pause immediately once it isn't (leaving the screen, or the app
backgrounding). Both modes share the one `AudioPlayer`/`IqraAudioHandler`
(no second player), so `IqraAudioHandler` splits its *broadcasts* instead:

- `playSurahLocal`/`playSupplementaryTrack` (Listening Mode) publish
  through the real, OS-facing `mediaItem`/`playbackState` —
  `audio_service`'s Android notification/foreground service is driven
  directly by these, so this is the only path that can ever put a player
  on the lock screen.
- `playAyah`/`playSurahAyahs` (Reading + Listening Mode) publish through
  a same-shape, plain-broadcast-stream pair instead —
  `inAppMediaItem`/`inAppPlaybackState` — that never reaches
  `audio_service`. `AudioController` listens to both pairs and merges
  them into the one `AudioPlaybackState` the UI (ayah highlighting, the
  play button, the mini-player) already reads, so nothing above
  `IqraAudioHandler` needs to know which pair an update came through.
  Switching modes explicitly clears whichever pair *isn't* current
  (`_enterPerAyahSession`/`_enterOsFacingSession`), so a Listening Mode
  notification can never linger once Reading + Listening starts, and
  vice versa.
- `surah_reader_screen.dart` proactively pauses Reading + Listening
  audio the moment its screen isn't the active one — on `dispose()`
  (navigating away) and on `didChangeAppLifecycleState` reaching
  `paused`/`hidden` (backgrounding while still on it). This is what
  actually keeps it from ever needing to survive backgrounding in the
  first place, rather than relying on Android to eventually kill it.

## Loading feedback and the Urdu-translation persistence fix

Tapping Play used to give no feedback at all while `AudioCacheManager`
downloaded an uncached Surah — `just_audio`'s own processing state only
starts reflecting reality once `setAudioSource` is called, which is
*after* that download, so a slow connection looked identical to a frozen
app. `IqraAudioHandler` now publishes an explicit "loading" state the
instant a `play*` method is called (`_publishLoading`), before any
network/cache work, and an "error" state (`_publishError`) if the load
fails — including a genuine network stall, now caught by
`AudioCacheManager`'s Dio `receiveTimeout` (20s of *no bytes at all*, not
a cap on total download time, so a slow-but-progressing download isn't
killed). `surah_reader_screen.dart`'s Play button shows a spinner while
loading (disabled — no second tap can start a conflicting attempt) and a
retry icon on error.

Selecting "Recitation + Urdu Translation" used to silently stop applying
after navigating to another Surah before the first one's Arabic portion
finished. The cause: the Urdu follow-up was armed by a `ref.listenManual`
subscription owned by the reader screen's widget — which Riverpod
disposes the moment that screen is replaced (Next/Previous/Jump-to-Surah
all do this immediately), silently killing the pending follow-up before
it could ever fire. `IqraAudioHandler._advanceQueueOrStop` now decides
this itself, reading the `listeningTrack` preference fresh from Hive at
the exact moment the Arabic portion finishes — independent of any
screen's lifetime, and always reflecting whatever is *currently*
selected, even if it changed mid-playback.

## On-device cache

`lib/core/audio/audio_cache_manager.dart` — native only (Android; web has
no persistent app-writable filesystem, so it streams directly from
Cloudflare R2 every time, same as before this cache existed). First
play downloads to a `.part` file and only marks it "cached" (a Hive
`audio_file_cache` box entry: key -> local file path) after a successful
rename — an interrupted/killed download can never leave a corrupt file
marked complete. Every later play of the same Surah reads straight off
disk, no network call. A Settings entry (Audio & Recitation sheet) shows
cache size and can clear it.
