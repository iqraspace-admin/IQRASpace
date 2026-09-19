"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/useT";

type SearchEntry = { key: string; surahId: number; surahName: string; ayah: number; text: string };
type SearchIndex = { generatedAt: string; entries: SearchEntry[] };

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const MAX_RESULTS = 50;

export function SearchClient() {
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState("");
  const { t } = useT();

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE_PATH}/search-index.json`)
      .then((res) => res.json())
      .then((data: SearchIndex) => {
        if (!cancelled) setIndex(data.entries);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!index || q.length < 2) return [];
    const matches: SearchEntry[] = [];
    for (const entry of index) {
      if (entry.text.toLowerCase().includes(q) || entry.surahName.toLowerCase().includes(q)) {
        matches.push(entry);
        if (matches.length >= MAX_RESULTS) break;
      }
    }
    return matches;
  }, [index, query]);

  return (
    <div>
      <h1 style={headingStyle}>{t("searchTitle")}</h1>
      <p style={{ margin: "0 0 1rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
        {t("searchSubtitle")}
      </p>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        autoFocus
        style={inputStyle}
      />

      {loadFailed && (
        <p style={{ marginTop: "1.5rem", color: "var(--color-text-muted)" }}>
          Couldn&apos;t load the search index. Please try again in a moment.
        </p>
      )}

      {!loadFailed && !index && <p style={{ marginTop: "1.5rem", color: "var(--color-text-muted)" }}>Loading…</p>}

      {index && query.trim().length >= 2 && (
        <p style={{ margin: "1.5rem 0 0.75rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          {results.length === 0
            ? `No matches for "${query}".`
            : `${results.length}${results.length === MAX_RESULTS ? "+" : ""} match${results.length === 1 ? "" : "es"}`}
        </p>
      )}

      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {results.map((entry) => (
          <li key={entry.key}>
            <Link href={`/surah/${entry.surahId}?verse=${entry.key}`} style={resultRowStyle}>
              <span style={badgeStyle}>{entry.key}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 600 }}>{entry.surahName}</span>
                <span style={{ display: "block", color: "var(--color-text)", marginTop: "0.2rem" }}>
                  {highlightMatch(entry.text, query)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Wraps the first case-insensitive match of `query` in a <mark> — a plain
    substring search, matching this feature's simple scope (no fuzzy/regex
    matching). */
function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (q.length < 2) return text;
  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark style={markStyle}>{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  );
}

const headingStyle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 600,
  fontSize: "1.5rem",
  margin: "0 0 0.5rem",
  color: "var(--color-text)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: "0.5rem",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text)",
  fontSize: "1rem",
};

const resultRowStyle: CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  alignItems: "flex-start",
  padding: "0.85rem 0.5rem",
  borderBottom: "1px solid var(--color-border)",
  textDecoration: "none",
  color: "var(--color-text)",
};

const badgeStyle: CSSProperties = {
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "2.75rem",
  padding: "0.15rem 0.4rem",
  borderRadius: "9999px",
  border: "1px solid var(--color-border)",
  color: "var(--color-text-muted)",
  fontSize: "0.75rem",
  marginTop: "0.1rem",
};

const markStyle: CSSProperties = {
  background: "color-mix(in srgb, var(--color-accent) 35%, transparent)",
  color: "inherit",
  borderRadius: "0.2rem",
};
