// Fetches the authoritative source texts used to correct truncated Duas and
// writes them to data/verified_sources.json (committed, so builds are offline
// and reproducible). Run:  node fetch_sources.mjs
//
//  * Qur'an Arabic  -> IqraSpace's own synced dataset (apps/quran, text_uthmani)
//  * Qur'an English -> Al Quran Cloud edition en.sahih (the same edition the
//                      Flutter reader already shows)
//  * Qur'an translit-> Al Quran Cloud edition en.transliteration
//  * Istikhara Arabic -> Sahih al-Bukhari 1166 (fawazahmed0 hadith-api, ara-bukhari)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const quranDir = join(here, '..', '..', '..', 'quran', 'src', 'content', 'generated', 'surah');

const get = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
};

const quranArabic = (surah, from, to) => {
  const s = JSON.parse(readFileSync(join(quranDir, `${surah}.json`), 'utf8'));
  return s.verses
    .filter((v) => v.verse_number >= from && v.verse_number <= to)
    .map((v) => v.text_uthmani.trim());
};

const edition = async (surah, ed) => {
  const j = await get(`https://api.alquran.cloud/v1/surah/${surah}/${ed}`);
  return j.data.ayahs.map((a) => ({ n: a.numberInSurah, text: a.text }));
};

const passages = {
  'ayat-al-kursi': [{ surah: 2, from: 255, to: 255 }],
  'al-ikhlas': [{ surah: 112, from: 1, to: 4 }],
  'al-falaq': [{ surah: 113, from: 1, to: 5 }],
  'an-nas': [{ surah: 114, from: 1, to: 6 }],
};

const out = { generated_at: new Date().toISOString(), quran: {}, hadith: {} };
for (const [key, parts] of Object.entries(passages)) {
  const p = parts[0];
  const [en, tr] = await Promise.all([edition(p.surah, 'en.sahih'), edition(p.surah, 'en.transliteration')]);
  const sel = (arr) => arr.filter((a) => a.n >= p.from && a.n <= p.to).map((a) => a.text.trim());
  out.quran[key] = {
    surah: p.surah,
    ayah_from: p.from,
    ayah_to: p.to,
    arabic_uthmani: quranArabic(p.surah, p.from, p.to),
    english_sahih: sel(en),
    transliteration: sel(tr),
    sources: {
      arabic: 'apps/quran/src/content/generated/surah/*.json (text_uthmani, Quran Foundation content API)',
      english: 'Al Quran Cloud en.sahih (Saheeh International)',
      transliteration: 'Al Quran Cloud en.transliteration',
    },
  };
}

const b = await get('https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari/1166.json');
out.hadith['bukhari-1166'] = {
  collection: 'Sahih al-Bukhari',
  number: 1166,
  arabic_full: b.hadiths[0].text,
  source: 'fawazahmed0/hadith-api ara-bukhari (jsDelivr)',
};

// Additional single-passage Qur'anic entries from the Wa Iyyaka reconciliation (drafts only).
out.quran_ranges = {};
try {
  const recon = JSON.parse(readFileSync(join(here, 'reports', 'wyn_reconciliation.json'), 'utf8'));
  const wanted = new Set();
  for (const w of recon.wyn) {
    if (w.match_status !== 'missing') continue;
    const ms = [...String(w.quran_ref).matchAll(/Q (\d+):(\d+)(?:-(\d+))?/g)];
    if (ms.length === 1) wanted.add(`${ms[0][1]}:${ms[0][2]}-${ms[0][3] ?? ms[0][2]}`);
  }
  const cache = {};
  for (const key of wanted) {
    const [, s, f, t] = key.match(/(\d+):(\d+)-(\d+)/);
    cache[s] ??= await edition(+s, 'en.sahih');
    out.quran_ranges[key] = {
      arabic_uthmani: quranArabic(+s, +f, +t),
      english_sahih: cache[s].filter((a) => a.n >= +f && a.n <= +t).map((a) => a.text.trim()),
    };
  }
} catch (e) {
  console.warn('no reconciliation report yet; skipping quran_ranges', e.message);
}

// Urdu translation of Qur'anic passages: ur.maududi, the same Urdu edition the Flutter Quran reader shows.
out.urdu_maududi = {};
try {
  const canon = JSON.parse(readFileSync(join(here, 'data', 'canonical_duas.json'), 'utf8'));
  const cache = {};
  for (const d of canon.duas) {
    for (const r of d.quran_refs) {
      const key = `${r.surah}:${r.ayah_from}-${r.ayah_to}`;
      if (out.urdu_maududi[key]) continue;
      cache[r.surah] ??= await edition(r.surah, 'ur.maududi');
      out.urdu_maududi[key] = {
        urdu: cache[r.surah].filter((a) => a.n >= r.ayah_from && a.n <= r.ayah_to).map((a) => a.text.trim()),
        source: 'Al Quran Cloud ur.maududi (Tafheem ul Quran, as used by the Flutter reader)',
      };
    }
  }
} catch (e) {
  console.warn('skipping urdu_maududi', e.message);
}

writeFileSync(join(here, 'data', 'verified_sources.json'), JSON.stringify(out, null, 2));
console.log('wrote data/verified_sources.json');
for (const [k, v] of Object.entries(out.quran)) {
  console.log(k, `${v.surah}:${v.ayah_from}-${v.ayah_to}`, 'ayat', v.arabic_uthmani.length, v.english_sahih.length, v.transliteration.length);
}
