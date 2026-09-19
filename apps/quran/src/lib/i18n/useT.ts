"use client";

import { useReaderPreferences } from "@/lib/preferences/ReaderPreferencesProvider";
import { STRINGS, type StringKey } from "./strings";

/**
 * UI chrome translation hook — `t("key")` returns the current
 * `preferences.uiLanguage`'s string, with `{placeholder}` substitution
 * for the handful of keys that need it (e.g. `t("homeAyah", { n: 5 })`).
 * See strings.ts's own doc comment for scope/provenance.
 */
export function useT() {
  const { preferences } = useReaderPreferences();
  const lang = preferences.uiLanguage;
  const dict = STRINGS[lang];

  function t(key: StringKey, params?: Record<string, string | number>): string {
    let value: string = dict[key];
    if (params) {
      for (const [name, replacement] of Object.entries(params)) {
        value = value.replace(`{${name}}`, String(replacement));
      }
    }
    return value;
  }

  return { t, lang, dir: lang === "ur" ? ("rtl" as const) : ("ltr" as const) };
}
