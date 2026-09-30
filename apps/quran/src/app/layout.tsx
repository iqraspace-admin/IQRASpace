import type { Metadata, Viewport } from "next";
import {
  Amiri,
  Amiri_Quran,
  Inter,
  Lateef,
  Newsreader,
  Noto_Naskh_Arabic,
  Noto_Nastaliq_Urdu,
  Noto_Sans_Telugu,
  Scheherazade_New,
} from "next/font/google";
import { ReaderPreferencesProvider } from "@/lib/preferences/ReaderPreferencesProvider";
import { AudioProvider } from "@/lib/audio/AudioProvider";
import { MiniPlayerBar } from "@/components/audio/MiniPlayerBar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { canonicalUrl } from "@/lib/site";
import "./globals.css";

// Amiri: the standard open-source Arabic typeface for Quranic-script UI
// (used elsewhere in this repo too — see apps/web/src/app/globals.css).
// Scheherazade New/Lateef/Noto Naskh Arabic: three further open Naskh
// faces offered in Settings' Arabic font picker (lib/content/arabicFonts.ts)
// alongside Amiri — all sustained-reading Quran faces, not display fonts.
// Inter: a calm, legible Latin body face for UI chrome.
// Newsreader: the editorial display serif apps/site (iqraspace.org's main
// site) uses for its wordmark/headings — used here for the same purpose
// (brand name + headings, never body text or Quran content) so both
// products read as one typographic identity instead of two close-but-
// different serifs.
const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

const amiriQuran = Amiri_Quran({
  variable: "--font-amiri-quran",
  subsets: ["arabic"],
  weight: ["400"],
  display: "swap",
});

const scheherazade = Scheherazade_New({
  variable: "--font-scheherazade",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

const lateef = Lateef({
  variable: "--font-lateef",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

const notoNaskh = Noto_Naskh_Arabic({
  variable: "--font-noto-naskh",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

const notoSansTelugu = Noto_Sans_Telugu({
  variable: "--font-noto-telugu",
  subsets: ["telugu"],
  weight: ["400", "600"],
  display: "swap",
});

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-noto-nastaliq",
  subsets: ["arabic"],
  weight: ["400", "600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  // Resolves relative OG/Twitter image URLs (opengraph-image.tsx) against
  // the real production origin instead of defaulting to localhost:3000 —
  // see PROJECT-STATUS.md's production-readiness inspection notes.
  metadataBase: new URL(canonicalUrl("/")),
  title: "IqraSpace Quran",
  description:
    "Read. Listen. Learn. Reflect. A free, fast, and accessible way to read the Quran on any device.",
  alternates: { canonical: canonicalUrl("/") },
  // No `manifest:` field here — src/app/manifest.ts (a Next.js metadata
  // route) makes Next auto-emit the <link rel="manifest"> tag with the
  // correct basePath-prefixed href itself; a hardcoded "/manifest.webmanifest"
  // string here would NOT get that prefix and would 404 in production.
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f2" },
    { media: "(prefers-color-scheme: dark)", color: "#101512" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      // These next/font `variable` classes must live on the SAME element
      // as (or a descendant of) globals.css's `:root` rules that alias
      // them (--font-arabic-amiriquran: var(--font-amiri-quran), etc.) —
      // custom properties don't inherit upward, so putting this className
      // on <body> instead left every one of those :root-declared aliases
      // referencing a variable that didn't exist yet at that point in the
      // tree, invalid-at-computed-value-time, silently falling back to
      // the browser's default UI font everywhere (confirmed live: a real
      // browser's getComputedStyle showed `--font-arabic` computing to
      // an empty string, and every styled font-family with it). `:root`
      // in CSS IS this <html> element, so the className belongs right here.
      className={`${amiri.variable} ${amiriQuran.variable} ${scheherazade.variable} ${lateef.variable} ${notoNaskh.variable} ${notoSansTelugu.variable} ${notoNastaliqUrdu.variable} ${inter.variable} ${newsreader.variable}`}
    >
      <body>
        <ReaderPreferencesProvider>
          <AudioProvider>
            <a href="#main-content" className="skip-link">
              Skip to content
            </a>
            <SiteHeader />
            <MiniPlayerBar />
            <main id="main-content">{children}</main>
            <SiteFooter />
          </AudioProvider>
        </ReaderPreferencesProvider>
      </body>
    </html>
  );
}
