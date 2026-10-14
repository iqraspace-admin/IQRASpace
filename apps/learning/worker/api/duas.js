// Public, published-only Duas feed:
//   GET /learning/api/duas/content   full snapshot (shape below)
//   GET /learning/api/duas/version   a string that changes whenever the snapshot does
// Consumers: apps/site (/api/duas, via service binding) and the Flutter app
// (--dart-define=DUAS_API_URL=https://iqraspace.org/learning/api).

const PUBLISHED_MAP_SQL = `
  SELECT m.dua_id, m.category_id, m.sort_order AS map_sort, m.updated_at AS map_updated,
         m.context_title, m.context_title_ur, m.context_note, m.context_reference, m.context_repeat_count,
         d.*
    FROM dua_category_map m
    JOIN duas d ON d.id = m.dua_id AND d.status = 'published'
    JOIN dua_categories c ON c.id = m.category_id AND c.is_active = 1`;

async function sha256Hex(text) {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return [...d].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Content version: changes whenever anything visible in the feed changes. */
export async function duaContentVersion(exec) {
  const rows = await exec.all(
    `SELECT 'd:' || id || ':' || updated_at AS x FROM duas WHERE status = 'published'
     UNION ALL SELECT 'c:' || id || ':' || updated_at FROM dua_categories WHERE is_active = 1
     UNION ALL SELECT 'm:' || m.dua_id || ':' || m.category_id || ':' || m.updated_at
       FROM dua_category_map m
       JOIN duas d ON d.id = m.dua_id AND d.status = 'published'
       JOIN dua_categories c ON c.id = m.category_id AND c.is_active = 1`
  );
  const parts = rows.map((r) => r.x).sort();
  return (await sha256Hex(parts.join("|"))).slice(0, 32);
}

const parseJson = (v, fallback) => {
  if (v === null || v === undefined) return fallback;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

/** Same JSON shape get_dua_content() returned. */
export async function getDuaContent(exec) {
  const [cats, maps, version] = await Promise.all([
    exec.all(`SELECT * FROM dua_categories WHERE is_active = 1`),
    exec.all(PUBLISHED_MAP_SQL),
    duaContentVersion(exec),
  ]);
  const byCat = new Map();
  for (const m of maps) {
    if (!byCat.has(m.category_id)) byCat.set(m.category_id, []);
    byCat.get(m.category_id).push(m);
  }
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const categories = cats
    .filter((c) => byCat.has(c.id))
    .sort((a, b) => a.sort_order - b.sort_order || cmp(a.slug, b.slug))
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      name_ur: c.name_ur,
      name_te: c.name_te,
      description: c.description,
      description_ur: c.description_ur,
      description_te: c.description_te,
      sort_order: c.sort_order,
      duas: byCat
        .get(c.id)
        .sort((a, b) => a.map_sort - b.map_sort || a.sort_order - b.sort_order || cmp(a.slug, b.slug))
        .map((d) => ({
          slug: d.slug,
          title: d.context_title ?? d.title,
          title_ur: d.context_title !== null ? d.context_title_ur : d.title_ur,
          arabic: d.arabic,
          transliteration_latin: d.transliteration_latin,
          transliteration_telugu: d.transliteration_telugu,
          transliteration_urdu: d.transliteration_urdu,
          translation_en: d.translation_en,
          translation_ur: d.translation_ur,
          description: d.context_note ?? d.description,
          repeat_count: d.context_repeat_count ?? d.repeat_count,
          source_type: d.source_type,
          source_collection: d.source_collection,
          reference: d.context_reference ?? d.source_reference,
          hadith_number: d.hadith_number,
          hadith_grade: d.hadith_grade,
          quran_refs: parseJson(d.quran_refs, []),
          audio_url: d.audio_url,
          sort_order: d.map_sort,
        })),
    }));
  return { version, generated_at: new Date().toISOString(), categories };
}
