"use client";

import type { CSSProperties } from "react";
import { useReaderPreferences } from "@/lib/preferences/ReaderPreferencesProvider";
import type { Dua } from "@/lib/content/supplications";

const TRANSLITERATION_FIELD = {
  latin: "transliteration_latin",
  telugu: "transliteration_telugu",
  urdu: "transliteration_urdu",
} as const;

/** One dua: occasion + hadith reference, Arabic text, transliteration in
    the app-wide selected script (see ScriptSwitch), English translation —
    matches the IqraSpace Flutter app's own DuaCard. No favorites/search
    within Supplications, matching Flutter's current scope exactly. */
export function DuaCard({ dua }: { dua: Dua }) {
  const { preferences } = useReaderPreferences();
  const script = preferences.supplicationScript;
  const transliteration = dua[TRANSLITERATION_FIELD[script]];

  return (
    <li style={cardStyle}>
      <p style={headerStyle}>
        <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{dua.occasion}</span>
        <span style={{ color: "var(--color-text-muted)" }}> · {dua.reference}</span>
      </p>
      <p dir="rtl" lang="ar" style={arabicStyle}>
        {dua.arabic}
      </p>
      <p
        dir={script === "urdu" ? "rtl" : "ltr"}
        lang={script === "telugu" ? "te" : script === "urdu" ? "ur" : undefined}
        style={{
          ...transliterationStyle,
          fontFamily:
            script === "telugu"
              ? "var(--font-transliteration-telugu)"
              : script === "urdu"
                ? "var(--font-transliteration-urdu)"
                : "var(--font-body)",
        }}
      >
        {transliteration}
      </p>
      <p style={translationStyle}>{dua.translation_english}</p>
    </li>
  );
}

const cardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "0.75rem",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
};

const headerStyle: CSSProperties = {
  margin: "0 0 0.75rem",
  fontSize: "0.85rem",
};

const arabicStyle: CSSProperties = {
  fontFamily: "var(--font-arabic-notonaskh)",
  fontSize: "1.5rem",
  lineHeight: 2,
  margin: "0 0 0.6rem",
  color: "var(--color-text)",
};

const transliterationStyle: CSSProperties = {
  fontSize: "1rem",
  lineHeight: 1.6,
  margin: "0 0 0.6rem",
  color: "var(--color-text)",
};

const translationStyle: CSSProperties = {
  margin: 0,
  fontSize: "0.9rem",
  lineHeight: 1.5,
  color: "var(--color-text-muted)",
};
