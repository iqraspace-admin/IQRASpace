import { quranHomeUrl } from "./quranLink";

/**
 * Every link out of the Learning App into the rest of the IqraSpace platform
 * (the website, the Quran Reader, Duas), in one place so the header, sheet,
 * footer and sidebar can never drift apart.
 *
 * They are absolute https://iqraspace.org/... URLs on purpose: this app lives
 * under a `/learning` basePath, so a bare "/duas" would resolve to
 * /learning/duas. Absolute links are also correct from the bare workers.dev host
 * and from localhost. Plain `<a>` tags, never next/link — each target is a
 * separate deployment joined only by apps/site's Multi-Zones rewrites.
 * NEXT_PUBLIC_SITE_URL overrides the origin for local dev.
 */
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://iqraspace.org").replace(/\/$/, "");

export const PLATFORM = {
  home: `${SITE}/`,
  about: `${SITE}/about`,
  explore: `${SITE}/explore`,
  mission: `${SITE}/mission`,
  getInvolved: `${SITE}/get-involved`,
  quran: quranHomeUrl(),
  duas: `${SITE}/duas`,
  mobileApp: `${SITE}/mobile-app`,
  contact: `${SITE}/contact`,
  faq: `${SITE}/faq`,
  privacy: `${SITE}/privacy`,
  terms: `${SITE}/terms`,
  x: "https://x.com/IqraspaceOrg",
  instagram: "https://instagram.com/IqraspaceOrg",
  email: "mailto:iqraspaceorg@gmail.com",
} as const;

/** `internal` links stay inside the Learning App (next/link, basePath-aware); the rest are cross-app anchors. */
export type PlatformLink = { href: string; label: string; internal?: boolean };

/** The platform-level primary nav shown in the header on every Learning App page. */
export const PLATFORM_NAV: PlatformLink[] = [
  { href: PLATFORM.home, label: "Home" },
  { href: PLATFORM.quran, label: "Quran Reader" },
  { href: PLATFORM.duas, label: "Duas" },
  { href: "/", label: "Learning", internal: true },
  { href: PLATFORM.mobileApp, label: "Mobile App" },
];
