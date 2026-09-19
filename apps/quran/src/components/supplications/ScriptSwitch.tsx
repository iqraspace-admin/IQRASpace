"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useReaderPreferences } from "@/lib/preferences/ReaderPreferencesProvider";
import { useT } from "@/lib/i18n/useT";
import type { TransliterationScript } from "@/lib/preferences/types";

const OPTIONS: { value: TransliterationScript; label: string }[] = [
  { value: "latin", label: "Default" },
  { value: "telugu", label: "Telugu" },
  { value: "urdu", label: "Urdu" },
];

/** "← All categories" back link — a tiny client component (like
    BookmarksHeader) purely so it can call useT() without making the
    whole Server Component category page client-side. */
export function SupplicationsBackLink() {
  const { t } = useT();
  return (
    <Link href="/supplications" style={{ color: "var(--color-primary)", fontSize: "0.85rem", textDecoration: "none" }}>
      {t("supplicationsBackToAll")}
    </Link>
  );
}

/** App-wide transliteration-script switch (Latin/Telugu/Urdu-script) for
    the Supplications feature — matches the IqraSpace Flutter app's own
    script switch: one choice for reading every dua's transliteration
    line, not a per-card setting. */
export function ScriptSwitch() {
  const { preferences, setPreference } = useReaderPreferences();

  return (
    <div role="radiogroup" aria-label="Transliteration script" style={groupStyle}>
      {OPTIONS.map((option) => {
        const selected = preferences.supplicationScript === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setPreference("supplicationScript", option.value)}
            style={buttonStyle(selected)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const groupStyle: CSSProperties = {
  display: "flex",
  gap: "0.35rem",
  marginBottom: "1.25rem",
};

function buttonStyle(selected: boolean): CSSProperties {
  return {
    border: `1px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
    background: selected ? "var(--color-primary)" : "var(--color-bg)",
    color: selected ? "var(--color-primary-contrast)" : "var(--color-text)",
    borderRadius: "0.375rem",
    padding: "0.35rem 0.85rem",
    fontSize: "0.85rem",
    cursor: "pointer",
  };
}
