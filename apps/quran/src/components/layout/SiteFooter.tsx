/**
 * Content-attribution line (Readme.md §23/§28, QURAN-CONTENT.md §3) — kept
 * here rather than only on a dedicated attribution page, since that page
 * doesn't exist yet (Phase 9). Plus "Reach Us" — the same handles the
 * IqraSpace Flutter app's About screen links to, so both platforms point
 * to one place. Server component: no interactivity needed.
 *
 * Styled as a constant dark-green band (apps/site's --green-900), not
 * tied to this app's own Light/Dark/Sepia reading theme — matches
 * apps/site's own .site-footer (which has no theme variants at all) so
 * both products' footers read as the same "brand band" regardless of
 * which reading theme is active, the same way apps/site's footer always
 * looks the same regardless of the visitor's OS color scheme.
 */
export function SiteFooter() {
  return (
    <footer
      style={{
        marginTop: "3rem",
        padding: "2.5rem 1rem 2rem",
        textAlign: "center",
        background: "#0f2e25",
        color: "#cfd9d1",
        fontSize: "0.85rem",
      }}
    >
      <p style={{ margin: "0 auto", maxWidth: "40rem", lineHeight: 1.6 }}>
        Quran text, English, and Roman Urdu translation data provided by the{" "}
        <a href="https://quran.foundation" style={{ color: "inherit" }}>
          Quran Foundation
        </a>
        . Urdu translation: Al Quran Cloud. Telugu translation: Quran.com. IqraSpace Quran is a free, ad-free reading
        platform — Sadaqah Jariyah, not a commercial product.
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
        <a
          href="https://x.com/IqraspaceOrg"
          target="_blank"
          rel="noopener noreferrer"
          style={reachUsLinkStyle}
          aria-label="IqraSpace on X"
        >
          <XIcon />X
        </a>
        <a
          href="https://instagram.com/IqraspaceOrg"
          target="_blank"
          rel="noopener noreferrer"
          style={reachUsLinkStyle}
          aria-label="IqraSpace on Instagram"
        >
          <InstagramIcon />
          Instagram
        </a>
        <a
          href="https://iqraspace.org"
          target="_blank"
          rel="noopener noreferrer"
          style={reachUsLinkStyle}
          aria-label="IqraSpace website"
        >
          <GlobeIcon />
          iqraspace.org
        </a>
      </div>
    </footer>
  );
}

const reachUsLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  color: "#cfd9d1",
  textDecoration: "none",
} as const;

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2H21.5l-7.5 8.57L22.8 22h-6.98l-5.47-7.15L4.06 22H.8l8.03-9.17L1.2 2h7.15l4.94 6.53L18.24 2Zm-1.22 18h1.93L7.06 4H5l11.98 16Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 4 6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-6-4-9s1.5-6.4 4-9Z" />
    </svg>
  );
}
