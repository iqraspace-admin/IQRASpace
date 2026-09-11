"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadPreferences, savePreferences } from "./storage";
import { DEFAULT_PREFERENCES, type ReaderPreferences } from "./types";

type ReaderPreferencesContextValue = {
  preferences: ReaderPreferences;
  setPreference: <K extends keyof ReaderPreferences>(key: K, value: ReaderPreferences[K]) => void;
  /** True once localStorage has been read on mount — lets callers avoid
      flashing a control at a value that's about to change. */
  isHydrated: boolean;
  /** Whether the Surah reader is currently auto-scrolling at
      `preferences.autoScrollSpeed` — mirrors the IqraSpace Flutter app's
      own `autoScrollEnabledProvider`: deliberately NOT persisted (a
      "start scrolling now" action, not a standing preference, unlike the
      speed itself), so it always starts false on a fresh page load. Lives
      here rather than local SurahReader state so the Reader Settings
      panel's Reading section can toggle it too, not just the reader's
      own nav-row button. */
  autoScrollEnabled: boolean;
  setAutoScrollEnabled: (enabled: boolean) => void;
};

const ReaderPreferencesContext = createContext<ReaderPreferencesContextValue | null>(null);

/**
 * Applies preferences to <html> as CSS custom properties / data
 * attributes (see globals.css) so every page — not just the reader —
 * can react to them without prop-drilling.
 */
function applyToDocument(prefs: ReaderPreferences) {
  const root = document.documentElement;
  if (prefs.theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", prefs.theme);
  }
  root.setAttribute("data-reading-width", prefs.readingWidth);
  // Every ArabicFontId has its own explicit `:root[data-arabic-font="…"]`
  // rule in globals.css (including "amiri" and "amiriQuran") — always set
  // it, rather than special-casing one id to omit the attribute. That
  // special-case used to be correct back when "amiri" was the base
  // :root default (an explicit choice of "amiri" and "no attribute at
  // all" resolved to the same CSS), but the base default is now
  // "amiriQuran" (DEFAULT_PREFERENCES) — omitting the attribute for an
  // explicit "amiri" choice would silently fall back to the new
  // amiriQuran base instead.
  root.setAttribute("data-arabic-font", prefs.arabicFont);
  root.style.setProperty("--reader-arabic-scale", String(prefs.arabicFontScale));
  root.style.setProperty("--reader-translation-scale", String(prefs.translationFontScale));
  root.style.setProperty("--reader-line-spacing", String(prefs.lineSpacing));
}

export function ReaderPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<ReaderPreferences>(DEFAULT_PREFERENCES);
  const [isHydrated, setIsHydrated] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);

  // Server-rendered HTML always uses DEFAULT_PREFERENCES (no localStorage
  // access during SSR) — reading the real value only after mount avoids a
  // hydration mismatch, at the cost of one render with defaults first.
  useEffect(() => {
    async function hydrate() {
      const loaded = loadPreferences();
      await Promise.resolve(); // satisfies react-hooks/set-state-in-effect (no sync setState at the top of an effect) — same fix apps/web's own history used for this rule
      setPreferences(loaded);
      applyToDocument(loaded);
      setIsHydrated(true);
    }
    hydrate();
  }, []);

  const value = useMemo<ReaderPreferencesContextValue>(
    () => ({
      preferences,
      isHydrated,
      autoScrollEnabled,
      setAutoScrollEnabled,
      setPreference: (key, val) => {
        setPreferences((prev) => {
          const next = { ...prev, [key]: val };
          savePreferences(next);
          applyToDocument(next);
          return next;
        });
      },
    }),
    [preferences, isHydrated, autoScrollEnabled]
  );

  return <ReaderPreferencesContext.Provider value={value}>{children}</ReaderPreferencesContext.Provider>;
}

export function useReaderPreferences(): ReaderPreferencesContextValue {
  const ctx = useContext(ReaderPreferencesContext);
  if (!ctx) {
    throw new Error("useReaderPreferences must be used within ReaderPreferencesProvider");
  }
  return ctx;
}
