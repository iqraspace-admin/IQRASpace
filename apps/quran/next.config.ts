import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Same monorepo layout as apps/web (see /package.json) — pin Turbopack's
  // root here so it doesn't get confused by the repo-root package-lock.json
  // one level up.
  turbopack: {
    root: path.join(__dirname),
  },

  // Domain is decided (ARCHITECTURE.md §8): iqraspace.org/quran, served by
  // a Cloudflare Worker route (wrangler.jsonc) on the iqraspace.org zone.
  // NEXT_BASE_PATH is unset for local dev (no-op) and set to /quran by
  // `npm run build:cf` (scripts/build-cf.mjs) for production. Do not
  // hardcode "/quran" anywhere else in the app.
  basePath: process.env.NEXT_BASE_PATH || undefined,

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

  // Static export (Cloudflare Workers Static Assets): `next build` writes a
  // fully static site to out/. Security headers/CSP and PDF CORS are NOT
  // set here (headers() is unsupported with output: "export") — they are
  // generated into dist/_headers by scripts/prepare-cf.mjs, the single
  // source of truth for them (see DEPLOYMENT.md).
  output: "export",
};

export default nextConfig;
