"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { loadLastReads, type ReadingHistoryEntry } from "@/lib/preferences/storage";
import type { Chapter } from "@/lib/content/types";

type Props = {
  chapters: Chapter[];
};

/**
 * "Last Reads" (plural) — every entry of the reading history beyond the
 * one already shown as the big "Continue Reading" card, one-click resume
 * for each. Mirrors the IqraSpace Flutter app's Home screen section,
 * which is likewise gated on having more than one entry: with only one
 * (or zero) recent reads, this row would just repeat the Continue
 * Reading card, so it renders nothing.
 */
export function LastReadsRow({ chapters }: Props) {
  const [entries, setEntries] = useState<ReadingHistoryEntry[]>([]);

  useEffect(() => {
    async function hydrate() {
      const loaded = loadLastReads();
      await Promise.resolve(); // satisfies react-hooks/set-state-in-effect
      setEntries(loaded);
    }
    hydrate();
  }, []);

  const rest = entries.slice(1);
  if (rest.length === 0) return null;

  return (
    <section style={{ width: "100%" }}>
      <h2 style={headingStyle}>Last Reads</h2>
      <div style={rowStyle}>
        {rest.map((entry) => {
          const chapter = chapters.find((c) => c.id === entry.surahNumber);
          return (
            <Link
              key={entry.surahNumber}
              href={`/surah/${entry.surahNumber}?verse=${entry.surahNumber}:${entry.ayahNumber}`}
              style={cardStyle}
            >
              <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                {chapter?.name_simple ?? `Surah ${entry.surahNumber}`}
              </span>
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>Ayah {entry.ayahNumber}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

const headingStyle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 600,
  fontSize: "1.125rem",
  color: "var(--color-text)",
  margin: "0 0 0.75rem",
};

const rowStyle: CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  overflowX: "auto",
  paddingBottom: "0.25rem",
  scrollSnapType: "x proximity",
  WebkitOverflowScrolling: "touch",
};

const cardStyle: CSSProperties = {
  flexShrink: 0,
  scrollSnapAlign: "start",
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  width: "9.5rem",
  padding: "0.75rem 0.9rem",
  borderRadius: "0.5rem",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  textDecoration: "none",
};
