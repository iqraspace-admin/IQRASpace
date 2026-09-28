/**
 * Translation languages this app ships, mapped to the `resource_id`
 * synced into every verse's `translations[]` array. English and Roman
 * Urdu come from the Quran Foundation Content API (see
 * scripts/sync-content.mjs's TRANSLATION_RESOURCE_IDS — keep both lists
 * in sync); Urdu and Telugu are merged in separately by
 * scripts/sync-secondary-translations.mjs from the same two public,
 * unauthenticated hosts the IqraSpace Flutter app (apps/mobile/android)
 * already uses for these languages — see that script's header for why.
 * This is the single source of truth the reader UI reads from.
 *
 * Roman Urdu (831, "Abul Ala Maududi (Roman Urdu)") was added per the
 * home-page/reader fix pass — confirmed via the Content API's own
 * /resources/translations metadata and a real verse's text (Latin-script
 * "Allah ke naam se jo Rehman o Raheem hai...", not Arabic-script Urdu).
 *
 * Urdu (Arabic-script, "ur.maududi") comes from Al Quran Cloud
 * (api.alquran.cloud) — the Quran Foundation Content API/Quran.com have
 * no Arabic-script Urdu edition under any resource id found in this
 * app's own catalog, same conclusion the Flutter app's own
 * dio_client.dart reached, so its string identifier is used as-is
 * instead of a synthesized numeric id.
 *
 * Telugu (227, "Maulana Abder-Rahim ibn Muhammad") comes from Quran.com's
 * public v4 API (api.quran.com) — Al Quran Cloud has no Telugu content in
 * any script; Quran Foundation's own OAuth2-gated catalog was not
 * queryable from this environment (no credentials on hand), but 227 is
 * confirmed genuine Telugu-script text via a live, unauthenticated
 * Quran.com v4 request — see sync-secondary-translations.mjs.
 */
export type TranslationLanguageId = "english" | "roman-urdu" | "urdu" | "telugu";

export type TranslationLanguage = {
  id: TranslationLanguageId;
  /** Matches VerseTranslation.resource_id in the synced content. */
  resourceId: number | string;
  label: string;
};

export const TRANSLATION_LANGUAGES: readonly TranslationLanguage[] = [
  { id: "english", resourceId: 85, label: "English" },
  { id: "roman-urdu", resourceId: 831, label: "Roman Urdu" },
  { id: "urdu", resourceId: "ur.maududi", label: "Urdu" },
  { id: "telugu", resourceId: 227, label: "Telugu" },
];
