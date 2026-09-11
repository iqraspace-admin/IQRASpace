"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useModalA11y } from "@/lib/reader/useModalA11y";
import type { Chapter } from "@/lib/content/types";

type Props = {
  open: boolean;
  onClose: () => void;
  chapters: Chapter[];
  /** The Surah currently open, if any — highlighted in the results list.
      Omitted when opened from outside a reader (e.g. Home's Quick
      Links). */
  currentSurahId?: number;
};

/**
 * "Jump to Surah" — a searchable dialog to go straight to any Surah (and,
 * optionally, a specific Ayah within it) from anywhere in the reader,
 * mirroring the IqraSpace Flutter app's tappable-header jump sheet. Not a
 * port of that sheet's twin scroll-wheel picker (not a web-native
 * pattern) — instead reuses the same responsive dialog chrome as
 * ReaderSettingsPanel (`.settings-backdrop`/`.settings-panel`, bottom
 * sheet on phone / side panel on desktop) so the reading surface only
 * ever shows one dialog "language".
 *
 * Navigation reuses the reader's existing `?verse=SURAH:AYAH` deep-link
 * convention (see AyahList's scroll-to-verse effect and
 * ContinueReadingCard) rather than inventing a new one.
 */
export function JumpToSurah({ open, onClose, chapters, currentSurahId }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [ayahQuery, setAyahQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headingId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chapters;
    return chapters.filter(
      (c) =>
        c.name_simple.toLowerCase().includes(q) ||
        c.translated_name.name.toLowerCase().includes(q) ||
        c.name_arabic.includes(query.trim()) ||
        String(c.id) === q
    );
  }, [chapters, query]);

  // Reset the roving selection whenever the result set changes — adjusted
  // during render (React's documented pattern for "state that depends on
  // props/state changing"), not inside an effect, so this doesn't cost an
  // extra cascading render.
  const [prevFiltered, setPrevFiltered] = useState(filtered);
  if (filtered !== prevFiltered) {
    setPrevFiltered(filtered);
    setHighlightedIndex(0);
  }

  // Likewise: a fresh search every time the dialog opens, rather than
  // remembering the last query.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setAyahQuery("");
    }
  }

  // Focusing the search box is a genuine external-system side effect
  // (imperative DOM focus), not state to synchronize — this is what
  // useEffect is actually for.
  useEffect(() => {
    if (open) searchInputRef.current?.focus();
  }, [open]);

  useModalA11y(open, panelRef, onClose);

  function buildHref(chapter: Chapter, ayahInput: string): string {
    const parsed = Number(ayahInput);
    if (!ayahInput.trim() || !Number.isFinite(parsed)) return `/surah/${chapter.id}`;
    const clamped = Math.min(Math.max(Math.round(parsed), 1), chapter.verses_count);
    return clamped > 1 ? `/surah/${chapter.id}?verse=${chapter.id}:${clamped}` : `/surah/${chapter.id}`;
  }

  function go(chapter: Chapter) {
    router.push(buildHref(chapter, ayahQuery));
    onClose();
  }

  function onSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[highlightedIndex];
      if (target) go(target);
    }
  }

  if (!open) return null;

  return createPortal(
    <>
      <div className="settings-backdrop" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} className="settings-panel" role="dialog" aria-modal="true" aria-labelledby={headingId} tabIndex={-1}>
        <div style={panelHeaderStyle}>
          <h2 id={headingId} style={{ margin: 0, fontSize: "1.05rem" }}>
            Jump to Surah
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" style={iconButtonStyle}>
            <CloseIcon />
          </button>
        </div>

        <div style={searchRowStyle}>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Search by name or number…"
            aria-label="Search Surahs"
            style={{ ...inputStyle, flex: 2 }}
          />
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={ayahQuery}
            onChange={(e) => setAyahQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Ayah (optional)"
            aria-label="Ayah number (optional)"
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>

        <ol aria-label="Surah results" className="settings-panel-body" style={{ listStyle: "none", margin: 0 }}>
          {filtered.length === 0 && <li style={emptyStyle}>No Surah matches “{query}”.</li>}
          {filtered.map((chapter, index) => {
            const isCurrent = chapter.id === currentSurahId;
            const isHighlighted = index === highlightedIndex;
            return (
              <li key={chapter.id}>
                <Link
                  href={buildHref(chapter, ayahQuery)}
                  onClick={onClose}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  style={resultRowStyle(isHighlighted, isCurrent)}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
                    <span aria-hidden="true" style={badgeStyle}>
                      {chapter.id}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 600 }}>{chapter.name_simple}</span>
                      <span style={{ color: "var(--color-text-muted)" }}> · {chapter.translated_name.name}</span>
                      {isCurrent && <span style={currentBadgeStyle}> Currently reading</span>}
                    </span>
                  </span>
                  <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic)", fontSize: "1.15rem", flexShrink: 0 }}>
                    {chapter.name_arabic}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </>,
    document.body
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  padding: "1.1rem 1.25rem 0.75rem",
  borderBottom: "1px solid var(--color-border)",
  flexShrink: 0,
};

const iconButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2.25rem",
  height: "2.25rem",
  border: "none",
  borderRadius: "0.375rem",
  background: "transparent",
  color: "var(--color-text)",
  cursor: "pointer",
  flexShrink: 0,
};

const searchRowStyle: CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  padding: "0.9rem 1.25rem",
  borderBottom: "1px solid var(--color-border)",
  flexShrink: 0,
};

const inputStyle: CSSProperties = {
  minWidth: 0,
  padding: "0.5rem 0.65rem",
  borderRadius: "0.375rem",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg)",
  color: "var(--color-text)",
  fontSize: "0.9rem",
};

function resultRowStyle(highlighted: boolean, current: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    padding: "0.75rem 0.5rem",
    borderBottom: "1px solid var(--color-border)",
    borderRadius: "0.375rem",
    textDecoration: "none",
    color: "var(--color-text)",
    background: highlighted ? "var(--color-bg)" : "transparent",
    outline: current ? "1px solid var(--color-primary)" : "none",
    outlineOffset: "-1px",
  };
}

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "2rem",
  height: "2rem",
  borderRadius: "9999px",
  border: "1px solid var(--color-border)",
  fontSize: "0.8rem",
  color: "var(--color-text-muted)",
  flexShrink: 0,
};

const currentBadgeStyle: CSSProperties = {
  color: "var(--color-primary)",
  fontSize: "0.75rem",
  fontWeight: 600,
};

const emptyStyle: CSSProperties = {
  padding: "1.5rem 0.5rem",
  textAlign: "center",
  color: "var(--color-text-muted)",
};
