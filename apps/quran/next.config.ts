import type { NextConfig } from "next";
import path from "node:path";

// Mobile (Capacitor) build: `npm run build:mobile` sets this so the exact
// same app/src code produces a fully static bundle (`out/`) that Capacitor
// bundles into the iOS/Android shell — see MOBILE.md. The regular
// `npm run build` (Vercel) is completely unaffected: this env var is never
// set there, so nothing below changes for the existing web deployment.
const isCapacitorBuild = process.env.CAPACITOR_BUILD === "1";

const nextConfig: NextConfig = {
  // Same monorepo layout as apps/web (see /package.json) — pin Turbopack's
  // root here so it doesn't get confused by the repo-root package-lock.json
  // one level up.
  turbopack: {
    root: path.join(__dirname),
  },

  // Static export for the mobile build only (MOBILE.md). Every route in
  // this app is already SSG (generateStaticParams on every dynamic
  // segment, no middleware, no route handlers, no server actions — see
  // MOBILE.md's "why this app can export at all" section), so `output:
  // "export"` needs no route changes, just this flag.
  ...(isCapacitorBuild ? { output: "export" as const } : {}),

  // Without this, `next export` writes "surah/2.html" (a flat file) —
  // fine for a host that infers the ".html" extension from a clean URL,
  // but Capacitor's bundled local web server resolves an exact path only,
  // so "/surah/2" (what every internal <Link> requests) would 404. With
  // trailingSlash on, export instead writes "surah/2/index.html" and
  // every generated <Link> href gains the matching trailing slash, so the
  // two stay consistent. Web build is untouched (still no trailing
  // slash), matching iqraspace.org's existing URLs exactly.
  trailingSlash: isCapacitorBuild ? true : undefined,

  // Domain is decided (ARCHITECTURE.md §8): iqraspace.org/quran, served via
  // a Next.js Multi-Zones rewrite from whatever owns the domain root, once
  // this app's own Vercel project exists. Until then NEXT_BASE_PATH is
  // unset everywhere (local dev, this repo's CI build) and this is a no-op
  // — set NEXT_BASE_PATH=/quran only in that future production
  // environment's config. Do not hardcode "/quran" anywhere else in the
  // app; Next's own routing/<Link>/asset handling picks this up
  // automatically once set. The mobile build never sets NEXT_BASE_PATH —
  // the app is served from the shell's own local root, not a path prefix.
  basePath: process.env.NEXT_BASE_PATH || undefined,

  // next/image's default loader needs the Vercel/Node image-optimization
  // route, which doesn't exist in a static export — serve the original
  // files as-is instead (the only next/image use in this app, the home
  // page logo, is a small pre-optimized PNG, so this costs nothing here).
  images: isCapacitorBuild ? { unoptimized: true } : undefined,

  // Exposes the same basePath value to client-bundled code as
  // NEXT_PUBLIC_BASE_PATH, inlined at build time — needed by
  // BrandWordmark.tsx, which renders in SiteHeader (a Client Component)
  // and can't rely on next/image's automatic basePath handling for its
  // icon (see that file's comment: next/image does NOT prefix the
  // optimizer's internal `url` query param with basePath for a
  // self-referencing *generated* route like app/icon.tsx — confirmed
  // live in production, 404s — even though it happens to work for a
  // *static* public/ asset). Using next.config.ts's `env` field (not a
  // second Vercel dashboard env var) means this can never drift out of
  // sync with NEXT_BASE_PATH above — one source of truth either way.
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_BASE_PATH || "",
  },

  // Security headers (objective: "Missing appropriate security headers").
  // Source paths are automatically prefixed with basePath by Next itself,
  // same as rewrites/redirects, so "/:path*" already covers "/quran/*" in
  // production without repeating the prefix here.
  //
  // style-src allows 'unsafe-inline': this codebase uses React inline
  // `style={{...}}` extensively (AyahBlock, reader toolbar, nav, etc.) —
  // rewriting all of it to CSS classes would be a real redesign, out of
  // scope for a deployment pass. Inline *styles* (not scripts) are a much
  // lower-risk CSP relaxation than allowing inline/eval'd script.
  //
  // script-src ALSO needs 'unsafe-inline' — this was the real root cause
  // of "nothing on the reader page is clickable" (zoom, translation
  // checkboxes, bookmark, Go-to-Ayah — every control, in both `next dev`
  // and the production build). The App Router inlines small bootstrap
  // <script> tags with no `src` (RSC flight data via
  // `self.__next_f.push(...)`, plus a dev-only debug-channel script) to
  // hydrate the page — without them the client never attaches ANY event
  // listeners. `script-src 'self'` with no 'unsafe-inline'/nonce/hash
  // silently blocked those (confirmed via a real browser: a CSP
  // violation console error plus, in prod, a hydration-failure React
  // error). The alternative — nonce-based CSP — requires forcing every
  // route to dynamic rendering (Next's own CSP guide,
  // node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
  // §"Static vs Dynamic Rendering with CSP"), which would break this
  // app's 759 statically-generated routes. Next's own docs give
  // `script-src 'self' 'unsafe-inline'` as the standard, supported
  // pattern for exactly this case (static generation, no nonces) — same
  // trade-off already accepted for style-src above. 'unsafe-eval' is
  // dev-only, added per the same guide's dev note (React reconstructs
  // server error stacks via eval in development only — production uses
  // neither React nor Next's eval). Nothing here allows a *third-party*
  // script origin — an XSS payload still can't load an external script,
  // only run inline, which is the same ceiling 'unsafe-inline' always
  // implies.
  // Not applied at all for the mobile build: `output: "export"` doesn't
  // serve responses through Next's server, so a `headers()` config has
  // nowhere to attach (Next ignores it with a build warning otherwise) —
  // the native shell's own security posture (no remote origin, no
  // arbitrary navigation) is Capacitor's job, not this file's, see
  // MOBILE.md. Guarding it out here keeps the mobile build's output clean.
  ...(isCapacitorBuild
    ? {}
    : {
        async headers() {
          const isDev = process.env.NODE_ENV === "development";
          return [
            // The per-Surah PDFs are already-public, freely-readable static
            // files with no auth of their own — the Learning App's PdfViewer
            // fetches them directly (pdf.js's getDocument does a real
            // fetch/XHR, unlike the plain <a target="_blank"> "Read in Quran"
            // links elsewhere, which have no CORS concern). Same-origin in
            // production via apps/landing's Multi-Zones rewrite, but genuinely
            // cross-origin in local dev (NEXT_PUBLIC_QURAN_URL pointing at this
            // app's own dev port) — allow any origin to fetch them.
            {
              source: "/pdf/:path*",
              headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
            },
            {
              source: "/:path*",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                {
                  key: "Content-Security-Policy",
                  value: [
                    "default-src 'self'",
                    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
                    "style-src 'self' 'unsafe-inline'",
                    "img-src 'self' data:",
                    "font-src 'self'",
                    "connect-src 'self'",
                    "frame-ancestors 'none'",
                    "base-uri 'self'",
                    "form-action 'self'",
                  ].join("; "),
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
