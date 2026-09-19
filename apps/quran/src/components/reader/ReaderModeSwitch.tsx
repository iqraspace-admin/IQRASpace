"use client";

import type { CSSProperties } from "react";
import { useReaderPreferences } from "@/lib/preferences/ReaderPreferencesProvider";
import { useT } from "@/lib/i18n/useT";
import type { ReaderMode } from "@/lib/preferences/types";
import type { StringKey } from "@/lib/i18n/strings";

const MODES: { value: ReaderMode; labelKey: StringKey }[] = [
  { value: "listening", labelKey: "readerModeListening" },
  { value: "reading", labelKey: "readerModeReading" },
  { value: "readingListening", labelKey: "readerModeReadingListening" },
];

/**
 * The IqraSpace Flutter app's 3-way Reader Mode switch (Listening /
 * Reading / Reading + Listening), pinned directly under the Surah nav
 * row — same placement as the Flutter reference's SegmentedButton under
 * its AppBar. Reading hides every audio control (per-Ayah AND whole-
 * Surah) via ReaderPreferences.readerMode, gated in SurahReader/
 * AyahBlock; Listening/Reading+Listening keep this app's existing full
 * audio experience — see ReaderMode's own doc comment for why the two
 * aren't behaviorally distinct on a web page.
 */
export function ReaderModeSwitch() {
  const { preferences, setPreference } = useReaderPreferences();
  const { t } = useT();

  return (
    <div role="radiogroup" aria-label={t("readerModeLabel")} style={wrapperStyle}>
      {MODES.map((mode) => {
        const selected = preferences.readerMode === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPreference("readerMode", mode.value)}
            style={segmentStyle(selected)}
          >
            {t(mode.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

const wrapperStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "0.35rem",
  margin: "0 0 1.25rem",
};

function segmentStyle(selected: boolean): CSSProperties {
  return {
    flex: 1,
    maxWidth: "12rem",
    border: `1px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
    background: selected ? "var(--color-primary)" : "var(--color-bg)",
    color: selected ? "var(--color-primary-contrast)" : "var(--color-text)",
    borderRadius: "0.375rem",
    padding: "0.4rem 0.5rem",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
  };
}
