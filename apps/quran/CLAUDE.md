@AGENTS.md

## Deployment

This app is a static export (`output: "export"`) hosted on Cloudflare Workers Static Assets. `npm run build:cf` builds with `NEXT_BASE_PATH=/quran` and assembles `dist/` (including a generated `_headers` that replaces `headers()`); config is in `wrangler.jsonc`. There is no server runtime — do not add route handlers, middleware, server actions, ISR/`revalidate`, `next/image` optimization, or `headers()`/`redirects()`/`rewrites()` in `next.config.ts`; metadata routes need `export const dynamic = "force-static"`. Edit security headers in `scripts/prepare-cf.mjs`. See `DEPLOYMENT.md`.

## Current scope and rules

- Web-only: no Capacitor/Android shell here (the Flutter reader is `apps/mobile/android`, a separate app). The Supplications/Duas feature was removed from this app; Duas live in `apps/site` (`/duas`), and this app only links to it (`/duas`) and `/learning` from the header and home cards as plain `<a>` tags (different Workers, outside the `/quran` basePath).
- Anonymous-first: reading, search, audio, bookmarks and preferences work with no account and no server; user data is `localStorage` only. The app has no backend or database client. Don't gate core reading behind auth or add third-party API dependencies for basic reading.
- Hosting is Cloudflare only (Worker `iqraspace-quran`, route `iqraspace.org/quran*`); CI is `.github/workflows/ci-quran.yml`, with a weekly content-sync PR workflow `sync-quran-content.yml`. Never run `wrangler deploy` from a session.
- UI follows `apps/site`'s design system/logo; UI strings are in `src/lib/i18n/strings.ts` (en/te/ur).
- Docs: `Readme.md` is the original master prompt (aspirational, partly superseded); `ARCHITECTURE.md`, `DEPLOYMENT.md`, `COST.md`, `QURAN-CONTENT.md`, `PDF-CONTENT.md` describe what is built.
