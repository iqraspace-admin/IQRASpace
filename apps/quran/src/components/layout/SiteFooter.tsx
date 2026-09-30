import Link from "next/link";

/**
 * Structural rebuild (not the earlier dark-band-only recolor) — now a
 * real multi-column footer matching apps/site's .site-footer shape
 * (design spec §3.4: brand+blurb, then link columns, then a bottom
 * legal/attribution bar), not just a centered attribution paragraph.
 * Still a constant dark-green band regardless of this app's own Light/
 * Dark/Sepia reading theme, same reasoning as the previous pass: matches
 * apps/site's footer, which has no theme variants of its own either.
 * Server component: no interactivity needed.
 */
export function SiteFooter() {
  return (
    <footer style={{ background: "#0f2e25", color: "#cfd9d1", marginTop: "3rem" }}>
      <div
        style={{
          maxWidth: "var(--content-max-width)",
          margin: "0 auto",
          padding: "2.5rem 1rem 1.5rem",
        }}
      >
        <div className="qr-footer-grid" style={gridStyle}>
          <div className="qr-footer-brand">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- see BrandWordmark.tsx's own comment on why a plain <img> is used for this generated route */}
              <img
                src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon`}
                alt=""
                width={512}
                height={512}
                style={{ width: 32, height: 32, borderRadius: 8 }}
              />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.1rem", color: "#ffffff" }}>
                IqraSpace Quran
              </span>
            </span>
            <p style={{ margin: "0.85rem 0 0", maxWidth: "38rem", lineHeight: 1.6, fontSize: "0.9rem" }}>
              A free, ad-free space to read, listen to, and reflect on the Quran — Sadaqah Jariyah, not a commercial
              product.
            </p>
          </div>

          <div>
            <h2 style={headingStyle}>Explore</h2>
            <ul style={listStyle}>
              <li>
                <Link href="/" style={linkStyle}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/surah" style={linkStyle}>
                  Surahs
                </Link>
              </li>
              <li>
                <Link href="/bookmarks" style={linkStyle}>
                  Bookmarks
                </Link>
              </li>
              <li>
                <Link href="/supplications" style={linkStyle}>
                  Supplications
                </Link>
              </li>
              <li>
                <Link href="/search" style={linkStyle}>
                  Search
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 style={headingStyle}>IqraSpace</h2>
            <ul style={listStyle}>
              <li>
                <a href="/learning" style={linkStyle}>
                  Learning App
                </a>
              </li>
              <li>
                <a href="https://iqraspace.org" style={linkStyle}>
                  Main website
                </a>
              </li>
              <li>
                <a href="https://iqraspace.org/mobile-app" style={linkStyle}>
                  Mobile app
                </a>
              </li>
              <li>
                <a href="https://iqraspace.org/privacy" style={linkStyle}>
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 style={headingStyle}>Reach us</h2>
            <ul style={listStyle}>
              <li>
                <a href="https://x.com/IqraspaceOrg" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  <XIcon />X
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/IqraspaceOrg"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                >
                  <InstagramIcon />
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://iqraspace.org" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  <GlobeIcon />
                  iqraspace.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div style={bottomBarStyle}>
          <span>
            Quran text, English, and Roman Urdu translation data provided by the{" "}
            <a href="https://quran.foundation" style={{ color: "inherit" }}>
              Quran Foundation
            </a>
            . Urdu translation: Al Quran Cloud. Telugu translation: Quran.com.
          </span>
        </div>
      </div>
    </footer>
  );
}

// grid-template-columns lives in globals.css's .qr-footer-grid instead of
// here — see that rule's own comment for why.
const gridStyle = {
  display: "grid",
  gap: "2rem 1.5rem",
} as const;

const headingStyle = {
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#e9d9b0",
  margin: "0 0 0.85rem",
} as const;

const listStyle = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: "0.5rem",
} as const;

const linkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  color: "#cfd9d1",
  textDecoration: "none",
  fontSize: "0.9rem",
} as const;

const bottomBarStyle = {
  marginTop: "2rem",
  paddingTop: "1.25rem",
  borderTop: "1px solid rgba(255, 255, 255, 0.14)",
  fontSize: "0.8rem",
  color: "#a9b6ae",
  lineHeight: 1.6,
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
