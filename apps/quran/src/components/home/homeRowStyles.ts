import type { CSSProperties } from "react";

/**
 * Shared layout for the home page's horizontal scrolling card rows
 * (BookmarksPreview, LastReadsRow) — same heading/"see all"/card shape as
 * the IqraSpace Flutter app's Home screen sections.
 */
export const headingRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  marginBottom: "0.75rem",
};

export const headingStyle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 600,
  fontSize: "1.125rem",
  color: "var(--color-text)",
  margin: 0,
};

export const seeAllStyle: CSSProperties = {
  color: "var(--color-primary)",
  fontWeight: 600,
  fontSize: "0.85rem",
  textDecoration: "none",
};

export const rowStyle: CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  overflowX: "auto",
  paddingBottom: "0.25rem",
  scrollSnapType: "x proximity",
  WebkitOverflowScrolling: "touch",
};

export const cardStyle: CSSProperties = {
  flexShrink: 0,
  scrollSnapAlign: "start",
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  width: "9.5rem",
  padding: "0.75rem 0.9rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  textDecoration: "none",
  boxShadow: "var(--shadow-1)",
  transition: "box-shadow 0.2s, border-color 0.2s",
};
