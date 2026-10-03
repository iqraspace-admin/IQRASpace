@AGENTS.md

## Deployment

This app is a static export (`output: "export"`) hosted on Cloudflare Workers Static Assets (not Vercel). `npm run build:cf` builds with `NEXT_BASE_PATH=/quran` and assembles `dist/` (including a generated `_headers` that replaces `headers()`); config is in `wrangler.jsonc`. There is no server runtime — do not add route handlers, middleware, server actions, ISR/`revalidate`, `next/image` optimization, or `headers()`/`redirects()`/`rewrites()` in `next.config.ts`; metadata routes need `export const dynamic = "force-static"`. Edit security headers in `scripts/prepare-cf.mjs`. See `DEPLOYMENT.md`.
